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
} from "lucide-react";
import { getContentTypeConfig } from "@/lib/constants/content-types";
import { cn } from "@/lib/utils";
import {
  calculateHoursRemaining,
  getDeadlineUrgency,
  formatPayment,
  type ReviewSlot,
} from "@/lib/api/reviewer";

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

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          My Reviews
        </h2>
        <p className="text-xs text-muted-foreground">
          {slots.length} active review{slots.length !== 1 ? "s" : ""}
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
                isSubmitted
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
  isSubmitted?: boolean;
  onSelect: () => void;
}

function ReviewCard({ slot, isActive, isSubmitted, onSelect }: ReviewCardProps) {
  const hoursRemaining = slot.claim_deadline
    ? calculateHoursRemaining(slot.claim_deadline)
    : 0;
  const urgency = getDeadlineUrgency(hoursRemaining);

  // Calculate progress
  const progress = React.useMemo(() => {
    if (isSubmitted) return 100;

    let completion = 0;
    if (slot.rating) completion += 50;
    if (slot.review_text && slot.review_text.length >= 50) completion += 50;

    return completion;
  }, [slot, isSubmitted]);

  // Use shared content type config
  const config = getContentTypeConfig(slot.review_request?.content_type);
  const Icon = config.icon;

  const urgencyColors = {
    danger: "text-red-700 bg-red-50 border-red-200",
    warning: "text-amber-700 bg-amber-50 border-amber-200",
    safe: "text-green-700 bg-green-50 border-green-200",
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
        <div className={cn("mt-0.5", config.color)}>
          <Icon className="size-4" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <h4 className="text-sm font-medium text-foreground line-clamp-2">
            {slot.review_request?.title || "Untitled Review"}
          </h4>
        </div>
      </div>

      {/* Progress Bar */}
      {!isSubmitted && (
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

      {/* Deadline Badge */}
      {slot.claim_deadline && !isSubmitted && (
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

      {/* Submitted Badge */}
      {isSubmitted && (
        <Badge variant="success" size="sm">
          <CheckCircle2 className="size-3" />
          Submitted
        </Badge>
      )}
    </Button>
  );
}
