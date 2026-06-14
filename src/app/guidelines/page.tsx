import Link from "next/link";
import {
  HandHeart,
  ShieldCheck,
  MessageCircle,
  MapPin,
  Flag,
  Sparkles,
  HeartHandshake,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Community Guidelines · Friendlie",
  description:
    "How we keep Friendlie warm, safe, inclusive, and strictly platonic.",
};

const PRINCIPLES = [
  {
    icon: HandHeart,
    title: "Friendship first — always platonic",
    body: "Friendlie is for making friends and finding activity partners. Romantic or sexual advances aren't welcome here. If someone treats it like a dating app, report them.",
  },
  {
    icon: HeartHandshake,
    title: "Be kind and inclusive",
    body: "Everyone deserves a friendly space regardless of race, gender, religion, orientation, ability, or background. Hate speech, harassment, and bullying are never tolerated.",
  },
  {
    icon: ShieldCheck,
    title: "Protect your privacy",
    body: "We never show your exact location — only an approximate distance. Take your time before sharing your address, workplace, or financial details.",
  },
  {
    icon: MapPin,
    title: "Meet safely",
    body: "For first hangouts, choose a public place and let a friend or family member know where you'll be. Trust your instincts — you can leave anytime.",
  },
  {
    icon: MessageCircle,
    title: "Communicate respectfully",
    body: "Messaging unlocks only after a mutual match. Keep conversations friendly. A 'no' or no reply is a complete answer — respect it.",
  },
  {
    icon: Flag,
    title: "Help us keep Friendlie safe",
    body: "See something off? Use Report or Block on any profile or chat. Our moderation team reviews every report.",
  },
];

export default function GuidelinesPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </header>

      <main className="container flex-1 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Community Guidelines
            </h1>
            <p className="mt-2 text-muted-foreground">
              Friendlie works because of the kindness of its members. Here&apos;s
              the promise we all make to each other.
            </p>
          </div>

          <div className="space-y-4">
            {PRINCIPLES.map((p) => (
              <Card key={p.title}>
                <CardContent className="flex gap-4 p-5">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{p.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {p.body}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8 friendlie-gradient border-none">
            <CardContent className="p-6 text-center">
              <h2 className="font-semibold">A quick reminder</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Repeated or serious violations lead to removal from Friendlie. We
                err on the side of keeping members safe.
              </p>
              <Button asChild className="mt-4">
                <Link href="/signup">Join the community</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Friendlie · Made for platonic friendships
        </div>
      </footer>
    </div>
  );
}
