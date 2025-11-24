"use client";

/**
 * Empty State Component
 *
 * Generic empty state display for dashboard sections with no data.
 * Provides consistent messaging and calls-to-action.
 *
 * @module dashboard/shared/empty-state
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
  };
  className?: string;
}

/**
 * Empty State Component
 *
 * Displays when a dashboard section has no data to show
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12",
        "rounded-2xl border-2 border-dashed border-border bg-muted/30",
        "min-h-[300px]",
        className
      )}
    >
      {Icon && (
        <div className="size-16 sm:size-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Icon className="size-8 sm:size-10 text-muted-foreground" />
        </div>
      )}

      <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>

      <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-6">
        {description}
      </p>

      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || "default"}
          size="lg"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
