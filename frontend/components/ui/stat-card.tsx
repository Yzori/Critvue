"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Sparkline } from "./sparkline";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

/**
 * StatCard Component - Modern 2025 Dashboard Pattern
 *
 * Features:
 * - Enhanced visual hierarchy with tiered shadows
 * - Sparkline trend visualization
 * - Trend direction indicators
 * - Comparison metrics
 * - Sophisticated hover states (scale + shadow)
 * - Loading skeleton state with shimmer
 * - Full touch target compliance (min 44px)
 */

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Icon element to display
   */
  icon: React.ReactNode;
  /**
   * Label for the stat
   */
  label: string;
  /**
   * Main value to display
   */
  value: string | number;
  /**
   * Trend description (e.g., "+2 this week")
   */
  trend?: string;
  /**
   * Direction of trend: up, down, neutral
   */
  trendDirection?: "up" | "down" | "neutral";
  /**
   * Data array for sparkline visualization
   */
  trendData?: number[];
  /**
   * Comparison text (e.g., "vs. last week")
   */
  comparison?: string;
  /**
   * Background color for icon container
   */
  bgColor?: string;
  /**
   * Loading state
   */
  isLoading?: boolean;
  /**
   * Sparkline color
   */
  sparklineColor?: string;
  /**
   * Click handler for interactive cards
   */
  onClick?: () => void;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({
    icon,
    label,
    value,
    trend,
    trendDirection = "neutral",
    trendData,
    comparison,
    bgColor = "bg-accent-blue/10",
    isLoading = false,
    sparklineColor,
    onClick,
    className,
    ...props
  }, ref) => {
    // Determine sparkline color based on trend or custom color
    const getSparklineColor = () => {
      if (sparklineColor) return sparklineColor;

      switch (trendDirection) {
        case "up":
          return "#10B981"; // green-500
        case "down":
          return "#EF4444"; // red-500
        default:
          return "#4CC9F0"; // blue-500
      }
    };

    // Determine trend color
    const getTrendColor = () => {
      switch (trendDirection) {
        case "up":
          return "text-green-600";
        case "down":
          return "text-red-600";
        default:
          return "text-muted-foreground";
      }
    };

    // Render trend icon
    const TrendIcon = () => {
      const iconClass = "size-3";
      switch (trendDirection) {
        case "up":
          return <ArrowUp className={iconClass} />;
        case "down":
          return <ArrowDown className={iconClass} />;
        default:
          return <Minus className={iconClass} />;
      }
    };

    if (isLoading) {
      return (
        <div
          ref={ref}
          className={cn(
            "rounded-2xl border border-border bg-card p-6",
            "shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]",
            className
          )}
          {...props}
        >
          <div className="animate-pulse space-y-4">
            <div className="flex items-start justify-between">
              <div className={cn("size-10 rounded-xl bg-muted")} />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-8 bg-muted rounded w-16" />
              <div className="h-3 bg-muted rounded w-20" />
            </div>
            {trendData && (
              <div className="h-10 bg-muted rounded" />
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "group rounded-2xl bg-card p-3 sm:p-4 lg:p-6",
          // Light mode - subtle border
          "border border-border",
          // Light mode shadows
          "shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]",
          // Dark mode - tier 2 with light blue accent border
          "dark:bg-[var(--dark-tier-2)]",
          "dark:border-accent-blue/30 dark:shadow-accent-blue/5",
          "transition-all duration-200 ease-in-out",
          "hover:shadow-[0_8px_16px_rgba(0,0,0,0.08),0_4px_8px_rgba(0,0,0,0.04)]",
          "hover:-translate-y-0.5",
          // Dark mode hover - subtle blue glow
          "dark:hover:border-accent-blue/50 dark:hover:shadow-lg dark:hover:shadow-accent-blue/10",
          onClick && "cursor-pointer active:scale-[0.98]",
          className
        )}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        } : undefined}
        {...props}
      >
        {/* Mobile: horizontal icon + label, Desktop: vertical */}
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className="flex items-center sm:flex-col sm:items-start gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Icon with subtle glow in dark mode */}
            <div className="relative">
              {/* Glow effect - only visible in dark mode */}
              <div className={cn(
                "absolute inset-0 rounded-lg sm:rounded-xl blur-md opacity-0 dark:opacity-40 transition-opacity",
                bgColor
              )} />
              <div
                className={cn(
                  "relative size-8 sm:size-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 [&>svg]:size-4 [&>svg]:sm:size-5",
                  "transition-transform duration-200 group-hover:scale-110",
                  bgColor
                )}
              >
                {icon}
              </div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{label}</p>
          </div>
        </div>

        <div className="space-y-1 sm:space-y-2">
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight">{value}</p>

          {(trend || comparison) && (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {trend && (
                <span className={cn("inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-medium", getTrendColor())}>
                  <TrendIcon />
                  <span className="hidden sm:inline">{trend}</span>
                  <span className="sm:hidden">{trend.split(" ")[0]}</span>
                </span>
              )}
              {comparison && (
                <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">
                  {comparison}
                </span>
              )}
            </div>
          )}
        </div>

        {trendData && trendData.length > 0 && (
          <div className="mt-2 sm:mt-3 lg:mt-4 pt-2 sm:pt-3 lg:pt-4 border-t border-border-light">
            <Sparkline
              data={trendData}
              height={24}
              color={getSparklineColor()}
              strokeWidth={1.5}
              showGradient
              smooth
              className="sm:h-8"
            />
          </div>
        )}
      </div>
    );
  }
);

StatCard.displayName = "StatCard";

export { StatCard };
