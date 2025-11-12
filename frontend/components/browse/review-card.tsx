"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrowseReviewItem } from "@/lib/api/browse";
import { ArrowRight, Calendar, DollarSign, Star, Heart, Users, AlertCircle } from "lucide-react";

export interface ReviewCardProps extends React.HTMLAttributes<HTMLDivElement> {
  review: BrowseReviewItem;
  size?: "small" | "medium" | "large" | "wide" | "tall";
  importance?: number;
}

/**
 * Review Card Component - Glassmorphic design with Bento Grid sizing
 *
 * Features:
 * - Five sizes: small, medium, large, wide, tall for dynamic Bento Grid layout
 * - Glassmorphism aesthetic with backdrop blur
 * - Visual hierarchy based on importance score
 * - Hover elevation and glow effects
 * - Preview images for design reviews
 * - Rich metadata (price, deadline, skills, rating)
 * - Accessible with keyboard navigation
 * - Responsive design with intelligent content adaptation
 */
export function ReviewCard({
  review,
  size = "medium",
  importance = 50,
  className,
  ...props
}: ReviewCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  // IMPROVED: Multi-tier importance levels for better visual hierarchy
  const isPremiumFeatured = importance >= 85; // Hero cards
  const isHighImportance = importance >= 70; // Featured cards
  const isMediumImportance = importance >= 55; // Elevated standard cards

  // Paid vs Free distinction
  const isPaidReview = review.review_type === "expert";

  // Calculate urgency badge
  const getUrgencyBadge = () => {
    if (!review.deadline) return null;

    const deadline = new Date(review.deadline);
    const now = new Date();
    const daysUntil = Math.ceil(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil <= 1) {
      return <Badge variant="error" size="sm">Urgent</Badge>;
    } else if (daysUntil <= 3) {
      return <Badge variant="warning" size="sm">3 days left</Badge>;
    }
    return null;
  };

  // Calculate claim status badge
  const getClaimStatusBadge = () => {
    const reviewsRequested = review.reviews_requested || 1;
    const reviewsClaimed = review.reviews_claimed || 0;
    const availableSlots = review.available_slots ?? (reviewsRequested - reviewsClaimed);

    // Don't show badge if only 1 review requested (standard flow)
    if (reviewsRequested === 1) return null;

    // Fully claimed
    if (availableSlots === 0) {
      return (
        <Badge variant="neutral" size="sm" className="flex items-center gap-1">
          <Users className="size-3" />
          <span>All slots claimed</span>
        </Badge>
      );
    }

    // Only 1 slot left - urgent badge
    if (availableSlots === 1) {
      return (
        <Badge variant="warning" size="sm" className="flex items-center gap-1 animate-pulse">
          <AlertCircle className="size-3" />
          <span>Only 1 slot left!</span>
        </Badge>
      );
    }

    // Multiple slots available
    return (
      <Badge variant="success" size="sm" className="flex items-center gap-1">
        <Users className="size-3" />
        <span>{availableSlots} of {reviewsRequested} slots</span>
      </Badge>
    );
  };

  // Get content type color
  const getContentTypeBadge = () => {
    const variants: Record<string, "primary" | "secondary" | "info" | "success" | "neutral"> = {
      design: "primary",
      code: "info",
      video: "secondary",
      audio: "success",
      writing: "neutral",
      art: "secondary",
    };

    return (
      <Badge variant={variants[review.content_type] || "neutral"} size="sm">
        {review.content_type.charAt(0).toUpperCase() + review.content_type.slice(1)}
      </Badge>
    );
  };

  // Get review type badge with icon for better visual distinction
  const getReviewTypeBadge = () => {
    if (review.review_type === "expert") {
      return (
        <Badge variant="warning" size="sm" className="flex items-center gap-1">
          <Star className="size-3 fill-current" />
          <span>Expert</span>
        </Badge>
      );
    }
    return (
      <Badge variant="success" size="sm" className="flex items-center gap-1">
        <Heart className="size-3 fill-current" />
        <span>Free</span>
      </Badge>
    );
  };

  // Format price
  const formatPrice = (price?: number, currency?: string) => {
    if (!price) return "Free";
    return `${currency || "$"}${price}`;
  };

  // Format deadline
  const formatDeadline = (deadline?: string) => {
    if (!deadline) return "Flexible";
    const date = new Date(deadline);
    const now = new Date();
    const daysUntil = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return `${daysUntil} day${daysUntil !== 1 ? "s" : ""}`;
  };

  // Determine grid size classes with responsive behavior
  const sizeClasses = {
    // Small cards: compact 1x1 on all screens
    small: "col-span-1 row-span-1",

    // Medium cards: default 1x1, standard size
    medium: "col-span-1 row-span-1",

    // Large cards: 1x1 mobile, 2x2 on tablet+
    large: cn(
      "col-span-1 row-span-1",
      "sm:col-span-2 sm:row-span-2"
    ),

    // Wide cards: 1x1 mobile, 2x1 on tablet+
    wide: cn(
      "col-span-1 row-span-1",
      "sm:col-span-2 sm:row-span-1"
    ),

    // Tall cards: 1x1 mobile, 1x2 on desktop+
    tall: cn(
      "col-span-1 row-span-1",
      "lg:col-span-1 lg:row-span-2"
    ),
  };

  const cardSize = sizeClasses[size];

  return (
    <div
      className={cn(
        "review-card group relative overflow-hidden transition-all duration-300 will-change-transform",
        // Border radius: larger for large cards (2025 professional standard)
        size === "large" ? "rounded-3xl" : "rounded-2xl",

        // IMPROVED: Professional glassmorphism following 2025 trends
        // Premium featured cards: Maximum glass effect
        isPremiumFeatured && "bg-white/90 backdrop-blur-xl border-2",
        // High importance: Strong glass effect
        isHighImportance && !isPremiumFeatured && "bg-white/85 backdrop-blur-lg border-2",
        // Medium importance: Standard glass effect
        isMediumImportance && !isHighImportance && "bg-white/80 backdrop-blur-md border",
        // Standard cards: Subtle glass effect
        !isMediumImportance && "bg-white/75 backdrop-blur-md border",

        // Border styling with gradient accent for premium cards
        isPremiumFeatured && "border-transparent",
        isHighImportance && !isPremiumFeatured && "border-white/40",
        !isHighImportance && "border-white/20",

        // Shadow depth hierarchy (2025 refined shadows with paid/free distinction)
        // Premium featured: Enhanced shadow for maximum prominence
        isPremiumFeatured && (isPaidReview ? "shadow-2xl" : "shadow-xl"),
        // High importance: Stronger shadow for paid reviews
        isHighImportance && !isPremiumFeatured && (isPaidReview ? "shadow-xl" : "shadow-lg"),
        // Medium importance: Elevated shadow for paid reviews
        isMediumImportance && !isHighImportance && (isPaidReview ? "shadow-lg" : "shadow-md"),
        // Standard: Subtle shadow, stronger for paid
        !isMediumImportance && (isPaidReview ? "shadow-md" : "shadow"),

        // Hover elevation - premium feel with smooth transitions
        isPremiumFeatured && "hover:shadow-[0_30px_60px_rgba(0,0,0,0.12)] hover:-translate-y-2 hover:scale-[1.02]",
        isHighImportance && !isPremiumFeatured && "hover:shadow-2xl hover:-translate-y-2",
        isMediumImportance && !isHighImportance && "hover:shadow-xl hover:-translate-y-1",
        !isMediumImportance && "hover:shadow-lg hover:-translate-y-1",

        // Focus ring for accessibility
        "focus-within:ring-2 focus-within:ring-accent-blue/50 focus-within:ring-offset-2",

        // Grid size
        cardSize,

        // Subtle ring accent for premium cards and all paid reviews
        isPremiumFeatured && "ring-1 ring-accent-peach/20",
        // Paid reviews get subtle ring accent for distinction
        isPaidReview && !isPremiumFeatured && "ring-1 ring-accent-blue/15",

        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        // Refined gradient border for premium cards only
        ...(isPremiumFeatured && {
          backgroundImage:
            "linear-gradient(white, white), linear-gradient(135deg, var(--accent-blue), var(--accent-peach))",
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
        }),
      }}
      {...props}
    >
      {/* IMPROVED: Multi-layer gradient glow on hover for premium depth */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none will-change-opacity",
          isPremiumFeatured
            ? "bg-gradient-to-br from-accent-blue/20 via-accent-peach/10 to-accent-sage/15"
            : isHighImportance
            ? "bg-gradient-to-br from-accent-blue/15 via-transparent to-accent-peach/15"
            : "bg-gradient-to-br from-accent-blue/8 via-transparent to-accent-peach/8",
          isHovered && "opacity-100"
        )}
      />

      {/* Subtle inner glow for premium cards */}
      {isPremiumFeatured && (
        <div className="absolute inset-0 rounded-[inherit] shadow-inner shadow-accent-blue/10 pointer-events-none" />
      )}

      {/* Card content */}
      <div
        className={cn(
          "relative flex flex-col h-full gap-3",
          // IMPROVED: Tighter padding for better height control
          size === "small" ? "p-4" : size === "large" ? "p-5 md:p-6" : "p-4 md:p-5"
        )}
      >
        {/* IMPROVED: Preview image with enhanced presentation */}
        {review.preview_image_url && size !== "small" && (
          <div
            className={cn(
              "relative w-full overflow-hidden mb-2",
              // Premium rounded corners for professional look
              size === "large" ? "rounded-2xl" : "rounded-xl",
              // Subtle gradient overlay for depth
              "before:absolute before:inset-0 before:bg-gradient-to-t before:from-black/10 before:to-transparent before:z-10 before:pointer-events-none",
              // IMPROVED: More compact aspect ratios to reduce height
              size === "large" ? "aspect-video" : "aspect-[21/9]",
              // Premium shadow for featured images
              isPremiumFeatured && "shadow-lg"
            )}
          >
            <div className="relative w-full h-full bg-gradient-to-br from-gray-100 to-gray-200">
              <img
                src={review.preview_image_url}
                alt={review.title}
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                loading="lazy"
              />
            </div>
            {/* Optional: Featured badge overlay for premium cards */}
            {isPremiumFeatured && review.is_featured && (
              <div className="absolute top-3 right-3 z-20">
                <Badge variant="warning" size="sm" className="backdrop-blur-sm bg-accent-peach/90">
                  Featured
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* IMPROVED: Badges - removed Featured (now on image for premium cards) */}
        <div className="flex flex-wrap gap-3 items-center pointer-events-none">
          {getContentTypeBadge()}
          {getReviewTypeBadge()}
          {getClaimStatusBadge()}
          {getUrgencyBadge()}
          {/* Featured badge only shown if no image (fallback) */}
          {review.is_featured && !review.preview_image_url && (
            <Badge variant="warning" size="sm">
              Featured
            </Badge>
          )}
        </div>

        {/* IMPROVED: Title with refined typography hierarchy */}
        <h3
          className={cn(
            "transition-colors duration-200",
            "group-hover:text-accent-blue",
            // Premium featured: Bold, larger, more space
            isPremiumFeatured && "font-bold",
            // High importance: Semibold with prominence
            isHighImportance && !isPremiumFeatured && "font-semibold",
            // Standard: Semibold
            !isHighImportance && "font-semibold",
            // IMPROVED: Tighter line-clamping for better height control
            size === "small" && "text-sm line-clamp-2 leading-snug",
            size === "medium" && "text-base md:text-lg line-clamp-2 leading-snug",
            size === "large" && "text-xl md:text-2xl line-clamp-2 leading-tight",
            size === "wide" && "text-lg md:text-xl line-clamp-2 leading-snug",
            size === "tall" && "text-base md:text-lg line-clamp-2 leading-snug",
            // Text color hierarchy
            isPremiumFeatured ? "text-gray-900" : "text-gray-800"
          )}
        >
          {review.title}
        </h3>

        {/* Description - adaptive based on size */}
        {size !== "small" && (
          <p
            className={cn(
              "text-gray-600 leading-relaxed",
              // IMPROVED: Tighter line-clamping to reduce height
              size === "large" ? "text-sm md:text-base line-clamp-3" : "text-sm line-clamp-2",
              size === "wide" && "line-clamp-2",
              size === "tall" && "line-clamp-3"
            )}
          >
            {review.description}
          </p>
        )}

        {/* Skills - only show on large cards to save space */}
        {review.skills && review.skills.length > 0 && size === "large" && (
          <div className="flex flex-wrap gap-1.5 text-xs text-gray-500">
            <span className="font-medium">Skills:</span>
            <span className="line-clamp-1">
              {review.skills.slice(0, 3).join(" • ")}
              {review.skills.length > 3 && " ..."}
            </span>
          </div>
        )}

        {/* Metadata and actions grouped at bottom with mt-auto */}
        <div className="mt-auto flex flex-col gap-3">
          {/* Claim Progress Bar - Only for multi-review requests */}
          {(review.reviews_requested ?? 1) > 1 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium flex items-center gap-1">
                  <Users className="size-3" />
                  Review slots
                </span>
                <span className="text-foreground font-semibold">
                  {review.reviews_claimed || 0} of {review.reviews_requested} claimed
                </span>
              </div>
              <div className="relative h-2 bg-accent-sage/20 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                    (review.available_slots ?? 1) > 1 ? "bg-accent-sage" :
                    (review.available_slots ?? 1) === 1 ? "bg-amber-500" :
                    "bg-green-500"
                  )}
                  style={{
                    width: `${((review.reviews_claimed || 0) / (review.reviews_requested || 1)) * 100}%`
                  }}
                />
              </div>
            </div>
          )}

          {/* Metadata footer */}
          <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
            {/* Price */}
            <div className="flex items-center gap-1.5">
              <DollarSign className="size-4 text-accent-blue" />
              <span className="font-semibold text-gray-900">
                {formatPrice(review.price, review.currency)}
              </span>
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4" />
              <span>{formatDeadline(review.deadline)}</span>
            </div>

            {/* Creator rating */}
            {review.creator_rating && (
              <div className="flex items-center gap-1.5">
                <Star className="size-4 text-amber-500 fill-amber-500" />
                <span>{review.creator_rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* IMPROVED: Actions with enhanced styling for premium cards + mobile-optimized */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <Button
              asChild
              variant="outline"
              size="sm"
              className={cn(
                "flex-1 transition-all duration-200 min-h-[44px]",
                isPremiumFeatured && "border-accent-blue/40 hover:border-accent-blue/70 hover:bg-accent-blue/5",
                isHighImportance && !isPremiumFeatured && "border-accent-blue/30 hover:border-accent-blue/50",
                !isHighImportance && "hover:border-gray-300"
              )}
            >
              <Link href={`/browse/${review.id}`}>
                View Details
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className={cn(
                "flex-1 bg-gradient-to-r from-accent-blue to-accent-peach transition-all duration-200 min-h-[44px]",
                isPremiumFeatured && "shadow-lg hover:shadow-xl hover:scale-105",
                isHighImportance && !isPremiumFeatured && "shadow-md hover:shadow-lg",
                !isHighImportance && "hover:opacity-90"
              )}
            >
              <Link href={`/browse/${review.id}/claim`}>
                Claim
                <ArrowRight className="ml-1 size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
