/**
 * Verdict Card Component
 *
 * Final verdict with:
 * - Star rating (1-5)
 * - Summary (50-300 chars)
 * - Top 3 takeaways (issue + fix pairs)
 * - Optional executive summary
 * - Optional follow-up offer
 */

"use client";

import * as React from "react";
import {
  Star,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  CalendarClock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AutoGrowTextarea } from "@/components/ui/auto-grow-textarea";

import { useReviewStudio } from "../context/ReviewStudioContext";
import type { TopTakeaway } from "@/lib/types/smart-review";

// ===== Star Rating Component =====

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: "sm" | "md" | "lg";
}

function StarRating({ value, onChange, size = "md" }: StarRatingProps) {
  const [hovered, setHovered] = React.useState<number | null>(null);

  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-7 w-7",
    lg: "h-10 w-10",
  };

  const labels = [
    "Needs major work",
    "Below expectations",
    "Meets expectations",
    "Exceeds expectations",
    "Exceptional",
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((rating) => {
          const isActive = rating <= (hovered ?? value);
          return (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(rating)}
              onMouseEnter={() => setHovered(rating)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "transition-all duration-150",
                "hover:scale-110 active:scale-95",
                "focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 rounded"
              )}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  "transition-colors",
                  isActive
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-transparent text-muted-foreground"
                )}
              />
            </button>
          );
        })}
      </div>
      {(hovered || value > 0) && (
        <p className="text-sm text-muted-foreground">
          {labels[(hovered ?? value) - 1]}
        </p>
      )}
    </div>
  );
}

// ===== Takeaway Item Component =====

interface TakeawayItemProps {
  index: number;
  takeaway: TopTakeaway;
  onChange: (takeaway: TopTakeaway) => void;
}

function TakeawayItem({ index, takeaway, onChange }: TakeawayItemProps) {
  const isComplete = takeaway.issue.length >= 5 && takeaway.fix.length >= 5;

  return (
    <div
      className={cn(
        "p-3 sm:p-4 rounded-lg border-2 transition-all",
        isComplete
          ? "border-green-200 dark:border-green-500/40 bg-green-50/50 dark:bg-green-500/10"
          : "border-border bg-background"
      )}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <div
          className={cn(
            "size-7 rounded-full flex items-center justify-center shrink-0 font-bold text-sm",
            isComplete
              ? "bg-green-500 text-white"
              : "bg-muted text-muted-foreground"
          )}
        >
          {index + 1}
        </div>

        <div className="flex-1 space-y-3">
          {/* Issue */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Issue / Priority Item
            </label>
            <Input
              value={takeaway.issue}
              onChange={(e) =>
                onChange({ ...takeaway, issue: e.target.value })
              }
              placeholder={`Priority ${index + 1}: What needs attention?`}
              className="text-sm"
            />
          </div>

          {/* Arrow */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowRight className="h-4 w-4" />
            <span className="text-xs">leads to</span>
          </div>

          {/* Fix */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Recommended Action
            </label>
            <Input
              value={takeaway.fix}
              onChange={(e) => onChange({ ...takeaway, fix: e.target.value })}
              placeholder="What should they do about it?"
              className="text-sm"
            />
          </div>
        </div>

        {isComplete && (
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
        )}
      </div>
    </div>
  );
}

// ===== Main Verdict Card Component =====

interface VerdictCardProps {
  className?: string;
}

export function VerdictCardEditor({ className }: VerdictCardProps) {
  const { state, updateVerdict } = useReviewStudio();
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const verdict = state.verdictCard;

  if (!verdict) return null;

  const summaryLength = verdict.summary.length;
  const isSummaryValid = summaryLength >= 50 && summaryLength <= 300;
  const areTakeawaysComplete = verdict.topTakeaways.every(
    (t) => t.issue.length >= 5 && t.fix.length >= 5
  );
  const isComplete =
    verdict.rating >= 1 &&
    verdict.rating <= 5 &&
    isSummaryValid &&
    areTakeawaysComplete;

  const handleTakeawayChange = (index: number, takeaway: TopTakeaway) => {
    const newTakeaways = [...verdict.topTakeaways];
    newTakeaways[index] = takeaway;
    updateVerdict({ topTakeaways: newTakeaways });
  };

  return (
    <div className={cn("space-y-4 sm:space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent-blue" />
          Final Verdict
        </h2>
        {isComplete && (
          <span className="text-xs bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Ready to submit
          </span>
        )}
      </div>

      {/* Overall Rating */}
      <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-500/40 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-500/20 dark:to-yellow-500/20">
        <label className="text-sm font-medium mb-3 block">
          Overall Rating <span className="text-red-500">*</span>
        </label>
        <StarRating
          value={verdict.rating}
          onChange={(rating) => updateVerdict({ rating })}
          size="lg"
        />
      </div>

      {/* Summary */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            Summary <span className="text-red-500">*</span>
          </label>
          <span
            className={cn(
              "text-xs",
              summaryLength < 50
                ? "text-amber-600"
                : summaryLength > 300
                  ? "text-red-600"
                  : "text-green-600"
            )}
          >
            {summaryLength}/300 (min 50)
          </span>
        </div>
        <AutoGrowTextarea
          value={verdict.summary}
          onChange={(value) => updateVerdict({ summary: value })}
          placeholder="Provide a concise summary of your review. What's the overall impression? What are the key strengths and areas for improvement?"
          className="text-sm"
          minRows={3}
          maxLength={350}
        />
        {summaryLength > 0 && summaryLength < 50 && (
          <p className="text-xs text-amber-600">
            {50 - summaryLength} more characters needed
          </p>
        )}
      </div>

      {/* Top 3 Takeaways */}
      <div className="space-y-3">
        <label className="text-sm font-medium">
          Top 3 Takeaways <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-muted-foreground -mt-1">
          The most important things the creator should focus on
        </p>

        <div className="space-y-3">
          {verdict.topTakeaways.map((takeaway, index) => (
            <TakeawayItem
              key={index}
              index={index}
              takeaway={takeaway}
              onChange={(t) => handleTakeawayChange(index, t)}
            />
          ))}
        </div>
      </div>

      {/* Advanced Options Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm font-medium text-accent-blue hover:text-accent-blue/80 transition-colors"
      >
        <Sparkles className="h-4 w-4" />
        {showAdvanced ? "Hide" : "Show"} advanced options
        {showAdvanced ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="space-y-6 pt-4 border-t animate-in slide-in-from-top-2 duration-200">
          {/* Executive Summary */}
          <div className="p-4 rounded-lg border border-indigo-200 dark:border-indigo-500/40 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/20 dark:to-purple-500/20 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <label className="text-sm font-medium text-indigo-800 dark:text-indigo-300">
                Executive Summary
              </label>
              <span className="text-xs text-indigo-600 dark:text-indigo-400">(Premium feature)</span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  One-liner
                </label>
                <Input
                  value={verdict.executiveSummary?.oneLiner || ""}
                  onChange={(e) =>
                    updateVerdict({
                      executiveSummary: {
                        ...verdict.executiveSummary,
                        oneLiner: e.target.value,
                      },
                    })
                  }
                  placeholder="A single sentence that captures the essence"
                  className="text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Biggest Win
                </label>
                <Input
                  value={verdict.executiveSummary?.biggestWin || ""}
                  onChange={(e) =>
                    updateVerdict({
                      executiveSummary: {
                        ...verdict.executiveSummary,
                        biggestWin: e.target.value,
                      },
                    })
                  }
                  placeholder="The strongest aspect of this work"
                  className="text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Most Critical Fix
                </label>
                <Input
                  value={verdict.executiveSummary?.criticalFix || ""}
                  onChange={(e) =>
                    updateVerdict({
                      executiveSummary: {
                        ...verdict.executiveSummary,
                        criticalFix: e.target.value,
                      },
                    })
                  }
                  placeholder="The single most important thing to address"
                  className="text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Quick Win
                </label>
                <Input
                  value={verdict.executiveSummary?.quickWin || ""}
                  onChange={(e) =>
                    updateVerdict({
                      executiveSummary: {
                        ...verdict.executiveSummary,
                        quickWin: e.target.value,
                      },
                    })
                  }
                  placeholder="An easy improvement with high impact"
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Follow-up Offer */}
          <div className="p-4 rounded-lg border border-green-200 dark:border-green-500/40 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-500/20 dark:to-emerald-500/20 space-y-4">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-green-600 dark:text-green-400" />
              <label className="text-sm font-medium text-green-800 dark:text-green-300">
                Follow-up Offer
              </label>
              <span className="text-xs text-green-600 dark:text-green-400">(Optional)</span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="offer-followup"
                checked={verdict.followUpOffer?.available || false}
                onChange={(e) =>
                  updateVerdict({
                    followUpOffer: {
                      ...verdict.followUpOffer,
                      available: e.target.checked,
                    },
                  })
                }
                className="h-4 w-4 rounded border-green-300 dark:border-green-500"
              />
              <label
                htmlFor="offer-followup"
                className="text-sm text-green-800 dark:text-green-200"
              >
                I'm available for a follow-up review
              </label>
            </div>

            {verdict.followUpOffer?.available && (
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    What you'll offer
                  </label>
                  <AutoGrowTextarea
                    value={verdict.followUpOffer?.description || ""}
                    onChange={(value) =>
                      updateVerdict({
                        followUpOffer: {
                          ...verdict.followUpOffer,
                          available: true,
                          description: value,
                        },
                      })
                    }
                    placeholder="e.g., Review the updated version after they implement your suggestions"
                    className="text-sm"
                    minRows={2}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    Response Time
                  </label>
                  <Input
                    value={verdict.followUpOffer?.responseTime || ""}
                    onChange={(e) =>
                      updateVerdict({
                        followUpOffer: {
                          ...verdict.followUpOffer,
                          available: true,
                          responseTime: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g., Within 2 weeks of original review"
                    className="text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Validation Status */}
      {!isComplete && (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/40">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Complete the following to submit:
              </p>
              <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                {verdict.rating < 1 && <li>• Set an overall rating (1-5 stars)</li>}
                {!isSummaryValid && (
                  <li>• Write a summary (50-300 characters)</li>
                )}
                {verdict.topTakeaways.map((t, i) => {
                  const issueShort = t.issue.length < 5;
                  const fixShort = t.fix.length < 5;
                  if (!issueShort && !fixShort) return null;
                  return (
                    <li key={i}>
                      • Takeaway #{i + 1}: {issueShort && fixShort
                        ? "Issue and fix need at least 5 characters each"
                        : issueShort
                          ? "Issue needs at least 5 characters"
                          : "Recommended action needs at least 5 characters"}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VerdictCardEditor;
