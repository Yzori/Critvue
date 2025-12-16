/**
 * Review Acceptance Page
 * Page where requesters can view, accept, or reject submitted reviews
 *
 * Features:
 * - Full Review Studio view in creator mode (read-only)
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
import { Button } from "@/components/ui/button";
import { AutoAcceptTimer } from "@/components/dashboard";
import { AcceptReviewModal, AcceptReviewData } from "@/components/dashboard/accept-review-modal";
import { RejectReviewModal, RejectReviewData } from "@/components/dashboard/reject-review-modal";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  getReviewSlot,
  acceptReview,
  rejectReview,
  ReviewSlotResponse,
} from "@/lib/api/reviews/slots";
import { getReviewDetail, ReviewRequestDetail } from "@/lib/api/reviews/requests";
import { submitReviewerRating } from "@/lib/api/gamification/sparks";
import { getErrorMessage } from "@/lib/api/client";
import { ReviewStudio } from "@/components/reviewer/review-studio/ReviewStudio";

export default function ReviewAcceptancePage() {
  const params = useParams();
  const router = useRouter();
  const slotId = parseInt(params.slotId as string);

  const [slot, setSlot] = useState<ReviewSlotResponse | null>(null);
  const [reviewRequest, setReviewRequest] = useState<ReviewRequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch review slot data and review request data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const slotData = await getReviewSlot(slotId);

        // Verify slot is in submitted state
        if (slotData.status !== "submitted") {
          setError("This review is not available for acceptance");
          return;
        }

        setSlot(slotData);

        // Also fetch the review request to get content type, image URL, etc.
        if (slotData.review_request_id) {
          try {
            const requestData = await getReviewDetail(slotData.review_request_id);
            setReviewRequest(requestData);
          } catch {
            // Don't fail the whole page if we can't get request details
          }
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    if (slotId) {
      fetchData();
    }
  }, [slotId]);

  // Handle accept review
  const handleAccept = async (data: AcceptReviewData) => {
    try {
      setIsSubmitting(true);

      // First, accept the review with the helpful rating
      await acceptReview(slotId, {
        helpful_rating: data.rating,
      });

      // Then submit the detailed reviewer rating
      try {
        await submitReviewerRating(slotId, {
          quality_rating: data.quality_rating,
          professionalism_rating: data.professionalism_rating,
          helpfulness_rating: data.helpfulness_rating,
          feedback_text: data.feedback_text,
          is_anonymous: data.is_anonymous,
        });
      } catch {
        // Don't fail the accept if rating submission fails
      }

      // Success - redirect to dashboard
      router.push("/dashboard?success=review-accepted");
    } catch (err) {
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

      // First, reject the review
      await rejectReview(slotId, {
        rejection_reason: data.rejection_reason,
        rejection_notes: data.rejection_notes,
      });

      // Then submit reviewer rating if provided
      if (data.quality_rating && data.professionalism_rating && data.helpfulness_rating) {
        try {
          await submitReviewerRating(slotId, {
            quality_rating: data.quality_rating,
            professionalism_rating: data.professionalism_rating,
            helpfulness_rating: data.helpfulness_rating,
            is_anonymous: data.is_anonymous,
          });
        } catch {
          // Don't fail the reject if rating submission fails
        }
      }

      // Success - redirect to dashboard
      router.push("/dashboard?success=review-rejected");
    } catch (err) {
      alert(`Failed to reject review: ${getErrorMessage(err)}`);
    } finally {
      setIsSubmitting(false);
      setShowRejectModal(false);
    }
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
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar with Back Button and Timer */}
      <div className="flex-shrink-0 border-b bg-background px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Button>

          {/* Auto-Accept Timer */}
          {slot.auto_accept_at && (
            <div className="flex-1 max-w-md">
              <AutoAcceptTimer autoAcceptAt={slot.auto_accept_at} compact />
            </div>
          )}

          <div className="w-[100px] sm:w-auto" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Review Studio in Creator Mode - Full Screen */}
      <div className="flex-1 overflow-hidden">
        <ReviewStudio
          slotId={slotId}
          contentType={reviewRequest?.content_type || "design"}
          contentSubcategory={reviewRequest?.content_subcategory}
          imageUrl={reviewRequest?.files?.[0]?.file_url || undefined}
          externalUrl={reviewRequest?.external_links?.[0] || null}
          mode="creator"
          reviewerName={slot.reviewer?.full_name}
          onAccept={() => setShowAcceptModal(true)}
          onReject={() => setShowRejectModal(true)}
          onRequestRevision={() => {
            // For now, just open reject modal - can add revision-specific modal later
            setShowRejectModal(true);
          }}
          className="h-full"
        />
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
