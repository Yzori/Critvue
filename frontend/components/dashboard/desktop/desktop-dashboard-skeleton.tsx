/**
 * Desktop Dashboard Loading Skeleton
 *
 * Brand-compliant loading skeleton for desktop dashboard
 * Shows three-panel layout with animated pulse effect
 *
 * Brand Compliance:
 * - Uses bg-muted for skeleton elements
 * - Smooth pulse animation
 * - Matches desktop layout structure
 * - Respects reduced motion preferences
 *
 * @module DesktopDashboardSkeleton
 */

import { cn } from "@/lib/utils";

export function DesktopDashboardSkeleton() {
  return (
    <div className="grid grid-cols-[280px,1fr,320px] min-h-screen">
      {/* Left Panel Skeleton */}
      <aside className="border-r border-border bg-background p-6 space-y-6 animate-pulse">
        {/* Role switcher skeleton */}
        <div className="h-[56px] bg-muted rounded-xl" />

        {/* Navigation items skeleton */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-12 bg-muted rounded-xl" />
          ))}
        </div>

        {/* Quick stats skeleton */}
        <div className="h-32 bg-muted rounded-xl" />

        {/* Tier progress skeleton */}
        <div className="h-40 bg-muted rounded-xl" />
      </aside>

      {/* Center Panel Skeleton */}
      <main className="p-8 space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="space-y-4 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-muted rounded-lg" />
              <div className="h-4 w-96 bg-muted rounded-lg" />
            </div>
            <div className="h-9 w-20 bg-muted rounded-lg" />
          </div>

          {/* Tabs skeleton */}
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-11 w-32 bg-muted rounded-lg" />
            ))}
          </div>

          {/* Filter bar skeleton */}
          <div className="h-10 w-full max-w-md bg-muted rounded-lg" />
        </div>

        {/* Content skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-xl" />
          ))}
        </div>
      </main>

      {/* Right Panel Skeleton */}
      <aside className="border-l border-border bg-background p-6 space-y-6 animate-pulse">
        {/* Quick actions skeleton */}
        <div className="space-y-2">
          <div className="h-14 bg-muted rounded-xl" />
          <div className="h-14 bg-muted rounded-xl" />
        </div>

        {/* Stats skeleton */}
        <div className="h-48 bg-muted rounded-xl" />

        {/* Notifications skeleton */}
        <div className="h-64 bg-muted rounded-xl" />

        {/* Activity timeline skeleton */}
        <div className="h-72 bg-muted rounded-xl" />
      </aside>
    </div>
  );
}

/**
 * Simplified Desktop Dashboard Skeleton for smaller screens
 * Shows two-panel layout (left + center)
 */
export function DesktopDashboardSkeletonCompact() {
  return (
    <div className="grid grid-cols-[240px,1fr] min-h-screen">
      {/* Left Panel Skeleton */}
      <aside className="border-r border-border bg-background p-6 space-y-6 animate-pulse">
        <div className="h-[56px] bg-muted rounded-xl" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="h-32 bg-muted rounded-xl" />
      </aside>

      {/* Center Panel Skeleton */}
      <main className="p-6 space-y-6 animate-pulse">
        <div className="space-y-4 pb-4 border-b border-border">
          <div className="h-8 w-64 bg-muted rounded-lg" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-11 w-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-xl" />
          ))}
        </div>
      </main>
    </div>
  );
}
