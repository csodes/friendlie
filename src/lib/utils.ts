import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, resolving conflicts (shadcn/ui convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert an exact distance in kilometres into a friendly, privacy-preserving
 * band. We never surface a user's precise location — only an approximate range.
 */
export function approxDistanceLabel(km: number | null): string {
  if (km == null) return "Nearby";
  if (km < 2) return "Under 2 km away";
  if (km < 5) return "About 5 km away";
  if (km < 10) return "Under 10 km away";
  if (km < 25) return "Within 25 km";
  return "More than 25 km away";
}

/** Format an ISO timestamp for chat bubbles (e.g. "2:45 PM"). */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Initials for avatar fallbacks. */
export function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
