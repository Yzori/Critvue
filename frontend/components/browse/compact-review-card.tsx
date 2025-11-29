"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BrowseReviewItem } from "@/lib/api/browse";
import { getFileUrl } from "@/lib/api/client";
import {
  Clock,
  DollarSign,
  Star,
  Code2,
  Palette,
  PenTool,
  Video,
  Music,
  FileText,
  Sparkles,
} from "lucide-react";

export interface CompactReviewCardProps {
  review: BrowseReviewItem;
  className?: string;
}

// Category-specific placeholder config
const categoryPlaceholders: Record<string, { gradient: string; icon: React.ReactNode }> = {
  design: {
    gradient: "from-violet-200 via-purple-100 to-fuchsia-200",
    icon: <Palette className="size-8 text-violet-400/60" />,
  },
  code: {
    gradient: "from-blue-200 via-cyan-100 to-sky-200",
    icon: <Code2 className="size-8 text-blue-400/60" />,
  },
  writing: {
    gradient: "from-amber-200 via-orange-100 to-yellow-200",
    icon: <PenTool className="size-8 text-amber-500/60" />,
  },
  video: {
    gradient: "from-rose-200 via-pink-100 to-red-200",
    icon: <Video className="size-8 text-rose-400/60" />,
  },
  audio: {
    gradient: "from-emerald-200 via-teal-100 to-green-200",
    icon: <Music className="size-8 text-emerald-400/60" />,
  },
  document: {
    gradient: "from-slate-200 via-gray-100 to-zinc-200",
    icon: <FileText className="size-8 text-slate-400/60" />,
  },
  other: {
    gradient: "from-indigo-200 via-blue-100 to-purple-200",
    icon: <Sparkles className="size-8 text-indigo-400/60" />,
  },
};

/**
 * Compact Review Card - Optimized for 2-column mobile grid
 *
 * Features:
 * - Square aspect ratio (1:1) for compact grid
 * - Category-specific placeholder gradients with icons
 * - Minimal metadata (price/free + deadline)
 * - Overlay gradient with title
 * - Touch-optimized (no hover states)
 */
export function CompactReviewCard({ review, className }: CompactReviewCardProps) {
  const isPaid = review.review_type === "expert" && (review.price ?? 0) > 0;
  const placeholder = categoryPlaceholders[review.content_type] || categoryPlaceholders.other;

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
        {/* Background Image or Category Placeholder */}
        {review.preview_image ? (
          <img
            src={getFileUrl(review.preview_image)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br flex items-center justify-center",
            placeholder.gradient
          )}>
            {placeholder.icon}
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
          {/* Price or Free badge */}
          {isPaid ? (
            <Badge className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 shadow-lg">
              <DollarSign className="size-3 mr-0.5" />
              {review.price}
            </Badge>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-white/90 backdrop-blur-sm text-gray-700 rounded-md shadow-sm">
              Free
            </span>
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
