import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  computeCompatibility,
  toDiscoveryCandidate,
} from "@/lib/matching";
import type {
  Activity,
  DiscoveryCandidate,
  Interest,
  MatchSummary,
  Message,
  Profile,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Server-side data access. Each function uses the authenticated Supabase
// client; Row Level Security guarantees a member only ever sees what they
// should. These helpers also enrich raw rows with matching context.
// ---------------------------------------------------------------------------

export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getMyProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}

export async function getAllInterests(): Promise<Interest[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("interests")
    .select("*")
    .order("category");
  return (data as Interest[]) ?? [];
}

export async function getAllActivities(): Promise<Activity[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("activities")
    .select("*")
    .order("category");
  return (data as Activity[]) ?? [];
}

export async function getMyInterestIds(userId: string): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("user_interests")
    .select("interest_id")
    .eq("user_id", userId);
  return (data ?? []).map((r) => r.interest_id as string);
}

export async function getMyActivityIds(userId: string): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("user_activity_preferences")
    .select("activity_id")
    .eq("user_id", userId);
  return (data ?? []).map((r) => r.activity_id as string);
}

/**
 * Build the discovery feed for the current member. We fetch candidate profiles
 * the viewer hasn't acted on (and who haven't been blocked), then compute a
 * compatibility score for each and sort by it. Exact location never leaves the
 * server — only an approximate distance band is surfaced.
 */
export async function getDiscoveryFeed(): Promise<{
  viewerProfile: Profile | null;
  candidates: DiscoveryCandidate[];
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { viewerProfile: null, candidates: [] };

  const [interests, activities, viewerProfile] = await Promise.all([
    getAllInterests(),
    getAllActivities(),
    getMyProfile(),
  ]);
  if (!viewerProfile) return { viewerProfile: null, candidates: [] };

  const interestById = new Map(interests.map((i) => [i.id, i]));
  const activityById = new Map(activities.map((a) => [a.id, a]));

  // Viewer's own selections.
  const [viewerInterestIds, viewerActivityIds] = await Promise.all([
    getMyInterestIds(user.id),
    getMyActivityIds(user.id),
  ]);
  const viewerInterests = viewerInterestIds
    .map((id) => interestById.get(id))
    .filter(Boolean) as Interest[];
  const viewerActivities = viewerActivityIds
    .map((id) => activityById.get(id))
    .filter(Boolean) as Activity[];

  // Profiles the viewer already acted on are excluded from the feed.
  const { data: actedRows } = await supabase
    .from("likes")
    .select("likee_id")
    .eq("liker_id", user.id);
  const actedOn = new Set((actedRows ?? []).map((r) => r.likee_id as string));

  // Candidate profiles. RLS already filters out blocked + non-discoverable.
  const { data: profileRows } = await supabase
    .from("profiles")
    .select("*")
    .neq("id", user.id)
    .eq("is_onboarded", true)
    .limit(100);
  const candidates = (profileRows as Profile[]) ?? [];
  const usable = candidates.filter((p) => !actedOn.has(p.id));
  if (usable.length === 0) {
    return { viewerProfile, candidates: [] };
  }

  // Bulk-load candidate interests & activities in two queries.
  const ids = usable.map((p) => p.id);
  const [{ data: ci }, { data: ca }] = await Promise.all([
    supabase.from("user_interests").select("user_id, interest_id").in("user_id", ids),
    supabase
      .from("user_activity_preferences")
      .select("user_id, activity_id")
      .in("user_id", ids),
  ]);

  const interestsByUser = new Map<string, Interest[]>();
  for (const row of ci ?? []) {
    const interest = interestById.get(row.interest_id as string);
    if (!interest) continue;
    const list = interestsByUser.get(row.user_id as string) ?? [];
    list.push(interest);
    interestsByUser.set(row.user_id as string, list);
  }
  const activitiesByUser = new Map<string, Activity[]>();
  for (const row of ca ?? []) {
    const activity = activityById.get(row.activity_id as string);
    if (!activity) continue;
    const list = activitiesByUser.get(row.user_id as string) ?? [];
    list.push(activity);
    activitiesByUser.set(row.user_id as string, list);
  }

  const enriched = usable.map((profile) => {
    const result = computeCompatibility({
      viewer: {
        interests: viewerInterests,
        activities: viewerActivities,
        availability: viewerProfile.availability,
        latitude: viewerProfile.latitude,
        longitude: viewerProfile.longitude,
        radiusKm: viewerProfile.location_radius_km,
      },
      candidate: {
        profile,
        interests: interestsByUser.get(profile.id) ?? [],
        activities: activitiesByUser.get(profile.id) ?? [],
      },
    });
    return toDiscoveryCandidate(profile, result);
  });

  enriched.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  return { viewerProfile, candidates: enriched };
}

/** All mutual matches for the current member, with shared context + last message. */
export async function getMatches(): Promise<MatchSummary[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: matchRows } = await supabase
    .from("matches")
    .select("*")
    .order("created_at", { ascending: false });
  const matches = matchRows ?? [];
  if (matches.length === 0) return [];

  const interests = await getAllInterests();
  const activities = await getAllActivities();
  const interestById = new Map(interests.map((i) => [i.id, i]));
  const activityById = new Map(activities.map((a) => [a.id, a]));

  const myInterestIds = new Set(await getMyInterestIds(user.id));
  const myActivityIds = new Set(await getMyActivityIds(user.id));

  const summaries: MatchSummary[] = [];
  for (const m of matches) {
    const partnerId = m.user_a === user.id ? m.user_b : m.user_a;

    const [{ data: partner }, { data: lastMsg }, { data: pInterests }, { data: pActs }] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", partnerId).single(),
        supabase
          .from("messages")
          .select("*")
          .eq("match_id", m.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("user_interests").select("interest_id").eq("user_id", partnerId),
        supabase
          .from("user_activity_preferences")
          .select("activity_id")
          .eq("user_id", partnerId),
      ]);

    if (!partner) continue;

    const sharedInterests = (pInterests ?? [])
      .filter((r) => myInterestIds.has(r.interest_id as string))
      .map((r) => interestById.get(r.interest_id as string))
      .filter(Boolean) as Interest[];
    const sharedActivities = (pActs ?? [])
      .filter((r) => myActivityIds.has(r.activity_id as string))
      .map((r) => activityById.get(r.activity_id as string))
      .filter(Boolean) as Activity[];

    const { buildHangoutIdeas } = await import("@/lib/matching");

    summaries.push({
      matchId: m.id as string,
      partner: partner as Profile,
      compatibilityScore: m.compatibility_score as number,
      sharedInterests,
      hangoutIdeas: buildHangoutIdeas(sharedActivities, sharedInterests),
      lastMessage: (lastMsg as Message) ?? null,
      createdAt: m.created_at as string,
    });
  }

  return summaries;
}

/** Profiles the current member has blocked (for the settings list). */
export async function getBlockedProfiles(): Promise<Profile[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: blockRows } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id);
  const ids = (blockRows ?? []).map((r) => r.blocked_id as string);
  if (ids.length === 0) return [];

  // Service-side fetch of blocked profiles (RLS allows reading any profile id
  // here because the viewer authored the block).
  const { data } = await supabase.from("profiles").select("*").in("id", ids);
  return (data as Profile[]) ?? [];
}

/** Load a single match (for the chat view), verifying participation via RLS. */
export async function getMatchThread(matchId: string): Promise<{
  match: { id: string; compatibility_score: number } | null;
  partner: Profile | null;
  messages: Message[];
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { match: null, partner: null, messages: [] };

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();
  if (!match) return { match: null, partner: null, messages: [] };

  const partnerId = match.user_a === user.id ? match.user_b : match.user_a;
  const [{ data: partner }, { data: messages }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", partnerId).single(),
    supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true }),
  ]);

  return {
    match: { id: match.id as string, compatibility_score: match.compatibility_score as number },
    partner: (partner as Profile) ?? null,
    messages: (messages as Message[]) ?? [],
  };
}
