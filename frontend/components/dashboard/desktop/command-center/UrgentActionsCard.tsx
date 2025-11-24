"use client";

/**
 * Urgent Actions Card Component
 *
 * Floating card that surfaces time-critical items requiring immediate attention.
 * Appears at top of dashboard when urgent items exist.
 *
 * Trigger Conditions:
 * - Creator: Reviews with < 24h until auto-accept
 * - Reviewer: Claims with < 24h until deadline
 * - CRITICAL or HIGH urgency level items
 *
 * Features:
 * - Prominent positioning (floats at top)
 * - Countdown timer
 * - Inline action buttons
 * - Collapsible/dismissible
 * - Pulsing glow animation
 *
 * Brand Compliance:
 * - Red/orange gradient for urgency
 * - Smooth animations
 * - Accessible keyboard navigation
 * - WCAG AA contrast
 *
 * @module UrgentActionsCard
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface UrgentAction {
  id: string;
  type: "review_submitted" | "claim_deadline" | "auto_accept_soon";
  title: string;
  description: string;
  deadline: string; // ISO string
  urgencyLevel: "CRITICAL" | "HIGH";
  actions: {
    primary: {
      label: string;
      action: () => void;
    };
    secondary?: {
      label: string;
      action: () => void;
    };
    view: {
      label: string;
      action: () => void;
    };
  };
}

export interface UrgentActionsCardProps {
  /**
   * Array of urgent action items
   */
  actions: UrgentAction[];

  /**
   * Current role (creator or reviewer)
   */
  role: "creator" | "reviewer";

  /**
   * Callback when card is dismissed
   */
  onDismiss?: () => void;

  /**
   * Optional className
   */
  className?: string;
}

/**
 * Calculate time remaining until deadline
 */
function useTimeRemaining(deadline: string) {
  const [timeRemaining, setTimeRemaining] = React.useState(() =>
    calculateTimeRemaining(deadline)
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(deadline));
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  return timeRemaining;
}

function calculateTimeRemaining(deadline: string): {
  hours: number;
  minutes: number;
  seconds: number;
  text: string;
  isExpired: boolean;
} {
  const now = Date.now();
  const deadlineTime = new Date(deadline).getTime();
  const diff = deadlineTime - now;

  if (diff <= 0) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      text: "Expired",
      isExpired: true,
    };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  let text: string;
  if (hours > 0) {
    text = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    text = `${minutes}m ${seconds}s`;
  } else {
    text = `${seconds}s`;
  }

  return { hours, minutes, seconds, text, isExpired: false };
}

/**
 * Urgent Actions Card Component
 *
 * Displays time-critical items at top of dashboard with prominent styling.
 */
export function UrgentActionsCard({
  actions,
  role,
  onDismiss,
  className,
}: UrgentActionsCardProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Don't render if no actions or dismissed
  if (actions.length === 0 || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const criticalCount = actions.filter((a) => a.urgencyLevel === "CRITICAL")
    .length;
  const highCount = actions.filter((a) => a.urgencyLevel === "HIGH").length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        transition={{
          type: "spring",
          damping: 25,
          stiffness: 300,
        }}
        className={cn("mb-6", className)}
      >
        <div
          className={cn(
            "relative",
            "rounded-2xl",
            "border-2",
            "overflow-hidden",
            criticalCount > 0
              ? "border-red-500/50 bg-gradient-to-br from-red-50 via-orange-50 to-red-50 dark:from-red-950/20 dark:via-orange-950/20 dark:to-red-950/20"
              : "border-orange-500/50 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-orange-950/20"
          )}
        >
          {/* Pulsing glow effect */}
          <div
            className={cn(
              "absolute inset-0",
              "opacity-50",
              "animate-pulse",
              criticalCount > 0
                ? "bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20"
                : "bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20"
            )}
            style={{
              animationDuration: "2s",
            }}
            aria-hidden="true"
          />

          {/* Header */}
          <div className="relative flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "size-10 rounded-xl flex items-center justify-center",
                  criticalCount > 0
                    ? "bg-red-500/20 text-red-700 dark:text-red-400"
                    : "bg-orange-500/20 text-orange-700 dark:text-orange-400"
                )}
              >
                <AlertCircle className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  Urgent Actions Required
                  <Badge
                    variant={criticalCount > 0 ? "error" : "warning"}
                    size="sm"
                  >
                    {actions.length} {actions.length === 1 ? "item" : "items"}
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {criticalCount > 0 && `${criticalCount} critical`}
                  {criticalCount > 0 && highCount > 0 && ", "}
                  {highCount > 0 && `${highCount} high priority`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="size-8 p-0"
                aria-label={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronUp className="size-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="size-8 p-0"
                aria-label="Dismiss"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* Actions List */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  {actions.map((action, index) => (
                    <UrgentActionItem
                      key={action.id}
                      action={action}
                      index={index}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Individual Urgent Action Item
 */
function UrgentActionItem({
  action,
  index,
}: {
  action: UrgentAction;
  index: number;
}) {
  const timeRemaining = useTimeRemaining(action.deadline);
  const isCritical = action.urgencyLevel === "CRITICAL";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.2,
        delay: index * 0.05,
      }}
      className={cn(
        "relative",
        "flex items-start gap-4",
        "p-4",
        "rounded-xl",
        "bg-background/80 backdrop-blur-sm",
        "border border-border/50",
        "shadow-sm",
        "hover:shadow-md",
        "transition-shadow"
      )}
    >
      {/* Urgency Indicator */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
          isCritical ? "bg-red-500" : "bg-orange-500"
        )}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="flex-1 min-w-0 pl-2">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground text-sm">
              {action.title}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {action.description}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Clock
              className={cn(
                "size-4",
                isCritical ? "text-red-600" : "text-orange-600"
              )}
            />
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
                isCritical ? "text-red-600" : "text-orange-600"
              )}
            >
              {timeRemaining.text}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={action.actions.primary.action}
            className={cn(
              "text-xs font-medium",
              isCritical
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-orange-600 hover:bg-orange-700 text-white"
            )}
          >
            <CheckCircle2 className="size-3.5 mr-1.5" />
            {action.actions.primary.label}
          </Button>

          {action.actions.secondary && (
            <Button
              size="sm"
              variant="outline"
              onClick={action.actions.secondary.action}
              className="text-xs font-medium"
            >
              <XCircle className="size-3.5 mr-1.5" />
              {action.actions.secondary.label}
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={action.actions.view.action}
            className="text-xs font-medium"
          >
            <Eye className="size-3.5 mr-1.5" />
            {action.actions.view.label}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
