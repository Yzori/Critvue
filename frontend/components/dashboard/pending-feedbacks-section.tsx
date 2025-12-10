/**
 * Pending Feedbacks Section Component
 *
 * Dedicated section showing all submitted reviews awaiting creator's acceptance/rejection
 *
 * Features:
 * - Shows all submitted reviews across all review requests
 * - Preview of review content with rating
 * - Reviewer information
 * - Auto-accept countdown timer
 * - Quick accept/reject actions
 * - Urgent indicator (< 24h to auto-accept)
 * - Mobile-responsive cards
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Star,
  Clock,
  User,
  FileText,
  ArrowRight,
  Inbox,
  Zap,
} from "lucide-react";
import {
  ReviewSlotWithRequest,
  getPendingReviewsForRequester,
  acceptReviewSlot,
  rejectReviewSlot,
} from "@/lib/api/review-slots";
import { getErrorMessage } from "@/lib/api/client";
import { AcceptReviewModal, type AcceptReviewData } from "./accept-review-modal";
import { RejectReviewModal, type RejectReviewData } from "./reject-review-modal";
import { toast } from "sonner";

interface PendingFeedbacksSectionProps {
  className?: string;
}

export function PendingFeedbacksSection({ className }: PendingFeedbacksSectionProps) {
  const router = useRouter();
  const [pendingFeedbacks, setPendingFeedbacks] = React.useState<ReviewSlotWithRequest[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Modal state
  const [selectedSlot, setSelectedSlot] = React.useState<ReviewSlotWithRequest | null>(null);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = React.useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fetch pending feedbacks
  React.useEffect(() => {
    const fetchPendingFeedbacks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Call the real API endpoint
        const data = await getPendingReviewsForRequester();
        setPendingFeedbacks(data);

        setIsLoading(false);
      } catch (err) {
        setError(getErrorMessage(err));
        setIsLoading(false);
      }
    };

    fetchPendingFeedbacks();
  }, []);

  // Handle accept review
  const handleAccept = async (data: AcceptReviewData) => {
    if (!selectedSlot) return;

    try {
      setIsSubmitting(true);
      await acceptReviewSlot(selectedSlot.id, data);

      // Remove from list
      setPendingFeedbacks(prev => prev.filter(f => f.id !== selectedSlot.id));

      // Close modal
      setIsAcceptModalOpen(false);
      setSelectedSlot(null);

      // Show success message
      toast.success("Review accepted successfully!");
    } catch (err) {
      toast.error(`Failed to accept review: ${getErrorMessage(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reject review
  const handleReject = async (data: RejectReviewData) => {
    if (!selectedSlot) return;

    try {
      setIsSubmitting(true);
      await rejectReviewSlot(selectedSlot.id, data);

      // Remove from list
      setPendingFeedbacks(prev => prev.filter(f => f.id !== selectedSlot.id));

      // Close modal
      setIsRejectModalOpen(false);
      setSelectedSlot(null);

      // Show success message
      toast.success("Review rejected successfully");
    } catch (err) {
      toast.error(`Failed to reject review: ${getErrorMessage(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate urgency (hours until auto-accept)
  const getUrgency = (autoAcceptAt?: string): { hours: number; isUrgent: boolean } => {
    if (!autoAcceptAt) return { hours: 0, isUrgent: false };

    const now = new Date();
    const deadline = new Date(autoAcceptAt);
    const hoursRemaining = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)));

    return {
      hours: hoursRemaining,
      isUrgent: hoursRemaining < 24,
    };
  };

  // Format time remaining
  const formatTimeRemaining = (hours: number): string => {
    if (hours < 1) return "Less than 1 hour";
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''}`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  // Get status badge info
  const getUrgencyBadge = (urgency: ReturnType<typeof getUrgency>) => {
    if (urgency.hours < 6) {
      return {
        variant: "error" as const,
        text: "URGENT",
        icon: <Zap className="size-3" />,
      };
    } else if (urgency.hours < 24) {
      return {
        variant: "warning" as const,
        text: "Soon",
        icon: <AlertCircle className="size-3" />,
      };
    } else if (urgency.hours < 72) {
      return {
        variant: "warning" as const,
        text: formatTimeRemaining(urgency.hours),
        icon: <Clock className="size-3" />,
      };
    } else {
      return {
        variant: "info" as const,
        text: formatTimeRemaining(urgency.hours),
        icon: <Clock className="size-3" />,
      };
    }
  };

  if (isLoading) {
    return (
      <div className={cn("rounded-2xl border border-border bg-card p-6 shadow-sm", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("rounded-2xl border border-red-500/20 bg-red-500/5 p-6 shadow-sm", className)}>
        <div className="flex items-start gap-3">
          <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-600 mb-1">Failed to load pending reviews</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (pendingFeedbacks.length === 0) {
    return (
      <div className={cn("rounded-2xl border border-border bg-card p-8 shadow-sm", className)}>
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="size-16 rounded-full bg-green-500/10 flex items-center justify-center">
            <Inbox className="size-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              All Caught Up!
            </h3>
            <p className="text-sm text-muted-foreground">
              No pending reviews to accept or reject at this time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Count urgent feedbacks
  const urgentCount = pendingFeedbacks.filter(f => getUrgency(f.auto_accept_at).isUrgent).length;

  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Pending Feedbacks
            </h2>
            {urgentCount > 0 && (
              <Badge variant="error" size="md" showDot pulse>
                {urgentCount} Urgent
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {pendingFeedbacks.length} review{pendingFeedbacks.length !== 1 ? 's' : ''} waiting for your decision
          </p>
        </div>

        <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <AlertCircle className="size-5 text-amber-600" />
        </div>
      </div>

      {/* Feedbacks List */}
      <div className="space-y-4">
        {pendingFeedbacks.map((feedback) => {
          const urgency = getUrgency(feedback.auto_accept_at);
          const urgencyBadge = getUrgencyBadge(urgency);

          return (
            <div
              key={feedback.id}
              className={cn(
                "rounded-xl border-2 overflow-hidden transition-all duration-200",
                "hover:shadow-md",
                urgency.isUrgent
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-border bg-background"
              )}
            >
              {/* Card Header */}
              <div className={cn(
                "p-4 border-b",
                urgency.isUrgent ? "bg-red-500/10 border-red-500/20" : "bg-muted/30 border-border"
              )}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                      {feedback.review_request.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="size-3.5" />
                        <span>{feedback.reviewer?.full_name || "Anonymous"}</span>
                      </div>
                      <span className="text-muted-foreground">•</span>
                      <Badge variant="secondary" size="sm">
                        {feedback.review_request.content_type}
                      </Badge>
                    </div>
                  </div>

                  {/* Rating */}
                  {feedback.rating && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <Star className="size-4 fill-amber-500 text-amber-500" />
                      <span className="text-sm font-bold text-amber-600">
                        {feedback.rating}
                      </span>
                    </div>
                  )}
                </div>

                {/* Auto-accept timer */}
                <div className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                  urgency.isUrgent
                    ? "bg-red-500/10 text-red-600"
                    : "bg-muted text-muted-foreground"
                )}>
                  {urgencyBadge.icon}
                  <span className="font-medium">
                    {urgency.isUrgent ? "URGENT: " : "Auto-accepts in "}
                    {formatTimeRemaining(urgency.hours)}
                  </span>
                </div>
              </div>

              {/* Review Preview */}
              <div className="p-4 space-y-4">
                {/* Review Text Preview */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <FileText className="size-3.5" />
                    Review Content
                  </div>
                  <p className="text-sm text-foreground line-clamp-3 leading-relaxed">
                    {feedback.review_text}
                  </p>
                  {feedback.review_text && feedback.review_text.length > 200 && (
                    <button
                      onClick={() => router.push(`/dashboard/reviews/${feedback.id}/review`)}
                      className="text-xs text-accent-blue hover:underline font-medium"
                    >
                      Read full review →
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedSlot(feedback);
                      setIsRejectModalOpen(true);
                    }}
                    className="w-full border-red-500/30 text-red-600 hover:bg-red-500/5 hover:border-red-500 min-h-[44px]"
                  >
                    <XCircle className="size-4" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedSlot(feedback);
                      setIsAcceptModalOpen(true);
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white min-h-[44px]"
                  >
                    <CheckCircle2 className="size-4" />
                    Accept
                  </Button>
                </div>

                {/* Full Review Link */}
                <button
                  onClick={() => router.push(`/dashboard/reviews/${feedback.id}/review`)}
                  className="w-full flex items-center justify-center gap-2 text-sm text-accent-blue hover:text-accent-blue/80 font-medium py-2 transition-colors group"
                >
                  View Full Review & Details
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Accept Review Modal */}
      {selectedSlot && (
        <AcceptReviewModal
          isOpen={isAcceptModalOpen}
          onClose={() => {
            setIsAcceptModalOpen(false);
            setSelectedSlot(null);
          }}
          onAccept={handleAccept}
          reviewerName={selectedSlot.reviewer?.full_name}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Reject Review Modal */}
      {selectedSlot && (
        <RejectReviewModal
          isOpen={isRejectModalOpen}
          onClose={() => {
            setIsRejectModalOpen(false);
            setSelectedSlot(null);
          }}
          onReject={handleReject}
          reviewerName={selectedSlot.reviewer?.full_name}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
