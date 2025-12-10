/**
 * RejectReviewModal Component
 * Modal for rejecting a submitted review with required reason
 *
 * Features:
 * - Required reason selection (5 options)
 * - Optional additional notes (required for "Other")
 * - Confirmation with consequences explained
 * - Brand-compliant design
 * - Mobile-optimized with 44px touch targets
 * - Clear warnings about refund and slot reopening
 */

"use client";

import { cn } from "@/lib/utils";
import { useFormState, useToggle } from "@/hooks";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { RejectionReason } from "@/lib/api/review-slots";

export interface RejectReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (data: RejectReviewData) => Promise<void>;
  reviewerName?: string;
  isSubmitting?: boolean;
  isPaidReview?: boolean;
}

export interface RejectReviewData {
  rejection_reason: RejectionReason;
  rejection_notes?: string;
  // Optional reviewer ratings (requester can still rate reviewer when rejecting)
  quality_rating?: number;
  professionalism_rating?: number;
  helpfulness_rating?: number;
  is_anonymous?: boolean;
}

const REJECTION_REASONS = [
  {
    value: "low_quality" as RejectionReason,
    label: "Low quality / Not helpful",
    description: "Review is too short, generic, or doesn't provide useful feedback",
  },
  {
    value: "off_topic" as RejectionReason,
    label: "Off-topic / Didn't address questions",
    description: "Review doesn't address my specific questions or concerns",
  },
  {
    value: "spam" as RejectionReason,
    label: "Spam or automated content",
    description: "Review appears to be copy-pasted, automated, or spam",
  },
  {
    value: "abusive" as RejectionReason,
    label: "Abusive or inappropriate",
    description: "Review contains offensive, abusive, or inappropriate content",
  },
  {
    value: "other" as RejectionReason,
    label: "Other (please explain)",
    description: "Another reason not listed above",
  },
] as const;

interface RejectFormData {
  selectedReason: RejectionReason | null;
  notes: string;
}

const initialRejectForm: RejectFormData = {
  selectedReason: null,
  notes: "",
};

export function RejectReviewModal({
  isOpen,
  onClose,
  onReject,
  reviewerName,
  isSubmitting = false,
  isPaidReview = false,
}: RejectReviewModalProps) {
  const { values: form, setValue, reset } = useFormState<RejectFormData>(initialRejectForm);
  const { value: showConfirmation, setTrue: showConfirm, setFalse: hideConfirm } = useToggle(false);

  const isOtherReason = form.selectedReason === "other";
  const canSubmit =
    form.selectedReason !== null && (!isOtherReason || form.notes.trim().length >= 10);

  const handleReject = async () => {
    if (!form.selectedReason || !canSubmit) return;

    await onReject({
      rejection_reason: form.selectedReason,
      rejection_notes: form.notes.trim() || undefined,
    });
  };

  const handleClose = () => {
    if (!isSubmitting) {
      hideConfirm();
      reset();
      onClose();
    }
  };

  const handleProceedToConfirm = () => {
    if (canSubmit) {
      showConfirm();
    }
  };

  const handleBackToForm = () => {
    hideConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-popover">
        {!showConfirmation ? (
          // Step 1: Select Reason
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                <XCircle className="size-6 text-red-600" />
                Reject Review
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {reviewerName
                  ? `You're rejecting ${reviewerName}'s review. `
                  : "You're rejecting this review. "}
                Please select a reason to help us maintain quality standards.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Warning Box */}
              <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
                  <AlertTriangle className="size-4" />
                  <span>Important: Rejection Consequences</span>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="size-1.5 rounded-full bg-red-600 mt-1.5 flex-shrink-0" />
                    <span>
                      This review slot will be reopened for other reviewers
                    </span>
                  </li>
                  {isPaidReview && (
                    <li className="flex items-start gap-2">
                      <div className="size-1.5 rounded-full bg-red-600 mt-1.5 flex-shrink-0" />
                      <span>Payment will be refunded to you</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <div className="size-1.5 rounded-full bg-red-600 mt-1.5 flex-shrink-0" />
                    <span>
                      The reviewer may dispute this rejection if they disagree
                    </span>
                  </li>
                </ul>
              </div>

              {/* Rejection Reason Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-foreground">
                  Reason for rejection *
                </Label>

                <RadioGroup
                  value={form.selectedReason || ""}
                  onValueChange={(value) =>
                    setValue("selectedReason", value as RejectionReason)
                  }
                >
                  <div className="space-y-3">
                    {REJECTION_REASONS.map((reason) => (
                      <div
                        key={reason.value}
                        className={cn(
                          "flex items-start gap-3 p-4 rounded-lg border-2 transition-all duration-200",
                          "hover:bg-red-500/5 cursor-pointer",
                          form.selectedReason === reason.value
                            ? "border-red-500 bg-red-500/5"
                            : "border-border"
                        )}
                        onClick={() => setValue("selectedReason", reason.value)}
                      >
                        <RadioGroupItem
                          value={reason.value}
                          id={reason.value}
                          className="mt-0.5 min-h-[24px] min-w-[24px]"
                        />
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor={reason.value}
                            className="text-sm font-semibold text-foreground cursor-pointer"
                          >
                            {reason.label}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {reason.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Additional Notes */}
              <div className="space-y-3">
                <Label
                  htmlFor="rejection-notes"
                  className="text-base font-semibold text-foreground"
                >
                  Additional notes
                  {isOtherReason && (
                    <span className="text-red-600"> (required)</span>
                  )}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isOtherReason
                    ? "Please explain your reason for rejecting this review"
                    : "Optionally provide more details about why you're rejecting this review"}
                </p>

                <Textarea
                  id="rejection-notes"
                  value={form.notes}
                  onChange={(e) => setValue("notes", e.target.value)}
                  placeholder={
                    isOtherReason
                      ? "Please explain why you're rejecting this review..."
                      : "Add any additional context..."
                  }
                  className="min-h-[120px] resize-none"
                  maxLength={2000}
                />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {isOtherReason &&
                      form.notes.trim().length < 10 &&
                      "Minimum 10 characters required"}
                  </span>
                  <span>{form.notes.length}/2000</span>
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
                onClick={handleProceedToConfirm}
                disabled={!canSubmit || isSubmitting}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white min-h-[48px] font-semibold"
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Step 2: Confirmation
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
                <AlertCircle className="size-6" />
                Confirm Rejection
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Are you sure you want to reject this review? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Summary */}
              <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-3">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">
                    REJECTION REASON
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {REJECTION_REASONS.find((r) => r.value === form.selectedReason)
                      ?.label}
                  </div>
                </div>

                {form.notes.trim() && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">
                      YOUR NOTES
                    </div>
                    <div className="text-sm text-foreground whitespace-pre-wrap">
                      {form.notes.trim()}
                    </div>
                  </div>
                )}
              </div>

              {/* Final Warning */}
              <div className="rounded-xl bg-red-500/10 border-2 border-red-500/30 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-red-600">
                      Final Confirmation Required
                    </p>
                    <p className="text-muted-foreground">
                      By rejecting this review, you confirm that it does not meet
                      quality standards. The reviewer will be notified and may
                      dispute your decision.
                      {isPaidReview &&
                        " Your payment for this review slot will be refunded."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleBackToForm}
                disabled={isSubmitting}
                className="w-full sm:w-auto min-h-[48px]"
              >
                Go Back
              </Button>
              <Button
                onClick={handleReject}
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white min-h-[48px] font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="size-5" />
                    Confirm Rejection
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
