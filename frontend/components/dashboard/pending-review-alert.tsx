/**
 * PendingReviewAlert Component
 * Dashboard banner showing pending reviews count
 *
 * Features:
 * - Dismissible but persists until reviews are addressed
 * - Click to scroll to pending reviews section
 * - Urgency-based styling (normal vs urgent)
 * - Mobile-responsive
 * - Smooth animations
 */

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PendingReviewAlertProps {
  pendingCount: number;
  urgentCount: number;
  onDismiss?: () => void;
  onViewPending?: () => void;
  className?: string;
}

export function PendingReviewAlert({
  pendingCount,
  urgentCount,
  onDismiss,
  onViewPending,
  className,
}: PendingReviewAlertProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't render if no pending reviews
  if (pendingCount === 0 || isDismissed) {
    return null;
  }

  const isUrgent = urgentCount > 0;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        "rounded-xl border-2 transition-all duration-300 animate-in slide-in-from-top-4",
        isUrgent
          ? "border-red-500/30 bg-gradient-to-r from-red-500/5 to-red-600/5 shadow-[0_0_12px_rgba(239,68,68,0.1)]"
          : "border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-amber-600/5",
        className
      )}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              "size-10 rounded-full flex items-center justify-center flex-shrink-0",
              isUrgent ? "bg-red-500/10" : "bg-amber-500/10"
            )}
          >
            <AlertCircle
              className={cn(
                "size-5",
                isUrgent ? "text-red-600" : "text-amber-600"
              )}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h3
                  className={cn(
                    "text-base sm:text-lg font-bold mb-1",
                    isUrgent ? "text-red-600" : "text-amber-600"
                  )}
                >
                  {isUrgent
                    ? `${urgentCount} Urgent Review${
                        urgentCount === 1 ? "" : "s"
                      } Need${urgentCount === 1 ? "s" : ""} Attention!`
                    : `${pendingCount} Review${
                        pendingCount === 1 ? "" : "s"
                      } Awaiting Your Response`}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isUrgent ? (
                    <>
                      {urgentCount === 1 ? "A review is" : "Reviews are"}{" "}
                      waiting for your acceptance and will auto-accept in less
                      than 24 hours.
                    </>
                  ) : (
                    <>
                      {pendingCount === 1
                        ? "A reviewer has submitted their feedback"
                        : "Reviewers have submitted their feedback"}{" "}
                      and {pendingCount === 1 ? "is" : "are"} waiting for you
                      to review and accept.
                    </>
                  )}
                </p>
              </div>

              {/* Dismiss button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className={cn(
                  "flex-shrink-0 size-8 p-0 rounded-full hover:bg-current/10",
                  isUrgent
                    ? "text-red-600 hover:text-red-700"
                    : "text-amber-600 hover:text-amber-700"
                )}
                aria-label="Dismiss alert"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Action Button */}
            {onViewPending && (
              <Button
                size="lg"
                onClick={onViewPending}
                className={cn(
                  "w-full sm:w-auto min-h-[48px] font-semibold touch-manipulation active:scale-[0.98]",
                  isUrgent
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-amber-600 hover:bg-amber-700 text-white"
                )}
              >
                <span>Review Now</span>
                <ChevronDown className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Additional info for multiple reviews */}
        {pendingCount > 1 && (
          <div
            className={cn(
              "mt-3 pt-3 border-t text-xs",
              isUrgent
                ? "border-red-500/20 text-red-600/80"
                : "border-amber-500/20 text-amber-600/80"
            )}
          >
            {urgentCount > 0 && urgentCount < pendingCount ? (
              <>
                {urgentCount} urgent (auto-accept in &lt;24h) • {pendingCount - urgentCount} pending
              </>
            ) : (
              <>Total pending: {pendingCount}</>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
