/**
 * Active Reviews List Component
 *
 * Displays reviewer's active claimed reviews with:
 * - Time remaining until deadline
 * - Quick actions (Submit, Cancel claim)
 * - Progress indicators
 * - Deadline urgency visual indicators
 *
 * Brand Compliance:
 * - Uses Critvue brand colors for urgency states
 * - Glassmorphism card design
 * - Smooth hover animations
 * - Mobile-friendly touch targets (44px minimum)
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  AlertCircle,
  FileEdit,
  XCircle,
  ChevronRight,
  Palette,
  Code,
  Video,
  Mic,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  calculateHoursRemaining,
  getDeadlineUrgency,
  formatPayment,
  type ReviewSlot,
} from "@/lib/api/reviewer";

export interface ActiveReviewsListProps {
  reviews: ReviewSlot[];
  onAbandon: (slotId: number) => Promise<void>;
  isLoading?: boolean;
}

export function ActiveReviewsList({
  reviews,
  onAbandon,
  isLoading = false,
}: ActiveReviewsListProps) {
  const router = useRouter();
  const [abandoningId, setAbandoningId] = React.useState<number | null>(null);

  const handleAbandon = async (slotId: number) => {
    if (!confirm("Are you sure you want to abandon this review? It will become available to other reviewers.")) {
      return;
    }

    try {
      setAbandoningId(slotId);
      await onAbandon(slotId);
    } catch (error) {
      console.error("Failed to abandon review:", error);
      alert("Failed to abandon review. Please try again.");
    } finally {
      setAbandoningId(null);
    }
  };

  const contentTypeConfig = {
    design: {
      icon: <Palette className="size-4" />,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
    },
    code: {
      icon: <Code className="size-4" />,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
    },
    video: {
      icon: <Video className="size-4" />,
      color: "text-purple-600",
      bg: "bg-purple-500/10",
    },
    audio: {
      icon: <Mic className="size-4" />,
      color: "text-pink-600",
      bg: "bg-pink-500/10",
    },
    writing: {
      icon: <FileText className="size-4" />,
      color: "text-green-600",
      bg: "bg-green-500/10",
    },
    art: {
      icon: <ImageIcon className="size-4" />,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
    },
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-xl bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="size-16 rounded-2xl bg-accent-blue/10 flex items-center justify-center mb-4">
          <Clock className="size-8 text-accent-blue" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No active reviews
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Browse the marketplace to find and claim reviews you'd like to work on.
        </p>
        <Button
          onClick={() => router.push("/browse")}
          className="bg-accent-blue hover:bg-accent-blue/90"
        >
          Browse Reviews
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => {
        if (!review.review_request) return null;

        const hoursRemaining = review.claim_deadline
          ? calculateHoursRemaining(review.claim_deadline)
          : 0;
        const urgency = getDeadlineUrgency(hoursRemaining);
        const config =
          contentTypeConfig[
            review.review_request.content_type as keyof typeof contentTypeConfig
          ] || contentTypeConfig.design;

        const urgencyConfig = {
          danger: {
            badge: "error" as const,
            border: "border-red-500/30",
            icon: <AlertCircle className="size-4" />,
            text: "text-red-600",
          },
          warning: {
            badge: "warning" as const,
            border: "border-amber-500/30",
            icon: <Clock className="size-4" />,
            text: "text-amber-600",
          },
          safe: {
            badge: "success" as const,
            border: "border-green-500/30",
            icon: <Clock className="size-4" />,
            text: "text-green-600",
          },
        };

        const urgencyStyle = urgencyConfig[urgency];

        return (
          <div
            key={review.id}
            className={cn(
              "group rounded-2xl border bg-card p-4 sm:p-5",
              "shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]",
              "hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)]",
              "transition-all duration-200",
              urgencyStyle.border
            )}
          >
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              {/* Content type icon */}
              <div
                className={cn(
                  "size-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  config.bg
                )}
              >
                <div className={config.color}>{config.icon}</div>
              </div>

              {/* Title and meta */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground text-sm sm:text-base line-clamp-1">
                  {review.review_request.title}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-0.5">
                  {review.review_request.description}
                </p>
              </div>

              {/* Payment badge */}
              <Badge variant="primary" size="sm" className="flex-shrink-0">
                {formatPayment(review.payment_amount)}
              </Badge>
            </div>

            {/* Deadline indicator */}
            <div
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg mb-3",
                urgency === "danger" && "bg-red-50 border border-red-200/50",
                urgency === "warning" &&
                  "bg-amber-50 border border-amber-200/50",
                urgency === "safe" && "bg-green-50 border border-green-200/50"
              )}
            >
              <div className={urgencyStyle.text}>{urgencyStyle.icon}</div>
              <div className="flex-1">
                <p className={cn("text-sm font-medium", urgencyStyle.text)}>
                  {hoursRemaining < 1
                    ? "Deadline passed"
                    : hoursRemaining < 24
                      ? `${hoursRemaining} hour${hoursRemaining !== 1 ? "s" : ""} remaining`
                      : `${Math.floor(hoursRemaining / 24)} day${Math.floor(hoursRemaining / 24) !== 1 ? "s" : ""} remaining`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Claimed{" "}
                  {review.claimed_at
                    ? new Date(review.claimed_at).toLocaleDateString()
                    : "recently"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1 bg-accent-blue hover:bg-accent-blue/90 min-h-[44px]"
                onClick={() =>
                  router.push(`/reviewer/review/${review.id}`)
                }
              >
                <FileEdit className="size-4" />
                Continue Review
                <ChevronRight className="size-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 text-red-600 hover:bg-red-50 hover:border-red-300 min-h-[44px]"
                onClick={() => handleAbandon(review.id)}
                disabled={abandoningId === review.id}
              >
                <XCircle className="size-4" />
                {abandoningId === review.id ? "..." : "Abandon"}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
