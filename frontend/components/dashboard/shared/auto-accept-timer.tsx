/**
 * AutoAcceptTimer Component
 * Displays countdown timer for pending review auto-acceptance
 *
 * Three urgency states:
 * - Normal (>72h): Blue, calm "Please review by [date]"
 * - Warning (24-72h): Amber, "Review soon - auto-accepts in X days"
 * - Urgent (<24h): Red pulsing, "URGENT: Auto-accepts in X hours!"
 *
 * Features:
 * - Live countdown updates every minute
 * - Brand-compliant colors for each urgency level
 * - Smooth animations and transitions
 * - Accessible with clear messaging
 */

"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle } from "lucide-react";

export interface AutoAcceptTimerProps {
  autoAcceptAt: string; // ISO datetime string
  className?: string;
  compact?: boolean; // Compact mode for smaller displays
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  totalSeconds: number;
  urgency: "normal" | "warning" | "urgent";
  isExpired: boolean;
}

/**
 * Calculate time remaining and urgency level
 */
function calculateTimeRemaining(autoAcceptAt: string): TimeRemaining {
  const now = new Date();
  const target = new Date(autoAcceptAt);
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      totalSeconds: 0,
      urgency: "urgent",
      isExpired: true,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  // Determine urgency level
  let urgency: "normal" | "warning" | "urgent";
  if (totalSeconds < 86400) {
    // < 24 hours
    urgency = "urgent";
  } else if (totalSeconds < 259200) {
    // < 72 hours (3 days)
    urgency = "warning";
  } else {
    urgency = "normal";
  }

  return {
    days,
    hours,
    minutes,
    totalSeconds,
    urgency,
    isExpired: false,
  };
}

/**
 * Format time remaining as readable string
 */
function formatTimeRemaining(time: TimeRemaining): string {
  if (time.isExpired) {
    return "Auto-accepted";
  }

  if (time.days > 0) {
    return `${time.days} day${time.days === 1 ? "" : "s"} ${time.hours} hour${
      time.hours === 1 ? "" : "s"
    }`;
  } else if (time.hours > 0) {
    return `${time.hours} hour${time.hours === 1 ? "" : "s"} ${time.minutes} minute${
      time.minutes === 1 ? "" : "s"
    }`;
  } else {
    return `${time.minutes} minute${time.minutes === 1 ? "" : "s"}`;
  }
}

/**
 * Get message based on urgency level
 */
function getUrgencyMessage(urgency: "normal" | "warning" | "urgent", isExpired: boolean): string {
  if (isExpired) {
    return "This review has been automatically accepted";
  }

  switch (urgency) {
    case "urgent":
      return "URGENT: Auto-accepts in";
    case "warning":
      return "Review soon - auto-accepts in";
    case "normal":
      return "Please review by";
  }
}

export function AutoAcceptTimer({
  autoAcceptAt,
  className,
  compact = false,
}: AutoAcceptTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
    calculateTimeRemaining(autoAcceptAt)
  );

  // Update timer every minute
  useEffect(() => {
    const updateTimer = () => {
      setTimeRemaining(calculateTimeRemaining(autoAcceptAt));
    };

    // Initial update
    updateTimer();

    // Update every minute (60000ms)
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [autoAcceptAt]);

  // Don't render if expired
  if (timeRemaining.isExpired) {
    return (
      <div
        className={cn(
          "rounded-lg border border-muted bg-muted/30 px-3 py-2",
          "flex items-center gap-2 text-sm text-muted-foreground",
          className
        )}
      >
        <Clock className="size-4" />
        <span>Auto-accepted</span>
      </div>
    );
  }

  // Render based on urgency and compact mode
  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold transition-all duration-300",
          timeRemaining.urgency === "urgent" &&
            "bg-red-500/10 text-red-600 animate-pulse",
          timeRemaining.urgency === "warning" &&
            "bg-amber-500/10 text-amber-600",
          timeRemaining.urgency === "normal" &&
            "bg-blue-500/10 text-blue-600",
          className
        )}
      >
        <Clock className="size-3" />
        <span>{formatTimeRemaining(timeRemaining)}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border-2 transition-all duration-300",
        timeRemaining.urgency === "urgent" &&
          "border-red-500/30 bg-gradient-to-br from-red-500/5 to-red-600/5 shadow-[0_0_12px_rgba(239,68,68,0.1)] animate-pulse",
        timeRemaining.urgency === "warning" &&
          "border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-600/5",
        timeRemaining.urgency === "normal" &&
          "border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-blue-600/5",
        className
      )}
    >
      <div className="p-4 space-y-3">
        {/* Icon and Message */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "size-10 rounded-full flex items-center justify-center flex-shrink-0",
              timeRemaining.urgency === "urgent" && "bg-red-500/10",
              timeRemaining.urgency === "warning" && "bg-amber-500/10",
              timeRemaining.urgency === "normal" && "bg-blue-500/10"
            )}
          >
            {timeRemaining.urgency === "urgent" ? (
              <AlertTriangle className="size-5 text-red-600" />
            ) : (
              <Clock
                className={cn(
                  "size-5",
                  timeRemaining.urgency === "warning" && "text-amber-600",
                  timeRemaining.urgency === "normal" && "text-blue-600"
                )}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div
              className={cn(
                "text-xs font-medium mb-1",
                timeRemaining.urgency === "urgent" && "text-red-600",
                timeRemaining.urgency === "warning" && "text-amber-600",
                timeRemaining.urgency === "normal" && "text-blue-600"
              )}
            >
              {getUrgencyMessage(timeRemaining.urgency, timeRemaining.isExpired)}
            </div>

            <div
              className={cn(
                "text-xl sm:text-2xl font-bold",
                timeRemaining.urgency === "urgent" && "text-red-600",
                timeRemaining.urgency === "warning" && "text-amber-600",
                timeRemaining.urgency === "normal" && "text-blue-600"
              )}
            >
              {formatTimeRemaining(timeRemaining)}
            </div>
          </div>
        </div>

        {/* Detailed Date */}
        <div className="text-xs text-muted-foreground border-t border-current/10 pt-2">
          {timeRemaining.urgency === "urgent"
            ? "You must accept or reject this review soon, or it will be automatically accepted."
            : timeRemaining.urgency === "warning"
            ? "Please review this submission within the next few days."
            : `Auto-accept date: ${new Date(autoAcceptAt).toLocaleDateString(
                undefined,
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }
              )}`}
        </div>
      </div>
    </div>
  );
}
