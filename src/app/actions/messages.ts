"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Message } from "@/lib/types";

/**
 * Send a message in a match thread. RLS enforces that the sender is a member
 * of the match and that neither party has blocked the other.
 */
export async function sendMessage(
  matchId: string,
  body: string,
): Promise<{ ok: boolean; message?: Message; error?: string }> {
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "Message is empty" };
  if (trimmed.length > 2000) return { ok: false, error: "Message is too long" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data, error } = await supabase
    .from("messages")
    .insert({ match_id: matchId, sender_id: user.id, body: trimmed })
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/messages/${matchId}`);
  revalidatePath("/messages");
  return { ok: true, message: data as Message };
}

/** Mark all of the other member's messages in a thread as read. */
export async function markThreadRead(matchId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("match_id", matchId)
    .neq("sender_id", user.id)
    .is("read_at", null);
}
