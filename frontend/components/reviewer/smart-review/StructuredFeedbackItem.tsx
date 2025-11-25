/**
 * Structured Feedback Item Component
 *
 * Provides guided input fields for actionable feedback:
 * - Improvements: issue, location, suggestion, priority
 * - Strengths: what, why
 */

"use client";

import * as React from "react";
import { X, ChevronDown, ChevronUp, AlertTriangle, AlertCircle, Lightbulb, MapPin, Wrench, Sparkles, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AutoGrowTextarea } from "@/components/ui/auto-grow-textarea";
import {
  StructuredImprovement,
  StructuredStrength,
  FeedbackPriority,
} from "@/lib/types/smart-review";

// Priority configuration
const PRIORITY_CONFIG: Record<FeedbackPriority, { label: string; color: string; bg: string; border: string; icon: typeof AlertTriangle }> = {
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

// Smart placeholder prompts for improvements
const IMPROVEMENT_PLACEHOLDERS = {
  issue: [
    "The error handling doesn't cover network failures...",
    "The button contrast is too low for accessibility...",
    "The paragraph structure makes it hard to follow...",
    "Variable names don't clearly describe their purpose...",
    "The color scheme clashes with the brand guidelines...",
  ],
  location: [
    "Line 45-52 in auth.js",
    "Header section, navigation menu",
    "Second paragraph, third sentence",
    "Login form component",
    "Hero banner area",
  ],
  suggestion: [
    "Add a try-catch block with specific error messages for users",
    "Increase contrast ratio to at least 4.5:1 per WCAG guidelines",
    "Break into shorter paragraphs with clear topic sentences",
    "Rename 'x' to 'userCount' for clarity",
    "Use the primary brand blue (#2563eb) instead",
  ],
};

// Smart placeholder prompts for strengths
const STRENGTH_PLACEHOLDERS = {
  what: [
    "The modular code structure makes it easy to test...",
    "The visual hierarchy guides the eye naturally...",
    "The opening hook immediately engages the reader...",
    "Error messages are clear and actionable...",
    "The color palette creates a cohesive feel...",
  ],
  why: [
    "This reduces coupling and makes maintenance easier",
    "Users can find key information without scrolling",
    "It establishes relevance and encourages reading on",
    "Users know exactly what went wrong and how to fix it",
    "It reinforces brand recognition across the experience",
  ],
};

// Get random placeholder
function getRandomPlaceholder(array: string[]): string {
  return array[Math.floor(Math.random() * array.length)];
}

interface StructuredImprovementItemProps {
  item: StructuredImprovement;
  onChange: (updated: StructuredImprovement) => void;
  onRemove: () => void;
  canRemove: boolean;
  index: number;
}

export function StructuredImprovementItem({
  item,
  onChange,
  onRemove,
  canRemove,
  index,
}: StructuredImprovementItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [placeholders] = React.useState({
    issue: getRandomPlaceholder(IMPROVEMENT_PLACEHOLDERS.issue),
    location: getRandomPlaceholder(IMPROVEMENT_PLACEHOLDERS.location),
    suggestion: getRandomPlaceholder(IMPROVEMENT_PLACEHOLDERS.suggestion),
  });

  // Auto-collapse when all required fields are filled
  const isComplete = item.issue.length >= 10 && item.suggestion.length >= 10;

  const updateField = <K extends keyof StructuredImprovement>(
    field: K,
    value: StructuredImprovement[K]
  ) => {
    onChange({ ...item, [field]: value });
  };

  // Collapsed view
  if (!isExpanded && isComplete) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className={cn(
          "w-full text-left p-3 rounded-lg border-2 transition-all",
          "hover:shadow-sm touch-manipulation",
          PRIORITY_CONFIG[item.priority].border,
          PRIORITY_CONFIG[item.priority].bg
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            "size-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
            "bg-white/50"
          )}>
            <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                PRIORITY_CONFIG[item.priority].bg,
                PRIORITY_CONFIG[item.priority].color
              )}>
                {PRIORITY_CONFIG[item.priority].label}
              </span>
              {item.location && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3" />
                  {item.location}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-foreground line-clamp-1">{item.issue}</p>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">→ {item.suggestion}</p>
          </div>
          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
        </div>
      </button>
    );
  }

  // Expanded view
  return (
    <div className={cn(
      "rounded-lg border-2 p-4 space-y-4 transition-all",
      PRIORITY_CONFIG[item.priority].border,
      "bg-white"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full bg-amber-100 flex items-center justify-center">
            <Wrench className="size-4 text-amber-600" />
          </div>
          <span className="text-sm font-semibold">Improvement #{index + 1}</span>
        </div>
        <div className="flex items-center gap-1">
          {isComplete && (
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 touch-manipulation"
              aria-label="Collapse"
            >
              <ChevronUp className="size-4" />
            </button>
          )}
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="size-9 text-muted-foreground hover:text-red-600"
              aria-label="Remove improvement"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Issue Field */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <AlertCircle className="size-3.5 text-amber-600" />
          What's the issue?
          <span className="text-red-500">*</span>
        </label>
        <AutoGrowTextarea
          placeholder={placeholders.issue}
          value={item.issue}
          onChange={(value) => updateField("issue", value)}
          className="text-sm"
          minRows={2}
        />
        {item.issue.length > 0 && item.issue.length < 10 && (
          <p className="text-xs text-amber-600">{10 - item.issue.length} more characters needed</p>
        )}
      </div>

      {/* Location Field (Optional) */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <MapPin className="size-3.5 text-blue-600" />
          Where in the work?
          <span className="text-xs text-muted-foreground font-normal">(optional)</span>
        </label>
        <Input
          placeholder={placeholders.location}
          value={item.location || ""}
          onChange={(e) => updateField("location", e.target.value)}
          className="text-sm"
        />
      </div>

      {/* Suggestion Field */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Lightbulb className="size-3.5 text-green-600" />
          Concrete suggestion
          <span className="text-red-500">*</span>
        </label>
        <AutoGrowTextarea
          placeholder={placeholders.suggestion}
          value={item.suggestion}
          onChange={(value) => updateField("suggestion", value)}
          className="text-sm"
          minRows={2}
        />
        {item.suggestion.length > 0 && item.suggestion.length < 10 && (
          <p className="text-xs text-amber-600">{10 - item.suggestion.length} more characters needed</p>
        )}
      </div>

      {/* Priority Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Priority</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PRIORITY_CONFIG) as FeedbackPriority[]).map((priority) => {
            const config = PRIORITY_CONFIG[priority];
            const Icon = config.icon;
            const isSelected = item.priority === priority;
            return (
              <button
                key={priority}
                type="button"
                onClick={() => updateField("priority", priority)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 transition-all",
                  "text-sm font-medium touch-manipulation",
                  "hover:scale-105 active:scale-95",
                  isSelected
                    ? cn(config.bg, config.border, config.color)
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                <Icon className="size-4" />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Completion indicator */}
      {isComplete && (
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <span className="text-xs text-green-600 font-medium">✓ Complete</span>
        </div>
      )}
    </div>
  );
}

interface StructuredStrengthItemProps {
  item: StructuredStrength;
  onChange: (updated: StructuredStrength) => void;
  onRemove: () => void;
  canRemove: boolean;
  index: number;
}

export function StructuredStrengthItem({
  item,
  onChange,
  onRemove,
  canRemove,
  index,
}: StructuredStrengthItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [placeholders] = React.useState({
    what: getRandomPlaceholder(STRENGTH_PLACEHOLDERS.what),
    why: getRandomPlaceholder(STRENGTH_PLACEHOLDERS.why),
  });

  // Auto-collapse when required field is filled
  const isComplete = item.what.length >= 10;

  const updateField = <K extends keyof StructuredStrength>(
    field: K,
    value: StructuredStrength[K]
  ) => {
    onChange({ ...item, [field]: value });
  };

  // Collapsed view
  if (!isExpanded && isComplete) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="w-full text-left p-3 rounded-lg border-2 border-green-200 bg-green-50 transition-all hover:shadow-sm touch-manipulation"
      >
        <div className="flex items-start gap-3">
          <div className="size-6 rounded-full bg-white/50 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground line-clamp-1">{item.what}</p>
            {item.why && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">→ {item.why}</p>
            )}
          </div>
          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
        </div>
      </button>
    );
  }

  // Expanded view
  return (
    <div className="rounded-lg border-2 border-green-200 bg-white p-4 space-y-4 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full bg-green-100 flex items-center justify-center">
            <Sparkles className="size-4 text-green-600" />
          </div>
          <span className="text-sm font-semibold">Strength #{index + 1}</span>
        </div>
        <div className="flex items-center gap-1">
          {isComplete && (
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 touch-manipulation"
              aria-label="Collapse"
            >
              <ChevronUp className="size-4" />
            </button>
          )}
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="size-9 text-muted-foreground hover:text-red-600"
              aria-label="Remove strength"
            >
              <X className="size-4" />
            </Button>
          )}
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
          value={item.what}
          onChange={(value) => updateField("what", value)}
          className="text-sm"
          minRows={2}
        />
        {item.what.length > 0 && item.what.length < 10 && (
          <p className="text-xs text-amber-600">{10 - item.what.length} more characters needed</p>
        )}
      </div>

      {/* Why Field (Optional) */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <MessageSquare className="size-3.5 text-blue-600" />
          Why does it work?
          <span className="text-xs text-muted-foreground font-normal">(optional but encouraged)</span>
        </label>
        <AutoGrowTextarea
          placeholder={placeholders.why}
          value={item.why || ""}
          onChange={(value) => updateField("why", value || undefined)}
          className="text-sm"
          minRows={2}
        />
      </div>

      {/* Completion indicator */}
      {isComplete && (
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <span className="text-xs text-green-600 font-medium">✓ Complete</span>
          {!item.why && (
            <span className="text-xs text-muted-foreground">Adding "why" makes feedback more valuable</span>
          )}
        </div>
      )}
    </div>
  );
}

// Helper to create new items with unique IDs
export function createNewImprovement(): StructuredImprovement {
  return {
    id: `imp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    issue: "",
    location: "",
    suggestion: "",
    priority: "important",
  };
}

export function createNewStrength(): StructuredStrength {
  return {
    id: `str-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    what: "",
    why: "",
  };
}
