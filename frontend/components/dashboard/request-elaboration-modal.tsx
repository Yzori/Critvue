/**
 * RequestElaborationModal Component
 * Modal for requesting additional detail/elaboration on a submitted review
 *
 * Features:
 * - Text area for describing what needs elaboration
 * - Shows elaboration count (max 2)
 * - Brand-compliant design
 * - Mobile-optimized with 44px touch targets
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquarePlus, Loader2, Info, HelpCircle } from "lucide-react";

export interface RequestElaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestElaboration: (elaborationRequest: string) => Promise<void>;
  reviewerName?: string;
  isSubmitting?: boolean;
  elaborationCount?: number;
  maxElaborations?: number;
}

export function RequestElaborationModal({
  isOpen,
  onClose,
  onRequestElaboration,
  reviewerName,
  isSubmitting = false,
  elaborationCount = 0,
  maxElaborations = 2,
}: RequestElaborationModalProps) {
  const [request, setRequest] = useState("");

  const remainingRequests = maxElaborations - elaborationCount;
  const canSubmit = request.trim().length >= 20;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onRequestElaboration(request.trim());
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRequest("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquarePlus className="size-6 text-blue-600" />
            Request Elaboration
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {reviewerName
              ? `Ask ${reviewerName} to provide more detail on specific areas of their review.`
              : "Ask the reviewer to provide more detail on specific areas."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info Box */}
          <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
              <Info className="size-4" />
              <span>How Elaboration Requests Work</span>
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="size-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                <span>
                  The reviewer will be notified and have 48 hours to respond
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="size-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                <span>
                  They can update their review with additional detail
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="size-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                <span>
                  You can request elaboration up to {maxElaborations} times per review
                </span>
              </li>
            </ul>
          </div>

          {/* Remaining Requests Badge */}
          {elaborationCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <HelpCircle className="size-4 text-amber-500" />
              <span className="text-muted-foreground">
                {remainingRequests === 1
                  ? "You have 1 elaboration request remaining for this review"
                  : `You have ${remainingRequests} elaboration requests remaining`}
              </span>
            </div>
          )}

          {/* Elaboration Request Text */}
          <div className="space-y-3">
            <Label
              htmlFor="elaboration-request"
              className="text-base font-semibold text-foreground"
            >
              What would you like more detail on? *
            </Label>
            <p className="text-sm text-muted-foreground">
              Be specific about which areas of the review you'd like expanded.
              The more specific you are, the better the response will be.
            </p>

            <Textarea
              id="elaboration-request"
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="Example: I'd like more detail on the color palette suggestions. What specific colors would work better for the hero section? Also, could you expand on why the current typography choice affects readability?"
              className="min-h-[150px] resize-none"
              maxLength={2000}
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {request.trim().length < 20 &&
                  `${20 - request.trim().length} more characters required`}
              </span>
              <span>{request.length}/2000</span>
            </div>
          </div>

          {/* Example Prompts */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Example prompts
            </Label>
            <div className="grid gap-2">
              {[
                "Can you explain the reasoning behind your first suggestion in more detail?",
                "I'd like more specific examples of how to implement your feedback.",
                "Could you elaborate on the accessibility issues you mentioned?",
              ].map((example, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRequest(example)}
                  className="text-left text-sm text-muted-foreground hover:text-foreground p-3 rounded-lg border border-border hover:border-blue-500/50 hover:bg-muted transition-all"
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto min-h-[48px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white min-h-[48px] font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Sending Request...
              </>
            ) : (
              <>
                <MessageSquarePlus className="size-5" />
                Request Elaboration
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
