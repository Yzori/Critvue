"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrowseReviewItem } from "@/lib/api/browse";
import { getFileUrl } from "@/lib/api/client";
import {
  ArrowRight,
  Calendar,
  Star,
  Clock,
  Zap,
  Target,
  TrendingUp,
  Award,
  Shield,
  Users,
} from "lucide-react";

export interface PremiumHeroCardProps {
  review: BrowseReviewItem;
}

/**
 * Premium Hero Card - Compact Banner Style
 *
 * Features:
 * - Horizontal banner layout (~200px height)
 * - Image thumbnail on left (25-30%)
 * - Content on right (70-75%)
 * - Compact, efficient space usage
 * - Premium badge and earnings highlight
 */
export function PremiumHeroCard({ review }: PremiumHeroCardProps) {
  const isPaidReview = review.review_type === "expert";

  const formatPrice = (price?: number, currency?: string) => {
    if (!price) return "Free";
    return `${currency || "$"}${price}`;
  };

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

  const getTierBadge = () => {
    if (review.review_type !== "expert" || !review.tier) return null;

    const tierConfig = {
      quick: { label: "Quick", icon: Zap, color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
      standard: { label: "Standard", icon: Target, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
      deep: { label: "Deep Dive", icon: Star, color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
    };

    const config = tierConfig[review.tier];
    const Icon = config.icon;
    const duration = review.estimated_duration || (review.tier === "quick" ? 10 : review.tier === "standard" ? 20 : 45);

    return (
      <Badge className={cn("flex items-center gap-1", config.bg, config.color, config.border, "text-xs")}>
        <Icon className="size-3" />
        <span className="font-semibold">{config.label}</span>
        <span className="opacity-60">•</span>
        <Clock className="size-2.5" />
        <span>{duration}m</span>
      </Badge>
    );
  };

  return (
    <Link href={`/review/${review.id}`} className="block w-full">
      <div
        className={cn(
          "group relative overflow-hidden rounded-xl w-full",
          "bg-white border border-gray-200",
          "transition-all duration-300",
          "hover:shadow-lg hover:-translate-y-0.5",
          "hover:border-accent-blue/30",
          "flex flex-row"
        )}
        style={{
          height: "280px",
        }}
      >
        {/* LEFT: Image Thumbnail */}
        <div className="relative w-[50%] min-w-[200px] max-w-[450px] flex-shrink-0 bg-gray-100">
          {review.preview_image && !review.requires_nda ? (
            <img
              src={getFileUrl(review.preview_image)}
              alt={review.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className={cn(
              "w-full h-full flex flex-col items-center justify-center p-4",
              review.requires_nda
                ? "bg-gradient-to-br from-purple-100 to-purple-200"
                : "bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
            )}>
              {review.requires_nda ? (
                <>
                  <Shield className="size-10 text-purple-400 mb-2" />
                  <p className="text-xs text-purple-600 font-medium text-center">Sign NDA to view</p>
                </>
              ) : (
                <Award className="size-10 text-accent-blue/40" />
              )}
            </div>
          )}

          {/* Premium Badge - Overlay on image */}
          <div className="absolute top-2 left-2">
            <Badge
              className={cn(
                "bg-white/95 backdrop-blur-sm text-accent-blue border-accent-blue/20 shadow-sm",
                "px-2 py-0.5 text-xs font-semibold flex items-center gap-1"
              )}
            >
              <Award className="size-3" />
              Premium
            </Badge>
          </div>
        </div>

        {/* RIGHT: Content */}
        <div className="flex-1 flex flex-col p-4 min-w-0">
          {/* Top Row: Badges */}
          <div className="flex flex-wrap gap-1.5 items-center mb-2">
            <Badge variant={review.content_type === "design" ? "primary" : "neutral"} size="sm">
              {review.content_type.charAt(0).toUpperCase() + review.content_type.slice(1)}
            </Badge>
            {getTierBadge()}
            {review.requires_nda && (
              <Badge className="flex items-center gap-1 bg-purple-50 border-purple-200 text-purple-700 font-semibold border text-xs">
                <Shield className="size-2.5" />
                <span>NDA</span>
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-base text-gray-900 group-hover:text-accent-blue transition-colors line-clamp-1 leading-tight mb-1">
            {review.title}
          </h3>

          {/* Description - single line */}
          {review.requires_nda ? (
            <p className="text-xs text-purple-600 italic line-clamp-1 mb-2">
              Sign NDA to view project details
            </p>
          ) : (
            <p className="text-xs text-gray-500 line-clamp-1 mb-2">
              {review.description}
            </p>
          )}

          {/* Bottom Row: Earnings + Metadata + CTA */}
          <div className="mt-auto flex items-center gap-3 flex-wrap">
            {/* Earnings - Compact */}
            {isPaidReview && review.price && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 border border-green-200">
                <TrendingUp className="size-3.5 text-green-600" />
                <span className="text-sm font-bold text-green-700">
                  {formatPrice(review.price, review.currency)}
                </span>
              </div>
            )}

            {/* Metadata - Compact */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="size-3" />
                <span>{formatDeadline(review.deadline)}</span>
              </div>
              {(review.reviews_requested ?? 1) > 1 && (
                <div className="flex items-center gap-1">
                  <Users className="size-3" />
                  <span>{review.available_slots ?? 0}/{review.reviews_requested}</span>
                </div>
              )}
              {review.creator_rating && (
                <div className="flex items-center gap-1">
                  <Star className="size-3 text-amber-500 fill-amber-500" />
                  <span>{review.creator_rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* CTA Button - Compact, pushed to right */}
            <Button
              size="sm"
              className={cn(
                "ml-auto h-8 px-3 text-xs font-semibold",
                "bg-accent-blue hover:bg-accent-blue/90",
                "text-white"
              )}
            >
              View Details
              <ArrowRight className="ml-1 size-3 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
