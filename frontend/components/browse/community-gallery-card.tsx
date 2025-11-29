"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrowseReviewItem } from "@/lib/api/browse";
import { getFileUrl } from "@/lib/api/client";
import {
  Calendar,
  Heart,
  Star,
  Users,
  ArrowRight,
} from "lucide-react";

export interface CommunityGalleryCardProps {
  review: BrowseReviewItem;
}

/**
 * Community Gallery Card - Masonry-style card for free reviews
 *
 * Features:
 * - Large preview image (60% of card)
 * - Hover reveals full description
 * - "Good Karma" badge for free reviews
 * - Creator avatar in corner
 * - Category color-coded left border
 * - Heart icon for save/favorite
 * - Natural masonry layout
 */
export function CommunityGalleryCard({ review }: CommunityGalleryCardProps) {
  const [isSaved, setIsSaved] = React.useState(false);

  const formatDeadline = (deadline?: string) => {
    if (!deadline) return "Flexible";
    const date = new Date(deadline);
    const now = new Date();
    const daysUntil = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil <= 1) return "Due tomorrow";
    if (daysUntil <= 3) return `${daysUntil} days left`;
    return `${daysUntil} days`;
  };

  // Category color coding for left border
  const getCategoryColor = (contentType: string) => {
    const colors = {
      design: "border-l-pink-500",
      code: "border-l-blue-500",
      writing: "border-l-purple-500",
      marketing: "border-l-green-500",
      video: "border-l-red-500",
      other: "border-l-gray-400",
    };
    return colors[contentType as keyof typeof colors] || colors.other;
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl bg-white border-l-4",
        getCategoryColor(review.content_type),
        "border-t border-r border-b border-gray-200",
        "transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-1",
        "h-full flex flex-col"
      )}
    >
      <Link href={`/review/${review.id}`} className="flex flex-col h-full">
        {/* Preview Image Section - Fixed aspect ratio */}
        <div className="relative aspect-[4/3] flex-shrink-0 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          {review.preview_image ? (
            <img
              src={getFileUrl(review.preview_image)}
              alt={review.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" />
          )}

          {/* Good Karma Badge - Top Left */}
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-green-500 text-white border-green-600 shadow-md px-2.5 py-1 font-semibold flex items-center gap-1.5">
              <Heart className="size-3.5 fill-current" />
              Good Karma
            </Badge>
          </div>

          {/* Save/Favorite Button - Top Right */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsSaved(!isSaved);
            }}
            className={cn(
              "absolute top-3 right-3 z-10",
              "size-8 rounded-full backdrop-blur-md border-2 transition-all",
              "flex items-center justify-center",
              isSaved
                ? "bg-red-500 border-red-600"
                : "bg-white/80 border-white/40 hover:bg-white"
            )}
          >
            <Heart
              className={cn(
                "size-4 transition-all",
                isSaved ? "fill-white text-white" : "text-gray-600"
              )}
            />
          </button>

          {/* Creator Avatar - Bottom Left Corner */}
          <div className="absolute bottom-3 left-3 z-10">
            <div className="size-10 rounded-full bg-white/90 backdrop-blur-sm border-2 border-white shadow-md flex items-center justify-center">
              <div className="size-8 rounded-full bg-accent-blue" />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-2.5 flex-1 flex flex-col">
          {/* Category Badge */}
          <Badge variant="neutral" size="sm">
            {review.content_type.charAt(0).toUpperCase() + review.content_type.slice(1)}
          </Badge>

          {/* Title */}
          <h3 className="font-bold text-base text-gray-900 group-hover:text-accent-blue transition-colors line-clamp-2 leading-tight">
            {review.title}
          </h3>

          {/* Short Description - Always Visible */}
          <p className="text-xs text-gray-600 line-clamp-2 leading-snug">
            {review.description}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-gray-600 pt-1">
            {/* Deadline */}
            <div className="flex items-center gap-1">
              <Calendar className="size-3.5 text-gray-500" />
              <span>{formatDeadline(review.deadline)}</span>
            </div>

            {/* Rating if available */}
            {review.creator_rating && (
              <>
                <span className="text-gray-400">•</span>
                <div className="flex items-center gap-1">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  <span>{review.creator_rating.toFixed(1)}</span>
                </div>
              </>
            )}

            {/* Slots if multiple */}
            {(review.reviews_requested ?? 1) > 1 && (
              <>
                <span className="text-gray-400">•</span>
                <div className="flex items-center gap-1">
                  <Users className="size-3.5" />
                  <span>{review.available_slots ?? 0}/{review.reviews_requested}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Hover Reveal: Full Description + CTA */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-white via-white/98 to-transparent",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
            "flex flex-col justify-end p-4",
            "pointer-events-none group-hover:pointer-events-auto"
          )}
        >
          {/* Full Description */}
          <div className="mb-3">
            <p className="text-sm text-gray-700 leading-relaxed mb-2">
              {review.description}
            </p>
            <p className="text-xs text-gray-500">
              Help out the community and build your portfolio!
            </p>
          </div>

          {/* CTA Button */}
          <Button
            className={cn(
              "w-full h-9 text-sm font-semibold",
              "bg-gradient-to-r from-green-500 to-emerald-500",
              "hover:from-green-600 hover:to-emerald-600",
              "text-white shadow-md"
            )}
          >
            Help Out
            <ArrowRight className="ml-1.5 size-4" />
          </Button>
        </div>
      </Link>
    </div>
  );
}
