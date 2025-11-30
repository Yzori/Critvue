/**
 * Issue Card Editor Component
 *
 * Full editor for issue cards with all fields.
 * Supports both expanded (editing) and collapsed (preview) modes.
 * Designed to work within a draggable card context.
 */

"use client";

import * as React from "react";
import {
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  MapPin,
  Wrench,
  Sparkles,
  Zap,
  Clock,
  HardHat,
  Shield,
  Target,
  Link2,
  Plus,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Gauge,
  MessageSquare,
  GripVertical,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AutoGrowTextarea } from "@/components/ui/auto-grow-textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type {
  IssueCard,
  CardSeverity,
} from "@/lib/types/review-studio";

import type {
  FeedbackPriority,
  EffortEstimate,
  ConfidenceLevel,
  ImprovementCategory,
  PrincipleCategory,
  ImpactType,
  ResourceLink,
} from "@/lib/types/smart-review";

import { useReviewStudio } from "../context/ReviewStudioContext";
import {
  getIssuePlaceholder,
  getFixPlaceholder,
} from "../utils/card-helpers";

// ===== Configuration =====

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

const SEVERITY_CONFIG: Record<
  CardSeverity,
  { label: string; color: string; bg: string }
> = {
  critical: { label: "Critical", color: "text-red-700", bg: "bg-red-100" },
  major: { label: "Major", color: "text-orange-700", bg: "bg-orange-100" },
  minor: { label: "Minor", color: "text-yellow-700", bg: "bg-yellow-100" },
  suggestion: { label: "Suggestion", color: "text-blue-700", bg: "bg-blue-100" },
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
  { label: string; description: string; color: string; bg: string }
> = {
  certain: {
    label: "Certain",
    description: "I'm confident this will help",
    color: "text-green-700",
    bg: "bg-green-100",
  },
  likely: {
    label: "Likely",
    description: "Should work based on my experience",
    color: "text-blue-700",
    bg: "bg-blue-100",
  },
  suggestion: {
    label: "Worth Exploring",
    description: "Consider investigating this approach",
    color: "text-gray-600",
    bg: "bg-gray-100",
  },
};

const CATEGORY_CONFIG: Record<
  ImprovementCategory,
  { label: string; icon: typeof Shield }
> = {
  performance: { label: "Performance", icon: Gauge },
  ux: { label: "User Experience", icon: Target },
  security: { label: "Security", icon: Shield },
  accessibility: { label: "Accessibility", icon: Target },
  maintainability: { label: "Maintainability", icon: Wrench },
  design: { label: "Design", icon: Sparkles },
  content: { label: "Content", icon: MessageSquare },
  other: { label: "Other", icon: Lightbulb },
};

const PRINCIPLE_CATEGORY_CONFIG: Record<
  PrincipleCategory,
  { label: string; examples: string[] }
> = {
  "ux-heuristic": {
    label: "UX Heuristic",
    examples: ["Nielsen's visibility of system status", "User control and freedom"],
  },
  "design-principle": {
    label: "Design Principle",
    examples: ["Gestalt proximity", "Color contrast ratio", "Typography hierarchy"],
  },
  "coding-standard": {
    label: "Coding Standard",
    examples: ["SOLID principles", "DRY", "Clean code naming"],
  },
  accessibility: {
    label: "Accessibility",
    examples: ["WCAG 2.1 AA", "Keyboard navigation", "Screen reader compatibility"],
  },
  performance: {
    label: "Performance",
    examples: ["Core Web Vitals", "Lazy loading", "Bundle size"],
  },
  security: {
    label: "Security",
    examples: ["OWASP Top 10", "Input validation", "XSS prevention"],
  },
  seo: {
    label: "SEO",
    examples: ["Meta tags", "Semantic HTML", "Mobile-first indexing"],
  },
  content: {
    label: "Content",
    examples: ["Inverted pyramid writing", "Clear CTAs", "Consistent voice"],
  },
  other: { label: "Other", examples: [] },
};

const IMPACT_TYPE_CONFIG: Record<
  ImpactType,
  { label: string; description: string; color: string }
> = {
  conversion: { label: "Conversion", description: "Affects sales/signups", color: "text-red-700" },
  usability: { label: "Usability", description: "Makes harder to use", color: "text-orange-700" },
  trust: { label: "Trust", description: "Reduces credibility", color: "text-amber-700" },
  performance: { label: "Performance", description: "Slows experience", color: "text-purple-700" },
  maintainability: { label: "Maintainability", description: "Creates tech debt", color: "text-blue-700" },
  accessibility: { label: "Accessibility", description: "Excludes users", color: "text-teal-700" },
  seo: { label: "SEO", description: "Hurts discoverability", color: "text-green-700" },
  brand: { label: "Brand", description: "Damages perception", color: "text-pink-700" },
  other: { label: "Other", description: "Other impact", color: "text-gray-700" },
};

// ===== Props =====

interface IssueCardEditorProps {
  card: IssueCard;
  index: number;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

// ===== Component =====

export function IssueCardEditor({
  card,
  index,
  isDragging = false,
  dragHandleProps,
}: IssueCardEditorProps) {
  const { updateCard, deleteCard, dispatch } = useReviewStudio();
  const [showExpertFields, setShowExpertFields] = React.useState(false);
  const [newResourceUrl, setNewResourceUrl] = React.useState("");
  const [newResourceTitle, setNewResourceTitle] = React.useState("");

  // Memoize placeholders
  const placeholders = React.useMemo(
    () => ({
      issue: getIssuePlaceholder(card.category),
      fix: getFixPlaceholder(card.category),
    }),
    [card.category]
  );

  const isComplete = card.issue.trim().length >= 10 && card.fix.trim().length >= 10;
  const isEditing = card.isEditing;
  const isExpanded = card.isExpanded;

  const updateField = <K extends keyof IssueCard>(field: K, value: IssueCard[K]) => {
    updateCard(card.id, { [field]: value });
  };

  const toggleExpanded = () => {
    dispatch({ type: "TOGGLE_CARD_EXPANDED", payload: card.id });
  };

  const startEditing = () => {
    dispatch({ type: "SET_EDITING_CARD", payload: card.id });
    updateCard(card.id, { isEditing: true, isExpanded: true });
  };

  const stopEditing = () => {
    dispatch({ type: "SET_EDITING_CARD", payload: null });
    updateCard(card.id, { isEditing: false });
  };

  const handleDelete = () => {
    deleteCard(card.id, "issue");
  };

  // Add resource link
  const addResource = () => {
    if (!newResourceUrl.trim()) return;
    const newResource: ResourceLink = {
      url: newResourceUrl.trim(),
      title: newResourceTitle.trim() || undefined,
    };
    updateField("resources", [...(card.resources || []), newResource]);
    setNewResourceUrl("");
    setNewResourceTitle("");
  };

  // Remove resource link
  const removeResource = (idx: number) => {
    const newResources = (card.resources || []).filter((_, i) => i !== idx);
    updateField("resources", newResources.length > 0 ? newResources : undefined);
  };

  // ===== Collapsed Preview =====
  if (!isExpanded && !isEditing) {
    return (
      <div
        className={cn(
          "group rounded-lg border-2 p-2 sm:p-3 transition-all cursor-pointer hover:shadow-md bg-white",
          PRIORITY_CONFIG[card.priority].border,
          isDragging && "shadow-lg opacity-90"
        )}
        onClick={toggleExpanded}
      >
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab touch-manipulation p-1 -ml-1"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Order Badge */}
          <div className={cn("size-6 rounded-full flex items-center justify-center shrink-0", PRIORITY_CONFIG[card.priority].bg)}>
            <span className={cn("text-xs font-bold", PRIORITY_CONFIG[card.priority].color)}>
              #{index + 1}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Tags */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  PRIORITY_CONFIG[card.priority].bg,
                  PRIORITY_CONFIG[card.priority].color
                )}
              >
                {PRIORITY_CONFIG[card.priority].label}
              </span>
              {card.isQuickWin && (
                <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <Zap className="size-3" /> Quick Win
                </span>
              )}
              {card.effort && (
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    EFFORT_CONFIG[card.effort].bg,
                    EFFORT_CONFIG[card.effort].color
                  )}
                >
                  {EFFORT_CONFIG[card.effort].label}
                </span>
              )}
              {card.location && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3" />
                  {card.location}
                </span>
              )}
            </div>

            {/* Issue & Fix */}
            <p className="text-sm font-medium text-foreground line-clamp-1">
              {card.issue || "Untitled issue"}
            </p>
            {card.fix && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                Fix: {card.fix}
              </p>
            )}

            {/* Expert insight badge */}
            {(card.principle || card.whyItMatters || card.afterState) && (
              <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                <Sparkles className="size-3" />
                Expert insight added
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
        "rounded-lg border-2 p-3 sm:p-4 space-y-3 sm:space-y-4 transition-all bg-white",
        PRIORITY_CONFIG[card.priority].border,
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

          <div className="size-7 rounded-full bg-amber-100 flex items-center justify-center">
            <Wrench className="size-4 text-amber-600" />
          </div>
          <span className="text-sm font-semibold">Issue #{index + 1}</span>

          {/* Category badge */}
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
            )}
          >
            {CATEGORY_CONFIG[card.category].label}
          </span>
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

      {/* Category Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(CATEGORY_CONFIG) as ImprovementCategory[]).map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const Icon = config.icon;
            const isSelected = card.category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => updateField("category", cat)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all touch-manipulation",
                  isSelected
                    ? "bg-accent-blue/10 border-accent-blue text-accent-blue"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                <Icon className="size-3.5" />
                {config.label}
              </button>
            );
          })}
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
          value={card.issue}
          onChange={(value) => updateField("issue", value)}
          className="text-sm"
          minRows={2}
        />
        {card.issue.length > 0 && card.issue.length < 10 && (
          <p className="text-xs text-amber-600">
            {10 - card.issue.length} more characters needed
          </p>
        )}
      </div>

      {/* Location Field */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <MapPin className="size-3.5 text-blue-600" />
          Where in the work?
          <span className="text-xs text-muted-foreground font-normal">(optional)</span>
        </label>
        <Input
          placeholder="e.g., Header section, line 45-52, second paragraph"
          value={card.location || ""}
          onChange={(e) => updateField("location", e.target.value || undefined)}
          className="text-sm"
        />
      </div>

      {/* Fix Field */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Lightbulb className="size-3.5 text-green-600" />
          Concrete suggestion
          <span className="text-red-500">*</span>
        </label>
        <AutoGrowTextarea
          placeholder={placeholders.fix}
          value={card.fix}
          onChange={(value) => updateField("fix", value)}
          className="text-sm"
          minRows={2}
        />
        {card.fix.length > 0 && card.fix.length < 10 && (
          <p className="text-xs text-amber-600">
            {10 - card.fix.length} more characters needed
          </p>
        )}
      </div>

      {/* Priority Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Priority</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PRIORITY_CONFIG) as FeedbackPriority[]).map((priority) => {
            const config = PRIORITY_CONFIG[priority];
            const Icon = config.icon;
            const isSelected = card.priority === priority;
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

      {/* Expert Fields Toggle */}
      <div className="pt-2 border-t border-border">
        <button
          type="button"
          onClick={() => setShowExpertFields(!showExpertFields)}
          className="flex items-center gap-2 text-sm font-medium text-accent-blue hover:text-accent-blue/80 transition-colors touch-manipulation"
        >
          <Sparkles className="size-4" />
          {showExpertFields ? "Hide expert details" : "Add expert details"}
          <span className="text-xs text-muted-foreground">
            (effort, confidence, resources)
          </span>
          {showExpertFields ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </button>
      </div>

      {/* Expert Fields */}
      {showExpertFields && (
        <div className="space-y-4 pt-3 animate-in slide-in-from-top-2 duration-200">
          {/* Expert Insight Section */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-800">
              <Sparkles className="size-4" />
              Expert Insight
            </div>

            {/* Principle */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                Underlying Principle
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="size-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      What design principle or best practice is being violated?
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <select
                value={card.principleCategory || ""}
                onChange={(e) =>
                  updateField(
                    "principleCategory",
                    (e.target.value as PrincipleCategory) || undefined
                  )
                }
                className="w-full text-sm border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="">Select category...</option>
                {(Object.keys(PRINCIPLE_CATEGORY_CONFIG) as PrincipleCategory[]).map(
                  (cat) => (
                    <option key={cat} value={cat}>
                      {PRINCIPLE_CATEGORY_CONFIG[cat].label}
                    </option>
                  )
                )}
              </select>
              <Input
                placeholder="e.g., Nielsen's 'Visibility of System Status'"
                value={card.principle || ""}
                onChange={(e) =>
                  updateField("principle", e.target.value || undefined)
                }
                className="text-sm bg-white"
              />
            </div>

            {/* Why It Matters */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                Impact if Not Fixed
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="size-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      What's the real cost of ignoring this?
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(Object.keys(IMPACT_TYPE_CONFIG) as ImpactType[]).map((impact) => (
                  <button
                    key={impact}
                    type="button"
                    onClick={() =>
                      updateField(
                        "impactType",
                        card.impactType === impact ? undefined : impact
                      )
                    }
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full border transition-all touch-manipulation",
                      card.impactType === impact
                        ? "bg-indigo-100 border-indigo-400 text-indigo-800"
                        : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"
                    )}
                  >
                    {IMPACT_TYPE_CONFIG[impact].label}
                  </button>
                ))}
              </div>
              <AutoGrowTextarea
                placeholder="e.g., Users will abandon checkout due to confusion..."
                value={card.whyItMatters || ""}
                onChange={(value) =>
                  updateField("whyItMatters", value || undefined)
                }
                className="text-sm bg-white"
                minRows={2}
              />
            </div>

            {/* After State */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                After State
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  (What does "fixed" look like?)
                </span>
              </label>
              <AutoGrowTextarea
                placeholder="e.g., Add a loading spinner with 'Processing...' text"
                value={card.afterState || ""}
                onChange={(value) =>
                  updateField("afterState", value || undefined)
                }
                className="text-sm bg-white"
                minRows={2}
              />
            </div>
          </div>

          {/* Quick Win + Severity Row */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => updateField("isQuickWin", !card.isQuickWin)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 transition-all",
                "text-sm font-medium touch-manipulation",
                card.isQuickWin
                  ? "bg-green-100 border-green-400 text-green-700"
                  : "bg-white border-gray-200 text-gray-600 hover:border-green-300"
              )}
            >
              <Zap className={cn("size-4", card.isQuickWin && "fill-green-500")} />
              Quick Win
            </button>

            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Severity:</label>
              <select
                value={card.severity}
                onChange={(e) =>
                  updateField("severity", e.target.value as CardSeverity)
                }
                className="text-sm border rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-accent-blue/50"
              >
                {(Object.keys(SEVERITY_CONFIG) as CardSeverity[]).map((sev) => (
                  <option key={sev} value={sev}>
                    {SEVERITY_CONFIG[sev].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Effort Estimate */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Clock className="size-3.5 text-purple-600" />
              Estimated Effort
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(EFFORT_CONFIG) as EffortEstimate[]).map((effort) => {
                const config = EFFORT_CONFIG[effort];
                const Icon = config.icon;
                const isSelected = card.effort === effort;
                return (
                  <button
                    key={effort}
                    type="button"
                    onClick={() =>
                      updateField("effort", isSelected ? undefined : effort)
                    }
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 transition-all",
                      "text-sm font-medium touch-manipulation",
                      isSelected
                        ? cn(config.bg, "border-current", config.color)
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    <Icon className="size-4" />
                    <span>{config.label}</span>
                    <span className="text-xs opacity-70">{config.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Confidence Level */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-blue-600" />
              Confidence Level
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CONFIDENCE_CONFIG) as ConfidenceLevel[]).map(
                (confidence) => {
                  const config = CONFIDENCE_CONFIG[confidence];
                  const isSelected = card.confidence === confidence;
                  return (
                    <button
                      key={confidence}
                      type="button"
                      onClick={() => updateField("confidence", confidence)}
                      className={cn(
                        "flex flex-col items-start px-3 py-2 rounded-lg border-2 transition-all",
                        "text-sm font-medium touch-manipulation text-left",
                        isSelected
                          ? cn(config.bg, "border-current", config.color)
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      <span>{config.label}</span>
                      <span className="text-xs opacity-70 font-normal">
                        {config.description}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Resource Links */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Link2 className="size-3.5 text-indigo-600" />
              Reference Links
              <span className="text-xs text-muted-foreground font-normal">
                (optional)
              </span>
            </label>

            {/* Existing links */}
            {card.resources && card.resources.length > 0 && (
              <div className="space-y-1.5">
                {card.resources.map((resource, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg text-sm"
                  >
                    <Link2 className="size-3.5 text-indigo-600 shrink-0" />
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-700 hover:underline truncate flex-1"
                    >
                      {resource.title || resource.url}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeResource(idx)}
                      className="p-1 text-red-500 hover:bg-red-100 rounded touch-manipulation"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new link */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="https://example.com/resource"
                value={newResourceUrl}
                onChange={(e) => setNewResourceUrl(e.target.value)}
                className="text-sm flex-1"
              />
              <Input
                placeholder="Title (optional)"
                value={newResourceTitle}
                onChange={(e) => setNewResourceTitle(e.target.value)}
                className="text-sm sm:w-32"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!newResourceUrl.trim()}
                onClick={addResource}
                className="shrink-0 touch-manipulation"
              >
                <Plus className="size-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Status */}
      {isComplete && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="size-3.5" /> Complete
          </span>
          {(card.principle || card.whyItMatters || card.afterState) && (
            <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Sparkles className="size-3" /> Has Insight
            </span>
          )}
          {card.isQuickWin && (
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Zap className="size-3" /> Quick Win
            </span>
          )}
          {card.effort && (
            <span
              className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                EFFORT_CONFIG[card.effort].bg,
                EFFORT_CONFIG[card.effort].color
              )}
            >
              {EFFORT_CONFIG[card.effort].label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default IssueCardEditor;
