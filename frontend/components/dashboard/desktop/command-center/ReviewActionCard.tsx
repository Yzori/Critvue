"use client";

/**
 * Review Action Card Component
 *
 * Compact, actionable review item for Kanban board columns.
 * Displays key information and inline actions.
 *
 * Features:
 * - Content type icon + title
 * - Status badge + urgency indicator
 * - Key metadata (time, progress, earnings)
 * - Inline action buttons
 * - Hover elevation effect
 * - Keyboard navigation support
 *
 * Brand Compliance:
 * - Critvue brand colors
 * - Smooth animations (scale, shadow)
 * - WCAG AA accessible
 * - Color-coded urgency borders
 *
 * @module ReviewActionCard
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Code,
  Video,
  Mic,
  Image as ImageIcon,
  Palette,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  Eye,
  Users,
  TrendingUp,
  Cast,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ReviewActionCardProps {
  /**
   * Unique review identifier
   */
  id: string | number;

  /**
   * Review title
   */
  title: string;

  /**
   * Brief description
   */
  description?: string;

  /**
   * Content type
   */
  contentType: "design" | "code" | "video" | "stream" | "audio" | "writing" | "art";

  /**
   * Review status
   */
  status:
    | "pending"
    | "in_review"
    | "submitted"
    | "completed"
    | "available"
    | "claimed";

  /**
   * Urgency level
   */
  urgency?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE";

  /**
   * Time metadata (e.g., "2h ago", "Deadline: 5h")
   */
  timeText?: string;

  /**
   * Progress information (for multi-review requests)
   */
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };

  /**
   * Earnings potential (for reviewers)
   */
  earnings?: number;

  /**
   * Rating (for completed reviews)
   */
  rating?: number;

  /**
   * Primary action
   */
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: "default" | "success" | "error";
  };

  /**
   * Secondary action
   */
  secondaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };

  /**
   * View/navigate action
   */
  onView: () => void;

  /**
   * Optional className
   */
  className?: string;
}

// Content type configuration
const contentTypeConfig = {
  design: {
    icon: Palette,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
  },
  code: {
    icon: Code,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
  },
  video: {
    icon: Video,
    color: "text-purple-600",
    bg: "bg-purple-500/10",
  },
  stream: {
    icon: Cast,
    color: "text-purple-600",
    bg: "bg-purple-500/10",
  },
  audio: {
    icon: Mic,
    color: "text-pink-600",
    bg: "bg-pink-500/10",
  },
  writing: {
    icon: FileText,
    color: "text-green-600",
    bg: "bg-green-500/10",
  },
  art: {
    icon: ImageIcon,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
  },
};

// Status configuration
const statusConfig = {
  pending: { variant: "warning" as const, label: "Pending" },
  in_review: { variant: "info" as const, label: "In Review" },
  submitted: { variant: "info" as const, label: "Submitted" },
  completed: { variant: "success" as const, label: "Completed" },
  available: { variant: "secondary" as const, label: "Available" },
  claimed: { variant: "info" as const, label: "Claimed" },
};

// Urgency border colors
const urgencyBorderColors = {
  CRITICAL: "border-l-red-500",
  HIGH: "border-l-orange-500",
  MEDIUM: "border-l-amber-500",
  LOW: "border-l-green-500",
  NONE: "border-l-transparent",
};

/**
 * Review Action Card Component
 *
 * Displays review information with inline actions in a compact card format.
 */
export function ReviewActionCard({
  id,
  title,
  description,
  contentType,
  status,
  urgency = "NONE",
  timeText,
  progress,
  earnings,
  rating,
  primaryAction,
  secondaryAction,
  onView,
  className,
}: ReviewActionCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const contentConfig = contentTypeConfig[contentType as keyof typeof contentTypeConfig] || {
    icon: FileText,
    color: "text-slate-600",
    bg: "bg-slate-500/10",
  };
  const ContentIcon = contentConfig.icon;
  const statusInfo = statusConfig[status] || { variant: "secondary" as const, label: status };

  return (
    <motion.div
      layout
      layoutId={`review-${id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{
        scale: 1.02,
        y: -4,
      }}
      transition={{
        layout: { type: "spring", damping: 25, stiffness: 300 },
        default: { duration: 0.2 },
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "group",
        "relative",
        "rounded-xl",
        "border-l-[3px]",
        urgencyBorderColors[urgency],
        "border-t border-r border-b border-border",
        "bg-card",
        // Dark mode - use tier 3 for elevated cards
        "dark:bg-[var(--dark-tier-3)] dark:border-[rgba(255,255,255,0.06)]",
        "p-3",
        "cursor-pointer",
        "transition-all duration-200",
        isHovered || isFocused
          ? "shadow-md dark:shadow-lg dark:shadow-black/20"
          : "shadow-sm hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20",
        "focus-within:ring-2 focus-within:ring-accent-blue focus-within:ring-offset-2",
        className
      )}
      onClick={onView}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      tabIndex={0}
      role="button"
      aria-label={`Review: ${title}`}
    >
      {/* Header */}
      <div className="flex items-start gap-2.5 mb-2.5">
        {/* Content Type Icon */}
        <div
          className={cn(
            "size-8 rounded-lg flex items-center justify-center flex-shrink-0",
            "transition-transform duration-200",
            contentConfig.bg,
            isHovered && "scale-105"
          )}
        >
          <ContentIcon className={cn("size-4", contentConfig.color)} />
        </div>

        {/* Title & Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm text-foreground line-clamp-1">
              {title}
            </h4>
            <Badge variant={statusInfo.variant} size="sm" className="flex-shrink-0 text-[10px] h-5">
              {statusInfo.label}
            </Badge>
          </div>

          {description && (
            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-2.5 mb-2 text-[11px] text-muted-foreground">
        {timeText && (
          <div className="flex items-center gap-1">
            <Clock className="size-3" />
            <span>{timeText}</span>
          </div>
        )}

        {earnings !== undefined && (
          <div className="flex items-center gap-1 text-green-600">
            <DollarSign className="size-3" />
            <span className="font-medium">${earnings}</span>
          </div>
        )}

        {rating !== undefined && (
          <div className="flex items-center gap-1 text-amber-600">
            <TrendingUp className="size-3" />
            <span className="font-medium">{rating.toFixed(1)}★</span>
          </div>
        )}
      </div>

      {/* Progress Bar (for multi-review requests) */}
      {progress && (
        <div className="mb-2 space-y-0.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <Users className="size-3" />
              {progress.current} of {progress.total}
            </span>
            <span className="text-accent-blue font-semibold">
              {progress.percentage}%
            </span>
          </div>
          <div className="relative h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 bg-accent-blue rounded-full"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <AnimatePresence>
        {(isHovered || isFocused) && (primaryAction || secondaryAction) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 pt-2 border-t border-border/60"
            onClick={(e) => e.stopPropagation()}
          >
            {primaryAction && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  primaryAction.onClick();
                }}
                className={cn(
                  "flex-1 text-xs font-medium",
                  primaryAction.variant === "success" &&
                    "bg-green-600 hover:bg-green-700 text-white",
                  primaryAction.variant === "error" &&
                    "bg-red-600 hover:bg-red-700 text-white"
                )}
              >
                {primaryAction.icon || <CheckCircle2 className="size-3.5 mr-1.5" />}
                {primaryAction.label}
              </Button>
            )}

            {secondaryAction && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  secondaryAction.onClick();
                }}
                className="flex-1 text-xs font-medium"
              >
                {secondaryAction.icon || <XCircle className="size-3.5 mr-1.5" />}
                {secondaryAction.label}
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              className="text-xs font-medium px-3"
              aria-label="View details"
            >
              <Eye className="size-3.5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard navigation hint */}
      {isFocused && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-foreground text-background text-xs whitespace-nowrap">
          Press Enter to view
        </div>
      )}
    </motion.div>
  );
}
