'use client';

import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface LeaderboardSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * LeaderboardSkeleton Component
 *
 * Displays animated skeleton cards matching the LeaderboardCard layout.
 * Features a left-to-right shimmer animation.
 */
export function LeaderboardSkeleton({
  count = 10,
  className,
}: LeaderboardSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} index={index} />
      ))}
    </div>
  );
}

function SkeletonCard({ index }: { index: number }) {
  const isPodium = index < 3;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-3 sm:p-4',
        isPodium ? 'border-2 shadow-md' : 'bg-card',
        'min-h-[44px]'
      )}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Rank skeleton */}
        <Skeleton className="h-10 w-10 shrink-0 rounded-lg sm:h-12 sm:w-12" />

        {/* Avatar skeleton */}
        <Skeleton className="h-10 w-10 shrink-0 rounded-full sm:h-12 sm:w-12" />

        {/* User info skeleton */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-32 sm:w-40" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="hidden h-3 w-16 sm:block" />
            <Skeleton className="hidden h-3 w-20 sm:block" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Skeleton className="h-6 w-16 sm:h-7 sm:w-20" />
          {index % 3 !== 0 && <Skeleton className="h-5 w-12 rounded-full" />}
        </div>
      </div>
    </div>
  );
}

// Add shimmer animation to global styles if not already present
// This can be added to your tailwind.config or globals.css
export const shimmerKeyframes = `
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
`;
