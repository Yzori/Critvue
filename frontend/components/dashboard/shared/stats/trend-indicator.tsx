"use client";

/**
 * Trend Indicator Component
 *
 * Visual trend indicators with arrows and sparklines.
 * Shows data trends and changes over time.
 *
 * @module dashboard/shared/stats/trend-indicator
 */

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface TrendIndicatorProps {
  value: number;
  label?: string;
  type?: "percentage" | "absolute" | "text";
  direction?: "up" | "down" | "neutral";
  showArrow?: boolean;
  variant?: "default" | "colored";
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Trend Indicator Component
 *
 * Displays trend direction and magnitude
 */
export function TrendIndicator({
  value,
  label,
  type = "percentage",
  direction,
  showArrow = true,
  variant = "default",
  size = "md",
  className,
}: TrendIndicatorProps) {
  // Auto-detect direction if not provided
  const trendDirection = direction || (value > 0 ? "up" : value < 0 ? "down" : "neutral");

  // Format value based on type
  const formattedValue =
    type === "percentage"
      ? `${Math.abs(value)}%`
      : type === "absolute"
      ? Math.abs(value).toString()
      : label || "";

  // Size classes
  const sizeClasses = {
    sm: "text-xs gap-0.5",
    md: "text-sm gap-1",
    lg: "text-base gap-1.5",
  };

  const iconSizes = {
    sm: "size-3",
    md: "size-3.5",
    lg: "size-4",
  };

  // Color classes
  const colorClasses =
    variant === "colored"
      ? {
          up: "text-green-700",
          down: "text-red-700",
          neutral: "text-muted-foreground",
        }
      : {
          up: "text-foreground",
          down: "text-foreground",
          neutral: "text-muted-foreground",
        };

  const IconComponent =
    trendDirection === "up"
      ? TrendingUp
      : trendDirection === "down"
      ? TrendingDown
      : Minus;

  return (
    <div
      className={cn(
        "inline-flex items-center font-medium",
        sizeClasses[size],
        colorClasses[trendDirection],
        className
      )}
    >
      {showArrow && <IconComponent className={iconSizes[size]} />}
      <span>{formattedValue}</span>
    </div>
  );
}

export interface SparklineProps {
  data: number[];
  height?: number;
  color?: string;
  className?: string;
}

/**
 * Mini Sparkline Component
 *
 * Simple line chart for trend visualization
 */
export function Sparkline({
  data,
  height = 24,
  color = "currentColor",
  className,
}: SparklineProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = ((max - value) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ height }}
      className={cn("w-full", className)}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
