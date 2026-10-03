"use client";

import * as React from "react";
import { Check, Sparkles, Trophy, X } from "lucide-react";

import type {
  TriviaAnswer,
  TriviaBoard,
  TriviaOption,
  TriviaQuestion,
  TriviaSession,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  advanceTriviaSession,
  revealCurrentQuestion,
  startTriviaSession,
  submitTriviaAnswer,
} from "@/app/actions/trivia";
import { Button } from "@/components/ui/button";

const QUESTION_SECONDS = 15;
const REVEAL_SECONDS = 4;
const OPTIONS: TriviaOption[] = ["a", "b", "c", "d"];

interface TriviaDuelProps {
  matchId: string;
  meId: string;
  partnerName: string;
  initialBoard: TriviaBoard | null;
}

/**
 * Live Trivia Duel. The Postgres row is the single source of truth for game
 * state (current question + a shared start timestamp) so either client can
 * drive the clock — no fragile "host" client required. Whichever client's
 * local countdown reaches zero first calls the guarded reveal/advance
 * actions; the other client's call becomes a harmless no-op.
 */
export function TriviaDuel({ matchId, meId, partnerName, initialBoard }: TriviaDuelProps) {
  const [session, setSession] = React.useState<TriviaSession | null>(
    initialBoard?.session ?? null,
  );
  const [questions, setQuestions] = React.useState<TriviaQuestion[]>(
    initialBoard?.questions ?? [],
  );
  const [myAnswers, setMyAnswers] = React.useState<Record<string, TriviaOption>>(
    initialBoard?.myAnswers ?? {},
  );
  const [rawPartnerAnswers, setRawPartnerAnswers] = React.useState<
    Record<string, TriviaOption>
  >(initialBoard?.partnerAnswers ?? {});
  const [starting, setStarting] = React.useState(false);
  const [now, setNow] = React.useState(() => Date.now());

  const advancedRef = React.useRef<string | null>(null);

  // Tick every 200ms while a question is live, to drive the countdown.
  React.useEffect(() => {
    if (session?.status !== "active") return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [session?.status]);

  // Subscribe to session state changes (mine or the partner's) for this match.
  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`trivia_sessions:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trivia_sessions",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const row = payload.new as TriviaSession | undefined;
          if (!row) return;
          setSession(row);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [matchId]);

  // Load the question bank whenever we (re)join a session, and reset
  // per-session answer state.
  React.useEffect(() => {
    if (!session) return;
    if (questions.length > 0 && questions.every((q) => session.question_ids.includes(q.id))) {
      return;
    }
    const supabase = createClient();
    supabase
      .from("trivia_questions")
      .select("*")
      .in("id", session.question_ids)
      .then(({ data }) => {
        const byId = new Map((data ?? []).map((q) => [q.id as string, q]));
        setQuestions(
          session.question_ids
            .map((id) => byId.get(id))
            .filter(Boolean) as TriviaQuestion[],
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  // Subscribe to answers for the current session.
  React.useEffect(() => {
    if (!session) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`trivia_answers:${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trivia_answers",
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const row = payload.new as TriviaAnswer;
          if (row.user_id === meId) return;
          setRawPartnerAnswers((prev) => ({ ...prev, [row.question_id]: row.choice }));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, meId]);

  const currentIndex = session?.current_index ?? 0;
  const status = session?.status;

  // Only surface the partner's pick for a question once it's actually
  // revealed — past questions, or the current one once time is up — or once
  // I've answered it myself. Otherwise it'd sit in client state (inspectable
  // via devtools) before I've made my own blind-under-time-pressure pick.
  const partnerAnswers = React.useMemo(() => {
    const visible: Record<string, TriviaOption> = {};
    questions.forEach((q, i) => {
      const revealed = i < currentIndex || status === "reveal" || status === "finished";
      if ((revealed || myAnswers[q.id]) && rawPartnerAnswers[q.id]) {
        visible[q.id] = rawPartnerAnswers[q.id];
      }
    });
    return visible;
  }, [questions, currentIndex, status, myAnswers, rawPartnerAnswers]);

  const resolvedCount = status === "finished" ? questions.length : status === "reveal" ? currentIndex + 1 : currentIndex;
  const myScore = questions
    .slice(0, resolvedCount)
    .filter((q) => myAnswers[q.id] === q.correct_option).length;
  const partnerScore = questions
    .slice(0, resolvedCount)
    .filter((q) => partnerAnswers[q.id] === q.correct_option).length;

  const currentQuestion = session ? questions[currentIndex] : undefined;
  const remainingMs = session
    ? QUESTION_SECONDS * 1000 - (now - new Date(session.question_started_at).getTime())
    : 0;
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

  // Drive the shared clock: reveal once time's up, then auto-advance.
  React.useEffect(() => {
    if (!session || !currentQuestion) return;
    const key = `${session.id}:${session.current_index}:${session.status}`;
    if (advancedRef.current === key) return;

    if (session.status === "active" && remainingMs <= 0) {
      advancedRef.current = key;
      void revealCurrentQuestion(session.id, session.current_index);
    } else if (session.status === "reveal") {
      advancedRef.current = key;
      const timeout = setTimeout(() => {
        void advanceTriviaSession(session.id, session.current_index, questions.length);
      }, REVEAL_SECONDS * 1000);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, session?.current_index, session?.status, remainingMs <= 0, questions.length]);

  async function handleStart() {
    setStarting(true);
    const res = await startTriviaSession(matchId);
    setStarting(false);
    if (res.ok && res.session) {
      setMyAnswers({});
      setRawPartnerAnswers({});
      setQuestions([]);
      setSession(res.session);
    }
  }

  async function pick(choice: TriviaOption) {
    if (!session || !currentQuestion || myAnswers[currentQuestion.id]) return;
    setMyAnswers((prev) => ({ ...prev, [currentQuestion.id]: choice }));
    await submitTriviaAnswer(session.id, currentQuestion.id, choice);
  }

  if (!session) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-center">
        <Trophy className="h-8 w-8 text-primary" />
        <p className="font-medium">Trivia Duel</p>
        <p className="text-sm text-muted-foreground">
          Six quick questions, live at the same time as {partnerName}. See who
          knows more!
        </p>
        <Button onClick={handleStart} disabled={starting}>
          {starting ? "Starting…" : "Start Trivia Duel"}
        </Button>
      </div>
    );
  }

  if (status === "finished") {
    const verdict =
      myScore === partnerScore
        ? "It's a tie!"
        : myScore > partnerScore
          ? "You win this round!"
          : `${partnerName} wins this round!`;
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 rounded-2xl border p-8 text-center">
        <Trophy className="h-8 w-8 text-primary" />
        <p className="text-lg font-semibold">{verdict}</p>
        <p className="text-sm text-muted-foreground">
          You: {myScore}/{questions.length} · {partnerName}: {partnerScore}/{questions.length}
        </p>
        <Button onClick={handleStart} disabled={starting}>
          {starting ? "Starting…" : "Play again"}
        </Button>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Loading duel…
      </div>
    );
  }

  const myChoice = myAnswers[currentQuestion.id] ?? null;
  const partnerChoice = partnerAnswers[currentQuestion.id] ?? null;
  const revealed = status === "reveal";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between rounded-full bg-accent/60 px-4 py-1.5 text-xs font-medium text-accent-foreground">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          You: {myScore} · {partnerName}: {partnerScore}
        </span>
        <span>
          Question {currentIndex + 1}/{questions.length}
        </span>
      </div>

      <div className="rounded-2xl border p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            {revealed ? "Time's up!" : `${remainingSeconds}s left`}
          </p>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: revealed
                  ? "0%"
                  : `${Math.max(0, Math.min(100, (remainingMs / (QUESTION_SECONDS * 1000)) * 100))}%`,
              }}
            />
          </div>
        </div>

        <p className="mb-4 font-medium">{currentQuestion.question}</p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {OPTIONS.map((opt) => (
            <OptionButton
              key={opt}
              label={currentQuestion[`option_${opt}` as const]}
              selected={myChoice === opt}
              correct={revealed && currentQuestion.correct_option === opt}
              incorrect={revealed && myChoice === opt && myChoice !== currentQuestion.correct_option}
              partnerPick={revealed && partnerChoice === opt}
              disabled={myChoice !== null || revealed}
              onClick={() => pick(opt)}
            />
          ))}
        </div>

        {!revealed && myChoice && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Locked in — waiting for the timer…
          </p>
        )}
      </div>
    </div>
  );
}

function OptionButton({
  label,
  selected,
  correct,
  incorrect,
  partnerPick,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  correct: boolean;
  incorrect: boolean;
  partnerPick: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-auto justify-start whitespace-normal py-3 text-left text-sm font-medium",
        selected && !correct && !incorrect && "border-primary bg-primary/10",
        correct && "border-primary bg-primary/10 text-primary",
        incorrect && "border-destructive bg-destructive/10 text-destructive",
      )}
    >
      <span className="flex-1">{label}</span>
      {correct && <Check className="h-4 w-4 shrink-0" />}
      {incorrect && <X className="h-4 w-4 shrink-0" />}
      {partnerPick && !correct && (
        <span className="shrink-0 text-[10px] text-muted-foreground">their pick</span>
      )}
    </Button>
  );
}
