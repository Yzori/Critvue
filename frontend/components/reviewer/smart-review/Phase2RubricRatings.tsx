/**
 * Phase 2: Rubric Ratings
 *
 * Content-specific rating dimensions:
 * - Code: functionality, code_quality, security, test_coverage
 * - Design: visual_hierarchy, accessibility, brand_alignment, usability
 * - Writing: clarity, structure, grammar, engagement
 */

"use client";

import * as React from "react";
import { Star, Info, HelpCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Phase2RubricRatings as Phase2Data,
  RatingDimension,
} from "@/lib/types/smart-review";

interface Phase2RubricRatingsProps {
  data: Phase2Data | null;
  dimensions: RatingDimension[];
  contentType: string;
  onChange: (data: Phase2Data) => void;
}

export function Phase2RubricRatings({
  data,
  dimensions,
  contentType,
  onChange,
}: Phase2RubricRatingsProps) {
  const [ratings, setRatings] = React.useState<Record<string, number>>(
    data?.ratings || {}
  );

  // Update parent when ratings change
  React.useEffect(() => {
    if (Object.keys(ratings).length > 0) {
      onChange({
        content_type: contentType,
        ratings,
      });
    }
  }, [ratings, contentType, onChange]);

  const setRating = (dimensionId: string, rating: number) => {
    setRatings((prev) => ({
      ...prev,
      [dimensionId]: rating,
    }));
  };

  const completedCount = Object.keys(ratings).length;
  const totalCount = dimensions.length;

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Rate Specific Dimensions</h3>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="size-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label="Rating guide"
                >
                  <HelpCircle className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-sm">
                <p className="font-medium mb-2 text-xs">Rating Guide:</p>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  <div>
                    <p className="font-medium">1 - Poor</p>
                    <p className="text-muted-foreground">Major issues</p>
                  </div>
                  <div>
                    <p className="font-medium">2 - Fair</p>
                    <p className="text-muted-foreground">Needs work</p>
                  </div>
                  <div>
                    <p className="font-medium">3 - Good</p>
                    <p className="text-muted-foreground">Acceptable</p>
                  </div>
                  <div>
                    <p className="font-medium">4 - Great</p>
                    <p className="text-muted-foreground">Above average</p>
                  </div>
                  <div>
                    <p className="font-medium">5 - Excellent</p>
                    <p className="text-muted-foreground">Outstanding</p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Rate each dimension from 1 (poor) to 5 (excellent)
          </p>
        </div>

      {/* Rating Dimensions */}
      <div className="space-y-4">
        {dimensions.map((dimension) => (
          <div
            key={dimension.id}
            className="rounded-xl border border-border bg-card p-4 space-y-3"
          >
            {/* Dimension Header */}
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-semibold">
                    {dimension.label}
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`More info about ${dimension.label}`}
                        >
                          <Info className="size-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-medium mb-2">{dimension.description}</p>
                        <ul className="text-xs space-y-1">
                          {dimension.criteria.map((criterion, i) => (
                            <li key={i}>• {criterion}</li>
                          ))}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {dimension.description}
                </p>
              </div>
            </div>

            {/* Star Rating */}
            <div className="flex items-center gap-1.5 md:gap-3">
              {[1, 2, 3, 4, 5].map((star) => {
                const isSelected = (ratings[dimension.id] || 0) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(dimension.id, star)}
                    className={cn(
                      "size-12 md:size-11 rounded-lg transition-all duration-200",
                      "flex items-center justify-center",
                      "hover:scale-105 active:scale-95",
                      "touch-manipulation",
                      isSelected
                        ? "text-amber-400 bg-amber-50 border-2 border-amber-300"
                        : "text-gray-300 bg-gray-50 border-2 border-gray-200 hover:text-amber-300 hover:bg-amber-50/50"
                    )}
                    aria-label={`Rate ${dimension.label} ${star} star${star !== 1 ? "s" : ""}`}
                    aria-pressed={isSelected}
                  >
                    <Star
                      className={cn(
                        "size-6 md:size-5",
                        isSelected && "fill-current"
                      )}
                    />
                  </button>
                );
              })}
              {ratings[dimension.id] && (
                <span className="ml-2 text-sm font-medium text-foreground">
                  {ratings[dimension.id]}/5
                </span>
              )}
            </div>

            {/* Criteria Checklist */}
            <div className="pt-2 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Evaluation Criteria:
              </p>
              <ul className="space-y-1">
                {dimension.criteria.map((criterion, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start">
                    <span className="text-accent-blue mr-1.5">•</span>
                    <span>{criterion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Summary */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <h4 className="text-sm font-semibold mb-2">Phase 2 Progress:</h4>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {completedCount} of {totalCount} dimensions rated
          </p>
          <div className="flex items-center gap-1">
            {dimensions.map((dim) => (
              <div
                key={dim.id}
                className={cn(
                  "size-2 rounded-full",
                  ratings[dim.id]
                    ? "bg-green-500"
                    : "bg-gray-300"
                )}
                aria-label={`${dim.label}: ${ratings[dim.id] ? `${ratings[dim.id]}/5` : "not rated"}`}
              />
            ))}
          </div>
        </div>
        {completedCount === totalCount && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs font-medium text-green-600 flex items-center gap-1">
              <span className="text-base">✨</span> Great work! All dimensions have been rated.
            </p>
          </div>
        )}
      </div>

    </div>
    </TooltipProvider>
  );
}
