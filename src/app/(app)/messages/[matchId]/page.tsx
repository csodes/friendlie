import { notFound } from "next/navigation";

import { getCurrentUser, getGameRounds, getMatchThread, getMatches } from "@/lib/data";
import { Chat } from "@/components/chat";
import { ThisOrThat } from "@/components/this-or-that";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  // Pull hangout ideas for this match to seed icebreakers, and the game board.
  const [matches, gameRounds] = await Promise.all([
    getMatches(),
    getGameRounds(matchId),
  ]);
  const summary = matches.find((m) => m.matchId === matchId);

  return (
    <div className="mx-auto max-w-2xl">
      <Tabs defaultValue="chat">
        <TabsList className="mx-auto grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="play">Play</TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="mt-3">
          <Chat
            matchId={thread.match.id}
            meId={user.id}
            partner={thread.partner}
            compatibilityScore={thread.match.compatibility_score}
            initialMessages={thread.messages}
            hangoutIdeas={summary?.hangoutIdeas ?? []}
          />
        </TabsContent>
        <TabsContent value="play" className="mt-3">
          <ThisOrThat
            matchId={thread.match.id}
            meId={user.id}
            partnerName={thread.partner.display_name}
            initialRounds={gameRounds}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
