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
import {
  Star,
  Info,
  HelpCircle,
  Code2,
  Shield,
  Sparkles,
  TestTube,
  Eye,
  Accessibility,
  Palette,
  MousePointer,
  FileText,
  List,
  BookOpen,
  Heart,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
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

// Dimension icon and color mapping
const getDimensionStyle = (dimensionId: string) => {
  const styles = {
    // Code dimensions
    functionality: {
      icon: Code2,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      accentBg: "bg-blue-100",
    },
    code_quality: {
      icon: Sparkles,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200",
      accentBg: "bg-purple-100",
    },
    security: {
      icon: Shield,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      accentBg: "bg-red-100",
    },
    test_coverage: {
      icon: TestTube,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
      accentBg: "bg-green-100",
    },
    // Design dimensions
    visual_hierarchy: {
      icon: Eye,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      accentBg: "bg-indigo-100",
    },
    accessibility: {
      icon: Accessibility,
      color: "text-teal-600",
      bg: "bg-teal-50",
      border: "border-teal-200",
      accentBg: "bg-teal-100",
    },
    brand_alignment: {
      icon: Palette,
      color: "text-pink-600",
      bg: "bg-pink-50",
      border: "border-pink-200",
      accentBg: "bg-pink-100",
    },
    usability: {
      icon: MousePointer,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
      accentBg: "bg-orange-100",
    },
    // Writing dimensions
    clarity: {
      icon: FileText,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      border: "border-cyan-200",
      accentBg: "bg-cyan-100",
    },
    structure: {
      icon: List,
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-200",
      accentBg: "bg-violet-100",
    },
    grammar: {
      icon: BookOpen,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      accentBg: "bg-emerald-100",
    },
    engagement: {
      icon: Heart,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-200",
      accentBg: "bg-rose-100",
    },
  };

  return styles[dimensionId as keyof typeof styles] || {
    icon: CheckCircle2,
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
    accentBg: "bg-gray-100",
  };
};

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
  const [collapsedDimensions, setCollapsedDimensions] = React.useState<Set<string>>(
    new Set()
  );
  const [collapseAll, setCollapseAll] = React.useState(false);

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

    // Auto-collapse when rated
    setCollapsedDimensions((prev) => new Set(prev).add(dimensionId));
  };

  const toggleDimension = (dimensionId: string) => {
    setCollapsedDimensions((prev) => {
      const next = new Set(prev);
      if (next.has(dimensionId)) {
        next.delete(dimensionId);
      } else {
        next.add(dimensionId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (collapseAll) {
      // Expand all
      setCollapsedDimensions(new Set());
      setCollapseAll(false);
    } else {
      // Collapse all rated dimensions
      const ratedDimensions = new Set(Object.keys(ratings));
      setCollapsedDimensions(ratedDimensions);
      setCollapseAll(true);
    }
  };

  const completedCount = Object.keys(ratings).length;
  const totalCount = dimensions.length;

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between gap-2">
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
            {/* Collapse/Expand All Toggle */}
            {completedCount > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs font-medium text-accent-blue hover:text-accent-blue/80 flex items-center gap-1 min-h-[48px] px-3 py-2 touch-manipulation"
              >
                {collapseAll ? "Expand All" : "Collapse Rated"}
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Rate each dimension from 1 (poor) to 5 (excellent)
          </p>
        </div>

      {/* Rating Dimensions */}
      <div className="space-y-4">
        {dimensions.map((dimension) => {
          const isCollapsed = collapsedDimensions.has(dimension.id);
          const rating = ratings[dimension.id];
          const style = getDimensionStyle(dimension.id);
          const DimensionIcon = style.icon;

          // Collapsed summary view
          if (isCollapsed && rating) {
            return (
              <button
                key={dimension.id}
                type="button"
                onClick={() => toggleDimension(dimension.id)}
                className={cn(
                  "w-full rounded-xl border p-3 flex items-center justify-between gap-3 transition-all touch-manipulation animate-in slide-in-from-top-2 duration-200",
                  style.border,
                  style.bg,
                  "hover:shadow-sm"
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn("size-10 rounded-lg flex items-center justify-center shrink-0", style.accentBg)}>
                    <DimensionIcon className={cn("size-5", style.color)} />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {dimension.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Rated {rating}/5
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "size-3",
                          star <= rating
                            ? "text-amber-400 fill-current"
                            : "text-gray-300"
                        )}
                      />
                    ))}
                  </div>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </div>
              </button>
            );
          }

          // Expanded full view
          return (
            <div
              key={dimension.id}
              className={cn(
                "rounded-xl border p-4 space-y-3 transition-all animate-in fade-in-50 duration-200",
                style.border,
                style.bg
              )}
            >
              {/* Dimension Header with Icon */}
              <div className="flex items-start gap-3">
                <div className={cn("size-10 rounded-lg flex items-center justify-center shrink-0", style.accentBg)}>
                  <DimensionIcon className={cn("size-5", style.color)} />
                </div>
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
                          <ul className="text-xs space-y-1.5">
                            {dimension.criteria.map((criterion, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className={cn("size-1 rounded-full mt-1.5 shrink-0", style.color.replace('text-', 'bg-'))} />
                                <span>{criterion}</span>
                              </li>
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
                  const isSelected = (rating || 0) >= star;
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
                {rating && (
                  <span className="ml-2 text-sm font-medium text-foreground">
                    {rating}/5
                  </span>
                )}
              </div>

              {/* Criteria Checklist */}
              <div className={cn("pt-3 border-t", style.border)}>
                <p className="text-xs font-semibold text-foreground mb-2.5 flex items-center gap-1.5">
                  <span className={cn("size-1 rounded-full", style.color.replace('text-', 'bg-'))} />
                  Evaluation Criteria
                </p>
                <ul className="space-y-2">
                  {dimension.criteria.map((criterion, i) => (
                    <li key={i} className="text-xs text-foreground flex items-start gap-2 leading-relaxed">
                      <span className={cn("size-1.5 rounded-full mt-1.5 shrink-0", style.color.replace('text-', 'bg-'))} />
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
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
