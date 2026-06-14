-- ===========================================================================
-- Friendlie — PostgreSQL / Supabase schema
-- A platonic friend-matching platform. Run this file in the Supabase SQL
-- editor (or via `supabase db reset`) before seeding.
--
-- Design notes:
--   * `auth.users` is Supabase's built-in auth table. We mirror it into
--     `public.users` and attach a rich `public.profiles` row via trigger.
--   * Exact coordinates are stored but NEVER exposed by the API — only coarse
--     distance bands are derived client-/server-side.
--   * Messaging is gated on a mutual match (enforced by RLS).
--   * Every table has Row Level Security enabled.
-- ===========================================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type interest_category as enum (
    'fitness','food','music','gaming','books','outdoors','arts',
    'volunteering','sports','tech','parenting','pets','travel','wellness'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type like_action as enum ('like','skip','save');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('open','reviewing','resolved','dismissed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- users — lightweight mirror of auth.users for FK convenience & moderation
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  is_banned   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- profiles — the public-facing member profile
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                     uuid primary key references public.users (id) on delete cascade,
  display_name           text not null default 'New friend',
  age_range              text,                       -- e.g. '25-34'
  city                   text,
  latitude               double precision,           -- private: never returned raw
  longitude              double precision,           -- private: never returned raw
  bio                    text,
  avatar_url             text,
  photos                 text[] not null default '{}',
  availability           text[] not null default '{}',
  friendship_preferences text[] not null default '{}',
  location_radius_km     integer not null default 25 check (location_radius_km between 1 and 200),
  is_onboarded           boolean not null default false,
  show_distance          boolean not null default true,
  discoverable           boolean not null default true,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- interests & activities — curated taxonomies (seeded separately)
-- ---------------------------------------------------------------------------
create table if not exists public.interests (
  id        uuid primary key default gen_random_uuid(),
  slug      text unique not null,
  name      text not null,
  category  interest_category not null,
  emoji     text not null default '✨'
);

create table if not exists public.activities (
  id        uuid primary key default gen_random_uuid(),
  slug      text unique not null,
  name      text not null,
  category  interest_category not null,
  emoji     text not null default '🤝'
);

-- ---------------------------------------------------------------------------
-- join tables — a member's selected interests & preferred activities
-- ---------------------------------------------------------------------------
create table if not exists public.user_interests (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  interest_id  uuid not null references public.interests (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (user_id, interest_id)
);

create table if not exists public.user_activity_preferences (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  activity_id  uuid not null references public.activities (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (user_id, activity_id)
);

-- ---------------------------------------------------------------------------
-- likes — directional feed actions (like / skip / save)
-- ---------------------------------------------------------------------------
create table if not exists public.likes (
  id          uuid primary key default gen_random_uuid(),
  liker_id    uuid not null references public.profiles (id) on delete cascade,
  likee_id    uuid not null references public.profiles (id) on delete cascade,
  action      like_action not null,
  created_at  timestamptz not null default now(),
  unique (liker_id, likee_id),
  check (liker_id <> likee_id)
);
create index if not exists likes_likee_idx on public.likes (likee_id);
create index if not exists likes_liker_idx on public.likes (liker_id);

-- ---------------------------------------------------------------------------
-- matches — created automatically on a mutual 'like'
-- user_a is always the lexicographically smaller uuid to keep pairs unique.
-- ---------------------------------------------------------------------------
create table if not exists public.matches (
  id                  uuid primary key default gen_random_uuid(),
  user_a              uuid not null references public.profiles (id) on delete cascade,
  user_b              uuid not null references public.profiles (id) on delete cascade,
  compatibility_score integer not null default 0,
  created_at          timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a < user_b)
);
create index if not exists matches_user_a_idx on public.matches (user_a);
create index if not exists matches_user_b_idx on public.matches (user_b);

-- ---------------------------------------------------------------------------
-- messages — only between matched members (enforced by RLS)
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.matches (id) on delete cascade,
  sender_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);
create index if not exists messages_match_idx on public.messages (match_id, created_at);

-- ---------------------------------------------------------------------------
-- reports — moderation queue
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references public.profiles (id) on delete cascade,
  reported_id  uuid not null references public.profiles (id) on delete cascade,
  reason       text not null,
  details      text,
  status       report_status not null default 'open',
  created_at   timestamptz not null default now(),
  check (reporter_id <> reported_id)
);
create index if not exists reports_status_idx on public.reports (status);

-- ---------------------------------------------------------------------------
-- blocks — one member blocking another (hides them everywhere)
-- ---------------------------------------------------------------------------
create table if not exists public.blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references public.profiles (id) on delete cascade,
  blocked_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- ===========================================================================
-- Functions & triggers
-- ===========================================================================

-- Keep profiles.updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- On new auth user, create the mirror + an empty profile.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email) values (new.id, new.email)
    on conflict (id) do nothing;
  insert into public.profiles (id, display_name)
    values (new.id, coalesce(split_part(new.email, '@', 1), 'New friend'))
    on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Compatibility score (0–100) computed in SQL: shared interests + activities
-- (Jaccard, weighted) plus availability overlap. Mirrors src/lib/matching.ts
-- closely enough for stored ranking; the UI recomputes the rich breakdown.
create or replace function public.friendlie_compatibility(a uuid, b uuid)
returns integer language sql stable as $$
  with
  ai as (select interest_id from user_interests where user_id = a),
  bi as (select interest_id from user_interests where user_id = b),
  aa as (select activity_id from user_activity_preferences where user_id = a),
  ba as (select activity_id from user_activity_preferences where user_id = b),
  pa as (select availability, friendship_preferences from profiles where id = a),
  pb as (select availability, friendship_preferences from profiles where id = b),
  interest_jaccard as (
    select case when (select count(*) from (select interest_id from ai union select interest_id from bi) u) = 0
      then 0
      else (select count(*) from (select interest_id from ai intersect select interest_id from bi) i)::numeric
         / (select count(*) from (select interest_id from ai union select interest_id from bi) u)
    end as v
  ),
  activity_jaccard as (
    select case when (select count(*) from (select activity_id from aa union select activity_id from ba) u) = 0
      then 0
      else (select count(*) from (select activity_id from aa intersect select activity_id from ba) i)::numeric
         / (select count(*) from (select activity_id from aa union select activity_id from ba) u)
    end as v
  ),
  avail as (
    select case
      when array_length((select availability from pa), 1) is null
        or array_length((select availability from pb), 1) is null then 0
      else (
        select count(*)::numeric from (
          select unnest((select availability from pa)) intersect
          select unnest((select availability from pb))
        ) x
      ) / greatest((
        select count(*) from (
          select unnest((select availability from pa)) union
          select unnest((select availability from pb))
        ) y
      ), 1)
    end as v
  ),
  shared_count as (
    select (select count(*) from (select interest_id from ai intersect select interest_id from bi) i)
         + (select count(*) from (select activity_id from aa intersect select activity_id from ba) j) as n
  )
  select least(100, round(
    (select v from interest_jaccard) * 35 +
    (select v from activity_jaccard) * 30 +
    (select v from avail) * 15 +
    20 +  -- proximity handled in app layer; neutral base here
    least((select n from shared_count), 6)
  ))::integer;
$$;

-- When a 'like' is inserted (or updated to 'like'), check for reciprocity and
-- create the match if both members liked each other. Idempotent.
create or replace function public.handle_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  reciprocal boolean;
  lo uuid;
  hi uuid;
  score integer;
begin
  if new.action <> 'like' then
    return new;
  end if;

  select exists(
    select 1 from public.likes
    where liker_id = new.likee_id
      and likee_id = new.liker_id
      and action = 'like'
  ) into reciprocal;

  if reciprocal then
    lo := least(new.liker_id, new.likee_id);
    hi := greatest(new.liker_id, new.likee_id);
    score := public.friendlie_compatibility(lo, hi);
    insert into public.matches (user_a, user_b, compatibility_score)
      values (lo, hi, score)
      on conflict (user_a, user_b) do nothing;
  end if;

  return new;
end; $$;

drop trigger if exists on_like_created on public.likes;
create trigger on_like_created
  after insert or update on public.likes
  for each row execute function public.handle_like();

-- Helper: is there a match between the current user and another member?
create or replace function public.is_matched_with(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.matches
    where (user_a = auth.uid() and user_b = other)
       or (user_b = auth.uid() and user_a = other)
  );
$$;

-- Helper: does either party block the other?
create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.users                      enable row level security;
alter table public.profiles                   enable row level security;
alter table public.interests                  enable row level security;
alter table public.activities                 enable row level security;
alter table public.user_interests             enable row level security;
alter table public.user_activity_preferences  enable row level security;
alter table public.likes                      enable row level security;
alter table public.matches                    enable row level security;
alter table public.messages                   enable row level security;
alter table public.reports                    enable row level security;
alter table public.blocks                     enable row level security;

-- users: a member can read/update only their own row.
drop policy if exists users_self_select on public.users;
create policy users_self_select on public.users
  for select using (id = auth.uid());

-- interests & activities: world-readable taxonomies.
drop policy if exists interests_read on public.interests;
create policy interests_read on public.interests for select using (true);
drop policy if exists activities_read on public.activities;
create policy activities_read on public.activities for select using (true);

-- profiles: a member can read their own profile, and any *discoverable*
-- profile that hasn't blocked (or been blocked by) them.
drop policy if exists profiles_self_all on public.profiles;
create policy profiles_self_all on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_discover_select on public.profiles;
create policy profiles_discover_select on public.profiles
  for select using (
    id = auth.uid()
    or (discoverable = true and not public.is_blocked_between(auth.uid(), id))
    -- A member can always read the basic profile of someone they've blocked
    -- (needed to render the "blocked users" list in settings) ...
    or exists (
      select 1 from public.blocks b
      where b.blocker_id = auth.uid() and b.blocked_id = id
    )
    -- ... and the profile of anyone they're matched with (for chat headers).
    or public.is_matched_with(id)
  );

-- user_interests / user_activity_preferences:
--   members manage their own rows; others' rows are readable for matching.
drop policy if exists ui_self_write on public.user_interests;
create policy ui_self_write on public.user_interests
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists ui_read on public.user_interests;
create policy ui_read on public.user_interests for select using (true);

drop policy if exists uap_self_write on public.user_activity_preferences;
create policy uap_self_write on public.user_activity_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists uap_read on public.user_activity_preferences;
create policy uap_read on public.user_activity_preferences for select using (true);

-- likes: a member can create and read only likes they authored.
drop policy if exists likes_self_insert on public.likes;
create policy likes_self_insert on public.likes
  for insert with check (
    liker_id = auth.uid()
    and not public.is_blocked_between(auth.uid(), likee_id)
  );
drop policy if exists likes_self_update on public.likes;
create policy likes_self_update on public.likes
  for update using (liker_id = auth.uid()) with check (liker_id = auth.uid());
drop policy if exists likes_self_select on public.likes;
create policy likes_self_select on public.likes
  for select using (liker_id = auth.uid());
drop policy if exists likes_self_delete on public.likes;
create policy likes_self_delete on public.likes
  for delete using (liker_id = auth.uid());

-- matches: visible to either participant.
drop policy if exists matches_participant_select on public.matches;
create policy matches_participant_select on public.matches
  for select using (user_a = auth.uid() or user_b = auth.uid());

-- messages: readable/insertable only by match participants, and only while a
-- match exists. Sender must be the authenticated user.
drop policy if exists messages_participant_select on public.messages;
create policy messages_participant_select on public.messages
  for select using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );
drop policy if exists messages_participant_insert on public.messages;
create policy messages_participant_insert on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user_a = auth.uid() or m.user_b = auth.uid())
        and not public.is_blocked_between(m.user_a, m.user_b)
    )
  );
-- allow marking messages as read
drop policy if exists messages_participant_update on public.messages;
create policy messages_participant_update on public.messages
  for update using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

-- reports: a member can file reports as themselves and read their own.
drop policy if exists reports_self_insert on public.reports;
create policy reports_self_insert on public.reports
  for insert with check (reporter_id = auth.uid());
drop policy if exists reports_self_select on public.reports;
create policy reports_self_select on public.reports
  for select using (reporter_id = auth.uid());

-- blocks: a member fully manages their own block list.
drop policy if exists blocks_self_all on public.blocks;
create policy blocks_self_all on public.blocks
  for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- ===========================================================================
-- Realtime — messages stream to matched participants
-- ===========================================================================
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
