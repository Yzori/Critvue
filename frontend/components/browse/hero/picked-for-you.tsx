"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { BrowseReviewItem } from "@/lib/api/browse";
import { ReviewCard } from "@/components/browse/review-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Settings2 } from "lucide-react";

export interface PickedForYouProps {
  recommendations: BrowseReviewItem[];
  userSkills?: string[];
  isLoggedIn?: boolean;
  onCustomizeSkills?: () => void;
}

/**
 * Picked For You Section - Personalized recommendations
 *
 * Features:
 * - Shows up to 3 cards max (focused curation)
 * - Horizontal layout on desktop, stacked on mobile
 * - Personalized based on user skills/history
 * - High prominence (above categories)
 * - Clean, focused presentation
 */
export function PickedForYou({ recommendations, userSkills, isLoggedIn, onCustomizeSkills }: PickedForYouProps) {
  // Limit to 3 cards max for focused curation
  const displayedRecommendations = recommendations.slice(0, 3);
  const [refreshKey, setRefreshKey] = React.useState(0);

  if (displayedRecommendations.length === 0) return null;

  // Get match percentage from review (real score from backend) or fallback
  const getMatchPercentage = (review: BrowseReviewItem, index: number): number => {
    // Use real match_score if available (from backend skill matching)
    if (review.match_score !== undefined && review.match_score !== null) {
      return review.match_score;
    }
    // Fallback: if no skills set, show decreasing placeholder scores
    return 95 - (index * 3);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    // TODO: In real implementation, fetch new recommendations
  };

  return (
    <section className="relative">
      {/* Premium Container */}
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl p-6 md:p-8",
          // Subtle gradient background
          "bg-gradient-to-br from-blue-50/30 via-white to-peach-50/30",
          // Glassmorphic effect
          "backdrop-blur-sm",
          // Gradient border effect
          "border-2 border-transparent",
          // Shadow for depth
          "shadow-xl"
        )}
        style={{
          backgroundImage: "linear-gradient(white, white), linear-gradient(135deg, var(--accent-blue), var(--accent-peach))",
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
        }}
      >
        {/* Subtle shimmer effect */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer"
            style={{
              animation: "shimmer 3s infinite",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative space-y-6">
          {/* Header with Icon */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-gradient-to-br from-accent-blue to-accent-peach flex items-center justify-center shadow-lg">
                <Sparkles className="size-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-accent-blue to-accent-peach bg-clip-text text-transparent">
                  Picked for You
                </h2>
                <p className="text-gray-600 text-sm md:text-base mt-0.5">
                  {userSkills && userSkills.length > 0
                    ? `Perfect matches for ${userSkills.slice(0, 2).join(" & ")} experts`
                    : isLoggedIn
                      ? "Set your skills to get personalized recommendations"
                      : "Sign in to get personalized recommendations"
                  }
                </p>
              </div>
            </div>

            {/* Action buttons - desktop only */}
            <div className="hidden md:flex items-center gap-2">
              {isLoggedIn && onCustomizeSkills && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCustomizeSkills}
                  className="items-center gap-2 border-accent-blue/20 hover:border-accent-blue/40 hover:bg-accent-blue/5"
                >
                  <Settings2 className="size-4" />
                  {userSkills && userSkills.length > 0 ? "Edit Skills" : "Set Skills"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="items-center gap-2 border-accent-blue/20 hover:border-accent-blue/40 hover:bg-accent-blue/5"
              >
                <RefreshCw className="size-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Cards Grid - 3 cards max, responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {displayedRecommendations.map((review, index) => (
              <div key={`${review.id}-${refreshKey}`} className="relative">
                {/* Match Badge */}
                <div className="absolute -top-2 -right-2 z-10">
                  <Badge
                    variant="primary"
                    className={cn(
                      "backdrop-blur-xl bg-accent-blue text-white border-white/20 shadow-lg",
                      "px-3 py-1.5 font-bold text-sm"
                    )}
                  >
                    {getMatchPercentage(review, index)}% Match
                  </Badge>
                </div>

                <ReviewCard
                  review={review}
                  size="medium"
                  importance={95 - (index * 5)}
                  className={cn(
                    "h-full",
                    "animate-in fade-in slide-in-from-bottom-4 duration-500",
                    "hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                  )}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: "backwards",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Action buttons - mobile */}
          <div className="flex md:hidden justify-center gap-2 pt-2">
            {isLoggedIn && onCustomizeSkills && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCustomizeSkills}
                className="items-center gap-2 border-accent-blue/20 hover:border-accent-blue/40 hover:bg-accent-blue/5"
              >
                <Settings2 className="size-4" />
                {userSkills && userSkills.length > 0 ? "Edit" : "Set Skills"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="items-center gap-2 border-accent-blue/20 hover:border-accent-blue/40 hover:bg-accent-blue/5"
            >
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Shimmer animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </section>
  );
}
