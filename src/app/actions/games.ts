"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { GameAnswer, GameChoice } from "@/lib/types";

/**
 * Submit (or update) a member's pick for a "This or That" prompt in a match.
 * RLS enforces that the sender is a member of the match and that neither
 * party has blocked the other.
 */
export async function submitGameAnswer(
  matchId: string,
  promptId: string,
  choice: GameChoice,
): Promise<{
  ok: boolean;
  answer?: GameAnswer;
  partnerChoice?: GameChoice | null;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data, error } = await supabase
    .from("game_answers")
    .upsert(
      { match_id: matchId, prompt_id: promptId, user_id: user.id, choice },
      { onConflict: "match_id,prompt_id,user_id" },
    )
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };

  // Now that I've answered, RLS lets me see the partner's pick for this
  // prompt too (if they already made one) — return it so the reveal is
  // correct immediately rather than waiting on a realtime event that
  // already fired before we subscribed to it.
  const { data: partnerRow } = await supabase
    .from("game_answers")
    .select("choice")
    .eq("match_id", matchId)
    .eq("prompt_id", promptId)
    .neq("user_id", user.id)
    .maybeSingle();

  revalidatePath(`/messages/${matchId}`);
  return {
    ok: true,
    answer: data as GameAnswer,
    partnerChoice: (partnerRow?.choice as GameChoice) ?? null,
  };
}
