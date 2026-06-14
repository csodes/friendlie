import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export const metadata = { title: "Log in · Friendlie" };

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-secondary/30 px-4 py-10">
      <div className="mb-8">
        <Logo />
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-sm text-muted-foreground">
        New to Friendlie?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
