/**
 * Phase 1: Quick Assessment
 *
 * - Overall rating (1-5 stars)
 * - Primary focus areas (multi-select chips)
 * - Quick summary (50-300 chars)
 */

"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Phase1QuickAssessment as Phase1Data,
  FocusArea,
} from "@/lib/types/smart-review";

interface Phase1QuickAssessmentProps {
  data: Phase1Data | null;
  focusAreas: FocusArea[];
  onChange: (data: Phase1Data) => void;
}

export function Phase1QuickAssessment({
  data,
  focusAreas,
  onChange,
}: Phase1QuickAssessmentProps) {
  const [rating, setRating] = React.useState(data?.overall_rating || 0);
  const [selectedAreas, setSelectedAreas] = React.useState<string[]>(
    data?.primary_focus_areas || []
  );
  const [summary, setSummary] = React.useState(data?.quick_summary || "");

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
    <div className="space-y-8">
      {/* Overall Rating */}
      <div className="space-y-3">
        <Label htmlFor="overall-rating" className="text-lg font-semibold">
          Overall Rating
        </Label>
        <p className="text-sm text-muted-foreground">
          How would you rate this overall?
        </p>
        <div className="flex items-center gap-3 sm:gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={cn(
                "size-14 sm:size-12 rounded-lg transition-all duration-200",
                "flex items-center justify-center",
                "hover:scale-110 active:scale-95",
                "touch-manipulation", // Better touch response
                rating >= star
                  ? "text-amber-400 bg-amber-50 border-2 border-amber-300"
                  : "text-gray-300 bg-gray-50 border-2 border-gray-200 hover:text-amber-300 hover:bg-amber-50/50"
              )}
              aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
              aria-pressed={rating >= star}
            >
              <Star
                className={cn(
                  "size-7 sm:size-6",
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
      <div className="space-y-3">
        <Label className="text-lg font-semibold">Primary Focus Areas</Label>
        <p className="text-sm text-muted-foreground">
          Select 1-6 areas you'll focus on in your review
        </p>
        <div className="flex flex-wrap gap-2">
          {focusAreas.map((area) => {
            const isSelected = selectedAreas.includes(area.id);
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => toggleFocusArea(area.id)}
                className={cn(
                  "px-4 py-2 rounded-lg border-2 transition-all",
                  "text-sm font-medium",
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
              </button>
            );
          })}
        </div>
        {selectedAreas.length > 6 && (
          <p className="text-xs text-amber-600">
            Maximum 6 focus areas. Please deselect some.
          </p>
        )}
      </div>

      {/* Quick Summary */}
      <div className="space-y-3">
        <Label htmlFor="quick-summary" className="text-lg font-semibold">
          Quick Summary
        </Label>
        <p className="text-sm text-muted-foreground">
          Briefly summarize your overall impression (50-300 characters)
        </p>
        <Textarea
          id="quick-summary"
          placeholder="e.g., 'Well-structured code with good separation of concerns. Some performance optimizations needed.'"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className={cn(
            "min-h-[100px] text-base resize-y",
            "focus:ring-2 focus:ring-accent-blue/50"
          )}
          aria-describedby="summary-char-count"
          maxLength={300}
        />
        <div
          id="summary-char-count"
          className="flex items-center justify-between text-sm"
        >
          <span className={charCountColor}>
            {charCount} character{charCount !== 1 ? "s" : ""}
          </span>
          <span className="text-muted-foreground">
            {charCount < 50
              ? `${50 - charCount} more needed`
              : charCount > 300
                ? `${charCount - 300} over limit`
                : "✓ Good"}
          </span>
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
      </div>
    </div>
  );
}
