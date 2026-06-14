import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { getMyProfile } from "@/lib/data";

/**
 * Shell for all authenticated pages. Ensures the member is signed in and has
 * finished onboarding before showing the main navigation.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");
  if (!profile.is_onboarded) redirect("/onboarding");

  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <AppNav />
      <main className="container py-6">{children}</main>
    </div>
  );
}
