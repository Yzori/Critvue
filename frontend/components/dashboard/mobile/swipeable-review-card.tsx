"use client";

/**
 * Swipeable Review Card Component
 *
 * Mobile-first card with horizontal swipe gestures for quick actions
 *
 * Features:
 * - Swipe left to reveal accept/reject actions (creator mode)
 * - Swipe right to reveal continue/view actions (reviewer mode)
 * - Visual feedback with color coding
 * - Haptic feedback simulation
 * - 48px minimum touch targets
 * - Urgency indicators with color coding
 * - Progressive disclosure pattern
 *
 * Urgency Color Coding:
 * - Red: <24h until auto-accept (urgent)
 * - Yellow: 24h-3d until auto-accept (soon)
 * - Green: >3d until auto-accept (plenty of time)
 */

import * as React from "react";
import { motion, PanInfo, useMotionValue, useTransform, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Star,
  User,
  ArrowRight,
  AlertTriangle,
  Zap,
  TrendingUp,
  DollarSign,
} from "lucide-react";

export type SwipeDirection = "left" | "right" | null;
export type UrgencyLevel = "urgent" | "soon" | "normal";

interface BaseReviewCardProps {
  id: number | string;
  title: string;
  description?: string;
  contentType: string;
  onSwipe?: (direction: SwipeDirection) => void;
  onClick?: () => void;
  className?: string;
}

// Creator Mode Props (Actions Needed)
export interface CreatorReviewCardProps extends BaseReviewCardProps {
  mode: "creator";
  autoAcceptDeadline?: string; // ISO date string
  reviewerName?: string;
  reviewerRating?: number;
  reviewerCount?: number;
  reviewPreview?: string;
  onAccept?: () => void;
  onReject?: () => void;
  onViewFull?: () => void;
}

// Reviewer Mode Props (Active/Submitted)
export interface ReviewerReviewCardProps extends BaseReviewCardProps {
  mode: "reviewer";
  status: "active" | "submitted" | "completed";
  deadline?: string;
  progress?: number; // 0-100 for active reviews
  earnings?: { karma?: number; payment?: number };
  onContinue?: () => void;
  onView?: () => void;
}

export type SwipeableReviewCardProps = CreatorReviewCardProps | ReviewerReviewCardProps;

export function SwipeableReviewCard(props: SwipeableReviewCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const [isRevealed, setIsRevealed] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Calculate urgency for creator mode
  const getUrgency = (deadline?: string): { level: UrgencyLevel; hours: number; label: string } => {
    if (!deadline) return { level: "normal", hours: 9999, label: "No deadline" };

    const now = new Date();
    const deadlineDate = new Date(deadline);
    const hoursRemaining = Math.max(0, (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (hoursRemaining < 24) {
      return { level: "urgent", hours: hoursRemaining, label: `${Math.floor(hoursRemaining)}h left` };
    } else if (hoursRemaining < 72) {
      const daysRemaining = Math.floor(hoursRemaining / 24);
      return { level: "soon", hours: hoursRemaining, label: `${daysRemaining}d left` };
    } else {
      const daysRemaining = Math.floor(hoursRemaining / 24);
      return { level: "normal", hours: hoursRemaining, label: `${daysRemaining}d left` };
    }
  };

  const urgency = props.mode === "creator" && props.autoAcceptDeadline
    ? getUrgency(props.autoAcceptDeadline)
    : null;

  // Color coding based on urgency
  const urgencyColors = {
    urgent: {
      border: "border-red-500/50",
      bg: "bg-red-50",
      text: "text-red-700",
      badgeVariant: "error" as const,
      icon: <Zap className="size-3.5" />,
    },
    soon: {
      border: "border-yellow-500/50",
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      badgeVariant: "warning" as const,
      icon: <AlertTriangle className="size-3.5" />,
    },
    normal: {
      border: "border-green-500/50",
      bg: "bg-green-50",
      text: "text-green-700",
      badgeVariant: "success" as const,
      icon: <Clock className="size-3.5" />,
    },
  };

  const urgencyColor = urgency ? urgencyColors[urgency.level] : urgencyColors.normal;

  // Transform for background color change during swipe
  const backgroundColor = useTransform(
    x,
    [-150, -50, 0, 50, 150],
    [
      "rgb(239 68 68 / 0.1)", // red
      "rgb(239 68 68 / 0.05)",
      "transparent",
      "rgb(34 197 94 / 0.05)",
      "rgb(34 197 94 / 0.1)", // green
    ]
  );

  // Handle drag end
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    const velocity = Math.abs(info.velocity.x);
    const offset = info.offset.x;

    // High velocity swipe or sufficient offset
    if (velocity > 500 || Math.abs(offset) > threshold) {
      if (offset < 0) {
        // Swiped left
        setIsRevealed(true);
        if (props.mode === "creator") {
          props.onSwipe?.("left");
        }
      } else {
        // Swiped right
        if (props.mode === "creator") {
          props.onSwipe?.("right");
        }
      }
    } else {
      // Snap back
      setIsRevealed(false);
    }
  };

  // Reset revealed state
  const handleReset = () => {
    setIsRevealed(false);
    x.set(0);
  };

  return (
    <div className="relative touch-pan-y">
      {/* Action Buttons Background - Left Swipe (Accept/Reject for Creator) */}
      {props.mode === "creator" && isRevealed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-end gap-2 pr-4 rounded-2xl overflow-hidden"
        >
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              props.onReject?.();
              handleReset();
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold min-h-[48px] min-w-[100px] shadow-lg active:scale-95 transition-transform"
            whileTap={{ scale: 0.95 }}
          >
            <XCircle className="size-5" />
            <span>Reject</span>
          </motion.button>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              props.onAccept?.();
              handleReset();
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold min-h-[48px] min-w-[100px] shadow-lg active:scale-95 transition-transform"
            whileTap={{ scale: 0.95 }}
          >
            <CheckCircle2 className="size-5" />
            <span>Accept</span>
          </motion.button>
        </motion.div>
      )}

      {/* Card */}
      <motion.div
        ref={cardRef}
        drag={prefersReducedMotion ? false : "x"}
        dragConstraints={{ left: -200, right: 50 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x, backgroundColor }}
        className={cn(
          "relative rounded-2xl border-2 bg-card shadow-md overflow-hidden",
          "cursor-grab active:cursor-grabbing",
          "transition-shadow duration-200",
          urgency && urgencyColor.border,
          props.className
        )}
        whileTap={{ scale: 0.98 }}
      >
        {/* Urgency Banner - Top of card */}
        {props.mode === "creator" && urgency && urgency.level !== "normal" && (
          <div className={cn(
            "px-4 py-2 flex items-center justify-between border-b-2",
            urgency.level === "urgent" ? "bg-red-500 text-white border-red-600" : "bg-yellow-400 text-yellow-900 border-yellow-500"
          )}>
            <div className="flex items-center gap-2 font-semibold text-sm">
              {urgencyColor.icon}
              <span>{urgency.level === "urgent" ? "URGENT" : "ACTION NEEDED SOON"}</span>
            </div>
            <span className="text-sm font-bold">
              {urgency.label}
            </span>
          </div>
        )}

        {/* Card Content */}
        <div className="p-4 sm:p-5" onClick={props.onClick}>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base sm:text-lg text-foreground line-clamp-2 mb-1">
                {props.title}
              </h3>
              <Badge variant="secondary" size="sm" className="mt-1">
                {props.contentType}
              </Badge>
            </div>

            {/* Status badge for reviewer mode */}
            {props.mode === "reviewer" && (
              <Badge
                variant={
                  props.status === "completed" ? "success" :
                  props.status === "submitted" ? "info" : "warning"
                }
                size="sm"
              >
                {props.status.charAt(0).toUpperCase() + props.status.slice(1)}
              </Badge>
            )}
          </div>

          {/* Creator Mode - Reviewer Info */}
          {props.mode === "creator" && (
            <div className="space-y-3">
              {/* Reviewer Details */}
              {props.reviewerName && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <User className="size-4" />
                    <span className="font-medium">{props.reviewerName}</span>
                  </div>
                  {props.reviewerRating && (
                    <div className="flex items-center gap-1">
                      <Star className="size-4 fill-amber-500 text-amber-500" />
                      <span className="font-semibold text-foreground">
                        {props.reviewerRating.toFixed(1)}
                      </span>
                      {props.reviewerCount && (
                        <span className="text-muted-foreground text-xs">
                          ({props.reviewerCount})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Review Preview */}
              {props.reviewPreview && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {props.reviewPreview}
                </p>
              )}

              {/* Deadline (if not urgent) */}
              {urgency && urgency.level === "normal" && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  <span>Auto-accepts in {urgency.label}</span>
                </div>
              )}
            </div>
          )}

          {/* Reviewer Mode - Progress & Earnings */}
          {props.mode === "reviewer" && (
            <div className="space-y-3">
              {/* Description */}
              {props.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {props.description}
                </p>
              )}

              {/* Progress Bar for Active Reviews */}
              {props.status === "active" && props.progress !== undefined && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Draft Progress</span>
                    <span className="text-foreground font-semibold">{props.progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-blue rounded-full transition-all duration-500"
                      style={{ width: `${props.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Deadline */}
              {props.deadline && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  <span>Due {new Date(props.deadline).toLocaleDateString()}</span>
                </div>
              )}

              {/* Earnings */}
              {props.earnings && (
                <div className="flex items-center gap-3 text-sm">
                  {props.earnings.payment && (
                    <div className="flex items-center gap-1.5 text-green-600 font-semibold">
                      <DollarSign className="size-4" />
                      <span>${props.earnings.payment.toFixed(2)}</span>
                    </div>
                  )}
                  {props.earnings.karma && (
                    <div className="flex items-center gap-1.5 text-accent-blue font-semibold">
                      <TrendingUp className="size-4" />
                      <span>{props.earnings.karma} karma</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Hint */}
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {props.mode === "creator" ? "Swipe left for actions" : "Tap to view details"}
            </span>
            <ArrowRight className="size-4 text-muted-foreground" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
