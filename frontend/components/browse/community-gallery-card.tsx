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
  Camera,
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

  // Category-specific placeholder config - using translucent colors for dark mode support
  const getCategoryPlaceholder = (contentType: string) => {
    const configs: Record<string, { gradient: string; icon: React.ReactNode; iconBg: string }> = {
      design: {
        gradient: "from-violet-500/20 via-purple-500/10 to-fuchsia-500/20",
        icon: <Palette className="size-12 text-violet-500" />,
        iconBg: "bg-violet-500/20",
      },
      photography: {
        gradient: "from-blue-500/20 via-cyan-500/10 to-sky-500/20",
        icon: <Camera className="size-12 text-blue-500" />,
        iconBg: "bg-blue-500/20",
      },
      writing: {
        gradient: "from-amber-500/20 via-orange-500/10 to-yellow-500/20",
        icon: <PenTool className="size-12 text-amber-500" />,
        iconBg: "bg-amber-500/20",
      },
      video: {
        gradient: "from-rose-500/20 via-pink-500/10 to-red-500/20",
        icon: <Video className="size-12 text-rose-500" />,
        iconBg: "bg-rose-500/20",
      },
      audio: {
        gradient: "from-emerald-500/20 via-teal-500/10 to-green-500/20",
        icon: <Music className="size-12 text-emerald-500" />,
        iconBg: "bg-emerald-500/20",
      },
      document: {
        gradient: "from-slate-500/20 via-gray-500/10 to-zinc-500/20",
        icon: <FileText className="size-12 text-slate-500" />,
        iconBg: "bg-slate-500/20",
      },
      other: {
        gradient: "from-indigo-500/20 via-blue-500/10 to-purple-500/20",
        icon: <Sparkles className="size-12 text-indigo-500" />,
        iconBg: "bg-indigo-500/20",
      },
    };
    return configs[contentType] || configs.other;
  };

  const placeholder = getCategoryPlaceholder(review.content_type);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-background",
        "border border-border/80",
        "transition-all duration-300 ease-out",
        "hover:shadow-lg hover:shadow-border/50 hover:-translate-y-1",
        "hover:border-border/80",
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
              "bg-background/90 backdrop-blur-md",
              "text-foreground border border-border/50",
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
                : "bg-background/90 text-muted-foreground hover:text-rose-500 hover:bg-background border border-border/50"
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
            <div className="size-10 rounded-full bg-background/95 backdrop-blur-sm border-2 border-background shadow-md flex items-center justify-center overflow-hidden">
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
          <h3 className="font-semibold text-base text-foreground group-hover:text-accent-blue transition-colors line-clamp-2 leading-snug">
            {review.title}
          </h3>

          {/* Short Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
            {review.description}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border">
            {/* Deadline */}
            <div className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              <span>{formatDeadline(review.deadline)}</span>
            </div>

            {/* Rating if available */}
            {review.creator_rating && (
              <>
                <span className="text-muted-foreground">•</span>
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
