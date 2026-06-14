// ---------------------------------------------------------------------------
// Domain types for Friendlie.
// These mirror the PostgreSQL schema in supabase/schema.sql. Keeping a single
// source of truth here keeps the UI and data layer in sync.
// ---------------------------------------------------------------------------

export type InterestCategory =
  | "fitness"
  | "food"
  | "music"
  | "gaming"
  | "books"
  | "outdoors"
  | "arts"
  | "volunteering"
  | "sports"
  | "tech"
  | "parenting"
  | "pets"
  | "travel"
  | "wellness";

/** A swipe/feed action. Deliberately non-romantic vocabulary. */
export type LikeAction = "like" | "skip" | "save";

export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

export type AgeRange = "18-24" | "25-34" | "35-44" | "45-54" | "55-64" | "65+";

/** Days of the week a member is typically free to meet up. */
export type AvailabilitySlot =
  | "weekday-mornings"
  | "weekday-afternoons"
  | "weekday-evenings"
  | "weekend-mornings"
  | "weekend-afternoons"
  | "weekend-evenings";

/** What kind of platonic connection a member is looking for. */
export type FriendshipPreference =
  | "activity-partner"
  | "regular-hangouts"
  | "group-friends"
  | "one-on-one"
  | "new-in-town"
  | "accountability-buddy";

export interface Interest {
  id: string;
  slug: string;
  name: string;
  category: InterestCategory;
  emoji: string;
}

export interface Activity {
  id: string;
  slug: string;
  name: string;
  category: InterestCategory;
  emoji: string;
}

export interface Profile {
  id: string;
  display_name: string;
  age_range: AgeRange | null;
  city: string | null;
  // Coarse coordinates used only to compute approximate distance bands.
  latitude: number | null;
  longitude: number | null;
  bio: string | null;
  avatar_url: string | null;
  photos: string[];
  availability: AvailabilitySlot[];
  friendship_preferences: FriendshipPreference[];
  location_radius_km: number;
  is_onboarded: boolean;
  show_distance: boolean;
  discoverable: boolean;
  created_at: string;
  updated_at: string;
}

/** A candidate surfaced on the Discovery feed, enriched with match context. */
export interface DiscoveryCandidate {
  profile: Profile;
  sharedInterests: Interest[];
  sharedActivities: Activity[];
  compatibilityScore: number;
  approxDistanceKm: number | null;
  /** Friendly hangout ideas derived from shared activities. */
  hangoutIdeas: string[];
}

export interface MatchSummary {
  matchId: string;
  partner: Profile;
  compatibilityScore: number;
  sharedInterests: Interest[];
  hangoutIdeas: string[];
  lastMessage: Message | null;
  createdAt: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}
