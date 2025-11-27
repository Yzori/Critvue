/**
 * Review Acceptance Page
 * Page where requesters can view, accept, or reject submitted reviews
 *
 * Features:
 * - Full review content display
 * - Reviewer information
 * - Auto-accept countdown timer at top
 * - Accept button (green, prominent)
 * - Reject button (outline, secondary)
 * - Mobile responsive layout
 * - Brand-compliant design
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AutoAcceptTimer } from "@/components/dashboard";
import { AcceptReviewModal, AcceptReviewData } from "@/components/dashboard/accept-review-modal";
import { RejectReviewModal, RejectReviewData } from "@/components/dashboard/reject-review-modal";
import {
  ArrowLeft,
  User,
  Calendar,
  Star,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  getReviewSlot,
  acceptReview,
  rejectReview,
  ReviewSlotResponse,
} from "@/lib/api/review-slots";
import { getErrorMessage } from "@/lib/api/client";

export default function ReviewAcceptancePage() {
  const params = useParams();
  const router = useRouter();
  const slotId = parseInt(params.slotId as string);

  const [slot, setSlot] = useState<ReviewSlotResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch review slot data
  useEffect(() => {
    const fetchSlot = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getReviewSlot(slotId);

        // Verify slot is in submitted state
        if (data.status !== "submitted") {
          setError("This review is not available for acceptance");
          return;
        }

        setSlot(data);
      } catch (err) {
        console.error("Failed to fetch review slot:", err);
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    if (slotId) {
      fetchSlot();
    }
  }, [slotId]);

  // Handle accept review
  const handleAccept = async (data: AcceptReviewData) => {
    try {
      setIsSubmitting(true);
      await acceptReview(slotId, {
        helpful_rating: data.rating,
      });

      // Success - redirect to dashboard
      router.push("/dashboard?success=review-accepted");
    } catch (err) {
      console.error("Failed to accept review:", err);
      alert(`Failed to accept review: ${getErrorMessage(err)}`);
    } finally {
      setIsSubmitting(false);
      setShowAcceptModal(false);
    }
  };

  // Handle reject review
  const handleReject = async (data: RejectReviewData) => {
    try {
      setIsSubmitting(true);
      await rejectReview(slotId, data);

      // Success - redirect to dashboard
      router.push("/dashboard?success=review-rejected");
    } catch (err) {
      console.error("Failed to reject review:", err);
      alert(`Failed to reject review: ${getErrorMessage(err)}`);
    } finally {
      setIsSubmitting(false);
      setShowRejectModal(false);
    }
  };

  // Format date
  const formatDate = (isoDate?: string) => {
    if (!isoDate) return "Unknown";
    return new Date(isoDate).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="size-12 animate-spin text-accent-blue mx-auto" />
          <p className="text-muted-foreground">Loading review...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !slot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <AlertCircle className="size-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Review Not Found
          </h1>
          <p className="text-muted-foreground">
            {error || "This review could not be loaded"}
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-accent-blue hover:bg-accent-blue/90 text-white"
          >
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isPaidReview = slot.payment_amount !== undefined && slot.payment_amount > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Button>

        {/* Auto-Accept Timer (Top Priority) */}
        {slot.auto_accept_at && (
          <AutoAcceptTimer autoAcceptAt={slot.auto_accept_at} />
        )}

        {/* Main Content Card */}
        <div className="rounded-2xl border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-accent-blue/5 to-accent-peach/5 border-b border-border p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  Review Submitted
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Please review this submission and decide whether to accept or reject it
                </p>
              </div>

              {/* Rating Display */}
              {slot.rating && (
                <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Star className="size-5 fill-amber-500 text-amber-500" />
                  <span className="text-xl font-bold text-amber-600">
                    {slot.rating}
                  </span>
                </div>
              )}
            </div>

            {/* Reviewer Info */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border">
                <User className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {slot.reviewer?.full_name || "Anonymous Reviewer"}
                </span>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border">
                <Calendar className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Submitted {formatDate(slot.submitted_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Review Content */}
          <div className="p-6 space-y-6">
            {/* Review Text */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileText className="size-4 text-accent-blue" />
                <span>Review Content</span>
              </div>

              <div className="rounded-xl bg-muted/50 border border-border p-6">
                <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                  {slot.review_text}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                {slot.review_text?.length || 0} characters
              </div>
            </div>

            {/* Attachments (if any) */}
            {slot.review_attachments && slot.review_attachments.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <FileText className="size-4 text-accent-blue" />
                  <span>Attachments ({slot.review_attachments.length})</span>
                </div>

                <div className="grid gap-2">
                  {slot.review_attachments.map((attachment: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                    >
                      <FileText className="size-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        {attachment.filename || `Attachment ${index + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons (Sticky on Mobile) */}
        <div className="fixed bottom-0 left-0 right-0 lg:relative bg-background border-t border-border lg:border-0 p-4 lg:p-0 shadow-[0_-4px_8px_rgba(0,0,0,0.04)] lg:shadow-none z-50">
          <div className="max-w-4xl mx-auto grid gap-3 sm:grid-cols-2">
            {/* Reject Button */}
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowRejectModal(true)}
              className={cn(
                "w-full min-h-[56px] font-semibold touch-manipulation active:scale-[0.98]",
                "border-2 border-red-500/30 text-red-600 hover:bg-red-500/5 hover:border-red-500"
              )}
            >
              <XCircle className="size-5" />
              Reject Review
            </Button>

            {/* Accept Button */}
            <Button
              size="lg"
              onClick={() => setShowAcceptModal(true)}
              className={cn(
                "w-full min-h-[56px] font-semibold touch-manipulation active:scale-[0.98]",
                "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
              )}
            >
              <CheckCircle2 className="size-5" />
              Accept Review
            </Button>
          </div>
        </div>

        {/* Spacer for fixed buttons on mobile */}
        <div className="h-20 lg:h-0" />
      </div>

      {/* Accept Modal */}
      <AcceptReviewModal
        isOpen={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        onAccept={handleAccept}
        reviewerName={slot.reviewer?.full_name}
        isSubmitting={isSubmitting}
      />

      {/* Reject Modal */}
      <RejectReviewModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onReject={handleReject}
        reviewerName={slot.reviewer?.full_name}
        isSubmitting={isSubmitting}
        isPaidReview={isPaidReview}
      />
    </div>
  );
}
