import Link from "next/link";
import { MapPin, MessageCircle, Sparkles } from "lucide-react";

import { getMatches } from "@/lib/data";
import { initials } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const metadata = { title: "Matches · Friendlie" };
export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const matches = await getMatches();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Your friend matches</h1>
        <p className="text-sm text-muted-foreground">
          You both said yes. Start a conversation and plan a hangout.
        </p>
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-10 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-2xl">
              👋
            </div>
            <h2 className="text-lg font-semibold">No matches yet</h2>
            <p className="text-sm text-muted-foreground">
              Head to Discover and connect with people who share your interests.
              When you both say yes, they&apos;ll show up here.
            </p>
            <Button asChild>
              <Link href="/discover">Start discovering</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {matches.map((m) => (
            <Card key={m.matchId} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar className="h-14 w-14">
                    {m.partner.avatar_url || m.partner.photos[0] ? (
                      <AvatarImage
                        src={m.partner.avatar_url ?? m.partner.photos[0]}
                        alt={m.partner.display_name}
                      />
                    ) : null}
                    <AvatarFallback>
                      {initials(m.partner.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="truncate font-semibold">
                        {m.partner.display_name}
                      </h2>
                      <Badge variant="secondary" className="shrink-0 gap-1">
                        <Sparkles className="h-3 w-3 text-primary" />
                        {m.compatibilityScore}%
                      </Badge>
                    </div>
                    {m.partner.city && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {m.partner.city}
                      </p>
                    )}
                  </div>
                </div>

                {m.sharedInterests.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {m.sharedInterests.slice(0, 4).map((i) => (
                      <Badge key={i.id} variant="outline" className="gap-1">
                        <span aria-hidden>{i.emoji}</span>
                        {i.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {m.hangoutIdeas.length > 0 && (
                  <div className="mt-3 rounded-xl bg-accent/60 p-3">
                    <p className="text-xs font-semibold text-accent-foreground">
                      First hangout idea
                    </p>
                    <p className="text-sm text-accent-foreground/90">
                      {m.hangoutIdeas[0]}
                    </p>
                  </div>
                )}

                {m.lastMessage ? (
                  <p className="mt-3 truncate text-sm text-muted-foreground">
                    {m.lastMessage.body}
                  </p>
                ) : (
                  <p className="mt-3 text-sm italic text-muted-foreground">
                    No messages yet — say hi!
                  </p>
                )}

                <Button asChild className="mt-4 w-full gap-2">
                  <Link href={`/messages/${m.matchId}`}>
                    <MessageCircle className="h-4 w-4" />
                    {m.lastMessage ? "Open chat" : "Start conversation"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
