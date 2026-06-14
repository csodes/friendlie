"use client";

import * as React from "react";
import { Flag, ShieldX } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { REPORT_REASONS } from "@/lib/constants";
import { blockUser, reportUser } from "@/app/actions/social";

interface SafetyDialogProps {
  targetId: string;
  targetName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful block so the parent can navigate away. */
  onBlocked?: () => void;
}

/**
 * Combined report + block dialog. Reinforces that Friendlie is platonic and
 * gives members a clear, low-friction path to keep themselves safe.
 */
export function SafetyDialog({
  targetId,
  targetName,
  open,
  onOpenChange,
  onBlocked,
}: SafetyDialogProps) {
  const { toast } = useToast();
  const [reason, setReason] = React.useState<string>("");
  const [details, setDetails] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function handleReport() {
    if (!reason) {
      toast({ title: "Pick a reason", variant: "warning" });
      return;
    }
    setPending(true);
    const res = await reportUser(targetId, reason, details);
    setPending(false);
    if (res.ok) {
      toast({
        title: "Report submitted",
        description: "Thanks for helping keep Friendlie safe. Our team will review it.",
        variant: "success",
      });
      onOpenChange(false);
      setReason("");
      setDetails("");
    } else {
      toast({ title: "Couldn't submit report", description: res.error, variant: "warning" });
    }
  }

  async function handleBlock() {
    setPending(true);
    const res = await blockUser(targetId);
    setPending(false);
    if (res.ok) {
      toast({
        title: `${targetName} blocked`,
        description: "They can no longer see your profile or message you.",
        variant: "success",
      });
      onOpenChange(false);
      onBlocked?.();
    } else {
      toast({ title: "Couldn't block", description: res.error, variant: "warning" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stay safe with {targetName}</DialogTitle>
          <DialogDescription>
            Friendlie is strictly platonic. If something feels off — unwanted
            romantic advances, harassment, or anything unsafe — let us know or
            block them. You&apos;re always in control.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Label>Report a reason</Label>
          <div className="flex flex-wrap gap-2">
            {REPORT_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  reason === r
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input hover:bg-muted"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Add any details (optional)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleReport}
            disabled={pending}
            className="gap-2"
          >
            <Flag className="h-4 w-4" />
            Submit report
          </Button>
          <Button
            variant="destructive"
            onClick={handleBlock}
            disabled={pending}
            className="gap-2"
          >
            <ShieldX className="h-4 w-4" />
            Block {targetName}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
