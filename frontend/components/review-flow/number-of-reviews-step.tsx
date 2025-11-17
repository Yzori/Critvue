/**
 * Number of Reviews Selection Step
 * Allows users to request 1-10 reviews for comprehensive feedback
 * Features:
 * - Interactive slider with increment/decrement buttons
 * - Dynamic pricing calculation
 * - Mobile-optimized touch targets (44px minimum)
 * - Brand-compliant design with glassmorphism
 * - Smooth animations
 */

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Users, Sparkles, TrendingUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NumberOfReviewsStepProps {
  numberOfReviews: number;
  pricePerReview: number;
  onNumberChange: (number: number) => void;
  isPaidReview: boolean;
  reviewType: "free" | "expert";
}

// Price tiers for volume discounts
interface PriceTier {
  min: number;
  max: number;
  discount: number;
  label: string;
  description: string;
}

const priceTiers: PriceTier[] = [
  {
    min: 1,
    max: 2,
    discount: 0,
    label: "Standard",
    description: "Individual perspective",
  },
  {
    min: 3,
    max: 5,
    discount: 10,
    label: "Popular",
    description: "Multiple viewpoints",
  },
  {
    min: 6,
    max: 10,
    discount: 15,
    label: "Comprehensive",
    description: "Diverse insights",
  },
];

function getPriceTier(count: number): PriceTier {
  const tier = priceTiers.find(t => count >= t.min && count <= t.max);
  return tier || priceTiers[0]!;
}

export function NumberOfReviewsStep({
  numberOfReviews,
  pricePerReview,
  onNumberChange,
  isPaidReview,
  reviewType,
}: NumberOfReviewsStepProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  // Determine max reviews based on review type
  const maxReviews = reviewType === "expert" ? 10 : 3;

  const currentTier = getPriceTier(numberOfReviews);
  const discountedPrice = pricePerReview * (1 - currentTier.discount / 100);
  const totalPrice = discountedPrice * numberOfReviews;
  const totalSavings = (pricePerReview - discountedPrice) * numberOfReviews;

  const handleIncrement = () => {
    if (numberOfReviews < maxReviews) {
      onNumberChange(numberOfReviews + 1);
      animatePulse();
    }
  };

  const handleDecrement = () => {
    if (numberOfReviews > 1) {
      onNumberChange(numberOfReviews - 1);
      animatePulse();
    }
  };

  const handleSliderChange = (value: number) => {
    onNumberChange(value);
    animatePulse();
  };

  const animatePulse = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Calculate progress percentage for slider fill
  const progress = ((numberOfReviews - 1) / (maxReviews - 1)) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          How many perspectives would you like?
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
          {reviewType === "free"
            ? "Free community reviews are limited to 3"
            : "Multiple reviewers give you diverse, well-rounded feedback"}
        </p>
      </div>

      {/* Main Content Card */}
      <div className="max-w-2xl mx-auto rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="space-y-6">
          {/* Number Display with Controls */}
          <div className="flex items-center justify-center gap-4">
            {/* Decrement Button */}
            <Button
              type="button"
              onClick={handleDecrement}
              disabled={numberOfReviews <= 1}
              variant="outline"
              size="lg"
              className={cn(
                "size-14 rounded-xl p-0 transition-all duration-200",
                "min-h-[44px] min-w-[44px]",
                "border-2 hover:bg-accent-blue/5 hover:border-accent-blue/30",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "active:scale-95"
              )}
              aria-label="Decrease number of reviews"
            >
              <Minus className="size-5" />
            </Button>

            {/* Number Display */}
            <div
              className={cn(
                "flex flex-col items-center justify-center min-w-[140px]",
                "rounded-2xl bg-gradient-to-br from-accent-blue/10 to-accent-peach/10",
                "border-2 border-accent-blue/20 p-6 transition-all duration-300",
                isAnimating && "scale-110"
              )}
            >
              <div className="text-5xl font-bold text-foreground leading-none mb-1">
                {numberOfReviews}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {numberOfReviews === 1 ? "review" : "reviews"}
              </div>
            </div>

            {/* Increment Button */}
            <Button
              type="button"
              onClick={handleIncrement}
              disabled={numberOfReviews >= maxReviews}
              variant="outline"
              size="lg"
              className={cn(
                "size-14 rounded-xl p-0 transition-all duration-200",
                "min-h-[44px] min-w-[44px]",
                "border-2 hover:bg-accent-blue/5 hover:border-accent-blue/30",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "active:scale-95"
              )}
              aria-label="Increase number of reviews"
            >
              <Plus className="size-5" />
            </Button>
          </div>

          {/* Slider */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground text-center block">
              Or drag the slider
            </Label>
            <div className="relative">
              {/* Progress fill background */}
              <div className="absolute inset-0 h-2 rounded-full bg-accent-blue/20 pointer-events-none" />
              <div
                className="absolute left-0 h-2 rounded-full bg-gradient-to-r from-accent-blue/40 to-accent-blue pointer-events-none transition-all duration-200"
                style={{ width: `${progress}%` }}
              />

              {/* Slider input - Enhanced for touch with 48px thumb */}
              <input
                type="range"
                min="1"
                max={maxReviews}
                step="1"
                value={numberOfReviews}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                className="relative w-full h-12 rounded-full appearance-none cursor-pointer bg-transparent touch-manipulation
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:size-12
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-accent-blue
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:shadow-accent-blue/30
                  [&::-webkit-slider-thumb]:transition-transform
                  [&::-webkit-slider-thumb]:hover:scale-110
                  [&::-webkit-slider-thumb]:active:scale-95
                  [&::-webkit-slider-thumb]:ring-4
                  [&::-webkit-slider-thumb]:ring-white
                  [&::-webkit-slider-thumb]:cursor-grab
                  [&::-webkit-slider-thumb]:active:cursor-grabbing
                  [&::-moz-range-thumb]:size-12
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-accent-blue
                  [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:shadow-lg
                  [&::-moz-range-thumb]:shadow-accent-blue/30
                  [&::-moz-range-thumb]:transition-transform
                  [&::-moz-range-thumb]:hover:scale-110
                  [&::-moz-range-thumb]:active:scale-95
                  [&::-moz-range-thumb]:ring-4
                  [&::-moz-range-thumb]:ring-white
                  [&::-moz-range-thumb]:cursor-grab
                  [&::-moz-range-thumb]:active:cursor-grabbing"
                aria-label="Number of reviews slider"
              />
            </div>

            {/* Slider markers */}
            <div className="flex justify-between text-xs text-muted-foreground px-0.5">
              <span>1</span>
              {reviewType === "expert" && <span>5</span>}
              <span>{maxReviews}</span>
            </div>
          </div>

          {/* Quick Select Buttons */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {(reviewType === "expert" ? [3, 5, 10] : [1, 2, 3])
              .filter((num) => num <= maxReviews)
              .map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    onNumberChange(num);
                    animatePulse();
                  }}
                  className={cn(
                    "px-3 py-3 sm:py-2 min-h-[48px] rounded-lg border-2 transition-all text-sm font-medium touch-manipulation active:scale-95",
                    numberOfReviews === num
                      ? "border-accent-blue bg-accent-blue/5 text-accent-blue"
                      : "border-border text-muted-foreground hover:border-accent-blue/30 hover:text-foreground"
                  )}
                  aria-label={`Set to ${num} reviews`}
                >
                  {num} {num === 1 ? "review" : "reviews"}
                </button>
              ))}
          </div>

          {/* Pricing Display */}
          {isPaidReview ? (
            <div
              className={cn(
                "rounded-xl bg-gradient-to-br from-accent-peach/5 to-accent-blue/5",
                "border border-accent-peach/20 p-5 space-y-4 transition-all duration-300",
                isAnimating && "scale-105"
              )}
            >
              {/* Price Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Price per review:
                  </span>
                  <span className="font-semibold text-foreground">
                    ${pricePerReview.toFixed(0)}
                  </span>
                </div>

                {currentTier.discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <Sparkles className="size-3" />
                      Volume discount ({currentTier.discount}%):
                    </span>
                    <span className="font-semibold text-green-600">
                      -${totalSavings.toFixed(0)}
                    </span>
                  </div>
                )}

                <div className="border-t border-accent-peach/20 pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-foreground">
                      Total:
                    </span>
                    <span className="text-3xl font-bold text-accent-peach">
                      ${totalPrice.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tier Badge */}
              <div className="flex items-center gap-2 justify-center">
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
                    currentTier.discount === 0 && "bg-accent-blue/10 text-accent-blue",
                    currentTier.discount === 10 && "bg-accent-peach/10 text-accent-peach",
                    currentTier.discount === 15 && "bg-green-500/10 text-green-600"
                  )}
                >
                  {currentTier.discount > 0 && <TrendingUp className="size-3" />}
                  {currentTier.label} - {currentTier.description}
                </div>
              </div>
            </div>
          ) : (
            /* Free Reviews Pricing Display */
            <div
              className={cn(
                "rounded-xl bg-gradient-to-br from-green-500/5 to-accent-sage/5",
                "border border-green-500/20 p-5 space-y-3 transition-all duration-300",
                isAnimating && "scale-105"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-foreground">
                  Total Cost:
                </span>
                <span className="text-3xl font-bold text-green-600">
                  FREE
                </span>
              </div>
              {numberOfReviews === maxReviews && (
                <div className="pt-3 border-t border-green-500/20">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Sparkles className="size-4 text-accent-peach flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground mb-1">
                        Need more than 3 reviews?
                      </p>
                      <p className="text-xs">
                        Upgrade to Expert reviews to request up to 10 professional reviews with faster turnaround times
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Benefits Section */}
          <div className="rounded-xl bg-accent-sage/5 border border-accent-sage/20 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="size-4 text-accent-sage" />
              <span>Why multiple reviews?</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="size-1.5 rounded-full bg-accent-sage mt-1.5 flex-shrink-0" />
                <span>Get diverse perspectives from different experts</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="size-1.5 rounded-full bg-accent-sage mt-1.5 flex-shrink-0" />
                <span>Identify patterns and common feedback areas</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="size-1.5 rounded-full bg-accent-sage mt-1.5 flex-shrink-0" />
                <span>Faster turnaround with parallel reviews</span>
              </li>
              {numberOfReviews >= 6 && (
                <li className="flex items-start gap-2 text-green-600 font-medium">
                  <Sparkles className="size-3.5 mt-0.5 flex-shrink-0" />
                  <span>Unlock {currentTier.discount}% volume discount!</span>
                </li>
              )}
            </ul>
          </div>

          {/* Note for high counts */}
          {numberOfReviews >= 8 && (
            <div className="text-center text-xs text-muted-foreground bg-accent-blue/5 rounded-lg p-3 border border-accent-blue/10">
              Your request will be distributed to {numberOfReviews} expert reviewers simultaneously
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
