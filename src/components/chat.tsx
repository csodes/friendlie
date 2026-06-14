"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Send, ShieldAlert, ArrowLeft, Sparkles } from "lucide-react";

import type { Message, Profile } from "@/lib/types";
import { cn, formatTime, initials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, markThreadRead } from "@/app/actions/messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SafetyDialog } from "@/components/safety-dialog";

interface ChatProps {
  matchId: string;
  meId: string;
  partner: Profile;
  compatibilityScore: number;
  initialMessages: Message[];
  hangoutIdeas: string[];
}

/**
 * Realtime chat for a matched pair. New messages stream in over Supabase
 * Realtime (the `messages` table is in the realtime publication). Includes
 * always-available report/block actions and a gentle safety reminder.
 */
export function Chat({
  matchId,
  meId,
  partner,
  compatibilityScore,
  initialMessages,
  hangoutIdeas,
}: ChatProps) {
  const router = useRouter();
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [safetyOpen, setSafetyOpen] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = React.useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Subscribe to new messages in this match thread.
  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming],
          );
        },
      )
      .subscribe();

    void markThreadRead(matchId);

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [matchId]);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft("");

    // Optimistic append; realtime will de-dupe by id when the row arrives.
    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      match_id: matchId,
      sender_id: meId,
      body,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages((prev) => [...prev, optimistic]);

    const res = await sendMessage(matchId, body);
    setSending(false);
    if (res.ok && res.message) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? res.message! : m)),
      );
    } else {
      // Roll back the optimistic message on failure.
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(body);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-9rem)] max-w-2xl flex-col md:h-[calc(100dvh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => router.push("/messages")}
          aria-label="Back to messages"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10">
          {partner.avatar_url || partner.photos[0] ? (
            <AvatarImage
              src={partner.avatar_url ?? partner.photos[0]}
              alt={partner.display_name}
            />
          ) : null}
          <AvatarFallback>{initials(partner.display_name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold leading-tight">{partner.display_name}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            {compatibilityScore}% match · {partner.city ?? "Nearby"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSafetyOpen(true)}
          aria-label="Report or block"
        >
          <ShieldAlert className="h-5 w-5" />
        </Button>
      </div>

      {/* Safety reminder */}
      <div className="mt-3 rounded-xl bg-accent/60 px-3 py-2 text-center text-xs text-accent-foreground">
        Keep it friendly and platonic. Meet in public for first hangouts and
        never share financial details. You can report or block anytime.
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto py-4">
        {messages.length === 0 && (
          <div className="rounded-2xl border border-dashed p-5 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              You matched with {partner.display_name}!
            </p>
            {hangoutIdeas[0] && (
              <p className="mt-1">
                Break the ice: &ldquo;{hangoutIdeas[0]}&rdquo;?
              </p>
            )}
          </div>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === meId;
          return (
            <div
              key={m.id}
              className={cn("flex", mine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                  mine
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-muted text-foreground",
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p
                  className={cn(
                    "mt-0.5 text-[10px]",
                    mine
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  {formatTime(m.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form onSubmit={handleSend} className="flex items-center gap-2 border-t pt-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message ${partner.display_name}…`}
          maxLength={2000}
          autoComplete="off"
        />
        <Button type="submit" size="icon" disabled={sending || !draft.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>

      <SafetyDialog
        targetId={partner.id}
        targetName={partner.display_name}
        open={safetyOpen}
        onOpenChange={setSafetyOpen}
        onBlocked={() => router.push("/messages")}
      />
    </div>
  );
}
