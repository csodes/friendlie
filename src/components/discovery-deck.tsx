"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bookmark,
  Heart,
  X,
  MapPin,
  Flag,
  Sparkles,
  PartyPopper,
} from "lucide-react";

import type { DiscoveryCandidate, LikeAction } from "@/lib/types";
import { approxDistanceLabel, initials } from "@/lib/utils";
import { recordFeedAction } from "@/app/actions/social";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SafetyDialog } from "@/components/safety-dialog";

export function DiscoveryDeck({
  initialCandidates,
}: {
  initialCandidates: DiscoveryCandidate[];
}) {
  const { toast } = useToast();
  const [queue, setQueue] = React.useState(initialCandidates);
  const [pending, setPending] = React.useState(false);
  const [safetyOpen, setSafetyOpen] = React.useState(false);
  const [matchCelebration, setMatchCelebration] =
    React.useState<DiscoveryCandidate | null>(null);

  const current = queue[0];

  async function act(action: LikeAction) {
    if (!current || pending) return;
    setPending(true);
    const candidate = current;
    const res = await recordFeedAction(candidate.profile.id, action);
    setPending(false);

    if (!res.ok) {
      toast({ title: "Something went wrong", description: res.error, variant: "warning" });
      return;
    }

    // Advance the deck.
    setQueue((prev) => prev.slice(1));

    if (action === "save") {
      toast({
        title: "Saved",
        description: `${candidate.profile.display_name} is in your saved list.`,
        variant: "success",
      });
    }
    if (res.matched) {
      setMatchCelebration(candidate);
    }
  }

  if (!current) {
    return (
      <EmptyState />
    );
  }

  const { profile, sharedInterests, sharedActivities, compatibilityScore, approxDistanceKm, hangoutIdeas } =
    current;

  return (
    <div className="mx-auto max-w-md">
      {/* Platonic reassurance banner */}
      <p className="mb-3 flex items-center justify-center gap-1.5 text-center text-xs font-medium text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        Friendlie is 100% platonic — you&apos;re meeting a potential friend
      </p>

      <Card className="overflow-hidden">
        {/* Photo / header */}
        <div className="relative h-72 friendlie-gradient">
          {profile.photos[0] || profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photos[0] ?? profile.avatar_url ?? ""}
              alt={profile.display_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Avatar className="h-28 w-28 text-3xl">
                <AvatarFallback>{initials(profile.display_name)}</AvatarFallback>
              </Avatar>
            </div>
          )}
          <div className="absolute right-3 top-3">
            <button
              onClick={() => setSafetyOpen(true)}
              className="flex items-center gap-1 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-background"
              aria-label="Report or block"
            >
              <Flag className="h-3.5 w-3.5" />
              Safety
            </button>
          </div>
          <div className="absolute left-3 top-3">
            <Badge className="gap-1 bg-background/90 text-foreground shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {compatibilityScore}% match
            </Badge>
          </div>
        </div>

        <CardContent className="space-y-4 p-5">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {profile.display_name}
                {profile.age_range && (
                  <span className="ml-2 text-base font-normal text-muted-foreground">
                    {profile.age_range}
                  </span>
                )}
              </h2>
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {profile.show_distance
                ? approxDistanceLabel(approxDistanceKm)
                : profile.city ?? "Nearby"}
            </p>
          </div>

          {profile.bio && <p className="text-sm">{profile.bio}</p>}

          {sharedInterests.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Shared interests
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sharedInterests.map((i) => (
                  <Badge key={i.id} variant="secondary" className="gap-1">
                    <span aria-hidden>{i.emoji}</span>
                    {i.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {hangoutIdeas.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Hangout ideas
              </p>
              <ul className="space-y-1">
                {hangoutIdeas.map((idea) => (
                  <li key={idea} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-primary">•</span>
                    {idea}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sharedActivities.length > 0 && (
            <>
              <Separator />
              <p className="text-xs text-muted-foreground">
                You both enjoy{" "}
                {sharedActivities.map((a) => a.name.toLowerCase()).join(", ")}.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="mt-5 flex items-center justify-center gap-4">
        <Button
          size="icon"
          variant="outline"
          className="h-14 w-14 rounded-full"
          onClick={() => act("skip")}
          disabled={pending}
          aria-label="Skip"
        >
          <X className="h-6 w-6" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="h-12 w-12 rounded-full text-sunshine"
          onClick={() => act("save")}
          disabled={pending}
          aria-label="Save for later"
        >
          <Bookmark className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          className="h-14 w-14 rounded-full"
          onClick={() => act("like")}
          disabled={pending}
          aria-label="Send a friend request"
        >
          <Heart className="h-6 w-6" />
        </Button>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Skip · Save for later · Connect
      </p>

      <SafetyDialog
        targetId={profile.id}
        targetName={profile.display_name}
        open={safetyOpen}
        onOpenChange={setSafetyOpen}
        onBlocked={() => setQueue((prev) => prev.slice(1))}
      />

      {matchCelebration && (
        <MatchCelebration
          candidate={matchCelebration}
          onClose={() => setMatchCelebration(null)}
        />
      )}
    </div>
  );
}

function MatchCelebration({
  candidate,
  onClose,
}: {
  candidate: DiscoveryCandidate;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-sm text-center">
        <CardContent className="space-y-4 p-8">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PartyPopper className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold">It&apos;s a friend match!</h2>
          <p className="text-muted-foreground">
            You and {candidate.profile.display_name} both want to connect. Say
            hello and plan a hangout together.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/matches">Start a conversation</Link>
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Keep discovering
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="mx-auto max-w-md text-center">
      <CardContent className="space-y-3 p-10">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-2xl">
          🌱
        </div>
        <h2 className="text-xl font-semibold">You&apos;re all caught up</h2>
        <p className="text-sm text-muted-foreground">
          You&apos;ve seen everyone nearby for now. Try widening your distance
          radius in settings, or check back soon for new friendly faces.
        </p>
        <div className="flex justify-center gap-2 pt-2">
          <Button asChild variant="outline">
            <Link href="/settings">Adjust radius</Link>
          </Button>
          <Button asChild>
            <Link href="/matches">View matches</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
