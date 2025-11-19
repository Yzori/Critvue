/**
 * Quality Indicators
 *
 * Real-time quality metrics:
 * - Completeness score (0-100%)
 * - Estimated tone
 * - Clarity score
 * - Actionability score
 */

"use client";

import * as React from "react";
import { CheckCircle2, TrendingUp, MessageSquare, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { QualityMetrics } from "@/lib/types/smart-review";
import {
  getCompletenessColor,
  getToneColor,
  getToneLabel,
} from "@/lib/utils/quality-metrics";

interface QualityIndicatorsProps {
  metrics: QualityMetrics;
  className?: string;
}

export function QualityIndicators({ metrics, className }: QualityIndicatorsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-1">Quality Indicators</h3>
        <p className="text-xs text-muted-foreground">
          Real-time feedback on your review quality
        </p>
      </div>

      {/* Completeness Score */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-accent-blue" />
            <span className="text-sm font-medium">Completeness</span>
          </div>
          <span
            className={cn(
              "text-lg font-bold",
              getCompletenessColor(metrics.completeness_score)
            )}
          >
            {metrics.completeness_score}%
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300",
              metrics.completeness_score >= 85
                ? "bg-green-500"
                : metrics.completeness_score >= 60
                  ? "bg-amber-500"
                  : "bg-red-500"
            )}
            style={{ width: `${metrics.completeness_score}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {metrics.completeness_score >= 85
            ? "Excellent! All key sections completed."
            : metrics.completeness_score >= 60
              ? "Good progress. A few more details would help."
              : "Just getting started. Keep filling in the sections."}
        </p>
      </div>

      {/* Tone */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4 text-accent-peach" />
            <span className="text-sm font-medium">Tone</span>
          </div>
          <span
            className={cn("text-sm font-semibold", getToneColor(metrics.estimated_tone))}
          >
            {getToneLabel(metrics.estimated_tone)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {metrics.estimated_tone === "professional"
            ? "Your feedback is clear and professional."
            : metrics.estimated_tone === "encouraging"
              ? "Great job being supportive and positive!"
              : metrics.estimated_tone === "critical"
                ? "Consider balancing criticism with constructive suggestions."
                : "Your feedback is casual and conversational."}
        </p>
      </div>

      {/* Clarity */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-accent-sage" />
            <span className="text-sm font-medium">Clarity</span>
          </div>
          <span
            className={cn(
              "text-sm font-semibold",
              metrics.clarity_score >= 80
                ? "text-green-600"
                : metrics.clarity_score >= 60
                  ? "text-amber-600"
                  : "text-red-600"
            )}
          >
            {metrics.clarity_score}/100
          </span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300",
              metrics.clarity_score >= 80
                ? "bg-green-500"
                : metrics.clarity_score >= 60
                  ? "bg-amber-500"
                  : "bg-red-500"
            )}
            style={{ width: `${metrics.clarity_score}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {metrics.clarity_score >= 80
            ? "Your feedback is clear and easy to understand."
            : metrics.clarity_score >= 60
              ? "Good clarity. Consider simplifying complex sentences."
              : "Try using shorter sentences and simpler words."}
        </p>
      </div>

      {/* Actionability */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="size-4 text-purple-500" />
            <span className="text-sm font-medium">Actionability</span>
          </div>
          <span
            className={cn(
              "text-sm font-semibold",
              metrics.actionability_score >= 80
                ? "text-green-600"
                : metrics.actionability_score >= 60
                  ? "text-amber-600"
                  : "text-red-600"
            )}
          >
            {metrics.actionability_score}/100
          </span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300",
              metrics.actionability_score >= 80
                ? "bg-green-500"
                : metrics.actionability_score >= 60
                  ? "bg-amber-500"
                  : "bg-red-500"
            )}
            style={{ width: `${metrics.actionability_score}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {metrics.actionability_score >= 80
            ? "Excellent! Your suggestions are specific and actionable."
            : metrics.actionability_score >= 60
              ? "Good suggestions. Add more specific action steps."
              : "Include concrete steps the creator can take."}
        </p>
      </div>

      {/* Overall Assessment */}
      <div className="rounded-xl border border-accent-blue/30 bg-accent-blue/5 p-4">
        <p className="text-sm font-medium text-accent-blue mb-2">
          💡 Overall Assessment
        </p>
        <p className="text-xs text-muted-foreground">
          {metrics.completeness_score >= 85 &&
          metrics.clarity_score >= 80 &&
          metrics.actionability_score >= 80
            ? "Outstanding! Your review is comprehensive, clear, and actionable."
            : metrics.completeness_score >= 60 &&
                metrics.clarity_score >= 60 &&
                metrics.actionability_score >= 60
              ? "You're on the right track! Add a bit more detail to make it excellent."
              : "Keep going! Focus on providing specific, actionable feedback."}
        </p>
      </div>
    </div>
  );
}
