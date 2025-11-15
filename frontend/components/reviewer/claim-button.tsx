/**
 * Claim Button Component
 *
 * Button for claiming review slots with:
 * - Confirmation modal
 * - Loading states
 * - Success/error feedback
 * - Optimistic UI updates
 * - Brand-compliant design
 *
 * Brand Compliance:
 * - Critvue accent-blue for primary action
 * - Smooth animations
 * - Clear visual feedback
 * - Mobile-friendly (44px minimum touch target)
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { claimReviewSlot, formatPayment } from "@/lib/api/reviewer";

export interface ClaimButtonProps {
  slotId: number;
  reviewRequestId: number;
  paymentAmount: number | null;
  reviewType: string;
  title: string;
  onClaimSuccess?: () => void;
  className?: string;
}

export function ClaimButton({
  slotId,
  reviewRequestId,
  paymentAmount,
  reviewType,
  title,
  onClaimSuccess,
  className,
}: ClaimButtonProps) {
  const router = useRouter();
  const [claiming, setClaiming] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleClaimClick = () => {
    setShowModal(true);
    setError(null);
  };

  const handleConfirmClaim = async () => {
    try {
      setClaiming(true);
      setError(null);

      await claimReviewSlot(slotId);

      // Success! Redirect to review writing page
      setShowModal(false);

      // Call success callback if provided
      if (onClaimSuccess) {
        onClaimSuccess();
      }

      // Small delay for visual feedback, then redirect
      setTimeout(() => {
        router.push(`/reviewer/review/${slotId}`);
      }, 500);
    } catch (err: any) {
      console.error("Claim failed:", err);

      // Extract error message
      let errorMessage = "Failed to claim review. Please try again.";
      if (err?.data?.detail) {
        errorMessage = typeof err.data.detail === "string"
          ? err.data.detail
          : err.data.detail[0]?.msg || errorMessage;
      }

      setError(errorMessage);
      setClaiming(false);
    }
  };

  return (
    <>
      {/* Claim Button */}
      <Button
        onClick={handleClaimClick}
        disabled={claiming}
        className={cn(
          "bg-accent-blue hover:bg-accent-blue/90",
          "min-h-[44px] font-semibold",
          className
        )}
      >
        {claiming ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Claiming...
          </>
        ) : (
          <>
            <CheckCircle2 className="size-4" />
            Claim Review
          </>
        )}
      </Button>

      {/* Confirmation Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !claiming) {
              setShowModal(false);
            }
          }}
        >
          <div
            className={cn(
              "w-full max-w-lg rounded-2xl border border-border bg-card p-6 sm:p-8",
              "shadow-2xl",
              "animate-in fade-in slide-in-from-bottom-4 duration-300"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Claim This Review
              </h2>
              <p className="text-sm text-muted-foreground">
                You're about to claim:
              </p>
            </div>

            {/* Review Details */}
            <div className="space-y-4 mb-6">
              {/* Title */}
              <div className="p-4 rounded-xl bg-accent-blue/5 border border-accent-blue/20">
                <p className="font-semibold text-foreground">{title}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="size-4" />
                    <span className="text-xs font-medium">Deadline</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    72 hours
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="size-4" />
                    <span className="text-xs font-medium">Payment</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatPayment(paymentAmount)}
                  </p>
                </div>
              </div>

              {/* Commitment Notice */}
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200/50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 mb-1">
                      Please Note
                    </p>
                    <ul className="text-xs text-amber-800 space-y-1">
                      <li>• You have 72 hours to submit your review</li>
                      <li>• The slot will be auto-abandoned if you don't submit in time</li>
                      <li>• You can only claim one slot per review request</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="size-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={claiming}
                className="flex-1 min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmClaim}
                disabled={claiming}
                className="flex-1 bg-accent-blue hover:bg-accent-blue/90 min-h-[44px] font-semibold"
              >
                {claiming ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    Claim & Start Review
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
