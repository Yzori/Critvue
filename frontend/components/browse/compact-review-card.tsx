"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BrowseReviewItem } from "@/lib/api/browse";
import { getFileUrl } from "@/lib/api/client";
import { Clock, DollarSign, Star } from "lucide-react";

export interface CompactReviewCardProps {
  review: BrowseReviewItem;
  className?: string;
}

/**
 * Compact Review Card - Optimized for 2-column mobile grid
 *
 * Features:
 * - Square aspect ratio (1:1) for compact grid
 * - Minimal metadata (price/karma + deadline)
 * - Overlay gradient with title
 * - Touch-optimized (no hover states)
 * - ~120px height vs ~280px for full cards
 */
export function CompactReviewCard({ review, className }: CompactReviewCardProps) {
  const isPaid = review.review_type === "expert" && (review.price ?? 0) > 0;

  const formatDeadline = (deadline?: string) => {
    if (!deadline) return null;
    const date = new Date(deadline);
    const now = new Date();
    const daysUntil = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil <= 0) return "Today";
    if (daysUntil === 1) return "1d";
    if (daysUntil <= 7) return `${daysUntil}d`;
    return `${Math.ceil(daysUntil / 7)}w`;
  };

  const deadline = formatDeadline(review.deadline);

  return (
    <Link
      href={`/review/${review.id}`}
      className={cn(
        "block relative overflow-hidden rounded-xl",
        "bg-gray-100",
        "active:scale-[0.98] transition-transform duration-150",
        className
      )}
    >
      {/* Square aspect ratio container */}
      <div className="aspect-square relative">
        {/* Background Image */}
        {review.preview_image ? (
          <img
            src={getFileUrl(review.preview_image)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100" />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
          {/* Price or Karma badge */}
          {isPaid ? (
            <Badge className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 shadow-lg">
              <DollarSign className="size-3 mr-0.5" />
              {review.price}
            </Badge>
          ) : (
            <Badge className="bg-emerald-500/90 text-white text-xs font-medium px-2 py-0.5 shadow-lg">
              Free
            </Badge>
          )}

          {/* Deadline if urgent */}
          {deadline && (
            <Badge
              className={cn(
                "text-xs font-medium px-2 py-0.5 shadow-lg",
                deadline === "Today" || deadline === "1d"
                  ? "bg-red-500 text-white"
                  : "bg-white/90 text-gray-700"
              )}
            >
              <Clock className="size-3 mr-0.5" />
              {deadline}
            </Badge>
          )}
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          {/* Category */}
          <p className="text-[10px] uppercase tracking-wide text-white/70 font-medium mb-1">
            {review.content_type}
          </p>

          {/* Title */}
          <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2">
            {review.title}
          </h3>

          {/* Creator rating if good */}
          {review.creator_rating && review.creator_rating >= 4.0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              <span className="text-xs text-white/80">
                {review.creator_rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
