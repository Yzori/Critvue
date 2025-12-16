/**
 * Active Reviews Sidebar
 *
 * Shows all active reviews in the reviewer hub:
 * - Grouped by status (In Progress, Claimed, Submitted)
 * - Deadline urgency indicators
 * - Progress tracking
 * - Quick switching between reviews
 *
 * Brand Compliance:
 * - Clean list design with Critvue colors
 * - Visual hierarchy with status badges
 * - Hover states and active indicators
 */

"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  XCircle,
  MessageSquarePlus,
  Trophy,
} from "lucide-react";
import { getContentTypeConfig } from "@/lib/constants/content-types";
import { cn } from "@/lib/utils";
import {
  calculateHoursRemaining,
  getDeadlineUrgency,
  formatPayment,
  type ReviewSlot,
} from "@/lib/api/reviews/reviewer-dashboard";

interface ActiveReviewsSidebarProps {
  slots: ReviewSlot[];
  currentSlotId: number;
  onSlotChange: (slotId: number) => void;
}

export function ActiveReviewsSidebar({
  slots,
  currentSlotId,
  onSlotChange,
}: ActiveReviewsSidebarProps) {
  // Group slots by status
  const inProgress = slots.filter(s => s.status === "claimed" && (s.review_text || s.rating));
  const claimed = slots.filter(s => s.status === "claimed" && !s.review_text && !s.rating);
  const submitted = slots.filter(s => s.status === "submitted");
  const elaborationRequested = slots.filter(s => s.status === "elaboration_requested");
  const accepted = slots.filter(s => s.status === "accepted");
  const rejected = slots.filter(s => s.status === "rejected");

  // Count only active reviews (needs action from reviewer)
  const activeCount = inProgress.length + claimed.length + elaborationRequested.length;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          My Reviews
        </h2>
        <p className="text-xs text-muted-foreground">
          {activeCount > 0
            ? `${activeCount} active review${activeCount !== 1 ? "s" : ""}`
            : `${slots.length} total review${slots.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* In Progress Section */}
      {inProgress.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Loader2 className="size-4 text-accent-blue" />
            <h3 className="text-sm font-semibold text-foreground">
              In Progress ({inProgress.length})
            </h3>
          </div>
          <div className="space-y-2">
            {inProgress.map(slot => (
              <ReviewCard
                key={slot.id}
                slot={slot}
                isActive={slot.id === currentSlotId}
                onSelect={() => onSlotChange(slot.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Claimed Section */}
      {claimed.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="size-4 text-accent-peach" />
            <h3 className="text-sm font-semibold text-foreground">
              Claimed ({claimed.length})
            </h3>
          </div>
          <div className="space-y-2">
            {claimed.map(slot => (
              <ReviewCard
                key={slot.id}
                slot={slot}
                isActive={slot.id === currentSlotId}
                onSelect={() => onSlotChange(slot.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Submitted Section */}
      {submitted.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="size-4 text-accent-sage" />
            <h3 className="text-sm font-semibold text-foreground">
              Submitted ({submitted.length})
            </h3>
          </div>
          <div className="space-y-2">
            {submitted.map(slot => (
              <ReviewCard
                key={slot.id}
                slot={slot}
                isActive={slot.id === currentSlotId}
                onSelect={() => onSlotChange(slot.id)}
                statusBadge="submitted"
              />
            ))}
          </div>
        </div>
      )}

      {/* Elaboration Requested Section */}
      {elaborationRequested.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquarePlus className="size-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-foreground">
              Needs Elaboration ({elaborationRequested.length})
            </h3>
          </div>
          <div className="space-y-2">
            {elaborationRequested.map(slot => (
              <ReviewCard
                key={slot.id}
                slot={slot}
                isActive={slot.id === currentSlotId}
                onSelect={() => onSlotChange(slot.id)}
                statusBadge="elaboration"
              />
            ))}
          </div>
        </div>
      )}

      {/* Accepted Section */}
      {accepted.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="size-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-foreground">
              Accepted ({accepted.length})
            </h3>
          </div>
          <div className="space-y-2">
            {accepted.map(slot => (
              <ReviewCard
                key={slot.id}
                slot={slot}
                isActive={slot.id === currentSlotId}
                onSelect={() => onSlotChange(slot.id)}
                statusBadge="accepted"
              />
            ))}
          </div>
        </div>
      )}

      {/* Rejected Section */}
      {rejected.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="size-4 text-red-500" />
            <h3 className="text-sm font-semibold text-foreground">
              Rejected ({rejected.length})
            </h3>
          </div>
          <div className="space-y-2">
            {rejected.map(slot => (
              <ReviewCard
                key={slot.id}
                slot={slot}
                isActive={slot.id === currentSlotId}
                onSelect={() => onSlotChange(slot.id)}
                statusBadge="rejected"
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {slots.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            No active reviews
          </p>
        </div>
      )}
    </div>
  );
}

interface ReviewCardProps {
  slot: ReviewSlot;
  isActive: boolean;
  statusBadge?: "submitted" | "accepted" | "rejected" | "elaboration";
  onSelect: () => void;
}

function ReviewCard({ slot, isActive, statusBadge, onSelect }: ReviewCardProps) {
  const hoursRemaining = slot.claim_deadline
    ? calculateHoursRemaining(slot.claim_deadline)
    : 0;
  const urgency = getDeadlineUrgency(hoursRemaining);

  // Calculate progress
  const progress = React.useMemo(() => {
    if (statusBadge) return 100; // All non-claimed statuses are "complete"

    let completion = 0;
    if (slot.rating) completion += 50;
    if (slot.review_text && slot.review_text.length >= 50) completion += 50;

    return completion;
  }, [slot, statusBadge]);

  // Use shared content type config
  const config = getContentTypeConfig(slot.review_request?.content_type);
  const Icon = config.icon;

  const urgencyColors = {
    danger: "text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-500/20 dark:border-red-500/30",
    warning: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/20 dark:border-amber-500/30",
    safe: "text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-500/20 dark:border-green-500/30",
  };

  const ariaLabel = `Switch to review: ${slot.review_request?.title || 'Untitled Review'}. ${progress}% complete. ${
    hoursRemaining < 24
      ? `${hoursRemaining} hours remaining`
      : `${Math.floor(hoursRemaining / 24)} days remaining`
  }.${isActive ? ' Currently selected.' : ''}`;

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full h-auto p-3 flex flex-col items-start gap-2 hover:bg-muted/50 transition-colors",
        "focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2",
        isActive && "bg-primary/5 border-2 border-primary"
      )}
      onClick={onSelect}
      aria-label={ariaLabel}
      aria-current={isActive ? "true" : undefined}
    >
      {/* Header Row */}
      <div className="w-full flex items-start gap-2">
        <div className={cn(
          "mt-0.5",
          config.color,
          "dark:brightness-125 dark:saturate-150"
        )}>
          <Icon className="size-4" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <h4 className="text-sm font-medium text-foreground line-clamp-2">
            {slot.review_request?.title || "Untitled Review"}
          </h4>
        </div>
      </div>

      {/* Progress Bar - only for claimed (in progress) reviews */}
      {!statusBadge && (
        <div className="w-full">
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300",
                progress === 0 && "bg-muted-foreground/30",
                progress > 0 && progress < 100 && "bg-accent-blue",
                progress === 100 && "bg-accent-sage"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {progress}% complete
          </p>
        </div>
      )}

      {/* Deadline Badge - only for claimed reviews */}
      {slot.claim_deadline && !statusBadge && (
        <div
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium",
            urgencyColors[urgency]
          )}
        >
          {urgency === "danger" && <AlertTriangle className="size-3" />}
          <Clock className="size-3" />
          <span>
            {hoursRemaining < 1
              ? "Overdue"
              : hoursRemaining < 24
                ? `${hoursRemaining}h left`
                : `${Math.floor(hoursRemaining / 24)}d left`}
          </span>
        </div>
      )}

      {/* Payment Badge */}
      <Badge variant="secondary" size="sm">
        {formatPayment(slot.payment_amount)}
      </Badge>

      {/* Status Badge */}
      {statusBadge === "submitted" && (
        <Badge variant="secondary" size="sm" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">
          <Clock className="size-3" />
          Awaiting Response
        </Badge>
      )}
      {statusBadge === "elaboration" && (
        <Badge variant="secondary" size="sm" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30">
          <MessageSquarePlus className="size-3" />
          Needs More Detail
        </Badge>
      )}
      {statusBadge === "accepted" && (
        <Badge variant="secondary" size="sm" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">
          <Trophy className="size-3" />
          Accepted
        </Badge>
      )}
      {statusBadge === "rejected" && (
        <Badge variant="secondary" size="sm" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30">
          <XCircle className="size-3" />
          Rejected
        </Badge>
      )}
    </Button>
  );
}
