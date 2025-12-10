/**
 * Application Modal Component
 *
 * Modal for submitting an application to review a paid/expert review request.
 * Experts must pitch themselves before the creator can accept them.
 *
 * Features:
 * - Pitch message textarea
 * - Character count
 * - Loading states
 * - Success/error feedback
 * - Auto-link to applicant's profile
 */

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { applyForSlot, canApplyToRequest, CanApplyResponse } from "@/lib/api/slot-applications";
import { useAuth } from "@/contexts/AuthContext";

export interface ApplicationModalProps {
  reviewRequestId: number;
  reviewTitle: string;
  paymentAmount: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const MIN_PITCH_LENGTH = 50;
const MAX_PITCH_LENGTH = 1000;

export function ApplicationModal({
  reviewRequestId,
  reviewTitle,
  paymentAmount,
  isOpen,
  onClose,
  onSuccess,
}: ApplicationModalProps) {
  const { user } = useAuth();
  const [pitch, setPitch] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [canApplyData, setCanApplyData] = React.useState<CanApplyResponse | null>(null);
  const [checkingStatus, setCheckingStatus] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user can apply when modal opens
  React.useEffect(() => {
    if (isOpen && reviewRequestId) {
      setCheckingStatus(true);
      setError(null);
      canApplyToRequest(reviewRequestId)
        .then((data) => {
          setCanApplyData(data);
          if (!data.can_apply && data.reason) {
            setError(data.reason);
          }
        })
        .catch(() => {
          setError("Failed to check application status");
        })
        .finally(() => {
          setCheckingStatus(false);
        });
    }
  }, [isOpen, reviewRequestId]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setPitch("");
      setError(null);
      setSuccess(false);
      setCanApplyData(null);
    }
  }, [isOpen]);

  const pitchLength = pitch.trim().length;
  const isValidLength = pitchLength >= MIN_PITCH_LENGTH && pitchLength <= MAX_PITCH_LENGTH;
  const canSubmit = isValidLength && canApplyData?.can_apply && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      setError(null);

      await applyForSlot(reviewRequestId, pitch.trim());

      setSuccess(true);

      // After brief delay, close modal
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: unknown) {
      let errorMessage = "Failed to submit application. Please try again.";
      const typedErr = err as { data?: { detail?: string | { msg: string }[] } };
      if (typedErr?.data?.detail) {
        errorMessage =
          typeof typedErr.data.detail === "string"
            ? typedErr.data.detail
            : typedErr.data.detail[0]?.msg || errorMessage;
      }

      setError(errorMessage);
      setSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !submitting && !success && onClose()}
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
            {/* Close Button */}
            {!submitting && !success && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            )}

            {/* Success State */}
            {success ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 mb-4">
                  <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Application Submitted!
                </h2>
                <p className="text-muted-foreground">
                  The creator will review your application and get back to you.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Apply to Review
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Tell the creator why you're the right expert for this review.
                  </p>
                </div>

                {/* Review Info */}
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 mb-6">
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">
                    {reviewTitle}
                  </p>
                  {paymentAmount && paymentAmount > 0 && (
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Payment: ${paymentAmount}
                    </p>
                  )}
                </div>

                {checkingStatus ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : canApplyData?.existing_application ? (
                  /* Already Applied */
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="size-5 text-amber-700 dark:text-amber-300 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">
                          You've Already Applied
                        </p>
                        <p className="text-xs text-amber-800 dark:text-amber-300">
                          Status: <span className="capitalize">{canApplyData.existing_application.status}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : !canApplyData?.can_apply ? (
                  /* Cannot Apply */
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="size-5 text-red-700 dark:text-red-300 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {error || "You cannot apply to this review."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Your Profile Preview */}
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Your profile will be shared with the creator:
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent-blue/10 flex items-center justify-center">
                          {user?.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.full_name || user.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="size-5 text-accent-blue" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">
                            {user?.full_name || user?.username || "Anonymous"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{user?.total_reviews_given || 0} reviews</span>
                            {user?.avg_rating && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-0.5">
                                  <Star className="size-3 text-yellow-500" />
                                  {user.avg_rating.toFixed(1)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pitch Textarea */}
                    <div className="mb-4">
                      <label
                        htmlFor="pitch"
                        className="block text-sm font-medium text-foreground mb-2"
                      >
                        Your Pitch
                      </label>
                      <Textarea
                        id="pitch"
                        value={pitch}
                        onChange={(e) => setPitch(e.target.value)}
                        placeholder="Describe your relevant experience and why you'd be a great fit for this review. What unique perspective can you bring?"
                        className="min-h-[120px] resize-none"
                        maxLength={MAX_PITCH_LENGTH}
                        disabled={submitting}
                      />
                      <div className="flex justify-between mt-2">
                        <p
                          className={cn(
                            "text-xs",
                            pitchLength < MIN_PITCH_LENGTH
                              ? "text-amber-600"
                              : "text-muted-foreground"
                          )}
                        >
                          {pitchLength < MIN_PITCH_LENGTH
                            ? `${MIN_PITCH_LENGTH - pitchLength} more characters required`
                            : "Pitch looks good!"}
                        </p>
                        <p
                          className={cn(
                            "text-xs",
                            pitchLength > MAX_PITCH_LENGTH
                              ? "text-red-600"
                              : "text-muted-foreground"
                          )}
                        >
                          {pitchLength}/{MAX_PITCH_LENGTH}
                        </p>
                      </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="size-4 text-red-700 dark:text-red-300 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-700 dark:text-red-300">
                            {error}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={submitting}
                        className="flex-1 min-h-[44px]"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="flex-1 bg-accent-blue hover:bg-accent-blue/90 min-h-[44px] font-semibold"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="size-4" />
                            Submit Application
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
