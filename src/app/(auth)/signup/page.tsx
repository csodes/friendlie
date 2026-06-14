import Link from "next/link";
import { Logo } from "@/components/logo";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Sign up · Friendlie" };

export default function SignupPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-secondary/30 px-4 py-10">
      <div className="mb-8">
        <Logo />
      </div>
      <SignupForm />
      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
