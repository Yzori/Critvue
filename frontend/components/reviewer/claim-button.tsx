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
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  DollarSign,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { claimReviewByRequestId, formatPayment } from "@/lib/api/reviews/reviewer-dashboard";
import { getNDAStatus } from "@/lib/api/reviews/nda";
import { NDAModal } from "@/components/nda/nda-modal";
import { ApplicationModal } from "@/components/reviewer/application-modal";
import { isApplicationRequiredError } from "@/lib/api/reviews/applications";

export interface ClaimButtonProps {
  reviewRequestId: number;
  paymentAmount: number | null;
  reviewType: string;
  title: string;
  requiresNda?: boolean;
  onClaimSuccess?: () => void;
  className?: string;
}

export function ClaimButton({
  reviewRequestId,
  paymentAmount,
  reviewType,
  title,
  requiresNda = false,
  onClaimSuccess,
  className,
}: ClaimButtonProps) {
  const router = useRouter();
  const [claiming, setClaiming] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [showNDAModal, setShowNDAModal] = React.useState(false);
  const [showApplicationModal, setShowApplicationModal] = React.useState(false);
  const [hasSignedNDA, setHasSignedNDA] = React.useState(false);
  const [checkingNDA, setCheckingNDA] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleClaimClick = async () => {
    setError(null);

    // If NDA required and not yet signed, check status and show NDA modal
    if (requiresNda && !hasSignedNDA) {
      setCheckingNDA(true);
      try {
        const status = await getNDAStatus(reviewRequestId);
        if (status.current_user_signed) {
          // Already signed, proceed to claim modal
          setHasSignedNDA(true);
          setShowModal(true);
        } else {
          // Need to sign NDA first
          setShowNDAModal(true);
        }
      } catch (err) {
        // If we can't check, show NDA modal to be safe
        setShowNDAModal(true);
      } finally {
        setCheckingNDA(false);
      }
      return;
    }

    // No NDA required or already signed, show claim modal
    setShowModal(true);
  };

  const handleNDASigned = () => {
    setHasSignedNDA(true);
    setShowNDAModal(false);
    // After signing NDA, show the claim confirmation modal
    setShowModal(true);
  };

  const handleConfirmClaim = async () => {
    try {
      setClaiming(true);
      setError(null);

      // Call the browse claim API which creates a ReviewSlot and returns slot_id
      const response = await claimReviewByRequestId(reviewRequestId);

      // Success! Redirect to review writing page using the returned slot_id
      setShowModal(false);

      // Call success callback if provided
      if (onClaimSuccess) {
        onClaimSuccess();
      }

      // Small delay for visual feedback, then redirect to the claimed slot
      setTimeout(() => {
        router.push(`/reviewer/review/${response.slot_id}`);
      }, 500);
    } catch (err: unknown) {
      const typedErr = err as { data?: { detail?: string | { msg: string }[] } };
      // Check if this is an APPLICATION_REQUIRED error (paid reviews need application)
      if (isApplicationRequiredError(err)) {
        // Close claim modal and open application modal
        setShowModal(false);
        setClaiming(false);
        setShowApplicationModal(true);
        return;
      }

      // Extract error message
      let errorMessage = "Failed to claim review. Please try again.";
      if (typedErr?.data?.detail) {
        errorMessage = typeof typedErr.data.detail === "string"
          ? typedErr.data.detail
          : typedErr.data.detail[0]?.msg || errorMessage;
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
        disabled={claiming || checkingNDA}
        className={cn(
          requiresNda && !hasSignedNDA
            ? "bg-purple-600 hover:bg-purple-700"
            : "bg-accent-blue hover:bg-accent-blue/90",
          "min-h-[44px] font-semibold",
          className
        )}
      >
        {claiming ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Claiming...
          </>
        ) : checkingNDA ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Checking...
          </>
        ) : requiresNda && !hasSignedNDA ? (
          <>
            <Shield className="size-4" />
            Sign NDA & Claim
          </>
        ) : (
          <>
            <CheckCircle2 className="size-4" />
            Claim Review
          </>
        )}
      </Button>

      {/* NDA Modal */}
      <NDAModal
        reviewId={reviewRequestId}
        isOpen={showNDAModal}
        onClose={() => setShowNDAModal(false)}
        onSigned={handleNDASigned}
      />

      {/* Application Modal (for paid reviews) */}
      <ApplicationModal
        reviewRequestId={reviewRequestId}
        reviewTitle={title}
        paymentAmount={paymentAmount}
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        onSuccess={onClaimSuccess}
      />

      {/* Confirmation Modal */}
      {showModal && mounted && createPortal(
        <div className="fixed inset-0 z-[9999]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !claiming && setShowModal(false)}
          />

          {/* Centering wrapper */}
          <div className="absolute inset-0 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              {/* Modal */}
              <div
                className={cn(
                  "relative z-10 w-full max-w-lg rounded-2xl border border-gray-200 dark:border-border bg-white dark:bg-popover p-6 sm:p-8",
                  "shadow-2xl"
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
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-gray-100 dark:bg-muted border border-gray-200 dark:border-border">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                    <Clock className="size-4" />
                    <span className="text-xs font-medium">Deadline</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    72 hours
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-gray-100 dark:bg-muted border border-gray-200 dark:border-border">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                    <DollarSign className="size-4" />
                    <span className="text-xs font-medium">Payment</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatPayment(paymentAmount)}
                  </p>
                </div>
              </div>

              {/* Commitment Notice */}
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30">
                <div className="flex items-start gap-3">
                  <AlertCircle className="size-5 text-amber-700 dark:text-amber-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">
                      Please Note
                    </p>
                    <ul className="text-xs text-amber-900 dark:text-amber-300 space-y-1">
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
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30">
                <div className="flex items-start gap-2">
                  <AlertCircle className="size-4 text-red-700 dark:text-red-300 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
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
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
