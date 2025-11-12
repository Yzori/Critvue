"use client";

import { cn } from "@/lib/utils";

export interface ReviewCardSkeletonProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

/**
 * Review Card Skeleton Component - Loading placeholder
 *
 * Features:
 * - Shimmer animation
 * - Matches card layout for each size
 * - Glassmorphism aesthetic
 * - Smooth loading experience
 */
export function ReviewCardSkeleton({
  size = "medium",
  className,
}: ReviewCardSkeletonProps) {
  const sizeClasses = {
    small: "col-span-1 row-span-1",
    medium: "col-span-1 row-span-1 md:col-span-1",
    large: "col-span-1 row-span-1 md:col-span-2 md:row-span-2",
  };

  const cardSize = sizeClasses[size];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-white/60 backdrop-blur-sm border border-gray-200/50",
        cardSize,
        className
      )}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />

      {/* Content skeleton */}
      <div className="flex flex-col h-full p-4 md:p-6 gap-3">
        {/* Preview image placeholder */}
        {size !== "small" && (
          <div className="w-full aspect-video rounded-xl bg-gray-200/50 mb-2" />
        )}

        {/* Badges */}
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full bg-gray-200/50" />
          <div className="h-6 w-12 rounded-full bg-gray-200/50" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div
            className={cn(
              "h-6 bg-gray-200/50 rounded",
              size === "large" ? "w-3/4" : "w-full"
            )}
          />
          {size !== "small" && <div className="h-6 w-1/2 bg-gray-200/50 rounded" />}
        </div>

        {/* Description */}
        {size !== "small" && (
          <div className="space-y-2">
            <div className="h-4 bg-gray-200/50 rounded w-full" />
            <div className="h-4 bg-gray-200/50 rounded w-5/6" />
          </div>
        )}

        {/* Skills */}
        {size !== "small" && (
          <div className="h-4 w-3/4 bg-gray-200/50 rounded" />
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Metadata */}
        <div className="flex gap-3">
          <div className="h-4 w-16 bg-gray-200/50 rounded" />
          <div className="h-4 w-20 bg-gray-200/50 rounded" />
          <div className="h-4 w-12 bg-gray-200/50 rounded" />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-2">
          <div className="h-9 flex-1 bg-gray-200/50 rounded-lg" />
          <div className="h-9 flex-1 bg-gray-200/50 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of skeleton cards for initial loading
 */
export function ReviewCardSkeletonGrid({ count = 6 }: { count?: number }) {
  // Generate a pattern of card sizes for visual interest
  const sizes: Array<"small" | "medium" | "large"> = [];
  for (let i = 0; i < count; i++) {
    if (i % 5 === 0) {
      sizes.push("large");
    } else if (i % 3 === 0) {
      sizes.push("small");
    } else {
      sizes.push("medium");
    }
  }

  return (
    <>
      {sizes.map((size, index) => (
        <ReviewCardSkeleton key={index} size={size} />
      ))}
    </>
  );
}
