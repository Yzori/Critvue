/**
 * Profile Page Skeleton Loaders
 * Brand-compliant loading states for profile sections
 */

import { cn } from "@/lib/utils";

/**
 * Skeleton Base Component
 * Animated shimmer effect using brand colors
 */
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded-lg",
        className
      )}
      style={{
        animation: "shimmer 2s infinite linear",
      }}
    />
  );
}

/**
 * Profile Hero Section Skeleton
 */
export function ProfileHeroSkeleton() {
  return (
    <section className="relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/10 via-purple-500/5 to-accent-peach/10" />
      <div className="absolute inset-0 backdrop-blur-3xl" />

      {/* Content Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 lg:gap-12 items-start">
          {/* Avatar Skeleton */}
          <div className="shrink-0">
            <Skeleton className="size-24 sm:size-28 lg:size-32 rounded-full" />
          </div>

          {/* Profile Info Skeleton */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Name & Rating */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <Skeleton className="h-9 sm:h-10 lg:h-11 w-48 sm:w-64" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>

            {/* Title */}
            <Skeleton className="h-6 w-64 sm:w-80" />

            {/* Bio */}
            <div className="space-y-2 max-w-2xl">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
            </div>

            {/* Specialty Tags */}
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
              <Skeleton className="h-7 w-32 rounded-full" />
            </div>

            {/* Role Toggle */}
            <Skeleton className="h-14 w-80 rounded-2xl" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
    </section>
  );
}

/**
 * Stats Dashboard Skeleton
 */
export function StatsDashboardSkeleton() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="p-6 sm:p-8 rounded-2xl bg-white border-2 border-gray-200/50 shadow-lg"
          >
            <Skeleton className="size-12 sm:size-14 rounded-xl mb-4" />
            <Skeleton className="h-10 sm:h-12 w-20 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Badges Section Skeleton
 */
export function BadgesSkeleton() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Skeleton className="h-8 w-40 mb-6" />
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="shrink-0 px-6 py-4 rounded-xl bg-white border-2 border-gray-200/50 shadow-md"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Portfolio Grid Skeleton
 */
export function PortfolioSkeleton() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="shrink-0 h-10 w-24 rounded-xl" />
        ))}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] gap-3 sm:gap-4">
        {/* Large card */}
        <Skeleton className="col-span-2 row-span-2 rounded-2xl" />
        {/* Small cards */}
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="rounded-2xl" />
        ))}
      </div>
    </section>
  );
}

/**
 * Full Profile Skeleton
 * Combines all skeleton sections
 */
export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <ProfileHeroSkeleton />
      <StatsDashboardSkeleton />
      <BadgesSkeleton />
      <PortfolioSkeleton />

      {/* Add shimmer animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}
