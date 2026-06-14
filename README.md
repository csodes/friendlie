# Friendlie 

**Find your next activity partner nearby.** Friendlie is a responsive,
mobile-first web app for making **platonic** friendships and finding local
activity partners with shared interests. It has a familiar swipe-style
discovery UX — but it is **strictly non-romantic** by design.

> No dating. No romance. Just friends and activity partners.

---

## Features

- **Landing page** explaining the platonic concept with clear sign-up / log-in CTAs
- **Onboarding wizard** — profile basics, interests, activities, availability,
  friendship preferences, distance radius, and photos
- **Discovery feed** — swipeable profile cards with shared interests, suggested
  hangout ideas, a compatibility score, and **approximate** distance (never exact)
- **Matching engine** — a 0–100 compatibility score from shared interests,
  activities, location proximity, and schedule overlap. Matches form only on a
  **mutual** like
- **Matches page** — mutual matches with shared interests and first-hangout ideas
- **Real-time messaging** — chat unlocks only after a mutual match, powered by
  Supabase Realtime, with safety reminders and report/block built in
- **Profile & settings** — edit everything, control your distance radius, privacy
  toggles, blocked-users list, and account deletion
- **Safety first** — report & block anywhere, exact location is never shown,
  messaging is gated on a match, and a **Community Guidelines** page
- **Moderation-ready** database with `reports` and `blocks` tables

### Product language

Friendlie deliberately uses warm, platonic vocabulary — *friend match, activity
partner, shared interests, hangout ideas, nearby friends, platonic connection* —
and never uses romantic terms.

---

## Tech stack

| Layer      | Choice                                            |
| ---------- | ------------------------------------------------- |
| Framework  | [Next.js 14](https://nextjs.org) (App Router)     |
| Language   | TypeScript                                        |
| Styling    | Tailwind CSS + [shadcn/ui](https://ui.shadcn.com) |
| Backend    | [Supabase](https://supabase.com) (Auth, Postgres, Realtime, Storage) |
| Icons      | lucide-react                                      |

---

## Getting started

### 1. Prerequisites

- Node.js 18.18+ (Node 20+ recommended)
- A free [Supabase](https://supabase.com) project

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your Supabase project values
(Supabase dashboard → **Project Settings → API**):

```bash
cp .env.example .env.local
```

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # optional, server-only
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Set up the database

Open the Supabase **SQL Editor** and run these files **in order**:

1. [`supabase/schema.sql`](supabase/schema.sql) — tables, enums, triggers,
   Row Level Security policies, and the matching function
2. [`supabase/seed.sql`](supabase/seed.sql) — interests & activities seed data
3. [`supabase/storage.sql`](supabase/storage.sql) — public `photos` storage
   bucket and its access policies

> 💡 Using the [Supabase CLI](https://supabase.com/docs/guides/cli)? You can
> instead place these in `supabase/migrations` / `supabase/seed.sql` and run
> `supabase db reset`.

### 5. Configure Auth (email/password)

In the Supabase dashboard → **Authentication → Providers**, ensure **Email** is
enabled. For local development you can disable “Confirm email” for a frictionless
sign-up; in production keep it on (the app handles the confirmation redirect at
`/auth/callback`). Add `http://localhost:3000/**` to **URL Configuration →
Redirect URLs**.

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To experience matching end-to-end, sign up with **two** accounts (e.g. two
browser profiles), complete onboarding for each with overlapping interests, then
like each other from Discover — a match and chat will appear instantly.

---

## Scripts

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the dev server                 |
| `npm run build`     | Production build                     |
| `npm run start`     | Start the production server          |
| `npm run lint`      | Lint with ESLint                     |
| `npm run typecheck` | Type-check with `tsc --noEmit`       |

---

## Project structure

```
friendlie/
├── middleware.ts                 # Refreshes Supabase session + route guards
├── supabase/
│   ├── schema.sql                # Tables, enums, triggers, RLS, matching fn
│   ├── seed.sql                  # Interests & activities seed data
│   └── storage.sql               # `photos` bucket + policies
└── src/
    ├── app/
    │   ├── page.tsx              # Landing page
    │   ├── guidelines/           # Community guidelines (public)
    │   ├── (auth)/               # login, signup, auth actions
    │   ├── auth/callback/        # Email-confirmation handler
    │   ├── onboarding/           # Multi-step profile setup
    │   ├── (app)/                # Authenticated shell (nav)
    │   │   ├── discover/         # Swipe feed
    │   │   ├── matches/          # Mutual matches
    │   │   ├── messages/         # Conversation list + [matchId] chat
    │   │   ├── profile/          # Edit profile
    │   │   └── settings/         # Privacy, blocks, delete account
    │   └── actions/              # Server actions (social, messages, profile)
    ├── components/               # UI + feature components (shadcn/ui in ui/)
    └── lib/
        ├── matching.ts           # Compatibility scoring engine
        ├── data.ts               # Server-side data access (RLS-protected)
        ├── supabase/             # Browser / server / middleware clients
        ├── types.ts              # Domain types (mirror the SQL schema)
        └── constants.ts          # Shared option lists & labels
```

---

## How matching works

The compatibility score (0–100) is computed in
[`src/lib/matching.ts`](src/lib/matching.ts) from four platonic signals:

| Signal                    | Weight |
| ------------------------- | ------ |
| Shared interests          | 35     |
| Shared preferred activities | 30   |
| Location proximity        | 20     |
| Schedule / availability overlap | 15 |

Plus a small bonus for several concrete things in common. There is **no**
romantic signal anywhere in the model.

When two members like each other, a Postgres trigger
(`handle_like` in `schema.sql`) creates a `matches` row and stores a SQL-computed
score. Messaging is then unlocked for that pair — and only that pair — via Row
Level Security.

---

## Safety & privacy model

- **Exact location is never exposed.** Coordinates are stored privately and only
  a coarse distance band (e.g. “under 5 km away”) is surfaced.
- **Messaging requires a mutual match**, enforced by RLS on the `messages` table.
- **Report & block** are available on every profile and in every chat. Blocking
  removes any existing match and hides both members from each other.
- **Row Level Security** is enabled on every table — members only ever read and
  write what they should.
- The `reports` table is a ready-to-use moderation queue.

---

## Database tables

`users`, `profiles`, `interests`, `user_interests`, `activities`,
`user_activity_preferences`, `likes`, `matches`, `messages`, `reports`, `blocks` —
see [`supabase/schema.sql`](supabase/schema.sql) for the full definitions,
triggers, and policies.

---

## Deployment

Friendlie deploys cleanly to [Vercel](https://vercel.com):

1. Import the repo
2. Add the environment variables from `.env.example`
3. Set `NEXT_PUBLIC_SITE_URL` to your production URL and add
   `https://your-domain/**` to Supabase **Redirect URLs**
4. Deploy

---

## License

MIT — build kind, safe, platonic communities.
