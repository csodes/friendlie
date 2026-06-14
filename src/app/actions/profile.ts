"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  AgeRange,
  AvailabilitySlot,
  FriendshipPreference,
} from "@/lib/types";

export interface ProfileInput {
  display_name: string;
  age_range: AgeRange | null;
  city: string | null;
  bio: string | null;
  latitude: number | null;
  longitude: number | null;
  availability: AvailabilitySlot[];
  friendship_preferences: FriendshipPreference[];
  location_radius_km: number;
  photos: string[];
  show_distance: boolean;
  discoverable: boolean;
}

/** Replace the current member's selected interest rows. */
export async function setInterests(interestIds: string[]) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  await supabase.from("user_interests").delete().eq("user_id", user.id);
  if (interestIds.length > 0) {
    const rows = interestIds.map((interest_id) => ({
      user_id: user.id,
      interest_id,
    }));
    const { error } = await supabase.from("user_interests").insert(rows);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/profile");
  revalidatePath("/discover");
  return { ok: true };
}

/** Replace the current member's preferred activity rows. */
export async function setActivities(activityIds: string[]) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  await supabase
    .from("user_activity_preferences")
    .delete()
    .eq("user_id", user.id);
  if (activityIds.length > 0) {
    const rows = activityIds.map((activity_id) => ({
      user_id: user.id,
      activity_id,
    }));
    const { error } = await supabase
      .from("user_activity_preferences")
      .insert(rows);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/profile");
  revalidatePath("/discover");
  return { ok: true };
}

/** Update profile fields (partial). */
export async function updateProfile(input: Partial<ProfileInput>) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { error } = await supabase
    .from("profiles")
    .update(input)
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/profile");
  revalidatePath("/settings");
  return { ok: true };
}

/**
 * Full onboarding submission: saves the profile, interests and activities, then
 * marks the member as onboarded and routes them to Discover.
 */
export async function completeOnboarding(payload: {
  profile: ProfileInput;
  interestIds: string[];
  activityIds: string[];
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  if (!payload.profile.display_name.trim()) {
    return { ok: false, error: "Please add your name." };
  }
  if (payload.interestIds.length < 1) {
    return { ok: false, error: "Pick at least one interest." };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ ...payload.profile, is_onboarded: true })
    .eq("id", user.id);
  if (profileError) return { ok: false, error: profileError.message };

  const interestRes = await setInterests(payload.interestIds);
  if (!interestRes.ok) return interestRes;
  const activityRes = await setActivities(payload.activityIds);
  if (!activityRes.ok) return activityRes;

  revalidatePath("/discover");
  return { ok: true };
}

/** Permanently delete the member's account and all associated data. */
export async function deleteAccount() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Deleting the profile cascades to interests, likes, matches, messages, etc.
  // The auth user row is best removed via an admin/service task; here we clear
  // app data and sign the member out.
  await supabase.from("profiles").delete().eq("id", user.id);
  await supabase.auth.signOut();
  redirect("/");
}
