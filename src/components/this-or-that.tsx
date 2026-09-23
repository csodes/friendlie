"use client";

import * as React from "react";
import { Check, Hourglass, Sparkles, X } from "lucide-react";

import type { GameChoice, GameRound } from "@/lib/types";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { submitGameAnswer } from "@/app/actions/games";
import { Button } from "@/components/ui/button";

interface ThisOrThatProps {
  matchId: string;
  meId: string;
  partnerName: string;
  initialRounds: GameRound[];
}

/**
 * Async "This or That" game for a matched pair. Each member picks an option
 * independently; once both have answered a prompt it reveals, and partner
 * picks stream in over Supabase Realtime so neither side has to refresh.
 */
export function ThisOrThat({
  matchId,
  meId,
  partnerName,
  initialRounds,
}: ThisOrThatProps) {
  const [rounds, setRounds] = React.useState<GameRound[]>(initialRounds);
  const [pending, setPending] = React.useState<string | null>(null);

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`game_answers:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_answers",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const row = payload.new as {
            prompt_id: string;
            user_id: string;
            choice: GameChoice;
          };
          if (row.user_id === meId) return; // our own writes are handled optimistically
          setRounds((prev) =>
            prev.map((r) =>
              // Only accept the partner's pick once we've already answered
              // this prompt ourselves — otherwise it'd sit in client state
              // (visible via devtools) before we've made our own blind pick.
              r.prompt.id === row.prompt_id && r.myChoice !== null
                ? { ...r, partnerChoice: row.choice }
                : r,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [matchId, meId]);

  const answered = rounds.filter((r) => r.myChoice !== null);
  const revealed = rounds.filter((r) => r.myChoice && r.partnerChoice);
  const matched = revealed.filter((r) => r.myChoice === r.partnerChoice);
  const current = rounds.find((r) => r.myChoice === null);

  async function pick(promptId: string, choice: GameChoice) {
    setPending(promptId);
    setRounds((prev) =>
      prev.map((r) =>
        r.prompt.id === promptId ? { ...r, myChoice: choice } : r,
      ),
    );
    const res = await submitGameAnswer(matchId, promptId, choice);
    setPending(null);
    if (res.ok) {
      if (res.partnerChoice) {
        setRounds((prev) =>
          prev.map((r) =>
            r.prompt.id === promptId
              ? { ...r, partnerChoice: res.partnerChoice! }
              : r,
          ),
        );
      }
    } else {
      // Roll back on failure.
      setRounds((prev) =>
        prev.map((r) =>
          r.prompt.id === promptId ? { ...r, myChoice: null } : r,
        ),
      );
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      {revealed.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 rounded-full bg-accent/60 px-3 py-1.5 text-center text-xs font-medium text-accent-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {matched.length}/{revealed.length} in common so far
        </div>
      )}

      {current ? (
        <PromptCard
          round={current}
          partnerName={partnerName}
          pending={pending === current.prompt.id}
          onPick={(choice) => pick(current.prompt.id, choice)}
        />
      ) : rounds.length > 0 ? (
        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          You&rsquo;ve answered every prompt! Check back later for more.
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No prompts available yet.
        </div>
      )}

      {answered.length > 0 && (
        <div className="space-y-2">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Past rounds
          </p>
          {[...answered].reverse().map((r) => (
            <PastRound key={r.prompt.id} round={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function PromptCard({
  round,
  partnerName,
  pending,
  onPick,
}: {
  round: GameRound;
  partnerName: string;
  pending: boolean;
  onPick: (choice: GameChoice) => void;
}) {
  const { prompt } = round;
  return (
    <div className="rounded-2xl border p-5">
      <p className="mb-4 text-center text-sm font-medium text-muted-foreground">
        This or that?
      </p>
      <div className="grid grid-cols-2 gap-3">
        <OptionButton
          emoji={prompt.emoji_a}
          label={prompt.option_a}
          disabled={pending}
          onClick={() => onPick("a")}
        />
        <OptionButton
          emoji={prompt.emoji_b}
          label={prompt.option_b}
          disabled={pending}
          onClick={() => onPick("b")}
        />
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Waiting to see what {partnerName} picks too.
      </p>
    </div>
  );
}

function OptionButton({
  emoji,
  label,
  disabled,
  onClick,
}: {
  emoji: string;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className="h-auto flex-col gap-1.5 whitespace-normal py-5 text-sm font-medium"
    >
      <span className="text-2xl">{emoji}</span>
      {label}
    </Button>
  );
}

function PastRound({ round }: { round: GameRound }) {
  const { prompt, myChoice, partnerChoice } = round;
  const revealed = myChoice !== null && partnerChoice !== null;
  const isMatch = revealed && myChoice === partnerChoice;

  return (
    <div className="flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm">
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">
          {prompt.option_a} <span className="opacity-50">vs</span>{" "}
          {prompt.option_b}
        </p>
        {revealed ? (
          <p className="mt-0.5">
            You: {myChoice === "a" ? prompt.emoji_a : prompt.emoji_b}{" "}
            {myChoice === "a" ? prompt.option_a : prompt.option_b} · Them:{" "}
            {partnerChoice === "a" ? prompt.emoji_a : prompt.emoji_b}{" "}
            {partnerChoice === "a" ? prompt.option_a : prompt.option_b}
          </p>
        ) : (
          <p className="mt-0.5 text-muted-foreground">
            You picked {myChoice === "a" ? prompt.option_a : prompt.option_b}
          </p>
        )}
      </div>
      {revealed ? (
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
            isMatch
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {isMatch ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
        </span>
      ) : (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Hourglass className="h-3 w-3" />
        </span>
      )}
    </div>
  );
}
