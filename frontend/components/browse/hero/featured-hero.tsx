"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BrowseReviewItem } from "@/lib/api/browse";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  DollarSign,
  Calendar,
  Star,
  Zap,
  ChevronLeft,
  ChevronRight,
  Users
} from "lucide-react";

export interface FeaturedHeroProps {
  featuredReviews: BrowseReviewItem[];
}

/**
 * Featured Hero Section - Netflix/Airbnb inspired
 *
 * Features:
 * - Auto-rotating carousel of featured opportunities
 * - Large, immersive preview images
 * - Glassmorphic overlay with key info
 * - Manual navigation controls
 * - Smooth fade transitions
 * - Mobile responsive
 */
export function FeaturedHero({ featuredReviews }: FeaturedHeroProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = React.useState(true);

  const current = featuredReviews[currentIndex];

  // Auto-rotate every 5 seconds
  React.useEffect(() => {
    if (!isAutoPlaying || featuredReviews.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredReviews.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredReviews.length]);

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % featuredReviews.length);
  };

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + featuredReviews.length) % featuredReviews.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  if (!current || featuredReviews.length === 0) return null;

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
    return `${daysUntil} days left`;
  };

  return (
    <section className="relative w-full h-[400px] md:h-[480px] rounded-3xl overflow-hidden group">
      {/* Background Images with Fade Transition */}
      <div className="absolute inset-0">
        {featuredReviews.map((review, index) => (
          <div
            key={review.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000",
              index === currentIndex ? "opacity-100" : "opacity-0"
            )}
          >
            {/* Background Image */}
            {review.preview_image_url ? (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300">
                <img
                  src={review.preview_image_url}
                  alt={review.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
            )}

            {/* Stronger Gradient Overlays for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
          </div>
        ))}
      </div>

      {/* Content Overlay */}
      <div className="relative h-full flex flex-col justify-end p-6 md:p-10 lg:p-12">
        <div className="max-w-3xl space-y-4 md:space-y-6">
          {/* Featured Badge */}
          <div className="flex items-center gap-3">
            <Badge
              variant="warning"
              size="lg"
              className="backdrop-blur-xl bg-accent-peach/90 text-white border-white/20"
            >
              <Zap className="size-4 fill-current" />
              Featured Opportunity
            </Badge>

            {current.review_type === "expert" && (
              <Badge
                variant="primary"
                size="lg"
                className="backdrop-blur-xl bg-accent-blue/90 text-white border-white/20"
              >
                <Star className="size-4 fill-current" />
                Expert Review
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            {current.title}
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-white/90 leading-relaxed line-clamp-2 md:line-clamp-3">
            {current.description}
          </p>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-4 text-white/90">
            {/* Price */}
            {current.review_type === "expert" && current.price ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
                <DollarSign className="size-5 text-green-400" />
                <span className="font-bold text-lg text-green-400">
                  {formatPrice(current.price, current.currency)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <DollarSign className="size-5" />
                <span className="font-semibold text-lg">{formatPrice()}</span>
              </div>
            )}

            {/* Deadline */}
            <div className="flex items-center gap-2">
              <Calendar className="size-5" />
              <span className="font-medium">{formatDeadline(current.deadline)}</span>
            </div>

            {/* Creator Rating */}
            {current.creator_rating && (
              <div className="flex items-center gap-2">
                <Star className="size-5 text-amber-400 fill-amber-400" />
                <span className="font-medium">{current.creator_rating.toFixed(1)}</span>
              </div>
            )}

            {/* Slots */}
            {(current.available_slots ?? 1) > 0 && (current.reviews_requested ?? 1) > 1 && (
              <div className="flex items-center gap-2">
                <Users className="size-5" />
                <span className="font-medium">
                  {current.available_slots} of {current.reviews_requested} slots
                </span>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <div className="pt-2">
            <Button
              asChild
              size="lg"
              className="bg-white text-gray-900 hover:bg-white/90 font-bold text-lg px-8 py-6 rounded-full shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:scale-105"
            >
              <Link href={`/review/${current.id}`}>
                View Details
                <ArrowRight className="ml-2 size-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      {featuredReviews.length > 1 && (
        <>
          {/* Previous/Next Buttons */}
          <button
            onClick={goToPrevious}
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 z-10",
              "size-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20",
              "flex items-center justify-center",
              "text-white hover:bg-white/20 transition-all duration-200",
              "opacity-0 group-hover:opacity-100",
              "hover:scale-110"
            )}
            aria-label="Previous featured review"
          >
            <ChevronLeft className="size-6" />
          </button>

          <button
            onClick={goToNext}
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 z-10",
              "size-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20",
              "flex items-center justify-center",
              "text-white hover:bg-white/20 transition-all duration-200",
              "opacity-0 group-hover:opacity-100",
              "hover:scale-110"
            )}
            aria-label="Next featured review"
          >
            <ChevronRight className="size-6" />
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            {featuredReviews.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "transition-all duration-300",
                  "rounded-full",
                  index === currentIndex
                    ? "w-8 h-2 bg-white"
                    : "size-2 bg-white/40 hover:bg-white/60"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
