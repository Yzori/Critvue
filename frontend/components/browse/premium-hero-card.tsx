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
  DollarSign,
  Star,
  Clock,
  Zap,
  Target,
  TrendingUp,
  Award,
  Shield,
} from "lucide-react";

export interface PremiumHeroCardProps {
  review: BrowseReviewItem;
}

/**
 * Premium Hero Card - Large showcase card for top paid opportunity
 *
 * Features:
 * - Large tall format (60% width of container)
 * - Prominent preview image with gradient overlay
 * - Creator profile overlay (avatar, rating, completed reviews)
 * - Earnings potential with gradient text
 * - "Premium Opportunity" badge with pulse animation
 * - Hover effects: lift, glow
 * - Glassmorphic styling
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
      quick: { label: "Quick", icon: Zap, color: "text-green-700", bg: "bg-gray-50", border: "border-green-200" },
      standard: { label: "Standard", icon: Target, color: "text-blue-700", bg: "bg-gray-50", border: "border-blue-200" },
      deep: { label: "Deep Dive", icon: Star, color: "text-purple-700", bg: "bg-gray-50", border: "border-purple-200" },
    };

    const config = tierConfig[review.tier];
    const Icon = config.icon;
    const duration = review.estimated_duration || (review.tier === "quick" ? 10 : review.tier === "standard" ? 20 : 45);

    return (
      <Badge className={cn("flex items-center gap-1.5", config.bg, config.color, config.border)}>
        <Icon className="size-3.5" />
        <span className="font-semibold">{config.label}</span>
        <span>•</span>
        <Clock className="size-3" />
        <span>{duration} min</span>
      </Badge>
    );
  };

  return (
    <Link href={`/review/${review.id}`}>
      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl h-full",
          "bg-white border border-gray-200",
          "transition-all duration-500",
          "hover:shadow-xl hover:-translate-y-1",
          "hover:border-accent-blue/20",
          "flex flex-col lg:flex-row"
        )}
        style={{
          minHeight: "380px",
        }}
      >
        {/* Premium Opportunity Badge - Top Right - Subtle */}
        <div className="absolute top-4 right-4 z-20">
          <Badge
            className={cn(
              "bg-white/95 backdrop-blur-sm text-accent-blue border-accent-blue/20 shadow-md",
              "px-3 py-1.5 font-semibold flex items-center gap-1.5"
            )}
          >
            <Award className="size-4" />
            Premium
          </Badge>
        </div>

        {/* LEFT SIDE: Content Section */}
        <div className="flex-1 flex flex-col">
          {/* Preview Image Section with Gradient Overlay - Mobile/Tablet Only - Hidden for NDA */}
          <div className="relative h-40 overflow-hidden lg:hidden">
            {review.preview_image && !review.requires_nda ? (
              <>
                <img
                  src={getFileUrl(review.preview_image)}
                  alt={review.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Dark gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100" />
            )}

            {/* Creator Profile Overlay - Bottom Left */}
            <div className="absolute bottom-4 left-4 flex items-center gap-3 z-10">
              <div className="size-12 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center">
                {/* TODO: Replace with actual creator avatar */}
                <div className="size-10 rounded-full bg-gradient-to-br from-accent-blue to-accent-peach" />
              </div>
              <div className="text-white">
                <p className="font-semibold text-sm drop-shadow-lg">
                  {review.creator_name || "Anonymous"}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  {review.creator_rating && (
                    <div className="flex items-center gap-1">
                      <Star className="size-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium drop-shadow">{review.creator_rating.toFixed(1)}</span>
                    </div>
                  )}
                  <span className="opacity-80">•</span>
                  <span className="opacity-90 drop-shadow">24 reviews</span>
                </div>
              </div>
            </div>
          </div>

          {/* Creator Info - Desktop Only (shows at top of content) */}
          <div className="hidden lg:flex items-center gap-3 p-5 pb-3">
            <div className="size-12 rounded-full bg-gradient-to-br from-accent-blue/10 to-accent-peach/10 border-2 border-accent-blue/20 flex items-center justify-center">
              <div className="size-10 rounded-full bg-gradient-to-br from-accent-blue to-accent-peach" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">
                {review.creator_name || "Anonymous"}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                {review.creator_rating && (
                  <div className="flex items-center gap-1">
                    <Star className="size-3 fill-amber-500 text-amber-500" />
                    <span className="font-medium">{review.creator_rating.toFixed(1)}</span>
                  </div>
                )}
                <span>•</span>
                <span>24 reviews</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 lg:pt-0 space-y-3 flex-1">
            {/* Badges Row */}
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant={review.content_type === "design" ? "primary" : "neutral"}>
                {review.content_type.charAt(0).toUpperCase() + review.content_type.slice(1)}
              </Badge>

              {getTierBadge()}

              {/* NDA Badge */}
              {review.requires_nda && (
                <Badge className="flex items-center gap-1 bg-purple-50 border-purple-200 text-purple-700 font-semibold border">
                  <Shield className="size-3" />
                  <span>NDA</span>
                </Badge>
              )}

              {review.is_featured && (
                <Badge variant="warning">Featured</Badge>
              )}
            </div>

            {/* Title */}
            <h3 className="font-bold text-lg text-gray-900 group-hover:text-accent-blue transition-colors line-clamp-2 leading-tight">
              {review.title}
            </h3>

            {/* Description */}
            {review.requires_nda ? (
              <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                <Shield className="size-4 flex-shrink-0" />
                <span className="italic">Sign NDA to view project details</span>
              </div>
            ) : (
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {review.description}
              </p>
            )}

            {/* Earnings Highlight - Subtle and Refined */}
            {isPaidReview && review.price && (
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="size-9 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="size-4 text-green-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Earn up to</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatPrice(review.price, review.currency)}
                  </p>
                </div>
              </div>
            )}

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 pt-2">
              {/* Deadline */}
              <div className="flex items-center gap-1.5">
                <Calendar className="size-4 text-gray-500" />
                <span>{formatDeadline(review.deadline)}</span>
              </div>

              {/* Slots */}
              {(review.reviews_requested ?? 1) > 1 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">•</span>
                  <span>{review.available_slots ?? 0}/{review.reviews_requested} slots</span>
                </div>
              )}
            </div>

            {/* CTA Button - Subtle */}
            <Button
              className={cn(
                "w-full mt-2 h-10 text-sm font-semibold group/btn",
                "bg-accent-blue hover:bg-accent-blue/90",
                "text-white"
              )}
            >
              Claim This Opportunity
              <ArrowRight className="ml-2 size-4 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </div>
        </div>

        {/* RIGHT SIDE: File Preview - Large Screens Only - Hidden for NDA */}
        <div className="hidden lg:block lg:w-[40%] relative bg-gray-100 border-l border-gray-200">
          {review.preview_image && !review.requires_nda ? (
            <img
              src={getFileUrl(review.preview_image)}
              alt={`Preview of ${review.title}`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className={cn(
              "w-full h-full flex items-center justify-center",
              review.requires_nda
                ? "bg-gradient-to-br from-purple-50 to-purple-100"
                : "bg-gradient-to-br from-gray-100 to-gray-200"
            )}>
              <div className="text-center p-6">
                <div className={cn(
                  "size-16 mx-auto mb-3 rounded-full flex items-center justify-center",
                  review.requires_nda ? "bg-purple-200" : "bg-gray-200"
                )}>
                  {review.requires_nda ? (
                    <Shield className="size-8 text-purple-500" />
                  ) : (
                    <DollarSign className="size-8 text-gray-400" />
                  )}
                </div>
                <p className={cn(
                  "text-sm font-medium",
                  review.requires_nda ? "text-purple-600" : "text-gray-500"
                )}>
                  {review.requires_nda ? "NDA Protected" : "File Preview"}
                </p>
                <p className={cn(
                  "text-xs mt-1",
                  review.requires_nda ? "text-purple-500" : "text-gray-400"
                )}>
                  {review.requires_nda ? "Sign NDA to view files" : "Upload available after claiming"}
                </p>
              </div>
            </div>
          )}

          {/* Preview Label Overlay - Hidden for NDA */}
          {review.preview_image && !review.requires_nda && (
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm">
              <p className="text-xs text-white font-medium">Preview</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
