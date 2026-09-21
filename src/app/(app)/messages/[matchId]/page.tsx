import { notFound } from "next/navigation";

import { getCurrentUser, getMatchThread, getMatches } from "@/lib/data";
import { Chat } from "@/components/chat";

export const metadata = { title: "Chat · Friendlie" };
export const dynamic = "force-dynamic";

export default async function ChatPage({
  params,
}: {
  // Next.js 15+ passes route params as a Promise.
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const [user, thread] = await Promise.all([
    getCurrentUser(),
    getMatchThread(matchId),
  ]);

  if (!user || !thread.match || !thread.partner) {
    notFound();
  }

  // Pull hangout ideas for this match to seed icebreakers.
  const matches = await getMatches();
  const summary = matches.find((m) => m.matchId === matchId);

  return (
    <Chat
      matchId={thread.match.id}
      meId={user.id}
      partner={thread.partner}
      compatibilityScore={thread.match.compatibility_score}
      initialMessages={thread.messages}
      hangoutIdeas={summary?.hangoutIdeas ?? []}
    />
  );
}
