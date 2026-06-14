import { redirect } from "next/navigation";

import {
  getCurrentUser,
  getMyProfile,
  getAllInterests,
  getAllActivities,
} from "@/lib/data";
import { OnboardingWizard } from "@/components/onboarding-wizard";

export const metadata = { title: "Set up your profile · Friendlie" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, interests, activities] = await Promise.all([
    getMyProfile(),
    getAllInterests(),
    getAllActivities(),
  ]);

  if (!profile) redirect("/login");
  // Already onboarded? Skip straight to the app.
  if (profile.is_onboarded) redirect("/discover");

  return (
    <OnboardingWizard
      userId={user.id}
      profile={profile}
      interests={interests}
      activities={activities}
    />
  );
}
