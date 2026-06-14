"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, MapPin, Loader2, Check } from "lucide-react";

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
import { completeOnboarding } from "@/app/actions/profile";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { ChipMultiSelect, TaxonomySelector } from "@/components/selectors";
import { PhotoUploader } from "@/components/photo-uploader";
import { cn } from "@/lib/utils";

const STEPS = [
  "About you",
  "Interests",
  "Activities",
  "Availability",
  "Preferences",
  "Photos",
] as const;

export function OnboardingWizard({
  userId,
  profile,
  interests,
  activities,
}: {
  userId: string;
  profile: Profile;
  interests: Interest[];
  activities: Activity[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [locating, setLocating] = React.useState(false);

  // Form state seeded from the (mostly empty) profile row.
  const [displayName, setDisplayName] = React.useState(
    profile.display_name === "New friend" ? "" : profile.display_name,
  );
  const [ageRange, setAgeRange] = React.useState<AgeRange | null>(
    profile.age_range as AgeRange | null,
  );
  const [city, setCity] = React.useState(profile.city ?? "");
  const [bio, setBio] = React.useState(profile.bio ?? "");
  const [coords, setCoords] = React.useState<{
    lat: number | null;
    lng: number | null;
  }>({ lat: profile.latitude, lng: profile.longitude });
  const [interestIds, setInterestIds] = React.useState<string[]>([]);
  const [activityIds, setActivityIds] = React.useState<string[]>([]);
  const [availability, setAvailability] = React.useState<AvailabilitySlot[]>([]);
  const [preferences, setPreferences] = React.useState<FriendshipPreference[]>(
    [],
  );
  const [radius, setRadius] = React.useState<number>(
    profile.location_radius_km ?? 25,
  );
  const [photos, setPhotos] = React.useState<string[]>(profile.photos ?? []);

  function detectLocation() {
    if (!navigator.geolocation) {
      toast({ title: "Location not supported on this device", variant: "warning" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast({
          title: "Location set",
          description: "We only use this to show approximate distance.",
          variant: "success",
        });
      },
      () => {
        setLocating(false);
        toast({
          title: "Couldn't get location",
          description: "You can still set your city manually.",
          variant: "warning",
        });
      },
    );
  }

  function canAdvance(): boolean {
    if (step === 0) return displayName.trim().length > 0;
    if (step === 1) return interestIds.length >= 1;
    return true;
  }

  async function finish() {
    setSubmitting(true);
    const res = await completeOnboarding({
      profile: {
        display_name: displayName.trim(),
        age_range: ageRange,
        city: city.trim() || null,
        bio: bio.trim() || null,
        latitude: coords.lat,
        longitude: coords.lng,
        availability,
        friendship_preferences: preferences,
        location_radius_km: radius,
        photos,
        show_distance: true,
        discoverable: true,
      },
      interestIds,
      activityIds,
    });
    setSubmitting(false);
    if (res.ok) {
      toast({
        title: "You're all set!",
        description: "Let's find you some nearby friends.",
        variant: "success",
      });
      router.push("/discover");
      router.refresh();
    } else {
      toast({ title: "Couldn't save", description: res.error, variant: "warning" });
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Logo />
        <span className="text-sm text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-6 flex gap-1.5">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= step ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>

      <Card className="flex-1">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold">{STEPS[step]}</h1>

          {/* Step 0 — basics */}
          {step === 0 && (
            <div className="mt-5 space-y-5">
              <p className="text-sm text-muted-foreground">
                This is what nearby friends will see. Keep it friendly!
              </p>
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Sam"
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
                <div className="flex gap-2">
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Austin"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={detectLocation}
                    disabled={locating}
                    className="shrink-0 gap-1.5"
                  >
                    {locating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                    Use my location
                  </Button>
                </div>
                {coords.lat != null && (
                  <p className="flex items-center gap-1 text-xs text-primary">
                    <Check className="h-3.5 w-3.5" />
                    Approximate location saved (exact spot never shared)
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Short bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="What are you hoping to do with new friends?"
                  maxLength={300}
                />
              </div>
            </div>
          )}

          {/* Step 1 — interests */}
          {step === 1 && (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                Pick the things you love. We&apos;ll match you with people who
                share them. ({interestIds.length} selected)
              </p>
              <TaxonomySelector
                items={interests}
                selectedIds={interestIds}
                onChange={setInterestIds}
              />
            </div>
          )}

          {/* Step 2 — activities */}
          {step === 2 && (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                Which activities would you like to do with a friend?
                ({activityIds.length} selected)
              </p>
              <TaxonomySelector
                items={activities}
                selectedIds={activityIds}
                onChange={setActivityIds}
              />
            </div>
          )}

          {/* Step 3 — availability */}
          {step === 3 && (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                When are you usually free to meet up?
              </p>
              <ChipMultiSelect
                options={AVAILABILITY_OPTIONS}
                selected={availability}
                onChange={setAvailability}
              />
            </div>
          )}

          {/* Step 4 — preferences + radius */}
          {step === 4 && (
            <div className="mt-5 space-y-6">
              <div className="space-y-3">
                <Label>What kind of connections are you looking for?</Label>
                <ChipMultiSelect
                  options={FRIENDSHIP_PREFERENCES}
                  selected={preferences}
                  onChange={setPreferences}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Distance radius</Label>
                  <span className="text-sm font-medium">{radius} km</span>
                </div>
                <Slider
                  value={[radius]}
                  min={1}
                  max={100}
                  step={1}
                  onValueChange={(v) => setRadius(v[0])}
                />
                <p className="text-xs text-muted-foreground">
                  We&apos;ll only suggest friends within this distance.
                </p>
              </div>
            </div>
          )}

          {/* Step 5 — photos */}
          {step === 5 && (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                Add a few photos so friends can recognise you (optional).
              </p>
              <PhotoUploader
                userId={userId}
                photos={photos}
                onChange={setPhotos}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nav buttons */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance()}
            className="gap-1.5"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={finish} disabled={submitting} className="gap-1.5">
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Finish & start
          </Button>
        )}
      </div>
    </div>
  );
}
