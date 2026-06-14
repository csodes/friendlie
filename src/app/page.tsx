import Link from "next/link";
import {
  MapPin,
  Sparkles,
  ShieldCheck,
  CalendarHeart,
  Users,
  MessageCircle,
  HandHeart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";

// Landing page is statically friendly but checks auth so we can point existing
// members straight to their feed.
export default async function LandingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Top bar */}
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/guidelines">Community</Link>
            </Button>
            {user ? (
              <Button asChild size="sm">
                <Link href="/discover">Open app</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4 gap-1">
              <HandHeart className="h-3.5 w-3.5" />
              100% platonic — no dating, ever
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
              Find your next{" "}
              <span className="text-primary">activity partner</span> nearby
            </h1>
            <p className="mt-6 text-balance text-lg text-muted-foreground">
              Friendlie matches you with nearby people who love the same things
              you do — so you can plan hangouts, build routines, and make real
              platonic friendships. No romance, no pressure.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/signup">Find nearby friends</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Link href="/login">I already have an account</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Free to join · Your exact location is never shared
            </p>
          </div>

          {/* Floating activity preview cards */}
          <div className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              { emoji: "🥾", label: "Weekend hikes", who: "Outdoor crew" },
              { emoji: "🎲", label: "Board game nights", who: "Game night pals" },
              { emoji: "☕", label: "Coffee walks", who: "New in town" },
            ].map((c) => (
              <Card key={c.label} className="friendlie-gradient border-none">
                <CardContent className="flex items-center gap-4 p-5">
                  <span className="text-3xl" aria-hidden>
                    {c.emoji}
                  </span>
                  <div>
                    <p className="font-semibold">{c.label}</p>
                    <p className="text-sm text-muted-foreground">{c.who}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-y bg-secondary/30">
          <div className="container py-16">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              How Friendlie works
            </h2>
            <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
              {[
                {
                  icon: Sparkles,
                  title: "Share what you love",
                  body: "Pick your interests, favourite activities, and when you're usually free.",
                },
                {
                  icon: Users,
                  title: "Discover nearby friends",
                  body: "Browse people close to you with shared interests and a compatibility score.",
                },
                {
                  icon: MessageCircle,
                  title: "Match & make plans",
                  body: "When you both say yes, you match. Chat and plan a first hangout together.",
                },
              ].map((s) => (
                <Card key={s.title} className="border-none shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {s.body}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Value props */}
        <section className="container py-16">
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">
            {[
              {
                icon: MapPin,
                title: "Local by design",
                body: "Match within a radius you control. We show approximate distance — never your exact location.",
              },
              {
                icon: CalendarHeart,
                title: "Built around activities",
                body: "Get hangout ideas based on what you both enjoy, from trivia nights to morning runs.",
              },
              {
                icon: ShieldCheck,
                title: "Safe & inclusive",
                body: "Messaging unlocks only on a mutual match. Report and block anytime. Everyone's welcome here.",
              },
              {
                icon: HandHeart,
                title: "Strictly platonic",
                body: "Friendlie is for friendship and activity partners — never dating. Our whole experience is built that way.",
              },
            ].map((v) => (
              <div key={v.title} className="flex gap-4">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <v.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{v.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{v.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container pb-20">
          <Card className="mx-auto max-w-3xl friendlie-gradient border-none">
            <CardContent className="flex flex-col items-center gap-5 p-10 text-center">
              <h2 className="text-balance text-3xl font-bold tracking-tight">
                Your next friend is already nearby
              </h2>
              <p className="max-w-md text-muted-foreground">
                Join Friendlie and start discovering activity partners and
                platonic connections in your area today.
              </p>
              <Button asChild size="lg">
                <Link href="/signup">Get started — it&apos;s free</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <Logo />
          <div className="flex gap-6">
            <Link href="/guidelines" className="hover:text-foreground">
              Community Guidelines
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-foreground">
              Sign up
            </Link>
          </div>
          <p>© {new Date().getFullYear()} Friendlie</p>
        </div>
      </footer>
    </div>
  );
}
