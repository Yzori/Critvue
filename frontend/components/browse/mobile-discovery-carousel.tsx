"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BrowseReviewItem } from "@/lib/api/browse";
import { getFileUrl } from "@/lib/api/client";
import { Sparkles, ChevronRight, DollarSign, Star } from "lucide-react";

export interface MobileDiscoveryCarouselProps {
  featuredReviews: BrowseReviewItem[];
  recommendations: BrowseReviewItem[];
  className?: string;
}

/**
 * Mobile Discovery Carousel - Horizontal scrolling featured content
 *
 * Features:
 * - Horizontal scroll instead of vertical stack
 * - Featured items in a swipeable strip
 * - Saves ~400px vertical space
 * - Momentum scrolling with snap points
 * - Single row, touch-optimized
 */
export function MobileDiscoveryCarousel({
  featuredReviews,
  recommendations,
  className,
}: MobileDiscoveryCarouselProps) {
  // Combine featured and recommendations, prioritize recommendations
  const items = [...recommendations, ...featuredReviews].slice(0, 8);

  if (items.length === 0) return null;

  return (
    <section className={cn("md:hidden", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-amber-500" />
          <h2 className="text-base font-bold text-gray-900">Featured</h2>
        </div>
        <Link
          href="#premium-marketplace"
          className="text-sm text-accent-blue font-medium flex items-center gap-0.5"
        >
          See all
          <ChevronRight className="size-4" />
        </Link>
      </div>

      {/* Horizontal Scroll Container */}
      <div
        className={cn(
          "flex gap-3 overflow-x-auto pb-3 px-4",
          "snap-x snap-mandatory",
          "scrollbar-hide",
          // Hide scrollbar
          "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        )}
      >
        {items.map((review, index) => (
          <FeaturedCard key={review.id} review={review} index={index} />
        ))}
      </div>
    </section>
  );
}

interface FeaturedCardProps {
  review: BrowseReviewItem;
  index: number;
}

function FeaturedCard({ review, index }: FeaturedCardProps) {
  const isPaid = review.review_type === "expert" && (review.price ?? 0) > 0;

  return (
    <Link
      href={`/review/${review.id}`}
      className={cn(
        "flex-shrink-0 snap-start",
        "w-[200px] rounded-xl overflow-hidden",
        "bg-gray-100 shadow-md",
        "active:scale-[0.98] transition-transform"
      )}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Image */}
      <div className="relative h-28 overflow-hidden">
        {review.preview_image ? (
          <img
            src={getFileUrl(review.preview_image)}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100" />
        )}

        {/* Price Badge */}
        {isPaid && (
          <div className="absolute top-2 right-2">
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center">
              <DollarSign className="size-3" />
              {review.price}
            </span>
          </div>
        )}

        {/* Featured indicator */}
        {review.is_featured && (
          <div className="absolute top-2 left-2">
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow">
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <p className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">
          {review.content_type}
        </p>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mt-0.5 leading-tight">
          {review.title}
        </h3>

        {/* Rating */}
        {review.creator_rating && (
          <div className="flex items-center gap-1 mt-2">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            <span className="text-xs text-gray-600">
              {review.creator_rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
