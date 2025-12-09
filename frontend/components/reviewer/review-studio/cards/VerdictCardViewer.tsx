/**
 * Verdict Card Viewer Component (Read-Only)
 *
 * Displays the final verdict for creators reviewing submitted feedback.
 * Shows rating, summary, top takeaways, and optional executive summary.
 */

"use client";

import {
  Star,
  Sparkles,
  ArrowRight,
  CalendarClock,
  Trophy,
  Target,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

import type { VerdictCard } from "@/lib/types/review-studio";

// ===== Star Rating Labels =====

const RATING_LABELS = [
  "Needs major work",
  "Below expectations",
  "Meets expectations",
  "Exceeds expectations",
  "Exceptional",
];

// ===== Props =====

interface VerdictCardViewerProps {
  verdict: VerdictCard;
  className?: string;
}

// ===== Component =====

export function VerdictCardViewer({ verdict, className }: VerdictCardViewerProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="size-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
          <Trophy className="size-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Final Verdict</h2>
          <p className="text-xs text-muted-foreground">Reviewer's overall assessment</p>
        </div>
      </div>

      {/* Overall Rating */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-500/20 dark:to-yellow-500/20 border border-amber-200 dark:border-amber-500/40">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
              Overall Rating
            </label>
            <div className="flex items-center gap-2 mt-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Star
                  key={rating}
                  className={cn(
                    "size-8",
                    rating <= verdict.rating
                      ? "fill-amber-400 text-amber-400"
                      : "fill-transparent text-muted-foreground"
                  )}
                />
              ))}
            </div>
            {verdict.rating > 0 && (
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1 font-medium">
                {RATING_LABELS[verdict.rating - 1]}
              </p>
            )}
          </div>
          <div className="text-5xl font-bold text-amber-600 dark:text-amber-400">
            {verdict.rating}<span className="text-2xl text-amber-400 dark:text-amber-500">/5</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Summary
        </label>
        <div className="p-4 rounded-xl bg-muted/50 border border-border">
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {verdict.summary}
          </p>
        </div>
      </div>

      {/* Top 3 Takeaways */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-accent-blue" />
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Top 3 Takeaways
          </label>
        </div>
        <div className="space-y-3">
          {verdict.topTakeaways.map((takeaway, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border-2 border-blue-200 dark:border-blue-500/40 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-500/20 dark:to-indigo-500/20"
            >
              <div className="flex items-start gap-3">
                <div className="size-7 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 space-y-2">
                  {/* Issue */}
                  <div>
                    <label className="text-xs font-medium text-blue-600 dark:text-blue-400">Priority Item</label>
                    <p className="text-sm text-foreground">{takeaway.issue}</p>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center gap-2 text-blue-400">
                    <ArrowRight className="size-4" />
                    <span className="text-xs">Recommended Action</span>
                  </div>

                  {/* Fix */}
                  <div className="p-2 rounded-lg bg-background/80 border border-blue-100 dark:border-blue-500/30">
                    <p className="text-sm text-foreground font-medium">{takeaway.fix}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Executive Summary (if provided) */}
      {verdict.executiveSummary && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200 dark:border-indigo-500/40 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-indigo-600 dark:text-indigo-400" />
            <label className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
              Executive Summary
            </label>
          </div>

          {verdict.executiveSummary.oneLiner && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-indigo-600 dark:text-indigo-400">One-liner</label>
              <p className="text-sm text-foreground font-medium italic">
                "{verdict.executiveSummary.oneLiner}"
              </p>
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-3">
            {verdict.executiveSummary.biggestWin && (
              <div className="p-3 rounded-lg bg-background/80 border border-green-200 dark:border-green-500/40">
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400 mb-1">
                  <Trophy className="size-3.5" />
                  <label className="text-xs font-medium">Biggest Win</label>
                </div>
                <p className="text-xs text-foreground">{verdict.executiveSummary.biggestWin}</p>
              </div>
            )}

            {verdict.executiveSummary.criticalFix && (
              <div className="p-3 rounded-lg bg-background/80 border border-red-200 dark:border-red-500/40">
                <div className="flex items-center gap-1 text-red-600 dark:text-red-400 mb-1">
                  <Target className="size-3.5" />
                  <label className="text-xs font-medium">Critical Fix</label>
                </div>
                <p className="text-xs text-foreground">{verdict.executiveSummary.criticalFix}</p>
              </div>
            )}

            {verdict.executiveSummary.quickWin && (
              <div className="p-3 rounded-lg bg-background/80 border border-amber-200 dark:border-amber-500/40">
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 mb-1">
                  <Zap className="size-3.5" />
                  <label className="text-xs font-medium">Quick Win</label>
                </div>
                <p className="text-xs text-foreground">{verdict.executiveSummary.quickWin}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Follow-up Offer (if provided) */}
      {verdict.followUpOffer?.available && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-500/20 dark:to-emerald-500/20 border border-green-200 dark:border-green-500/40 space-y-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-4 text-green-600 dark:text-green-400" />
            <label className="text-sm font-semibold text-green-800 dark:text-green-300">
              Follow-up Offer Available
            </label>
            <CheckCircle2 className="size-4 text-green-500 dark:text-green-400" />
          </div>

          {verdict.followUpOffer.description && (
            <p className="text-sm text-green-800 dark:text-green-200">
              {verdict.followUpOffer.description}
            </p>
          )}

          {verdict.followUpOffer.responseTime && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Response time: {verdict.followUpOffer.responseTime}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default VerdictCardViewer;
