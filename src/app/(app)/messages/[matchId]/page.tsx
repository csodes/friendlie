import { notFound } from "next/navigation";

import {
  getCurrentUser,
  getGameRounds,
  getMatchThread,
  getMatches,
  getTriviaBoard,
} from "@/lib/data";
import { Chat } from "@/components/chat";
import { ThisOrThat } from "@/components/this-or-that";
import { TriviaDuel } from "@/components/trivia-duel";
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

  // Pull hangout ideas for this match to seed icebreakers, and both game boards.
  const [matches, gameRounds, triviaBoard] = await Promise.all([
    getMatches(),
    getGameRounds(matchId),
    getTriviaBoard(matchId),
  ]);
  const summary = matches.find((m) => m.matchId === matchId);

  return (
    <div className="mx-auto max-w-2xl">
      <Tabs defaultValue="chat">
        <TabsList className="mx-auto grid w-full max-w-sm grid-cols-3">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="play">This or That</TabsTrigger>
          <TabsTrigger value="trivia">Trivia</TabsTrigger>
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
        <TabsContent value="trivia" className="mt-3">
          <TriviaDuel
            matchId={thread.match.id}
            meId={user.id}
            partnerName={thread.partner.display_name}
            initialBoard={triviaBoard}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
