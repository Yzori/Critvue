/**
 * Assessment Phase (Combined Step 1)
 *
 * Combines Focus Areas + Rubric Ratings into one streamlined step
 */

"use client";

import * as React from "react";
import {
  Star,
  Info,
  HelpCircle,
  Target,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
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
  Phase1QuickAssessment as Phase1Data,
  Phase2RubricRatings as Phase2Data,
  FocusArea,
  RatingDimension,
} from "@/lib/types/smart-review";

// Dimension icon and color mapping
const getDimensionStyle = (dimensionId: string) => {
  const styles: Record<string, { icon: typeof Star; color: string; bg: string; border: string; accentBg: string }> = {
    functionality: { icon: Code2, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", accentBg: "bg-blue-100" },
    code_quality: { icon: Sparkles, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", accentBg: "bg-purple-100" },
    security: { icon: Shield, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", accentBg: "bg-red-100" },
    test_coverage: { icon: TestTube, color: "text-green-600", bg: "bg-green-50", border: "border-green-200", accentBg: "bg-green-100" },
    visual_hierarchy: { icon: Eye, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200", accentBg: "bg-indigo-100" },
    accessibility: { icon: Accessibility, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200", accentBg: "bg-teal-100" },
    brand_alignment: { icon: Palette, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200", accentBg: "bg-pink-100" },
    usability: { icon: MousePointer, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", accentBg: "bg-orange-100" },
    clarity: { icon: FileText, color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200", accentBg: "bg-cyan-100" },
    structure: { icon: List, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200", accentBg: "bg-violet-100" },
    grammar: { icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", accentBg: "bg-emerald-100" },
    engagement: { icon: Heart, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", accentBg: "bg-rose-100" },
  };
  return styles[dimensionId] || { icon: CheckCircle2, color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", accentBg: "bg-gray-100" };
};

interface AssessmentPhaseProps {
  phase1Data: Phase1Data | null;
  phase2Data: Phase2Data | null;
  focusAreas: FocusArea[];
  dimensions: RatingDimension[];
  contentType: string;
  onPhase1Change: (data: Phase1Data) => void;
  onPhase2Change: (data: Phase2Data) => void;
}

export function AssessmentPhase({
  phase1Data,
  phase2Data,
  focusAreas,
  dimensions,
  contentType,
  onPhase1Change,
  onPhase2Change,
}: AssessmentPhaseProps) {
  // Focus Areas state
  const [selectedAreas, setSelectedAreas] = React.useState<string[]>(
    phase1Data?.primary_focus_areas || []
  );

  // Rubric Ratings state
  const [ratings, setRatings] = React.useState<Record<string, number>>(
    phase2Data?.ratings || {}
  );
  const [collapsedDimensions, setCollapsedDimensions] = React.useState<Set<string>>(new Set());

  // Section collapse state
  const [focusAreasExpanded, setFocusAreasExpanded] = React.useState(true);
  const [ratingsExpanded, setRatingsExpanded] = React.useState(true);

  // Update Phase 1 when focus areas change
  React.useEffect(() => {
    if (selectedAreas.length > 0 && selectedAreas.length <= 6) {
      onPhase1Change({
        overall_rating: phase1Data?.overall_rating || 0,
        primary_focus_areas: selectedAreas,
        quick_summary: phase1Data?.quick_summary || "",
      });
    }
  }, [selectedAreas, phase1Data?.overall_rating, phase1Data?.quick_summary, onPhase1Change]);

  // Update Phase 2 when ratings change
  React.useEffect(() => {
    if (Object.keys(ratings).length > 0) {
      onPhase2Change({
        content_type: contentType,
        ratings,
      });
    }
  }, [ratings, contentType, onPhase2Change]);

  const toggleFocusArea = (areaId: string) => {
    setSelectedAreas((prev) =>
      prev.includes(areaId)
        ? prev.filter((id) => id !== areaId)
        : [...prev, areaId]
    );
  };

  const setRating = (dimensionId: string, rating: number) => {
    setRatings((prev) => ({ ...prev, [dimensionId]: rating }));
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

  const focusAreasValid = selectedAreas.length > 0 && selectedAreas.length <= 6;
  const ratingsCount = Object.keys(ratings).length;
  const ratingsValid = ratingsCount >= 1;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Section 1: Focus Areas */}
        <div className="rounded-xl border-2 border-accent-blue/20 bg-gradient-to-r from-accent-blue/5 to-purple-500/5 p-4 md:p-5">
          <button
            type="button"
            onClick={() => setFocusAreasExpanded(!focusAreasExpanded)}
            className="w-full flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "size-10 rounded-full flex items-center justify-center",
                focusAreasValid ? "bg-green-500 text-white" : "bg-accent-blue/20"
              )}>
                {focusAreasValid ? (
                  <CheckCircle2 className="size-5" />
                ) : (
                  <Target className="size-5 text-accent-blue" />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Focus Areas</h4>
                <p className="text-sm text-muted-foreground">
                  {focusAreasValid ? `${selectedAreas.length} selected` : "Select 1-6 areas"}
                </p>
              </div>
            </div>
            {focusAreasExpanded ? (
              <ChevronUp className="size-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-5 text-muted-foreground" />
            )}
          </button>

          {focusAreasExpanded && (
            <div className="mt-4 pt-4 border-t border-accent-blue/10">
              <div className="flex flex-wrap gap-2">
                {focusAreas.map((area) => {
                  const isSelected = selectedAreas.includes(area.id);
                  return (
                    <Tooltip key={area.id} delayDuration={300}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => toggleFocusArea(area.id)}
                          className={cn(
                            "px-3 py-2 rounded-lg border-2 transition-all",
                            "text-sm font-medium flex items-center gap-1.5",
                            "hover:scale-105 active:scale-95",
                            "touch-manipulation min-h-[44px]",
                            isSelected
                              ? "bg-accent-blue text-white border-accent-blue shadow-md"
                              : "bg-white text-foreground border-border hover:border-accent-blue/50"
                          )}
                        >
                          {isSelected && <CheckCircle2 className="size-3.5" />}
                          {area.label}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs">{area.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Rubric Ratings */}
        <div className="rounded-xl border-2 border-purple-200/50 bg-gradient-to-r from-purple-50/30 to-indigo-50/30 p-4 md:p-5">
          <button
            type="button"
            onClick={() => setRatingsExpanded(!ratingsExpanded)}
            className="w-full flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "size-10 rounded-full flex items-center justify-center",
                ratingsValid ? "bg-green-500 text-white" : "bg-purple-100"
              )}>
                {ratingsValid ? (
                  <CheckCircle2 className="size-5" />
                ) : (
                  <Star className="size-5 text-purple-600" />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Quality Ratings</h4>
                <p className="text-sm text-muted-foreground">
                  {ratingsCount > 0 ? `${ratingsCount}/${dimensions.length} rated` : "Rate key dimensions"}
                </p>
              </div>
            </div>
            {ratingsExpanded ? (
              <ChevronUp className="size-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-5 text-muted-foreground" />
            )}
          </button>

          {ratingsExpanded && (
            <div className="mt-4 pt-4 border-t border-purple-200/50 space-y-3">
              {dimensions.map((dimension) => {
                const isCollapsed = collapsedDimensions.has(dimension.id);
                const rating = ratings[dimension.id];
                const style = getDimensionStyle(dimension.id);
                const DimensionIcon = style.icon;

                // Collapsed view (after rating)
                if (isCollapsed && rating) {
                  return (
                    <button
                      key={dimension.id}
                      type="button"
                      onClick={() => toggleDimension(dimension.id)}
                      className={cn(
                        "w-full rounded-lg border p-3 flex items-center justify-between gap-3 transition-all touch-manipulation",
                        style.border, style.bg, "hover:shadow-sm"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn("size-8 rounded-lg flex items-center justify-center shrink-0", style.accentBg)}>
                          <DimensionIcon className={cn("size-4", style.color)} />
                        </div>
                        <span className="text-sm font-medium text-foreground truncate">{dimension.label}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn("size-3", star <= rating ? "text-amber-400 fill-current" : "text-gray-300")}
                            />
                          ))}
                        </div>
                        <ChevronDown className="size-4 text-muted-foreground" />
                      </div>
                    </button>
                  );
                }

                // Expanded view
                return (
                  <div key={dimension.id} className={cn("rounded-lg border p-4 space-y-3", style.border, style.bg)}>
                    <div className="flex items-start gap-3">
                      <div className={cn("size-9 rounded-lg flex items-center justify-center shrink-0", style.accentBg)}>
                        <DimensionIcon className={cn("size-4", style.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-semibold">{dimension.label}</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="text-muted-foreground hover:text-foreground">
                                <Info className="size-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs">{dimension.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{dimension.description}</p>
                      </div>
                    </div>

                    {/* Star Rating Row */}
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isSelected = (rating || 0) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(dimension.id, star)}
                            className={cn(
                              "size-10 rounded-lg transition-all duration-200",
                              "flex items-center justify-center",
                              "hover:scale-105 active:scale-95 touch-manipulation",
                              isSelected
                                ? "text-amber-400 bg-amber-50 border-2 border-amber-300"
                                : "text-gray-300 bg-white border-2 border-gray-200 hover:text-amber-300"
                            )}
                          >
                            <Star className={cn("size-5", isSelected && "fill-current")} />
                          </button>
                        );
                      })}
                      {rating && <span className="ml-2 text-sm font-medium">{rating}/5</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Progress Summary */}
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "size-6 rounded-full flex items-center justify-center text-xs font-bold",
                focusAreasValid && ratingsValid ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
              )}>
                {focusAreasValid && ratingsValid ? "1" : "!"}
              </div>
              <span className={cn(
                "text-sm font-medium",
                focusAreasValid && ratingsValid ? "text-green-600" : "text-muted-foreground"
              )}>
                {!focusAreasValid && "Select focus areas"}
                {focusAreasValid && !ratingsValid && "Rate at least 1 dimension"}
                {focusAreasValid && ratingsValid && "Assessment complete!"}
              </span>
            </div>
            {focusAreasValid && ratingsValid && (
              <span className="text-xs text-muted-foreground">Next: Feedback & Verdict</span>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
