import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpenCheck } from "lucide-react";

import { getMyProfile, getBlockedProfiles } from "@/lib/data";
import { SettingsForm } from "@/components/settings-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Settings · Friendlie" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [profile, blocked] = await Promise.all([
    getMyProfile(),
    getBlockedProfiles(),
  ]);
  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Control your privacy, safety, and account.
        </p>
      </div>

      <SettingsForm profile={profile} blocked={blocked} />

      <Card className="mt-6">
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <BookOpenCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Community Guidelines</p>
              <p className="text-sm text-muted-foreground">
                How we keep Friendlie kind, safe, and platonic.
              </p>
            </div>
          </div>
          <Link
            href="/guidelines"
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            Read
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
