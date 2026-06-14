"use client";

import { useFormState, useFormStatus } from "react-dom";

import { signUp } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating account…" : "Create account"}
    </Button>
  );
}

export function SignupForm() {
  const [state, formAction] = useFormState(signUp, {});

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Join Friendlie</CardTitle>
        <CardDescription>
          Make platonic friendships and find activity partners nearby.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state?.message ? (
          <p className="rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">
            {state.message}
          </p>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                placeholder="At least 8 characters"
                required
              />
            </div>
            {state?.error && (
              <p className="text-sm text-destructive" role="alert">
                {state.error}
              </p>
            )}
            <SubmitButton />
            <p className="text-center text-xs text-muted-foreground">
              By joining you agree to keep Friendlie kind, safe, and platonic.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
