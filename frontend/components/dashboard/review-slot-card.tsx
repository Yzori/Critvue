/**
 * ReviewSlotCard Component
 * Displays individual review slot status with 4 variants:
 * - Accepted (green) - Completed review with rating
 * - Pending (amber) - Submitted, awaiting requester acceptance
 * - In Progress (blue) - Claimed by reviewer
 * - Available (gray) - Waiting for reviewers
 *
 * Features:
 * - Mobile-optimized with 44px touch targets
 * - Auto-accept countdown for pending reviews
 * - Brand-compliant glassmorphism design
 */

"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  User,
  Mail,
  Star,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Review slot status enum matching backend
export type ReviewSlotStatus =
  | "available"
  | "claimed"
  | "submitted"
  | "accepted"
  | "rejected"
  | "abandoned"
  | "disputed";

export interface ReviewSlotCardProps {
  slotId: number;
  status: ReviewSlotStatus;
  reviewerName?: string;
  reviewText?: string;
  rating?: number;
  submittedAt?: string; // ISO datetime
  claimedAt?: string; // ISO datetime
  autoAcceptAt?: string; // ISO datetime
  claimDeadline?: string; // ISO datetime
  onViewReview?: (slotId: number) => void;
  isRequester?: boolean; // True if viewing as requester
}

/**
 * Format time remaining as human-readable string
 */
function formatTimeRemaining(isoDate: string): {
  text: string;
  urgency: "normal" | "warning" | "urgent";
} {
  const now = new Date();
  const target = new Date(isoDate);
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { text: "Expired", urgency: "urgent" };
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(diffSeconds / 86400);
  const hours = Math.floor((diffSeconds % 86400) / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);

  // Determine urgency
  let urgency: "normal" | "warning" | "urgent";
  if (diffSeconds < 86400) {
    // < 24 hours
    urgency = "urgent";
  } else if (diffSeconds < 259200) {
    // < 3 days
    urgency = "warning";
  } else {
    urgency = "normal";
  }

  // Format text
  if (days > 0) {
    return { text: `${days}d ${hours}h`, urgency };
  } else if (hours > 0) {
    return { text: `${hours}h ${minutes}m`, urgency };
  } else {
    return { text: `${minutes}m`, urgency };
  }
}

/**
 * Format date as relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(isoDate: string): string {
  const now = new Date();
  const target = new Date(isoDate);
  const diffMs = now.getTime() - target.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) {
    return "Just now";
  } else if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  } else {
    const days = Math.floor(diffSeconds / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }
}

export function ReviewSlotCard({
  slotId,
  status,
  reviewerName,
  reviewText,
  rating,
  submittedAt,
  claimedAt,
  autoAcceptAt,
  claimDeadline,
  onViewReview,
  isRequester = false,
}: ReviewSlotCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    text: string;
    urgency: "normal" | "warning" | "urgent";
  } | null>(null);

  // Update countdown timer for pending reviews
  useEffect(() => {
    if (status === "submitted" && autoAcceptAt && isRequester) {
      const updateTimer = () => {
        setTimeRemaining(formatTimeRemaining(autoAcceptAt));
      };

      updateTimer();
      const interval = setInterval(updateTimer, 60000); // Update every minute

      return () => clearInterval(interval);
    } else if (status === "claimed" && claimDeadline) {
      const updateTimer = () => {
        setTimeRemaining(formatTimeRemaining(claimDeadline));
      };

      updateTimer();
      const interval = setInterval(updateTimer, 60000);

      return () => clearInterval(interval);
    }
  }, [status, autoAcceptAt, claimDeadline, isRequester]);

  // Render based on status
  const renderContent = () => {
    switch (status) {
      case "accepted":
        return renderAcceptedSlot();
      case "submitted":
        return isRequester ? renderPendingSlot() : renderSubmittedSlot();
      case "claimed":
        return renderInProgressSlot();
      case "available":
        return renderAvailableSlot();
      case "rejected":
        return renderRejectedSlot();
      case "abandoned":
        return renderAbandonedSlot();
      default:
        return renderAvailableSlot();
    }
  };

  // Accepted variant (green)
  const renderAcceptedSlot = () => (
    <div
      className={cn(
        "rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-500/5 to-green-600/5",
        "p-4 sm:p-5 space-y-3 transition-all duration-200",
        "hover:shadow-[0_4px_12px_rgba(34,197,94,0.1)]"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="size-4 text-green-600" />
          </div>
          <div>
            <div className="font-semibold text-foreground text-sm sm:text-base">
              Review Accepted
            </div>
            {reviewerName && (
              <div className="text-xs text-muted-foreground">
                by {reviewerName}
              </div>
            )}
          </div>
        </div>

        {/* Rating */}
        {rating && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/10">
            <Star className="size-3 fill-green-600 text-green-600" />
            <span className="text-sm font-semibold text-green-600">
              {rating}
            </span>
          </div>
        )}
      </div>

      {/* Review Preview */}
      {reviewText && (
        <div className="text-sm text-muted-foreground line-clamp-2 bg-background/50 rounded-lg p-3 border border-border">
          {reviewText}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-green-500/10">
        <div className="text-xs text-muted-foreground">
          {submittedAt && formatRelativeTime(submittedAt)}
        </div>
        {onViewReview && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onViewReview(slotId)}
            className="h-9 text-green-600 hover:text-green-700 hover:bg-green-500/10"
          >
            View Review
          </Button>
        )}
      </div>
    </div>
  );

  // Pending variant (amber) - Requester view
  const renderPendingSlot = () => (
    <div
      className={cn(
        "rounded-xl border-2 bg-gradient-to-br",
        timeRemaining?.urgency === "urgent"
          ? "border-red-500/30 from-red-500/5 to-red-600/5 shadow-[0_0_12px_rgba(239,68,68,0.1)] animate-pulse"
          : timeRemaining?.urgency === "warning"
          ? "border-amber-500/30 from-amber-500/5 to-amber-600/5"
          : "border-amber-500/30 from-amber-500/5 to-amber-600/5",
        "p-4 sm:p-5 space-y-3 transition-all duration-200",
        "hover:shadow-[0_4px_12px_rgba(245,158,11,0.15)]"
      )}
    >
      {/* Header with ACTION NEEDED badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "size-8 rounded-full flex items-center justify-center",
              timeRemaining?.urgency === "urgent"
                ? "bg-red-500/10"
                : "bg-amber-500/10"
            )}
          >
            <AlertCircle
              className={cn(
                "size-4",
                timeRemaining?.urgency === "urgent"
                  ? "text-red-600"
                  : "text-amber-600"
              )}
            />
          </div>
          <div>
            <div className="font-semibold text-foreground text-sm sm:text-base">
              Review Submitted
            </div>
            {reviewerName && (
              <div className="text-xs text-muted-foreground">
                by {reviewerName}
              </div>
            )}
          </div>
        </div>

        {/* ACTION NEEDED badge */}
        <div
          className={cn(
            "px-2 py-1 rounded-md text-xs font-bold",
            timeRemaining?.urgency === "urgent"
              ? "bg-red-500/10 text-red-600"
              : "bg-amber-500/10 text-amber-600"
          )}
        >
          ACTION NEEDED
        </div>
      </div>

      {/* Auto-accept countdown */}
      {timeRemaining && (
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border",
            timeRemaining.urgency === "urgent"
              ? "bg-red-500/5 border-red-500/20"
              : timeRemaining.urgency === "warning"
              ? "bg-amber-500/5 border-amber-500/20"
              : "bg-blue-500/5 border-blue-500/20"
          )}
        >
          <Clock
            className={cn(
              "size-4",
              timeRemaining.urgency === "urgent"
                ? "text-red-600"
                : timeRemaining.urgency === "warning"
                ? "text-amber-600"
                : "text-blue-600"
            )}
          />
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">
              {timeRemaining.urgency === "urgent"
                ? "URGENT: Auto-accepts in"
                : "Auto-accepts in"}
            </div>
            <div
              className={cn(
                "text-sm font-bold",
                timeRemaining.urgency === "urgent"
                  ? "text-red-600"
                  : timeRemaining.urgency === "warning"
                  ? "text-amber-600"
                  : "text-blue-600"
              )}
            >
              {timeRemaining.text}
            </div>
          </div>
        </div>
      )}

      {/* Review Preview */}
      {reviewText && (
        <div className="text-sm text-muted-foreground line-clamp-2 bg-background/50 rounded-lg p-3 border border-border">
          {reviewText}
        </div>
      )}

      {/* CTA Button */}
      <Button
        size="lg"
        onClick={() => onViewReview?.(slotId)}
        className={cn(
          "w-full min-h-[48px] font-semibold touch-manipulation active:scale-[0.98]",
          timeRemaining?.urgency === "urgent"
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-amber-600 hover:bg-amber-700 text-white"
        )}
      >
        Read & Review Now
      </Button>
    </div>
  );

  // Submitted variant (for reviewer view)
  const renderSubmittedSlot = () => (
    <div
      className={cn(
        "rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-blue-600/5",
        "p-4 sm:p-5 space-y-3 transition-all duration-200"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-full bg-blue-500/10 flex items-center justify-center">
          <CheckCircle2 className="size-4 text-blue-600" />
        </div>
        <div>
          <div className="font-semibold text-foreground text-sm">
            Review Submitted
          </div>
          <div className="text-xs text-muted-foreground">
            Awaiting acceptance
          </div>
        </div>
      </div>
    </div>
  );

  // In Progress variant (blue)
  const renderInProgressSlot = () => (
    <div
      className={cn(
        "rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-blue-600/5",
        "p-4 sm:p-5 space-y-3 transition-all duration-200"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Loader2 className="size-4 text-blue-600 animate-spin" />
          </div>
          <div>
            <div className="font-semibold text-foreground text-sm sm:text-base">
              In Progress
            </div>
            {reviewerName && (
              <div className="text-xs text-muted-foreground">
                by {reviewerName}
              </div>
            )}
          </div>
        </div>

        {/* Status badge */}
        <div className="px-2 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-600">
          CLAIMED
        </div>
      </div>

      {/* Deadline countdown */}
      {timeRemaining && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
          <Clock className="size-4 text-blue-600" />
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">
              Deadline in {timeRemaining.text}
            </div>
          </div>
        </div>
      )}

      {/* Claimed time */}
      {claimedAt && (
        <div className="text-xs text-muted-foreground">
          Claimed {formatRelativeTime(claimedAt)}
        </div>
      )}
    </div>
  );

  // Available variant (gray)
  const renderAvailableSlot = () => (
    <div
      className={cn(
        "rounded-xl border-2 border-border bg-muted/30",
        "p-4 sm:p-5 space-y-3 transition-all duration-200"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-full bg-muted flex items-center justify-center">
          <Mail className="size-4 text-muted-foreground" />
        </div>
        <div>
          <div className="font-semibold text-foreground text-sm sm:text-base">
            Available
          </div>
          <div className="text-xs text-muted-foreground">
            Waiting for reviewers
          </div>
        </div>
      </div>
    </div>
  );

  // Rejected variant (red)
  const renderRejectedSlot = () => (
    <div
      className={cn(
        "rounded-xl border-2 border-red-500/30 bg-gradient-to-br from-red-500/5 to-red-600/5",
        "p-4 sm:p-5 space-y-3 transition-all duration-200"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="size-4 text-red-600" />
        </div>
        <div>
          <div className="font-semibold text-foreground text-sm sm:text-base">
            Rejected
          </div>
          <div className="text-xs text-muted-foreground">
            Review not accepted
          </div>
        </div>
      </div>
    </div>
  );

  // Abandoned variant (gray)
  const renderAbandonedSlot = () => (
    <div
      className={cn(
        "rounded-xl border-2 border-border bg-muted/30",
        "p-4 sm:p-5 space-y-3 transition-all duration-200 opacity-60"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-full bg-muted flex items-center justify-center">
          <AlertCircle className="size-4 text-muted-foreground" />
        </div>
        <div>
          <div className="font-semibold text-foreground text-sm sm:text-base">
            Abandoned
          </div>
          <div className="text-xs text-muted-foreground">
            Reviewer timed out
          </div>
        </div>
      </div>
    </div>
  );

  return renderContent();
}
