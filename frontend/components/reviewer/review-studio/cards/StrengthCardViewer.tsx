/**
 * Strength Card Viewer Component (Read-Only)
 *
 * Displays a strength card for creators reviewing submitted feedback.
 * No editing capabilities - purely for viewing.
 */

"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  ThumbsUp,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

import type { StrengthCard } from "@/lib/types/review-studio";

// ===== Props =====

interface StrengthCardViewerProps {
  card: StrengthCard;
  index: number;
  defaultExpanded?: boolean;
}

// ===== Component =====

export function StrengthCardViewer({
  card,
  index,
  defaultExpanded = false,
}: StrengthCardViewerProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  // ===== Collapsed View =====
  if (!isExpanded) {
    return (
      <div
        className="rounded-xl border-2 border-green-300 bg-white p-3 sm:p-4 transition-all cursor-pointer hover:shadow-md"
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex items-start gap-3">
          {/* Icon Badge */}
          <div className="size-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <ThumbsUp className="size-4 text-green-600" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                Strength #{index + 1}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground line-clamp-2">
              {card.what}
            </p>
            {card.impact && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1 line-clamp-1">
                <TrendingUp className="size-3" />
                {card.impact}
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
    <div className="rounded-xl border-2 border-green-300 bg-white overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3 bg-green-100 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(false)}
      >
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-white flex items-center justify-center">
            <ThumbsUp className="size-4 text-green-600" />
          </div>
          <span className="text-sm font-semibold text-green-800">
            Strength #{index + 1}
          </span>
        </div>
        <ChevronUp className="size-5 text-green-600" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* What's Working */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-green-600" />
            What's Working Well
          </label>
          <p className="text-sm text-foreground">{card.what}</p>
        </div>

        {/* Why It Works */}
        {card.why && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <MessageSquare className="size-3.5 text-blue-600" />
              Why It Works
            </label>
            <p className="text-sm text-foreground">{card.why}</p>
          </div>
        )}

        {/* Business/UX Impact */}
        {card.impact && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <label className="text-xs font-semibold text-green-700 uppercase tracking-wide flex items-center gap-1.5 mb-1">
              <TrendingUp className="size-3.5" />
              Business/UX Impact
            </label>
            <p className="text-sm text-green-800">{card.impact}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StrengthCardViewer;
