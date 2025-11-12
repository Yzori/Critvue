/**
 * MultiReviewStatusCard Component
 * Shows overall progress for multi-review requests
 *
 * Features:
 * - Progress bar with completion percentage
 * - Status counts (Accepted, Pending, In Progress, Available)
 * - Expandable to show individual ReviewSlotCards
 * - Glassmorphism aesthetic with brand colors
 * - Mobile-optimized touch targets
 */

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  AlertCircle,
  Eye,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ReviewSlotCard,
  ReviewSlotStatus,
  ReviewSlotCardProps,
} from "./review-slot-card";

export interface ReviewSlot {
  id: number;
  status: ReviewSlotStatus;
  reviewerName?: string;
  reviewText?: string;
  rating?: number;
  submittedAt?: string;
  claimedAt?: string;
  autoAcceptAt?: string;
  claimDeadline?: string;
}

export interface MultiReviewStatusCardProps {
  requestId: number;
  title: string;
  contentType: string;
  reviewType: "free" | "expert";
  createdAt: string;
  slots: ReviewSlot[];
  onViewReview?: (slotId: number) => void;
  onViewRequest?: (requestId: number) => void;
}

/**
 * Calculate status counts from slots
 */
function calculateStatusCounts(slots: ReviewSlot[]) {
  return {
    accepted: slots.filter((s) => s.status === "accepted").length,
    pending: slots.filter((s) => s.status === "submitted").length,
    inProgress: slots.filter((s) => s.status === "claimed").length,
    available: slots.filter((s) => s.status === "available").length,
    rejected: slots.filter((s) => s.status === "rejected").length,
    abandoned: slots.filter((s) => s.status === "abandoned").length,
  };
}

/**
 * Format relative time
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
    return `${minutes}m ago`;
  } else if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffSeconds / 86400);
    return `${days}d ago`;
  }
}

export function MultiReviewStatusCard({
  requestId,
  title,
  contentType,
  reviewType,
  createdAt,
  slots,
  onViewReview,
  onViewRequest,
}: MultiReviewStatusCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusCounts = calculateStatusCounts(slots);
  const totalSlots = slots.length;
  const completedSlots = statusCounts.accepted;
  const progressPercentage =
    totalSlots > 0 ? (completedSlots / totalSlots) * 100 : 0;

  // Determine if there are urgent pending reviews
  const hasPendingReviews = statusCounts.pending > 0;
  const urgentPending = slots.some((slot) => {
    if (slot.status === "submitted" && slot.autoAcceptAt) {
      const now = new Date();
      const autoAccept = new Date(slot.autoAcceptAt);
      const hoursRemaining = (autoAccept.getTime() - now.getTime()) / 3600000;
      return hoursRemaining < 24;
    }
    return false;
  });

  // Get content type icon/color
  const getContentTypeColor = () => {
    switch (contentType.toLowerCase()) {
      case "design":
        return "text-accent-peach bg-accent-peach/10";
      case "code":
        return "text-accent-blue bg-accent-blue/10";
      case "video":
        return "text-purple-600 bg-purple-500/10";
      case "writing":
        return "text-accent-sage bg-accent-sage/10";
      default:
        return "text-accent-blue bg-accent-blue/10";
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border-2 bg-card transition-all duration-300",
        "shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
        urgentPending
          ? "border-red-500/30 shadow-[0_0_16px_rgba(239,68,68,0.1)]"
          : hasPendingReviews
          ? "border-amber-500/30"
          : "border-border",
        "hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
      )}
    >
      {/* Main Card Content */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {/* Content Type Badge */}
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold",
                  getContentTypeColor()
                )}
              >
                {contentType}
              </span>

              {/* Review Type Badge */}
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold",
                  reviewType === "expert"
                    ? "bg-accent-peach/10 text-accent-peach"
                    : "bg-green-500/10 text-green-600"
                )}
              >
                {reviewType === "expert" ? "Expert" : "Free"}
              </span>

              {/* Urgent Badge */}
              {urgentPending && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-red-500/10 text-red-600 animate-pulse">
                  <AlertCircle className="size-3" />
                  URGENT
                </span>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1 line-clamp-2">
              {title}
            </h3>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="size-3" />
              <span>{formatRelativeTime(createdAt)}</span>
            </div>
          </div>

          {/* View Request Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewRequest?.(requestId)}
            className="flex-shrink-0 h-9"
          >
            <Eye className="size-4" />
            <span className="hidden sm:inline">View</span>
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">
              {completedSlots} of {totalSlots} reviews{" "}
              {completedSlots === totalSlots ? "complete" : "submitted"}
            </span>
            <span className="text-muted-foreground">
              {progressPercentage.toFixed(0)}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
            {/* Completed portion (green) */}
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />

            {/* Pending portion (amber) */}
            {statusCounts.pending > 0 && (
              <div
                className={cn(
                  "absolute top-0 h-full transition-all duration-500 ease-out",
                  urgentPending
                    ? "bg-gradient-to-r from-red-500 to-red-600"
                    : "bg-gradient-to-r from-amber-500 to-amber-600"
                )}
                style={{
                  left: `${progressPercentage}%`,
                  width: `${(statusCounts.pending / totalSlots) * 100}%`,
                }}
              />
            )}

            {/* In Progress portion (blue) */}
            {statusCounts.inProgress > 0 && (
              <div
                className="absolute top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                style={{
                  left: `${
                    ((completedSlots + statusCounts.pending) / totalSlots) * 100
                  }%`,
                  width: `${(statusCounts.inProgress / totalSlots) * 100}%`,
                }}
              />
            )}
          </div>
        </div>

        {/* Status Counts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Accepted */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/20">
            <CheckCircle2 className="size-4 text-green-600 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Accepted</div>
              <div className="text-sm font-bold text-green-600">
                {statusCounts.accepted}
              </div>
            </div>
          </div>

          {/* Pending */}
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border",
              urgentPending
                ? "bg-red-500/5 border-red-500/20"
                : statusCounts.pending > 0
                ? "bg-amber-500/5 border-amber-500/20"
                : "bg-muted/50 border-border"
            )}
          >
            <Clock
              className={cn(
                "size-4 flex-shrink-0",
                urgentPending
                  ? "text-red-600"
                  : statusCounts.pending > 0
                  ? "text-amber-600"
                  : "text-muted-foreground"
              )}
            />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Pending</div>
              <div
                className={cn(
                  "text-sm font-bold",
                  urgentPending
                    ? "text-red-600"
                    : statusCounts.pending > 0
                    ? "text-amber-600"
                    : "text-muted-foreground"
                )}
              >
                {statusCounts.pending}
              </div>
            </div>
          </div>

          {/* In Progress */}
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border",
              statusCounts.inProgress > 0
                ? "bg-blue-500/5 border-blue-500/20"
                : "bg-muted/50 border-border"
            )}
          >
            <Loader2
              className={cn(
                "size-4 flex-shrink-0",
                statusCounts.inProgress > 0
                  ? "text-blue-600"
                  : "text-muted-foreground"
              )}
            />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">In Progress</div>
              <div
                className={cn(
                  "text-sm font-bold",
                  statusCounts.inProgress > 0
                    ? "text-blue-600"
                    : "text-muted-foreground"
                )}
              >
                {statusCounts.inProgress}
              </div>
            </div>
          </div>

          {/* Available */}
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border",
              statusCounts.available > 0
                ? "bg-muted/50 border-border"
                : "bg-muted/30 border-border"
            )}
          >
            <Mail className="size-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Available</div>
              <div className="text-sm font-bold text-muted-foreground">
                {statusCounts.available}
              </div>
            </div>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full min-h-[44px] touch-manipulation active:scale-[0.98]"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="size-4" />
              Hide Individual Reviews
            </>
          ) : (
            <>
              <ChevronDown className="size-4" />
              Show Individual Reviews ({totalSlots})
            </>
          )}
        </Button>
      </div>

      {/* Expanded Section - Individual Slot Cards */}
      {isExpanded && (
        <div className="border-t border-border p-5 sm:p-6 space-y-3 bg-muted/20 animate-in slide-in-from-top-2 duration-300">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Individual Review Slots
          </h4>

          <div className="grid gap-3">
            {slots.map((slot) => (
              <ReviewSlotCard
                key={slot.id}
                slotId={slot.id}
                status={slot.status}
                reviewerName={slot.reviewerName}
                reviewText={slot.reviewText}
                rating={slot.rating}
                submittedAt={slot.submittedAt}
                claimedAt={slot.claimedAt}
                autoAcceptAt={slot.autoAcceptAt}
                claimDeadline={slot.claimDeadline}
                onViewReview={onViewReview}
                isRequester={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
