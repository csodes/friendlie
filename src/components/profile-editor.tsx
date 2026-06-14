"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

import type {
  Activity,
  AgeRange,
  AvailabilitySlot,
  FriendshipPreference,
  Interest,
  Profile,
} from "@/lib/types";
import {
  AGE_RANGES,
  AVAILABILITY_OPTIONS,
  FRIENDSHIP_PREFERENCES,
} from "@/lib/constants";
import {
  setActivities,
  setInterests,
  updateProfile,
} from "@/app/actions/profile";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChipMultiSelect, TaxonomySelector } from "@/components/selectors";
import { PhotoUploader } from "@/components/photo-uploader";

export function ProfileEditor({
  profile,
  interests,
  activities,
  selectedInterestIds,
  selectedActivityIds,
}: {
  profile: Profile;
  interests: Interest[];
  activities: Activity[];
  selectedInterestIds: string[];
  selectedActivityIds: string[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);

  const [displayName, setDisplayName] = React.useState(profile.display_name);
  const [ageRange, setAgeRange] = React.useState<AgeRange | null>(
    profile.age_range as AgeRange | null,
  );
  const [city, setCity] = React.useState(profile.city ?? "");
  const [bio, setBio] = React.useState(profile.bio ?? "");
  const [availability, setAvailability] = React.useState<AvailabilitySlot[]>(
    profile.availability,
  );
  const [preferences, setPreferences] = React.useState<FriendshipPreference[]>(
    profile.friendship_preferences,
  );
  const [photos, setPhotos] = React.useState<string[]>(profile.photos);
  const [interestIds, setInterestIds] = React.useState(selectedInterestIds);
  const [activityIds, setActivityIds] = React.useState(selectedActivityIds);

  async function save() {
    setSaving(true);
    const results = await Promise.all([
      updateProfile({
        display_name: displayName.trim() || "Friend",
        age_range: ageRange,
        city: city.trim() || null,
        bio: bio.trim() || null,
        availability,
        friendship_preferences: preferences,
        photos,
      }),
      setInterests(interestIds),
      setActivities(activityIds),
    ]);
    setSaving(false);
    const failed = results.find((r) => !r.ok);
    if (failed) {
      toast({ title: "Couldn't save", description: failed.error, variant: "warning" });
    } else {
      toast({ title: "Profile updated", variant: "success" });
      router.refresh();
    }
  }

  return (
    <div className="space-y-5">
      <Tabs defaultValue="basics">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="interests">Interests</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
        </TabsList>

        <TabsContent value="basics">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={40}
                />
              </div>
              <div className="space-y-2">
                <Label>Age range</Label>
                <ChipMultiSelect
                  options={AGE_RANGES.map((a) => ({ value: a, label: a }))}
                  selected={ageRange ? [ageRange] : []}
                  onChange={(next) =>
                    setAgeRange((next[next.length - 1] as AgeRange) ?? null)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={300}
                />
              </div>
              <div className="space-y-2">
                <Label>Friendship preferences</Label>
                <ChipMultiSelect
                  options={FRIENDSHIP_PREFERENCES}
                  selected={preferences}
                  onChange={setPreferences}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interests">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your interests</CardTitle>
            </CardHeader>
            <CardContent>
              <TaxonomySelector
                items={interests}
                selectedIds={interestIds}
                onChange={setInterestIds}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preferred activities</CardTitle>
            </CardHeader>
            <CardContent>
              <TaxonomySelector
                items={activities}
                selectedIds={activityIds}
                onChange={setActivityIds}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">When you&apos;re free</CardTitle>
            </CardHeader>
            <CardContent>
              <ChipMultiSelect
                options={AVAILABILITY_OPTIONS}
                selected={availability}
                onChange={setAvailability}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your photos</CardTitle>
            </CardHeader>
            <CardContent>
              <PhotoUploader
                userId={profile.id}
                photos={photos}
                onChange={setPhotos}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-20 flex justify-end md:bottom-4">
        <Button onClick={save} disabled={saving} className="gap-2 shadow-lg">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save changes
        </Button>
      </div>
    </div>
  );
}
