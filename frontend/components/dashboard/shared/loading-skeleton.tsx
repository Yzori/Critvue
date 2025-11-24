"use client";

/**
 * Loading Skeleton Components
 *
 * Generic skeleton loaders for dashboard components.
 * Provides consistent loading states across the application.
 *
 * @module dashboard/shared/loading-skeleton
 */

import { cn } from "@/lib/utils";

export interface SkeletonProps {
  className?: string;
}

/**
 * Base Skeleton Component
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-muted rounded-lg",
        className
      )}
    />
  );
}

/**
 * Card Skeleton
 *
 * Loading state for review cards
 */
export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 space-y-4", className)}>
      <div className="flex items-start gap-3">
        <Skeleton className="size-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-20" />
      </div>
    </div>
  );
}

/**
 * Stat Card Skeleton
 *
 * Loading state for statistics cards
 */
export function StatCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

/**
 * List Skeleton
 *
 * Loading state for lists
 */
export function ListSkeleton({
  items = 3,
  className
}: SkeletonProps & { items?: number }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-border">
          <Skeleton className="size-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Dashboard Skeleton
 *
 * Full dashboard loading state
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="space-y-4">
          <StatCardSkeleton />
          <ListSkeleton items={5} />
        </div>
      </div>
    </div>
  );
}
