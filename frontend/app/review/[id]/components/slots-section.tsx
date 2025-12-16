"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToggle } from "@/hooks";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  CheckCircle2,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ReviewSlot {
  id: number;
  status: string;
  reviewer_id?: number;
  reviewer_username?: string;
  payment_amount?: string | number;
  review_text?: string;
}

interface SlotsSectionProps {
  slots: ReviewSlot[];
  totalSlots: number;
  isPaidReview: boolean;
}

export function SlotsSection({ slots, totalSlots, isPaidReview }: SlotsSectionProps) {
  const showAllSlotsState = useToggle();

  const availableSlots = slots.filter((s) => s.status === "available").length;
  const claimedSlots = slots.filter((s) => s.status !== "available").length;
  const completionPercent = Math.round((claimedSlots / totalSlots) * 100);

  return (
    <section className="rounded-3xl bg-white dark:bg-[var(--dark-tier-2)] border border-gray-100 dark:border-gray-800 p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <div className="size-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
            <Users className="size-4 text-accent-blue" />
          </div>
          Review Slots
        </h2>
        <span className="text-sm text-foreground-muted">
          {claimedSlots} of {totalSlots} filled
        </span>
      </div>

      {/* Visual Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-blue to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <span className="text-sm font-medium text-foreground-muted w-12 text-right">
            {completionPercent}%
          </span>
        </div>

        {/* Slot Dots */}
        <div className="flex items-center gap-2 flex-wrap">
          {slots.map((slot, index) => {
            const isAvailable = slot.status === "available";
            const isClaimed = slot.status === "claimed";
            const isSubmitted = slot.status === "submitted";
            const isCompleted = slot.status === "accepted";

            return (
              <div
                key={slot.id}
                className={cn(
                  "size-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                  isAvailable && "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600",
                  isClaimed && "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-2 border-amber-300 dark:border-amber-500/40",
                  isSubmitted && "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-500/40",
                  isCompleted && "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 border-2 border-green-300 dark:border-green-500/40"
                )}
                title={`Slot ${index + 1}: ${slot.status}${slot.reviewer_username ? ` - ${slot.reviewer_username}` : ""}`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="size-4" />
                ) : isSubmitted ? (
                  <Clock className="size-4" />
                ) : isClaimed ? (
                  <Zap className="size-4" />
                ) : (
                  index + 1
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Expandable Slot Details */}
      {slots.length > 0 && (
        <div>
          <button
            onClick={showAllSlotsState.toggle}
            className="flex items-center gap-2 text-sm text-accent-blue hover:text-accent-blue/80 font-medium transition-colors"
          >
            {showAllSlotsState.value ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            {showAllSlotsState.value ? "Hide details" : "Show slot details"}
          </button>

          {showAllSlotsState.value && (
            <div className="mt-4 space-y-3">
              {slots.map((slot, index) => (
                <div
                  key={slot.id}
                  className={cn(
                    "p-4 rounded-xl border transition-colors",
                    slot.status === "available"
                      ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                      : "bg-white dark:bg-[var(--dark-tier-3)] border-gray-100 dark:border-gray-700"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground-muted">
                        #{index + 1}
                      </span>
                      <Badge
                        variant={
                          slot.status === "available" ? "neutral" :
                          slot.status === "claimed" ? "warning" :
                          slot.status === "submitted" ? "info" :
                          slot.status === "accepted" ? "success" : "neutral"
                        }
                        size="sm"
                      >
                        {slot.status === "available" ? "Open" :
                         slot.status === "claimed" ? "In Progress" :
                         slot.status === "submitted" ? "Submitted" :
                         slot.status === "accepted" ? "Completed" : slot.status}
                      </Badge>
                      {slot.reviewer_username && (
                        <span className="text-sm text-foreground">
                          {slot.reviewer_username}
                        </span>
                      )}
                    </div>
                    {isPaidReview && slot.payment_amount && (
                      <span className="text-sm font-semibold text-green-600">
                        ${Number(slot.payment_amount).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {slot.review_text && (
                    <p className="mt-2 text-sm text-foreground-muted line-clamp-2">
                      {slot.review_text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {slots.length === 0 && (
        <div className="text-center py-8">
          <div className="size-16 mx-auto mb-4 rounded-full bg-accent-blue/10 flex items-center justify-center">
            <Users className="size-8 text-accent-blue" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Reviewers Yet</h3>
          <p className="text-foreground-muted mb-4">Be the first to claim a review slot!</p>
        </div>
      )}
    </section>
  );
}
