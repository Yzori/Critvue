/**
 * Strength Card Editor Component
 *
 * Editor for strength/praise cards.
 * Simpler than IssueCard - just "what" and "why" fields.
 */

"use client";

import * as React from "react";
import {
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MessageSquare,
  ThumbsUp,
  CheckCircle2,
  GripVertical,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AutoGrowTextarea } from "@/components/ui/auto-grow-textarea";

import type { StrengthCard } from "@/lib/types/review-studio";
import { useReviewStudio } from "../context/ReviewStudioContext";

// ===== Placeholders =====

const WHAT_PLACEHOLDERS = [
  "The modular code structure makes it easy to test...",
  "The visual hierarchy guides the eye naturally...",
  "The opening hook immediately engages the reader...",
  "Error messages are clear and actionable...",
  "The color palette creates a cohesive feel...",
];

const WHY_PLACEHOLDERS = [
  "This reduces coupling and makes maintenance easier",
  "Users can find key information without scrolling",
  "It establishes relevance and encourages reading on",
  "Users know exactly what went wrong and how to fix it",
  "It reinforces brand recognition across the experience",
];

const IMPACT_PLACEHOLDERS = [
  "Developers can onboard faster and contribute sooner",
  "Conversion rates improve when users can quickly find what they need",
  "Engaged readers are more likely to share and return",
  "Reduced support tickets and happier customers",
  "Stronger brand recall leads to repeat business",
];

function getRandomPlaceholder(array: string[]): string {
  return array[Math.floor(Math.random() * array.length)] ?? array[0] ?? "";
}

// ===== Props =====

interface StrengthCardEditorProps {
  card: StrengthCard;
  index: number;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

// ===== Component =====

export function StrengthCardEditor({
  card,
  index,
  isDragging = false,
  dragHandleProps,
}: StrengthCardEditorProps) {
  const { updateCard, deleteCard, dispatch } = useReviewStudio();

  // Memoize placeholders
  const placeholders = React.useMemo(
    () => ({
      what: getRandomPlaceholder(WHAT_PLACEHOLDERS),
      why: getRandomPlaceholder(WHY_PLACEHOLDERS),
      impact: getRandomPlaceholder(IMPACT_PLACEHOLDERS),
    }),
    []
  );

  const isComplete = card.what.trim().length >= 10;
  const isExpanded = card.isExpanded;

  const updateField = <K extends keyof StrengthCard>(
    field: K,
    value: StrengthCard[K]
  ) => {
    updateCard(card.id, { [field]: value });
  };

  const toggleExpanded = () => {
    dispatch({ type: "TOGGLE_CARD_EXPANDED", payload: card.id });
  };

  const handleDelete = () => {
    deleteCard(card.id, "strength");
  };

  // ===== Collapsed Preview =====
  if (!isExpanded && !card.isEditing) {
    return (
      <div
        className={cn(
          "group rounded-lg border-2 border-green-200 bg-green-50 p-3 transition-all cursor-pointer hover:shadow-md",
          isDragging && "shadow-lg opacity-90"
        )}
        onClick={toggleExpanded}
      >
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab touch-manipulation p-1 -ml-1"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Order Badge */}
          <div className="size-6 rounded-full bg-white/50 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-muted-foreground">
              #{index + 1}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground line-clamp-1">
              {card.what || "Untitled strength"}
            </p>
            {card.why && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                Why: {card.why}
              </p>
            )}
            {card.impact && (
              <p className="text-xs text-green-600 line-clamp-1 mt-0.5 flex items-center gap-1">
                <TrendingUp className="size-3" />
                {card.impact}
              </p>
            )}
          </div>

          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
        </div>
      </div>
    );
  }

  // ===== Expanded Editor =====
  return (
    <div
      className={cn(
        "rounded-lg border-2 border-green-200 bg-white p-4 space-y-4 transition-all",
        isDragging && "shadow-lg opacity-90"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="cursor-grab touch-manipulation p-1 hover:bg-muted/50 rounded"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="size-7 rounded-full bg-green-100 flex items-center justify-center">
            <ThumbsUp className="size-4 text-green-600" />
          </div>
          <span className="text-sm font-semibold">Strength #{index + 1}</span>
        </div>

        <div className="flex items-center gap-1">
          {isComplete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleExpanded}
              className="size-8"
            >
              <ChevronUp className="size-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="size-8 text-muted-foreground hover:text-red-600"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* What Field */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-green-600" />
          What's working well?
          <span className="text-red-500">*</span>
        </label>
        <AutoGrowTextarea
          placeholder={placeholders.what}
          value={card.what}
          onChange={(value) => updateField("what", value)}
          className="text-sm"
          minRows={2}
        />
        {card.what.length > 0 && card.what.length < 10 && (
          <p className="text-xs text-amber-600">
            {10 - card.what.length} more characters needed
          </p>
        )}
      </div>

      {/* Why Field */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <MessageSquare className="size-3.5 text-blue-600" />
          Why does it work?
          <span className="text-xs text-muted-foreground font-normal">
            (optional but encouraged)
          </span>
        </label>
        <AutoGrowTextarea
          placeholder={placeholders.why}
          value={card.why || ""}
          onChange={(value) => updateField("why", value || undefined)}
          className="text-sm"
          minRows={2}
        />
      </div>

      {/* Impact Field */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <TrendingUp className="size-3.5 text-green-600" />
          Business/UX Impact
          <span className="text-xs text-muted-foreground font-normal">
            (optional)
          </span>
        </label>
        <AutoGrowTextarea
          placeholder={placeholders.impact}
          value={card.impact || ""}
          onChange={(value) => updateField("impact", value || undefined)}
          className="text-sm"
          minRows={2}
        />
      </div>

      {/* Completion Status */}
      {isComplete && (
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="size-3.5" /> Complete
          </span>
          {!card.why && (
            <span className="text-xs text-muted-foreground">
              Adding "why" makes feedback more valuable
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default StrengthCardEditor;
