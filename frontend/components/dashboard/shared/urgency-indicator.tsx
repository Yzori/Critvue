"use client";

/**
 * Urgency Indicator Component
 *
 * Extracted shared urgency calculation and display logic used across dashboard components.
 * Provides consistent urgency levels, colors, and messaging throughout the application.
 *
 * @module dashboard/shared/urgency-indicator
 */

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Zap, CheckCircle2 } from "lucide-react";

export type UrgencyLevel = "critical" | "urgent" | "soon" | "normal";

export interface UrgencyData {
  hours: number;
  minutes: number;
  level: UrgencyLevel;
  label: string;
  isExpired: boolean;
}

/**
 * Calculate urgency data from a deadline
 */
export function calculateUrgency(deadline: string): UrgencyData {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const msRemaining = Math.max(0, deadlineDate.getTime() - now.getTime());

  const hours = Math.floor(msRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));

  let level: UrgencyLevel;
  let label: string;
  const isExpired = msRemaining === 0;

  if (isExpired) {
    level = "critical";
    label = "Expired";
  } else if (hours < 6) {
    level = "critical";
    label = `${hours}h ${minutes}m`;
  } else if (hours < 24) {
    level = "urgent";
    label = `${hours} hour${hours !== 1 ? "s" : ""}`;
  } else if (hours < 72) {
    level = "soon";
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    label = remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} day${days !== 1 ? "s" : ""}`;
  } else {
    level = "normal";
    const days = Math.floor(hours / 24);
    label = `${days} day${days !== 1 ? "s" : ""}`;
  }

  return { hours, minutes, level, label, isExpired };
}

/**
 * Get urgency configuration (colors, icons, etc.)
 */
export function getUrgencyConfig(level: UrgencyLevel) {
  const configs = {
    critical: {
      badge: "error" as const,
      text: "text-red-700",
      bg: "bg-red-50",
      border: "border-red-500",
      icon: <Zap className="size-4" />,
    },
    urgent: {
      badge: "warning" as const,
      text: "text-orange-700",
      bg: "bg-orange-50",
      border: "border-orange-500",
      icon: <AlertTriangle className="size-4" />,
    },
    soon: {
      badge: "warning" as const,
      text: "text-yellow-700",
      bg: "bg-yellow-50",
      border: "border-yellow-500",
      icon: <Clock className="size-4" />,
    },
    normal: {
      badge: "success" as const,
      text: "text-green-700",
      bg: "bg-green-50",
      border: "border-green-500",
      icon: <CheckCircle2 className="size-4" />,
    },
  };

  return configs[level];
}

export interface UrgencyIndicatorProps {
  level: UrgencyLevel;
  label?: string;
  showIcon?: boolean;
  showDot?: boolean;
  pulse?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Urgency Indicator Badge Component
 *
 * Displays urgency level with consistent styling
 */
export function UrgencyIndicator({
  level,
  label,
  showIcon = true,
  showDot,
  pulse,
  size = "md",
  className,
}: UrgencyIndicatorProps) {
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
      size={size}
      showDot={showDot ?? (level === "critical")}
      pulse={pulse ?? (level === "critical" || level === "urgent")}
      icon={showIcon ? config.icon : undefined}
      className={className}
    >
      {label || defaultLabels[level]}
    </Badge>
  );
}
