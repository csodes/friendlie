import type {
  AgeRange,
  AvailabilitySlot,
  FriendshipPreference,
  InterestCategory,
} from "./types";

export const AGE_RANGES: AgeRange[] = [
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65+",
];

export const AVAILABILITY_OPTIONS: {
  value: AvailabilitySlot;
  label: string;
}[] = [
  { value: "weekday-mornings", label: "Weekday mornings" },
  { value: "weekday-afternoons", label: "Weekday afternoons" },
  { value: "weekday-evenings", label: "Weekday evenings" },
  { value: "weekend-mornings", label: "Weekend mornings" },
  { value: "weekend-afternoons", label: "Weekend afternoons" },
  { value: "weekend-evenings", label: "Weekend evenings" },
];

export const FRIENDSHIP_PREFERENCES: {
  value: FriendshipPreference;
  label: string;
  description: string;
}[] = [
  {
    value: "activity-partner",
    label: "Activity partner",
    description: "Someone to do a specific hobby or sport with",
  },
  {
    value: "regular-hangouts",
    label: "Regular hangouts",
    description: "A friend for recurring meetups",
  },
  {
    value: "group-friends",
    label: "Group friends",
    description: "Building a small circle of friends",
  },
  {
    value: "one-on-one",
    label: "One-on-one friendship",
    description: "Close, individual friendships",
  },
  {
    value: "new-in-town",
    label: "New in town",
    description: "Getting to know the area and its people",
  },
  {
    value: "accountability-buddy",
    label: "Accountability buddy",
    description: "Keeping each other on track with goals",
  },
];

// Friendly labels for each interest category, used to group selectors.
export const CATEGORY_LABELS: Record<InterestCategory, string> = {
  fitness: "Fitness",
  food: "Food & Drink",
  music: "Music",
  gaming: "Gaming",
  books: "Books",
  outdoors: "Outdoors",
  arts: "Arts & Culture",
  volunteering: "Volunteering",
  sports: "Sports",
  tech: "Tech",
  parenting: "Parenting",
  pets: "Pets",
  travel: "Travel",
  wellness: "Wellness",
};

export const REPORT_REASONS = [
  "Harassment or bullying",
  "Inappropriate or romantic advances",
  "Spam or scam",
  "Fake profile",
  "Hate speech",
  "Safety concern",
  "Other",
];
