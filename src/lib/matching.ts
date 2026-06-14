import type {
  Activity,
  AvailabilitySlot,
  DiscoveryCandidate,
  Interest,
  Profile,
} from "./types";

// ---------------------------------------------------------------------------
// Friendlie matching engine
//
// Compatibility for *platonic* connections is computed from five signals:
//   1. Shared interests          (weight 35)
//   2. Shared preferred activities (weight 30)
//   3. Location proximity        (weight 20)
//   4. Schedule / availability overlap (weight 15)
//
// The result is a 0–100 "compatibility score". There is deliberately no
// romantic signal anywhere in this model.
// ---------------------------------------------------------------------------

const WEIGHTS = {
  interests: 35,
  activities: 30,
  proximity: 20,
  availability: 15,
} as const;

/** Great-circle distance between two coordinates in kilometres (Haversine). */
export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Earth's mean radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function overlapById<T extends { id: string }>(a: T[], b: T[]): T[] {
  const ids = new Set(b.map((item) => item.id));
  return a.filter((item) => ids.has(item.id));
}

function jaccard<T>(a: Set<T>, b: Set<T>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  a.forEach((value) => {
    if (b.has(value)) intersection += 1;
  });
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Maps a distance into a 0–1 proximity score within the viewer's radius. */
function proximityScore(km: number | null, radiusKm: number): number {
  if (km == null) return 0.4; // unknown location — neutral-ish
  if (km > radiusKm) return 0;
  // Linear falloff: same spot = 1, edge of radius = ~0.1
  return Math.max(0.1, 1 - km / Math.max(radiusKm, 1));
}

export interface CompatibilityInput {
  viewer: {
    interests: Interest[];
    activities: Activity[];
    availability: AvailabilitySlot[];
    latitude: number | null;
    longitude: number | null;
    radiusKm: number;
  };
  candidate: {
    profile: Profile;
    interests: Interest[];
    activities: Activity[];
  };
}

export interface CompatibilityResult {
  score: number;
  sharedInterests: Interest[];
  sharedActivities: Activity[];
  approxDistanceKm: number | null;
}

/**
 * Compute the platonic compatibility score (0–100) between the viewer and a
 * candidate, along with the shared context used to explain the match.
 */
export function computeCompatibility(
  input: CompatibilityInput,
): CompatibilityResult {
  const { viewer, candidate } = input;

  const sharedInterests = overlapById(viewer.interests, candidate.interests);
  const sharedActivities = overlapById(viewer.activities, candidate.activities);

  const interestScore = jaccard(
    new Set(viewer.interests.map((i) => i.id)),
    new Set(candidate.interests.map((i) => i.id)),
  );
  const activityScore = jaccard(
    new Set(viewer.activities.map((a) => a.id)),
    new Set(candidate.activities.map((a) => a.id)),
  );
  const availabilityScore = jaccard(
    new Set(viewer.availability),
    new Set(candidate.profile.availability),
  );

  let approxDistanceKm: number | null = null;
  if (
    viewer.latitude != null &&
    viewer.longitude != null &&
    candidate.profile.latitude != null &&
    candidate.profile.longitude != null
  ) {
    approxDistanceKm = distanceKm(
      viewer.latitude,
      viewer.longitude,
      candidate.profile.latitude,
      candidate.profile.longitude,
    );
  }
  const proximity = proximityScore(approxDistanceKm, viewer.radiusKm);

  const raw =
    interestScore * WEIGHTS.interests +
    activityScore * WEIGHTS.activities +
    proximity * WEIGHTS.proximity +
    availabilityScore * WEIGHTS.availability;

  // Small "shared spark" bonus so members with several concrete things in
  // common rank above those with only abstract overlap — capped at 100.
  const bonus = Math.min(sharedInterests.length + sharedActivities.length, 6);
  const score = Math.min(100, Math.round(raw + bonus));

  return { score, sharedInterests, sharedActivities, approxDistanceKm };
}

/**
 * Generate friendly hangout ideas from shared activities (and interests as a
 * fallback). Pure copy generation — keeps the tone warm and platonic.
 */
export function buildHangoutIdeas(
  sharedActivities: Activity[],
  sharedInterests: Interest[],
): string[] {
  const ideas: string[] = [];

  for (const activity of sharedActivities.slice(0, 3)) {
    ideas.push(HANGOUT_TEMPLATES[activity.slug] ?? `Plan a ${activity.name.toLowerCase()} meetup`);
  }

  if (ideas.length < 3) {
    for (const interest of sharedInterests) {
      if (ideas.length >= 3) break;
      ideas.push(`Swap ${interest.name.toLowerCase()} recommendations`);
    }
  }

  if (ideas.length === 0) {
    ideas.push("Grab a coffee and find your shared interests");
  }

  return ideas;
}

/** Activity-slug → suggested first hangout. Extend freely as activities grow. */
const HANGOUT_TEMPLATES: Record<string, string> = {
  "morning-run": "Meet up for an easy morning run",
  "coffee-walk": "Take a coffee walk around the neighbourhood",
  "board-games": "Host a casual board-game evening",
  "cooking-together": "Cook a new recipe together",
  "live-music": "Catch a local live-music set",
  "museum-visit": "Wander a museum or gallery together",
  "hiking": "Plan a beginner-friendly hike",
  "book-club": "Start a two-person book club",
  "potluck": "Organise a small potluck",
  "cycling": "Go for a relaxed weekend cycle",
  "volunteering": "Volunteer together for a local cause",
  "yoga": "Join a drop-in yoga class together",
  "photography-walk": "Take a photography walk downtown",
  "farmers-market": "Explore the farmers' market",
  "trivia-night": "Sign up for a pub trivia night",
  "dog-walk": "Walk your dogs at the park together",
};

/** Convenience: assemble a full DiscoveryCandidate from raw parts. */
export function toDiscoveryCandidate(
  profile: Profile,
  result: CompatibilityResult,
): DiscoveryCandidate {
  return {
    profile,
    sharedInterests: result.sharedInterests,
    sharedActivities: result.sharedActivities,
    compatibilityScore: result.score,
    approxDistanceKm: result.approxDistanceKm,
    hangoutIdeas: buildHangoutIdeas(
      result.sharedActivities,
      result.sharedInterests,
    ),
  };
}
