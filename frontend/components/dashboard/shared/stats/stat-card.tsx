"use client";

/**
 * Stat Card Component
 *
 * Dashboard-styled wrapper around the base StatCard component.
 * Provides consistent statistics display across dashboard views.
 *
 * @module dashboard/shared/stats/stat-card
 */

import { StatCard as BaseStatCard } from "@/components/ui/stat-card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  description?: string;
  loading?: boolean;
  variant?: "default" | "gradient" | "outlined";
  className?: string;
}

/**
 * Dashboard Stat Card
 *
 * Enhanced stat card with dashboard-specific styling
 */
export function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  description,
  loading = false,
  variant = "default",
  className,
}: StatCardProps) {
  if (loading) {
    return (
      <div className={cn(
        "rounded-2xl border border-border bg-card p-6 space-y-3 animate-pulse",
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="size-8 bg-muted rounded-lg" />
        </div>
        <div className="h-8 w-32 bg-muted rounded" />
        <div className="h-3 w-20 bg-muted rounded" />
      </div>
    );
  }

  return (
    <BaseStatCard
      title={title}
      value={value}
      change={change}
      changeType={changeType}
      icon={Icon}
      description={description}
      className={cn(
        variant === "gradient" && "bg-gradient-to-br from-accent-blue/5 to-accent-peach/5",
        variant === "outlined" && "border-2",
        className
      )}
    />
  );
}
