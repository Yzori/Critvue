"use client";

/**
 * Urgency Countdown Component
 *
 * Real-time countdown timer for auto-accept deadlines with visual urgency indicators.
 * Uses shared urgency utilities from dashboard/shared.
 *
 * Features:
 * - Live countdown updates every minute
 * - Color-coded urgency levels
 * - Animated pulse for urgent items
 * - Accessible time formatting
 * - Mobile-optimized display
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  calculateUrgency,
  getUrgencyConfig,
  type UrgencyLevel,
  type UrgencyData,
} from "../shared/urgency-indicator";

interface UrgencyCountdownProps {
  deadline: string; // ISO date string
  onExpire?: () => void;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "badge" | "inline" | "banner";
  className?: string;
}

export function UrgencyCountdown({
  deadline,
  onExpire,
  showIcon = true,
  size = "md",
  variant = "badge",
  className,
}: UrgencyCountdownProps) {
  const [timeRemaining, setTimeRemaining] = React.useState<UrgencyData | null>(null);

  // Calculate time remaining using shared utility
  const calculateTimeRemaining = React.useCallback(() => {
    const urgencyData = calculateUrgency(deadline);
    if (urgencyData.isExpired) {
      onExpire?.();
    }
    return urgencyData;
  }, [deadline, onExpire]);

  // Update countdown every minute
  React.useEffect(() => {
    setTimeRemaining(calculateTimeRemaining());

    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [calculateTimeRemaining]);

  if (!timeRemaining) return null;

  // Get urgency configuration from shared utility
  const config = getUrgencyConfig(timeRemaining.level);
  const icon = showIcon ? config.icon : null;

  // Badge variant
  if (variant === "badge") {
    return (
      <Badge
        variant={config.badge}
        size={size}
        showDot={timeRemaining.level === "critical"}
        pulse={timeRemaining.level === "critical" || timeRemaining.level === "urgent"}
        icon={icon}
        className={className}
      >
        {timeRemaining.label}
      </Badge>
    );
  }

  // Inline variant
  if (variant === "inline") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 text-sm font-medium",
          config.text,
          className
        )}
      >
        {icon}
        <span>{timeRemaining.label}</span>
      </div>
    );
  }

  // Banner variant
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 rounded-lg border-2",
        config.bg,
        config.border,
        timeRemaining.level === "critical" && "animate-pulse",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className={cn("font-semibold", config.text)}>
          {timeRemaining.level === "critical" ? "URGENT" : "Auto-accepts in"}
        </span>
      </div>
      <span className={cn("font-bold text-lg", config.text)}>
        {timeRemaining.label}
      </span>
    </div>
  );
}

/**
 * Urgency Badge Component
 *
 * Static urgency indicator for quick visual scanning.
 * Re-exported from shared utilities for backward compatibility.
 */
interface UrgencyBadgeProps {
  level: UrgencyLevel;
  label?: string;
  showIcon?: boolean;
  className?: string;
}

export function UrgencyBadge({
  level,
  label,
  showIcon = true,
  className,
}: UrgencyBadgeProps) {
  const config = getUrgencyConfig(level);

  const defaultLabels = {
    critical: "CRITICAL",
    urgent: "URGENT",
    soon: "SOON",
    normal: "ON TRACK",
  };

  return (
    <Badge
      variant={config.badge}
      showDot={level === "critical"}
      pulse={level === "critical" || level === "urgent"}
      icon={showIcon ? config.icon : undefined}
      className={className}
    >
      {label || defaultLabels[level]}
    </Badge>
  );
}
