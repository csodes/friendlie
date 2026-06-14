import { redirect } from "next/navigation";

import {
  getCurrentUser,
  getMyProfile,
  getAllInterests,
  getAllActivities,
  getMyInterestIds,
  getMyActivityIds,
} from "@/lib/data";
import { ProfileEditor } from "@/components/profile-editor";

export const metadata = { title: "Profile · Friendlie" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, interests, activities, interestIds, activityIds] =
    await Promise.all([
      getMyProfile(),
      getAllInterests(),
      getAllActivities(),
      getMyInterestIds(user.id),
      getMyActivityIds(user.id),
    ]);

  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Your profile</h1>
        <p className="text-sm text-muted-foreground">
          Keep it warm and friendly — this is how nearby friends get to know you.
        </p>
      </div>
      <ProfileEditor
        profile={profile}
        interests={interests}
        activities={activities}
        selectedInterestIds={interestIds}
        selectedActivityIds={activityIds}
      />
    </div>
  );
}
