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
  Code2,
  Palette,
  PenTool,
  Video,
  Music,
  FileText,
  Sparkles,
} from "lucide-react";

export interface CommunityGalleryCardProps {
  review: BrowseReviewItem;
}

/**
 * Community Gallery Card - Modern card for free reviews
 *
 * Features:
 * - Category-specific placeholder gradients with icons
 * - Subtle "Free" badge with backdrop blur
 * - Enhanced hover states
 * - Creator avatar overlay
 * - Clean, modern design
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

  // Category-specific placeholder config
  const getCategoryPlaceholder = (contentType: string) => {
    const configs: Record<string, { gradient: string; icon: React.ReactNode; iconBg: string }> = {
      design: {
        gradient: "from-violet-100 via-purple-50 to-fuchsia-100",
        icon: <Palette className="size-12 text-violet-400" />,
        iconBg: "bg-violet-200/50",
      },
      code: {
        gradient: "from-blue-100 via-cyan-50 to-sky-100",
        icon: <Code2 className="size-12 text-blue-400" />,
        iconBg: "bg-blue-200/50",
      },
      writing: {
        gradient: "from-amber-100 via-orange-50 to-yellow-100",
        icon: <PenTool className="size-12 text-amber-500" />,
        iconBg: "bg-amber-200/50",
      },
      video: {
        gradient: "from-rose-100 via-pink-50 to-red-100",
        icon: <Video className="size-12 text-rose-400" />,
        iconBg: "bg-rose-200/50",
      },
      audio: {
        gradient: "from-emerald-100 via-teal-50 to-green-100",
        icon: <Music className="size-12 text-emerald-400" />,
        iconBg: "bg-emerald-200/50",
      },
      document: {
        gradient: "from-slate-100 via-gray-50 to-zinc-100",
        icon: <FileText className="size-12 text-slate-400" />,
        iconBg: "bg-slate-200/50",
      },
      other: {
        gradient: "from-indigo-100 via-blue-50 to-purple-100",
        icon: <Sparkles className="size-12 text-indigo-400" />,
        iconBg: "bg-indigo-200/50",
      },
    };
    return configs[contentType] || configs.other;
  };

  const placeholder = getCategoryPlaceholder(review.content_type);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white",
        "border border-gray-200/80",
        "transition-all duration-300 ease-out",
        "hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1",
        "hover:border-gray-300/80",
        "h-full flex flex-col"
      )}
    >
      <Link href={`/review/${review.id}`} className="flex flex-col h-full">
        {/* Preview Image Section */}
        <div className="relative aspect-[4/3] flex-shrink-0 overflow-hidden">
          {review.preview_image ? (
            <img
              src={getFileUrl(review.preview_image)}
              alt={review.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            /* Category-specific placeholder */
            <div className={cn(
              "w-full h-full bg-gradient-to-br",
              placeholder.gradient,
              "flex items-center justify-center"
            )}>
              <div className={cn(
                "size-20 rounded-2xl flex items-center justify-center",
                placeholder.iconBg,
                "backdrop-blur-sm"
              )}>
                {placeholder.icon}
              </div>
            </div>
          )}

          {/* Free Badge - Top Left - Subtle styling */}
          <div className="absolute top-3 left-3 z-10">
            <span className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1",
              "text-xs font-semibold uppercase tracking-wide",
              "bg-white/90 backdrop-blur-md",
              "text-gray-700 border border-gray-200/50",
              "rounded-lg shadow-sm"
            )}>
              Free
            </span>
          </div>

          {/* Save/Favorite Button - Top Right */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsSaved(!isSaved);
            }}
            className={cn(
              "absolute top-3 right-3 z-10",
              "size-9 rounded-full backdrop-blur-md transition-all",
              "flex items-center justify-center",
              "shadow-sm",
              isSaved
                ? "bg-rose-500 text-white"
                : "bg-white/90 text-gray-500 hover:text-rose-500 hover:bg-white border border-gray-200/50"
            )}
          >
            <Heart
              className={cn(
                "size-4 transition-all",
                isSaved && "fill-current"
              )}
            />
          </button>

          {/* Creator Avatar - Bottom Left Corner */}
          <div className="absolute bottom-3 left-3 z-10">
            <div className="size-10 rounded-full bg-white/95 backdrop-blur-sm border-2 border-white shadow-md flex items-center justify-center overflow-hidden">
              <div className="size-8 rounded-full bg-gradient-to-br from-accent-blue to-cyan-500" />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-2.5 flex-1 flex flex-col">
          {/* Category Badge */}
          <Badge variant="neutral" size="sm" className="w-fit">
            {review.content_type.charAt(0).toUpperCase() + review.content_type.slice(1)}
          </Badge>

          {/* Title */}
          <h3 className="font-semibold text-base text-gray-900 group-hover:text-accent-blue transition-colors line-clamp-2 leading-snug">
            {review.title}
          </h3>

          {/* Short Description */}
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed flex-1">
            {review.description}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-gray-500 pt-1 border-t border-gray-100">
            {/* Deadline */}
            <div className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              <span>{formatDeadline(review.deadline)}</span>
            </div>

            {/* Rating if available */}
            {review.creator_rating && (
              <>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  <span>{review.creator_rating.toFixed(1)}</span>
                </div>
              </>
            )}

            {/* Slots */}
            <div className="flex items-center gap-1 ml-auto">
              <Users className="size-3.5" />
              <span>{review.available_slots ?? 0}/{review.reviews_requested ?? 1}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
