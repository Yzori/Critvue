"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ReviewSlot, ReviewSlotStatus } from "@/lib/api/reviews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Star,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

/**
 * SlotsList Component
 *
 * Features:
 * - Display all review slots with status indicators
 * - Show reviewer information when claimed
 * - Display review content when submitted
 * - Status badges with appropriate colors
 * - Time indicators (deadlines, timestamps)
 * - Mobile-responsive layout
 * - Glassmorphism design
 * - WCAG 2.1 Level AA compliant
 */

interface SlotsListProps {
  slots: ReviewSlot[];
  className?: string;
  isOwner?: boolean; // Whether the current user is the review request owner
}

// Helper to get status badge variant
function getStatusVariant(
  status: ReviewSlotStatus
): "success" | "warning" | "error" | "info" | "neutral" {
  switch (status) {
    case "available":
      return "info";
    case "claimed":
      return "warning";
    case "submitted":
      return "warning";
    case "accepted":
      return "success";
    case "rejected":
      return "error";
    case "abandoned":
      return "neutral";
    case "disputed":
      return "error";
    default:
      return "neutral";
  }
}

// Helper to get status icon
function getStatusIcon(status: ReviewSlotStatus, className?: string) {
  switch (status) {
    case "available":
      return <Clock className={className} />;
    case "claimed":
      return <Clock className={className} />;
    case "submitted":
      return <AlertCircle className={className} />;
    case "accepted":
      return <CheckCircle2 className={className} />;
    case "rejected":
      return <XCircle className={className} />;
    case "abandoned":
      return <XCircle className={className} />;
    case "disputed":
      return <AlertCircle className={className} />;
    default:
      return <Clock className={className} />;
  }
}

// Helper to format status text
function getStatusText(status: ReviewSlotStatus): string {
  switch (status) {
    case "available":
      return "Available";
    case "claimed":
      return "In Progress";
    case "submitted":
      return "Awaiting Review";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    case "abandoned":
      return "Abandoned";
    case "disputed":
      return "Disputed";
    default:
      return status;
  }
}

// Helper to format time relative to now (using native Intl API)
function formatTimeRelative(dateString?: string): string {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Use Intl.RelativeTimeFormat for accurate, localized formatting
    const rtf = new Intl.RelativeTimeFormat('en', {
      numeric: 'auto',  // Use "yesterday" instead of "1 day ago" when appropriate
      style: 'long'     // Use "2 hours ago" instead of "2 hr ago"
    });

    const absDiff = Math.abs(diffInSeconds);
    const isPast = diffInSeconds > 0;
    const sign = isPast ? -1 : 1;

    // Determine appropriate unit and value
    if (absDiff < 60) {
      return isPast ? "just now" : "in a few seconds";
    } else if (absDiff < 3600) {
      const minutes = Math.floor(absDiff / 60);
      return rtf.format(sign * minutes, 'minute');
    } else if (absDiff < 86400) {
      const hours = Math.floor(absDiff / 3600);
      return rtf.format(sign * hours, 'hour');
    } else if (absDiff < 2592000) {
      const days = Math.floor(absDiff / 86400);
      return rtf.format(sign * days, 'day');
    } else if (absDiff < 31536000) {
      const months = Math.floor(absDiff / 2592000);
      return rtf.format(sign * months, 'month');
    } else {
      const years = Math.floor(absDiff / 31536000);
      return rtf.format(sign * years, 'year');
    }
  } catch {
    return "";
  }
}

export function SlotsList({ slots, className, isOwner = false }: SlotsListProps) {
  const router = useRouter();

  if (slots.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <User className="size-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No review slots available</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)} role="list" aria-label="Review slots">
      {slots.map((slot, index) => {
        const statusVariant = getStatusVariant(slot.status);
        const statusIcon = getStatusIcon(slot.status, "size-4");
        const statusText = getStatusText(slot.status);

        return (
          <div
            key={slot.id}
            role="listitem"
            className={cn(
              "rounded-xl overflow-hidden",
              "bg-white/60 backdrop-blur-sm border border-gray-200/50",
              "hover:border-accent-blue/30 hover:shadow-md",
              "transition-all duration-300"
            )}
          >
            {/* Slot Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200/50">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                {/* Slot Number & Status */}
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "size-10 rounded-full flex items-center justify-center",
                      "bg-gradient-to-br from-accent-blue/10 to-accent-blue/5",
                      "border border-accent-blue/20 font-semibold text-accent-blue"
                    )}
                  >
                    #{index + 1}
                  </div>
                  <div>
                    <Badge variant={statusVariant} size="md" icon={statusIcon} showDot>
                      {statusText}
                    </Badge>
                  </div>
                </div>

                {/* Reviewer Info */}
                {slot.reviewer_username && (
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {slot.reviewer_username}
                    </span>
                  </div>
                )}
              </div>

              {/* Time Information */}
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
                {slot.claimed_at && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    <span>Claimed {formatTimeRelative(slot.claimed_at)}</span>
                  </div>
                )}
                {slot.claim_deadline && slot.status === "claimed" && (
                  <div className="flex items-center gap-1.5 text-amber-600">
                    <AlertCircle className="size-3.5" />
                    <span>Due {formatTimeRelative(slot.claim_deadline)}</span>
                  </div>
                )}
                {slot.submitted_at && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5" />
                    <span>Submitted {formatTimeRelative(slot.submitted_at)}</span>
                  </div>
                )}
                {slot.reviewed_at && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5" />
                    <span>Reviewed {formatTimeRelative(slot.reviewed_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Review Content (if submitted) */}
            {slot.review_text && (
              <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50/50 to-white/50">
                {/* Rating */}
                {slot.rating && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "size-4",
                            i < slot.rating!
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {slot.rating} / 5
                    </span>
                  </div>
                )}

                {/* Review Text */}
                <div className="prose prose-sm max-w-none">
                  <div className="flex items-start gap-2 mb-2">
                    <MessageSquare className="size-4 text-gray-400 mt-0.5 shrink-0" />
                    <h4 className="text-sm font-semibold text-gray-900 m-0">Review</h4>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {slot.review_text}
                  </p>
                </div>

                {/* Rejection Info */}
                {slot.status === "rejected" && slot.rejection_reason && (
                  <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                    <div className="flex items-start gap-2">
                      <XCircle className="size-4 text-red-600 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-red-900 mb-1">
                          Rejection Reason
                        </p>
                        <p className="text-xs text-red-700 capitalize">
                          {slot.rejection_reason.replace(/_/g, " ")}
                        </p>
                        {slot.rejection_notes && (
                          <p className="text-xs text-red-600 mt-2">
                            {slot.rejection_notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Acceptance Type */}
                {slot.status === "accepted" && slot.acceptance_type && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="size-3.5 text-green-600" />
                    <span>
                      {slot.acceptance_type === "auto"
                        ? "Automatically accepted"
                        : "Manually accepted"}
                    </span>
                  </div>
                )}

                {/* Action Button for Submitted Reviews - Owner Only */}
                {isOwner && slot.status === "submitted" && (
                  <div className="mt-4 pt-4 border-t border-gray-200/50">
                    <Button
                      onClick={() => router.push(`/dashboard/reviews/${slot.id}/review`)}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white min-h-[48px] font-semibold touch-manipulation active:scale-[0.98]"
                      size="lg"
                    >
                      Review & Accept/Reject
                      <ArrowRight className="size-5" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Payment Info (if applicable) */}
            {slot.payment_amount && slot.payment_amount > 0 && (
              <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-green-50/50 to-emerald-50/50 border-t border-gray-200/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Payment</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      ${Number(slot.payment_amount).toFixed(2)}
                    </span>
                    <Badge
                      variant={
                        slot.payment_status === "released"
                          ? "success"
                          : slot.payment_status === "escrowed"
                          ? "warning"
                          : "neutral"
                      }
                      size="sm"
                    >
                      {slot.payment_status}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
