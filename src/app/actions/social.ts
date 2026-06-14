"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { LikeAction } from "@/lib/types";

// ---------------------------------------------------------------------------
// Social actions shared by Discovery, Matches, Profile and Chat. All run
// server-side and rely on RLS for authorisation. The DB trigger handles match
// creation on a mutual like (see supabase/schema.sql).
// ---------------------------------------------------------------------------

export interface ActionResult {
  ok: boolean;
  matched?: boolean;
  error?: string;
}

/**
 * Record a feed action (like / skip / save) toward another member. Returns
 * whether the action produced a mutual match so the UI can celebrate it.
 */
export async function recordFeedAction(
  likeeId: string,
  action: LikeAction,
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  if (user.id === likeeId) return { ok: false, error: "Invalid target" };

  // Upsert so a member can change their mind (e.g. skip → like later).
  const { error } = await supabase
    .from("likes")
    .upsert(
      { liker_id: user.id, likee_id: likeeId, action },
      { onConflict: "liker_id,likee_id" },
    );
  if (error) return { ok: false, error: error.message };

  let matched = false;
  if (action === "like") {
    // The trigger may have just created a match; check for it.
    const lo = user.id < likeeId ? user.id : likeeId;
    const hi = user.id < likeeId ? likeeId : user.id;
    const { data: match } = await supabase
      .from("matches")
      .select("id")
      .eq("user_a", lo)
      .eq("user_b", hi)
      .maybeSingle();
    matched = Boolean(match);
  }

  revalidatePath("/discover");
  revalidatePath("/matches");
  return { ok: true, matched };
}

/** File a report against another member. Goes into the moderation queue. */
export async function reportUser(
  reportedId: string,
  reason: string,
  details?: string,
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    reported_id: reportedId,
    reason,
    details: details ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Block another member. This hides them from discovery for both parties and
 * (via RLS) prevents further messages. Any existing match is removed so the
 * conversation disappears for both sides.
 */
export async function blockUser(blockedId: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  if (user.id === blockedId) return { ok: false, error: "Invalid target" };

  const { error } = await supabase
    .from("blocks")
    .upsert(
      { blocker_id: user.id, blocked_id: blockedId },
      { onConflict: "blocker_id,blocked_id" },
    );
  if (error) return { ok: false, error: error.message };

  // Tear down any existing match between the two members.
  const lo = user.id < blockedId ? user.id : blockedId;
  const hi = user.id < blockedId ? blockedId : user.id;
  await supabase.from("matches").delete().eq("user_a", lo).eq("user_b", hi);

  revalidatePath("/discover");
  revalidatePath("/matches");
  revalidatePath("/settings");
  return { ok: true };
}

/** Remove a block, allowing the two members to rediscover each other. */
export async function unblockUser(blockedId: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", blockedId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  return { ok: true };
}
