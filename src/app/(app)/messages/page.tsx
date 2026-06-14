import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { getMatches } from "@/lib/data";
import { initials } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const metadata = { title: "Messages · Friendlie" };
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const matches = await getMatches();
  // Conversations with messages first, then matches awaiting a hello.
  const sorted = [...matches].sort((a, b) => {
    const at = a.lastMessage?.created_at ?? a.createdAt;
    const bt = b.lastMessage?.created_at ?? b.createdAt;
    return bt.localeCompare(at);
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Chat with your matches and plan your next hangout.
        </p>
      </div>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-10 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-2xl">
              💬
            </div>
            <h2 className="text-lg font-semibold">No conversations yet</h2>
            <p className="text-sm text-muted-foreground">
              Messaging unlocks once you and another member match. Find your
              first friend in Discover.
            </p>
            <Button asChild>
              <Link href="/discover">Discover friends</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="divide-y overflow-hidden">
          {sorted.map((m) => (
            <Link
              key={m.matchId}
              href={`/messages/${m.matchId}`}
              className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/50"
            >
              <Avatar className="h-12 w-12">
                {m.partner.avatar_url || m.partner.photos[0] ? (
                  <AvatarImage
                    src={m.partner.avatar_url ?? m.partner.photos[0]}
                    alt={m.partner.display_name}
                  />
                ) : null}
                <AvatarFallback>{initials(m.partner.display_name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{m.partner.display_name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {m.lastMessage?.body ?? "You matched — say hello!"}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
