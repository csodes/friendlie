"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TriviaAnswer, TriviaOption, TriviaSession } from "@/lib/types";

const QUESTIONS_PER_SESSION = 6;

/**
 * Start a new Trivia Duel for a match. Guarded by a partial unique index
 * (one non-finished session per match) — if the partner started one a
 * moment earlier, we join that session instead of erroring.
 */
export async function startTriviaSession(
  matchId: string,
): Promise<{ ok: boolean; session?: TriviaSession; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: questionIds, error: pickError } = await supabase.rpc(
    "pick_random_trivia_questions",
    { n: QUESTIONS_PER_SESSION },
  );
  if (pickError) return { ok: false, error: pickError.message };
  if (!questionIds || questionIds.length === 0) {
    return { ok: false, error: "No trivia questions available" };
  }

  const { data, error } = await supabase
    .from("trivia_sessions")
    .insert({ match_id: matchId, question_ids: questionIds })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: existing, error: fetchError } = await supabase
        .from("trivia_sessions")
        .select("*")
        .eq("match_id", matchId)
        .neq("status", "finished")
        .maybeSingle();
      if (fetchError || !existing) {
        return { ok: false, error: fetchError?.message ?? "Could not join the duel" };
      }
      return { ok: true, session: existing as TriviaSession };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath(`/messages/${matchId}`);
  return { ok: true, session: data as TriviaSession };
}

/**
 * Submit (or update) a member's pick for the current question. Only accepted
 * while that question is still the live, active one — the UI already
 * disables answering after reveal, but this guards the raw API too, so a
 * client can't wait for the reveal (or a later question) and then submit a
 * guaranteed-correct answer after the fact.
 */
export async function submitTriviaAnswer(
  sessionId: string,
  questionId: string,
  choice: TriviaOption,
): Promise<{ ok: boolean; answer?: TriviaAnswer; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: session, error: sessionError } = await supabase
    .from("trivia_sessions")
    .select("status, current_index, question_ids")
    .eq("id", sessionId)
    .maybeSingle();
  if (sessionError || !session) return { ok: false, error: sessionError?.message ?? "Session not found" };

  const isCurrentQuestion = session.question_ids[session.current_index] === questionId;
  if (session.status !== "active" || !isCurrentQuestion) {
    return { ok: false, error: "This question is no longer live" };
  }

  const { data, error } = await supabase
    .from("trivia_answers")
    .upsert(
      { session_id: sessionId, question_id: questionId, user_id: user.id, choice },
      { onConflict: "session_id,question_id,user_id" },
    )
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, answer: data as TriviaAnswer };
}

/**
 * Flip the current question from "active" to "reveal" once the shared timer
 * runs out. Guarded on the expected index/status so whichever client's timer
 * fires first wins and the other's call becomes a harmless no-op.
 */
export async function revealCurrentQuestion(
  sessionId: string,
  expectedIndex: number,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("trivia_sessions")
    .update({ status: "reveal" })
    .eq("id", sessionId)
    .eq("current_index", expectedIndex)
    .eq("status", "active");

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Move from "reveal" to the next question, or "finished" if that was the last one. */
export async function advanceTriviaSession(
  sessionId: string,
  expectedIndex: number,
  totalQuestions: number,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const nextIndex = expectedIndex + 1;
  const finished = nextIndex >= totalQuestions;

  const { error } = await supabase
    .from("trivia_sessions")
    .update({
      current_index: nextIndex,
      status: finished ? "finished" : "active",
      question_started_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("current_index", expectedIndex)
    .eq("status", "reveal");

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
