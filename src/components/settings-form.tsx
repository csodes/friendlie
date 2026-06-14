"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Trash2 } from "lucide-react";

import type { Profile } from "@/lib/types";
import { initials } from "@/lib/utils";
import { updateProfile, deleteAccount } from "@/app/actions/profile";
import { unblockUser } from "@/app/actions/social";
import { signOut } from "@/app/(auth)/actions";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

export function SettingsForm({
  profile,
  blocked,
}: {
  profile: Profile;
  blocked: Profile[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [radius, setRadius] = React.useState(profile.location_radius_km);
  const [showDistance, setShowDistance] = React.useState(profile.show_distance);
  const [discoverable, setDiscoverable] = React.useState(profile.discoverable);
  const [blockedList, setBlockedList] = React.useState(blocked);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  async function savePrivacy() {
    setSaving(true);
    const res = await updateProfile({
      location_radius_km: radius,
      show_distance: showDistance,
      discoverable,
    });
    setSaving(false);
    if (res.ok) {
      toast({ title: "Settings saved", variant: "success" });
      router.refresh();
    } else {
      toast({ title: "Couldn't save", description: res.error, variant: "warning" });
    }
  }

  async function handleUnblock(id: string, name: string) {
    const res = await unblockUser(id);
    if (res.ok) {
      setBlockedList((prev) => prev.filter((p) => p.id !== id));
      toast({ title: `Unblocked ${name}`, variant: "success" });
    }
  }

  return (
    <div className="space-y-6">
      {/* Discovery & privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Discovery & privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
              Only suggest friends within this distance.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="show-distance">Show approximate distance</Label>
              <p className="text-xs text-muted-foreground">
                Others see a distance band (e.g. &ldquo;under 5 km&rdquo;), never
                your exact location.
              </p>
            </div>
            <Switch
              id="show-distance"
              checked={showDistance}
              onCheckedChange={setShowDistance}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="discoverable">Appear in discovery</Label>
              <p className="text-xs text-muted-foreground">
                Turn off to take a break. You&apos;ll still keep your matches.
              </p>
            </div>
            <Switch
              id="discoverable"
              checked={discoverable}
              onCheckedChange={setDiscoverable}
            />
          </div>

          <Button onClick={savePrivacy} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save settings
          </Button>
        </CardContent>
      </Card>

      {/* Blocked users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Blocked members</CardTitle>
        </CardHeader>
        <CardContent>
          {blockedList.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t blocked anyone. You can block a member anytime from
              their card or a chat.
            </p>
          ) : (
            <ul className="divide-y">
              {blockedList.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <Avatar className="h-9 w-9">
                    {b.avatar_url || b.photos[0] ? (
                      <AvatarImage src={b.avatar_url ?? b.photos[0]} alt={b.display_name} />
                    ) : null}
                    <AvatarFallback>{initials(b.display_name)}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm font-medium">
                    {b.display_name}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(b.id, b.display_name)}
                  >
                    Unblock
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form action={signOut}>
            <Button variant="outline" type="submit" className="w-full gap-2 sm:w-auto">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full gap-2 sm:w-auto">
                <Trash2 className="h-4 w-4" />
                Delete account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete your account?</DialogTitle>
                <DialogDescription>
                  This permanently removes your profile, matches, messages, and
                  saved friends. This can&apos;t be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    await deleteAccount();
                  }}
                  className="gap-2"
                >
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Yes, delete everything
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
