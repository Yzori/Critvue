/**
 * Dashboard Loading Component
 * Displayed while dashboard content is loading (Suspense boundary)
 * Features:
 * - Animated skeleton screens
 * - Brand-consistent loading states
 * - Smooth transitions
 */

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
      {/* Welcome Section Skeleton */}
      <div className="space-y-3">
        <div className="h-10 bg-muted rounded-xl w-80 max-w-full" />
        <div className="h-6 bg-muted rounded-lg w-96 max-w-full" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="size-10 rounded-xl bg-muted" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-8 bg-muted rounded w-16" />
              <div className="h-3 bg-muted rounded w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Skeleton */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="h-7 bg-muted rounded-lg w-40" />
            <div className="size-5 bg-muted rounded" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-border bg-background min-h-[96px] space-y-3"
              >
                <div className="size-10 rounded-lg bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-28" />
                  <div className="h-3 bg-muted rounded w-36" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Account Info Skeleton */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-12 rounded-xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-muted rounded w-28" />
              <div className="h-3 bg-muted rounded w-24" />
            </div>
          </div>

          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-border-light last:border-0"
              >
                <div className="h-4 bg-muted rounded w-20" />
                <div className="h-4 bg-muted rounded w-32" />
              </div>
            ))}
          </div>

          <div className="h-11 bg-muted rounded-lg w-full mt-6" />
        </div>
      </div>

      {/* Recent Activity Skeleton */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="h-7 bg-muted rounded-lg w-48" />
          <div className="size-5 bg-muted rounded" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-xl">
              <div className="size-10 rounded-lg bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-40" />
                <div className="h-3 bg-muted rounded w-64 max-w-full" />
                <div className="h-3 bg-muted rounded w-24" />
              </div>
            </div>
          ))}
        </div>

        <div className="h-11 bg-muted rounded-lg w-full mt-6" />
      </div>
    </div>
  );
}
