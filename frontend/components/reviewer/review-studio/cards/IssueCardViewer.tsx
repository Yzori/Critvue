/**
 * Issue Card Viewer Component (Read-Only)
 *
 * Displays an issue card for creators reviewing submitted feedback.
 * No editing capabilities - purely for viewing.
 */

"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  MapPin,
  Sparkles,
  Zap,
  Clock,
  HardHat,
  Shield,
  Target,
  Link2,
  Gauge,
  MessageSquare,
  Wrench,
  ExternalLink,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

import type { IssueCard } from "@/lib/types/review-studio";
import type {
  FeedbackPriority,
  EffortEstimate,
  ConfidenceLevel,
  ImprovementCategory,
} from "@/lib/types/smart-review";

// ===== Configuration (same as editor) =====

const PRIORITY_CONFIG: Record<
  FeedbackPriority,
  { label: string; color: string; bg: string; border: string; icon: typeof AlertTriangle }
> = {
  critical: {
    label: "Critical",
    color: "text-red-700",
    bg: "bg-red-100",
    border: "border-red-300",
    icon: AlertTriangle,
  },
  important: {
    label: "Important",
    color: "text-amber-700",
    bg: "bg-amber-100",
    border: "border-amber-300",
    icon: AlertCircle,
  },
  "nice-to-have": {
    label: "Nice to Have",
    color: "text-blue-700",
    bg: "bg-blue-100",
    border: "border-blue-300",
    icon: Lightbulb,
  },
};

const EFFORT_CONFIG: Record<
  EffortEstimate,
  { label: string; description: string; color: string; bg: string; icon: typeof Zap }
> = {
  "quick-fix": {
    label: "Quick Fix",
    description: "< 30 mins",
    color: "text-green-700",
    bg: "bg-green-100",
    icon: Zap,
  },
  moderate: {
    label: "Moderate",
    description: "1-4 hours",
    color: "text-amber-700",
    bg: "bg-amber-100",
    icon: Clock,
  },
  "major-refactor": {
    label: "Major",
    description: "1+ days",
    color: "text-purple-700",
    bg: "bg-purple-100",
    icon: HardHat,
  },
};

const CONFIDENCE_CONFIG: Record<
  ConfidenceLevel,
  { label: string; color: string; bg: string }
> = {
  certain: { label: "Certain", color: "text-green-700", bg: "bg-green-100" },
  likely: { label: "Likely", color: "text-blue-700", bg: "bg-blue-100" },
  suggestion: { label: "Worth Exploring", color: "text-gray-600", bg: "bg-gray-100" },
};

const CATEGORY_CONFIG: Record<
  ImprovementCategory,
  { label: string; icon: typeof Shield; color: string; bg: string; border: string }
> = {
  performance: { label: "Performance", icon: Gauge, color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-300" },
  ux: { label: "User Experience", icon: Target, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-300" },
  security: { label: "Security", icon: Shield, color: "text-red-700", bg: "bg-red-50", border: "border-red-300" },
  accessibility: { label: "Accessibility", icon: Target, color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-300" },
  maintainability: { label: "Maintainability", icon: Wrench, color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-300" },
  design: { label: "Design", icon: Sparkles, color: "text-pink-700", bg: "bg-pink-50", border: "border-pink-300" },
  content: { label: "Content", icon: MessageSquare, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300" },
  other: { label: "Other", icon: Lightbulb, color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-300" },
};

// ===== Props =====

interface IssueCardViewerProps {
  card: IssueCard;
  index: number;
  defaultExpanded?: boolean;
}

// ===== Component =====

export function IssueCardViewer({
  card,
  index,
  defaultExpanded = false,
}: IssueCardViewerProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  const priorityConfig = PRIORITY_CONFIG[card.priority];
  const categoryConfig = CATEGORY_CONFIG[card.category];
  const PriorityIcon = priorityConfig.icon;
  const CategoryIcon = categoryConfig.icon;

  const hasExpertInsight = card.principle || card.whyItMatters || card.afterState;

  // ===== Collapsed View =====
  if (!isExpanded) {
    return (
      <div
        className={cn(
          "rounded-xl border-2 p-3 sm:p-4 transition-all cursor-pointer hover:shadow-md bg-white",
          priorityConfig.border
        )}
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex items-start gap-3">
          {/* Priority Badge */}
          <div className={cn("size-8 rounded-full flex items-center justify-center shrink-0", priorityConfig.bg)}>
            <PriorityIcon className={cn("size-4", priorityConfig.color)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Tags Row */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", priorityConfig.bg, priorityConfig.color)}>
                {priorityConfig.label}
              </span>
              <span className={cn("text-xs px-2 py-0.5 rounded-full", categoryConfig.bg, categoryConfig.color)}>
                {categoryConfig.label}
              </span>
              {card.isQuickWin && (
                <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <Zap className="size-3" /> Quick Win
                </span>
              )}
            </div>

            {/* Issue Title */}
            <p className="text-sm font-medium text-foreground line-clamp-2">
              {card.issue}
            </p>

            {/* Location if present */}
            {card.location && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin className="size-3" />
                {card.location}
              </p>
            )}

            {/* Expert insight indicator */}
            {hasExpertInsight && (
              <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                <Sparkles className="size-3" />
                Expert insight included
              </p>
            )}
          </div>

          <ChevronDown className="size-5 text-muted-foreground shrink-0" />
        </div>
      </div>
    );
  }

  // ===== Expanded View =====
  return (
    <div className={cn("rounded-xl border-2 bg-white overflow-hidden", priorityConfig.border)}>
      {/* Header */}
      <div
        className={cn("px-4 py-3 cursor-pointer flex items-center justify-between", priorityConfig.bg)}
        onClick={() => setIsExpanded(false)}
      >
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-white/80 flex items-center justify-center">
            <PriorityIcon className={cn("size-4", priorityConfig.color)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Issue #{index + 1}</span>
              <span className={cn("text-xs px-2 py-0.5 rounded-full bg-white/80", priorityConfig.color)}>
                {priorityConfig.label}
              </span>
              <span className={cn("text-xs px-2 py-0.5 rounded-full", categoryConfig.bg, categoryConfig.color)}>
                <CategoryIcon className="size-3 inline mr-1" />
                {categoryConfig.label}
              </span>
            </div>
          </div>
        </div>
        <ChevronUp className="size-5 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Issue */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <AlertCircle className="size-3.5 text-amber-600" />
            What's the issue
          </label>
          <p className="text-sm text-foreground">{card.issue}</p>
        </div>

        {/* Location */}
        {card.location && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <MapPin className="size-3.5 text-blue-600" />
              Where
            </label>
            <p className="text-sm text-foreground">{card.location}</p>
          </div>
        )}

        {/* Fix / Suggestion */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Lightbulb className="size-3.5 text-green-600" />
            Suggested Fix
          </label>
          <p className="text-sm text-foreground">{card.fix}</p>
        </div>

        {/* Metadata Row */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          {card.effort && (
            <span className={cn("text-xs px-2.5 py-1 rounded-full flex items-center gap-1", EFFORT_CONFIG[card.effort].bg, EFFORT_CONFIG[card.effort].color)}>
              {React.createElement(EFFORT_CONFIG[card.effort].icon, { className: "size-3" })}
              {EFFORT_CONFIG[card.effort].label}
              <span className="opacity-70">({EFFORT_CONFIG[card.effort].description})</span>
            </span>
          )}
          {card.confidence && (
            <span className={cn("text-xs px-2.5 py-1 rounded-full", CONFIDENCE_CONFIG[card.confidence].bg, CONFIDENCE_CONFIG[card.confidence].color)}>
              {CONFIDENCE_CONFIG[card.confidence].label}
            </span>
          )}
          {card.isQuickWin && (
            <span className="text-xs bg-green-200 text-green-800 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Zap className="size-3 fill-green-600" /> Quick Win
            </span>
          )}
        </div>

        {/* Expert Insight Section */}
        {hasExpertInsight && (
          <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-800">
              <Sparkles className="size-4" />
              Expert Insight
            </div>

            {card.principle && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-indigo-600">Underlying Principle</label>
                <p className="text-sm text-foreground">{card.principle}</p>
              </div>
            )}

            {card.whyItMatters && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-indigo-600 flex items-center gap-1">
                  <TrendingUp className="size-3" />
                  Impact if Not Fixed
                </label>
                <p className="text-sm text-foreground">{card.whyItMatters}</p>
              </div>
            )}

            {card.afterState && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-indigo-600">After State (Fixed)</label>
                <p className="text-sm text-foreground">{card.afterState}</p>
              </div>
            )}
          </div>
        )}

        {/* Resources */}
        {card.resources && card.resources.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Link2 className="size-3.5 text-indigo-600" />
              Reference Links
            </label>
            <div className="space-y-1.5">
              {card.resources.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg text-sm text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  <Link2 className="size-3.5 shrink-0" />
                  <span className="truncate flex-1">{resource.title || resource.url}</span>
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default IssueCardViewer;
