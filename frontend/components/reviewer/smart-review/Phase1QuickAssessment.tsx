/**
 * Phase 1: Quick Assessment
 *
 * - Overall rating (1-5 stars)
 * - Primary focus areas (multi-select chips)
 * - Quick summary (50-300 chars)
 */

"use client";

import * as React from "react";
import { Star, HelpCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Phase1QuickAssessment as Phase1Data,
  FocusArea,
} from "@/lib/types/smart-review";

interface Phase1QuickAssessmentProps {
  data: Phase1Data | null;
  focusAreas: FocusArea[];
  contentType?: string;
  onChange: (data: Phase1Data) => void;
}

export function Phase1QuickAssessment({
  data,
  focusAreas,
  contentType = "code",
  onChange,
}: Phase1QuickAssessmentProps) {
  const [rating, setRating] = React.useState(data?.overall_rating || 0);
  const [selectedAreas, setSelectedAreas] = React.useState<string[]>(
    data?.primary_focus_areas || []
  );
  const [summary, setSummary] = React.useState(data?.quick_summary || "");

  // Contextual placeholder based on content type
  const getPlaceholder = () => {
    const placeholders = {
      code: "What's your gut take on this code? Clean? Complex? Security concerns?",
      design: "What's your first impression of this design? Does it feel cohesive? Any standout elements?",
      art: "How does this artwork make you feel? What catches your eye first?",
      writing: "What's the overall vibe of this piece? Clear? Engaging? Any tone issues?",
      music: "How does this sound to you? What's the energy? Production quality?",
      video: "What's your take on this video? Pacing? Visual quality? Storytelling?",
    };
    return placeholders[contentType as keyof typeof placeholders] || placeholders.code;
  };

  // Update parent when any field changes
  React.useEffect(() => {
    if (rating > 0 && selectedAreas.length > 0 && summary.length >= 50) {
      onChange({
        overall_rating: rating,
        primary_focus_areas: selectedAreas,
        quick_summary: summary,
      });
    }
  }, [rating, selectedAreas, summary, onChange]);

  const toggleFocusArea = (areaId: string) => {
    setSelectedAreas((prev) =>
      prev.includes(areaId)
        ? prev.filter((id) => id !== areaId)
        : [...prev, areaId]
    );
  };

  const charCount = summary.length;
  const charCountColor =
    charCount < 50
      ? "text-amber-600"
      : charCount > 300
        ? "text-red-600"
        : "text-green-600";

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Overall Rating */}
        <div className="space-y-2">
          <Label htmlFor="overall-rating" className="text-lg font-semibold">
            Overall Rating
          </Label>
          <p className="text-sm text-muted-foreground">
            How would you rate this overall?
          </p>
        <div className="flex items-center gap-1.5 md:gap-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={cn(
                "size-12 md:size-14 rounded-lg transition-all duration-200",
                "flex items-center justify-center",
                "hover:scale-105 active:scale-95",
                "touch-manipulation",
                rating >= star
                  ? "text-amber-400 bg-amber-50 border-2 border-amber-300"
                  : "text-gray-300 bg-gray-50 border-2 border-gray-200 hover:text-amber-300 hover:bg-amber-50/50"
              )}
              aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
              aria-pressed={rating >= star}
            >
              <Star
                className={cn(
                  "size-6 md:size-7",
                  rating >= star && "fill-current"
                )}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm font-medium text-foreground">
              {rating}/5
            </span>
          )}
        </div>
      </div>

      {/* Focus Areas */}
      <div className="space-y-2">
        <Label className="text-lg font-semibold">Primary Focus Areas</Label>
        <p className="text-sm text-muted-foreground">
          Select 1-6 areas you'll focus on in your review
        </p>
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
                      "px-4 py-3 rounded-lg border-2 transition-all",
                      "text-sm font-medium flex items-center gap-2",
                      "hover:scale-105 active:scale-95",
                      "touch-manipulation min-h-[48px]", // Touch-friendly
                      isSelected
                        ? "bg-accent-blue text-white border-accent-blue"
                        : "bg-card text-foreground border-border hover:border-accent-blue/50"
                    )}
                    aria-pressed={isSelected}
                    aria-label={`${area.label}: ${area.description}`}
                  >
                    {area.label}
                    <HelpCircle className="size-3 opacity-60" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-xs"
                >
                  <p className="text-xs">{area.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        {selectedAreas.length > 6 && (
          <p className="text-xs text-amber-600">
            Maximum 6 focus areas. Please deselect some.
          </p>
        )}
      </div>

      {/* Quick Summary - Modernized */}
      <div className="space-y-3">
        {/* Conversational Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <Label htmlFor="quick-summary" className="text-lg font-semibold text-foreground">
              In a nutshell...
            </Label>
            <p className="text-sm text-muted-foreground mt-0.5">
              Share your first impression with the creator
            </p>
          </div>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="size-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors shrink-0"
                aria-label="Tips for writing a good summary"
              >
                <HelpCircle className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs font-medium mb-1">💡 Writing Tips:</p>
              <ul className="text-xs space-y-1">
                <li>• Focus on your honest first impression</li>
                <li>• Be specific but concise (80-150 chars is ideal)</li>
                <li>• Mention what stood out most to you</li>
              </ul>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Modern Textarea with Enhanced Styling */}
        <div className="relative">
          <Textarea
            id="quick-summary"
            placeholder={getPlaceholder()}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className={cn(
              "min-h-[120px] text-base resize-y",
              "rounded-xl border-2 shadow-inner",
              "bg-gradient-to-br from-white to-gray-50/30",
              "px-4 py-3.5 leading-relaxed",
              "placeholder:text-muted-foreground/60 placeholder:italic",
              "focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue/50",
              "transition-all duration-200",
              charCount >= 50 && charCount <= 300 && "border-green-300 bg-green-50/20",
              charCount > 300 && "border-red-300 bg-red-50/20"
            )}
            aria-describedby="summary-progress"
            maxLength={300}
          />
          {/* Character Count Badge - Floating */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              charCount < 50 && "bg-amber-100 text-amber-700",
              charCount >= 50 && charCount <= 150 && "bg-green-100 text-green-700",
              charCount > 150 && charCount <= 300 && "bg-blue-100 text-blue-700",
              charCount > 300 && "bg-red-100 text-red-700"
            )}>
              {charCount}
            </span>
          </div>
        </div>

        {/* Visual Progress Meter */}
        <div id="summary-progress" className="space-y-2">
          {/* Progress Bar */}
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            {/* Ideal range indicator (80-150 chars) */}
            <div
              className="absolute h-full bg-green-200/40"
              style={{ left: '26.67%', width: '23.33%' }}
            />
            {/* Progress fill */}
            <div
              className={cn(
                "absolute h-full transition-all duration-300 rounded-full",
                charCount < 50 && "bg-amber-400",
                charCount >= 50 && charCount <= 150 && "bg-green-500",
                charCount > 150 && charCount <= 300 && "bg-blue-500",
                charCount > 300 && "bg-red-500"
              )}
              style={{ width: `${Math.min((charCount / 300) * 100, 100)}%` }}
            />
            {/* Milestone markers */}
            <div className="absolute top-0 h-full w-px bg-gray-300" style={{ left: '16.67%' }} />
            <div className="absolute top-0 h-full w-px bg-green-400" style={{ left: '26.67%' }} />
            <div className="absolute top-0 h-full w-px bg-green-400" style={{ left: '50%' }} />
          </div>

          {/* Progress Labels */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className={cn(
                "font-medium",
                charCount >= 50 ? "text-green-600" : "text-muted-foreground"
              )}>
                {charCount >= 50 ? "✓" : "○"} 50 min
              </span>
              <span className={cn(
                "font-medium",
                charCount >= 80 && charCount <= 150 ? "text-green-600" : "text-muted-foreground"
              )}>
                80-150 ideal
              </span>
            </div>
            <span className="text-muted-foreground">300 max</span>
          </div>

          {/* Contextual Feedback */}
          <div className="text-xs font-medium">
            {charCount === 0 && (
              <p className="text-muted-foreground italic">
                💭 Start typing your honest first impression...
              </p>
            )}
            {charCount > 0 && charCount < 50 && (
              <p className="text-amber-600">
                📝 Keep going! {50 - charCount} more character{50 - charCount !== 1 ? 's' : ''} to reach minimum
              </p>
            )}
            {charCount >= 50 && charCount < 80 && (
              <p className="text-green-600">
                ✓ Good! Consider adding a bit more detail (ideal: 80-150 chars)
              </p>
            )}
            {charCount >= 80 && charCount <= 150 && (
              <p className="text-green-600 flex items-center gap-1">
                <span className="text-base">✨</span> Perfect length! Clear and concise
              </p>
            )}
            {charCount > 150 && charCount <= 300 && (
              <p className="text-blue-600">
                📊 Detailed summary ({300 - charCount} characters remaining)
              </p>
            )}
            {charCount > 300 && (
              <p className="text-red-600">
                ⚠️ {charCount - 300} character{charCount - 300 !== 1 ? 's' : ''} over limit - please shorten
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Validation Summary */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <h4 className="text-sm font-semibold mb-2">Phase 1 Progress:</h4>
        <ul className="space-y-1 text-sm">
          <li className={cn(rating > 0 ? "text-green-600" : "text-muted-foreground")}>
            {rating > 0 ? "✓" : "○"} Overall rating selected
          </li>
          <li
            className={cn(
              selectedAreas.length > 0 && selectedAreas.length <= 6
                ? "text-green-600"
                : "text-muted-foreground"
            )}
          >
            {selectedAreas.length > 0 && selectedAreas.length <= 6 ? "✓" : "○"}{" "}
            Focus areas selected ({selectedAreas.length}/6)
          </li>
          <li
            className={cn(
              charCount >= 50 && charCount <= 300
                ? "text-green-600"
                : "text-muted-foreground"
            )}
          >
            {charCount >= 50 && charCount <= 300 ? "✓" : "○"} Quick summary complete
          </li>
        </ul>
        {rating > 0 && selectedAreas.length > 0 && selectedAreas.length <= 6 && charCount >= 50 && charCount <= 300 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs font-medium text-green-600 flex items-center gap-1">
              <span className="text-base">🎉</span> Nice! You've completed your quick assessment.
            </p>
          </div>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}
