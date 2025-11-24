"use client";

/**
 * Mini Stat Component
 *
 * Compact stat display for dashboard panels and sidebars.
 * Space-efficient alternative to full stat cards.
 *
 * @module dashboard/shared/stats/mini-stat
 */

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface MiniStatProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  iconColor?: string;
  className?: string;
}

/**
 * Mini Stat Component
 *
 * Compact stat display for tight spaces
 */
export function MiniStat({
  icon: Icon,
  label,
  value,
  trend,
  trendDirection = "neutral",
  iconColor,
  className,
}: MiniStatProps) {
  const trendColors = {
    up: "text-green-700",
    down: "text-red-700",
    neutral: "text-muted-foreground",
  };

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {Icon && (
          <div className={cn("flex-shrink-0", iconColor)}>
            <Icon className="size-4" />
          </div>
        )}
        <span className="text-sm text-muted-foreground truncate">{label}</span>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-sm font-semibold text-foreground">{value}</span>
        {trend && (
          <span className={cn("text-xs font-medium", trendColors[trendDirection])}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

export interface MiniStatListProps {
  stats: MiniStatProps[];
  className?: string;
}

/**
 * Mini Stat List
 *
 * Container for multiple mini stats with consistent spacing
 */
export function MiniStatList({ stats, className }: MiniStatListProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {stats.map((stat, index) => (
        <MiniStat key={index} {...stat} />
      ))}
    </div>
  );
}
