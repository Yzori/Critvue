/**
 * Structured Feedback Item Component
 *
 * Provides guided input fields for actionable feedback:
 * - Improvements: issue, location, suggestion, priority
 * - Strengths: what, why
 */

"use client";

import * as React from "react";
import { X, ChevronDown, ChevronUp, AlertTriangle, AlertCircle, Lightbulb, MapPin, Wrench, Sparkles, MessageSquare, Zap, Clock, HardHat, Shield, Target, Link2, Plus, Trash2, CheckCircle2, HelpCircle, Gauge } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AutoGrowTextarea } from "@/components/ui/auto-grow-textarea";
import {
  StructuredImprovement,
  StructuredStrength,
  FeedbackPriority,
  EffortEstimate,
  ConfidenceLevel,
  ImprovementCategory,
  ResourceLink,
  PrincipleCategory,
  ImpactType,
} from "@/lib/types/smart-review";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

// Effort estimate configuration
const EFFORT_CONFIG: Record<EffortEstimate, { label: string; description: string; color: string; bg: string; icon: typeof Zap }> = {
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

// Confidence level configuration
const CONFIDENCE_CONFIG: Record<ConfidenceLevel, { label: string; description: string; color: string; bg: string }> = {
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

// Category configuration
const CATEGORY_CONFIG: Record<ImprovementCategory, { label: string; icon: typeof Shield }> = {
  performance: { label: "Performance", icon: Gauge },
  ux: { label: "User Experience", icon: Target },
  security: { label: "Security", icon: Shield },
  accessibility: { label: "Accessibility", icon: Target },
  maintainability: { label: "Maintainability", icon: Wrench },
  design: { label: "Design", icon: Sparkles },
  content: { label: "Content", icon: MessageSquare },
  other: { label: "Other", icon: Lightbulb },
};

// Principle category configuration - what rule/heuristic is violated
const PRINCIPLE_CATEGORY_CONFIG: Record<PrincipleCategory, { label: string; examples: string[] }> = {
  "ux-heuristic": {
    label: "UX Heuristic",
    examples: ["Nielsen's visibility of system status", "Match between system and real world", "User control and freedom"],
  },
  "design-principle": {
    label: "Design Principle",
    examples: ["Gestalt proximity", "Color contrast ratio", "Typography hierarchy", "Visual balance"],
  },
  "coding-standard": {
    label: "Coding Standard",
    examples: ["SOLID principles", "DRY (Don't Repeat Yourself)", "Clean code naming", "Separation of concerns"],
  },
  accessibility: {
    label: "Accessibility",
    examples: ["WCAG 2.1 AA", "Keyboard navigation", "Screen reader compatibility", "Color blindness"],
  },
  performance: {
    label: "Performance",
    examples: ["Core Web Vitals", "Lazy loading", "Bundle size", "Caching strategy"],
  },
  security: {
    label: "Security",
    examples: ["OWASP Top 10", "Input validation", "Authentication best practices", "XSS prevention"],
  },
  seo: {
    label: "SEO",
    examples: ["Meta tags", "Semantic HTML", "Page speed", "Mobile-first indexing"],
  },
  content: {
    label: "Content",
    examples: ["Inverted pyramid writing", "Scannable content", "Clear CTAs", "Consistent voice"],
  },
  other: {
    label: "Other",
    examples: [],
  },
};

// Impact type configuration - what happens if not fixed
const IMPACT_TYPE_CONFIG: Record<ImpactType, { label: string; description: string; color: string }> = {
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
  return array[Math.floor(Math.random() * array.length)] ?? array[0] ?? "";
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
  const [showPremiumFields, setShowPremiumFields] = React.useState(false);
  const [newResourceUrl, setNewResourceUrl] = React.useState("");
  const [newResourceTitle, setNewResourceTitle] = React.useState("");
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
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                PRIORITY_CONFIG[item.priority].bg,
                PRIORITY_CONFIG[item.priority].color
              )}>
                {PRIORITY_CONFIG[item.priority].label}
              </span>
              {item.isQuickWin && (
                <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <Zap className="size-3" /> Quick Win
                </span>
              )}
              {item.effort && (
                <span className={cn("text-xs px-2 py-0.5 rounded-full", EFFORT_CONFIG[item.effort].bg, EFFORT_CONFIG[item.effort].color)}>
                  {EFFORT_CONFIG[item.effort].label}
                </span>
              )}
              {item.location && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3" />
                  {item.location}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-foreground line-clamp-1">{item.issue}</p>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">→ {item.suggestion}</p>
            {(item.principle || item.impact || item.afterState) && (
              <p className="text-xs text-indigo-600 mt-0.5 flex items-center gap-1">
                <Sparkles className="size-3" />
                Expert insight added
              </p>
            )}
            {item.resources && item.resources.length > 0 && (
              <p className="text-xs text-indigo-600 mt-0.5 flex items-center gap-1">
                <Link2 className="size-3" />
                {item.resources.length} reference link{item.resources.length > 1 ? "s" : ""}
              </p>
            )}
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

      {/* Premium Fields Toggle */}
      <div className="pt-2 border-t border-border">
        <button
          type="button"
          onClick={() => setShowPremiumFields(!showPremiumFields)}
          className="flex items-center gap-2 text-sm font-medium text-accent-blue hover:text-accent-blue/80 transition-colors touch-manipulation"
        >
          <Sparkles className="size-4" />
          {showPremiumFields ? "Hide expert details" : "Add expert details"}
          <span className="text-xs text-muted-foreground">(effort, confidence, resources)</span>
          {showPremiumFields ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      {/* Premium Fields (Collapsible) */}
      {showPremiumFields && (
        <div className="space-y-4 pt-3 animate-in slide-in-from-top-2 duration-200">
          {/* === INSIGHT FIELDS - Transform opinions into expert guidance === */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-800">
              <Sparkles className="size-4" />
              Expert Insight
              <span className="text-xs font-normal text-indigo-600">(This is what makes reviews valuable)</span>
            </div>

            {/* Principle - What rule/heuristic is violated */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                📘 Underlying Principle
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="size-4 text-muted-foreground hover:text-foreground">
                      <HelpCircle className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    What design principle, heuristic, or best practice is being violated? This builds trust and shows expertise.
                  </TooltipContent>
                </Tooltip>
              </label>
              <div className="flex flex-col gap-2">
                <select
                  value={item.principleCategory || ""}
                  onChange={(e) => updateField("principleCategory", e.target.value as PrincipleCategory || undefined)}
                  className="text-sm border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="">Select category...</option>
                  {(Object.keys(PRINCIPLE_CATEGORY_CONFIG) as PrincipleCategory[]).map((cat) => (
                    <option key={cat} value={cat}>{PRINCIPLE_CATEGORY_CONFIG[cat].label}</option>
                  ))}
                </select>
                {item.principleCategory && PRINCIPLE_CATEGORY_CONFIG[item.principleCategory].examples.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Examples: {PRINCIPLE_CATEGORY_CONFIG[item.principleCategory].examples.slice(0, 3).join(", ")}
                  </p>
                )}
                <Input
                  placeholder="e.g., Nielsen's 'Visibility of System Status' - users need feedback on their actions"
                  value={item.principle || ""}
                  onChange={(e) => updateField("principle", e.target.value || undefined)}
                  className="text-sm bg-white"
                />
              </div>
            </div>

            {/* Impact - What happens if not fixed */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                💥 Impact if Not Fixed
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="size-4 text-muted-foreground hover:text-foreground">
                      <HelpCircle className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    What's the real cost of ignoring this? This helps creators prioritize.
                  </TooltipContent>
                </Tooltip>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(Object.keys(IMPACT_TYPE_CONFIG) as ImpactType[]).map((impact) => (
                  <button
                    key={impact}
                    type="button"
                    onClick={() => updateField("impactType", item.impactType === impact ? undefined : impact)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full border transition-all touch-manipulation",
                      item.impactType === impact
                        ? "bg-indigo-100 border-indigo-400 text-indigo-800"
                        : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"
                    )}
                  >
                    {IMPACT_TYPE_CONFIG[impact].label}
                  </button>
                ))}
              </div>
              <AutoGrowTextarea
                placeholder="e.g., Users will abandon checkout due to confusion about payment status, leading to ~15% conversion loss"
                value={item.impact || ""}
                onChange={(value) => updateField("impact", value || undefined)}
                className="text-sm bg-white"
                minRows={2}
              />
            </div>

            {/* After State - What would it look like if fixed */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                ✨ After State
                <span className="text-xs text-muted-foreground font-normal">(What does "fixed" look like?)</span>
              </label>
              <AutoGrowTextarea
                placeholder="e.g., Add a loading spinner with 'Processing payment...' text. After success, show green checkmark with 'Payment confirmed!' for 2 seconds before redirect."
                value={item.afterState || ""}
                onChange={(value) => updateField("afterState", value || undefined)}
                className="text-sm bg-white"
                minRows={2}
              />
            </div>
          </div>

          {/* Quick Win + Category Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Win Toggle */}
            <button
              type="button"
              onClick={() => updateField("isQuickWin", !item.isQuickWin)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 transition-all",
                "text-sm font-medium touch-manipulation",
                item.isQuickWin
                  ? "bg-green-100 border-green-400 text-green-700"
                  : "bg-white border-gray-200 text-gray-600 hover:border-green-300"
              )}
            >
              <Zap className={cn("size-4", item.isQuickWin && "fill-green-500")} />
              Quick Win
            </button>

            {/* Category Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Category:</label>
              <select
                value={item.category || ""}
                onChange={(e) => updateField("category", e.target.value as ImprovementCategory || undefined)}
                className="text-sm border rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-accent-blue/50"
              >
                <option value="">Select...</option>
                {(Object.keys(CATEGORY_CONFIG) as ImprovementCategory[]).map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_CONFIG[cat].label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Effort Estimate */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Clock className="size-3.5 text-purple-600" />
              Estimated Effort
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="size-4 text-muted-foreground hover:text-foreground">
                    <HelpCircle className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Help creators prioritize by knowing how much work each fix requires</TooltipContent>
              </Tooltip>
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(EFFORT_CONFIG) as EffortEstimate[]).map((effort) => {
                const config = EFFORT_CONFIG[effort];
                const Icon = config.icon;
                const isSelected = item.effort === effort;
                return (
                  <button
                    key={effort}
                    type="button"
                    onClick={() => updateField("effort", isSelected ? undefined : effort)}
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="size-4 text-muted-foreground hover:text-foreground">
                    <HelpCircle className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>How confident are you that this suggestion will improve the work?</TooltipContent>
              </Tooltip>
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CONFIDENCE_CONFIG) as ConfidenceLevel[]).map((confidence) => {
                const config = CONFIDENCE_CONFIG[confidence];
                const isSelected = item.confidence === confidence;
                return (
                  <button
                    key={confidence}
                    type="button"
                    onClick={() => updateField("confidence", isSelected ? undefined : confidence)}
                    className={cn(
                      "flex flex-col items-start px-3 py-2 rounded-lg border-2 transition-all",
                      "text-sm font-medium touch-manipulation text-left",
                      isSelected
                        ? cn(config.bg, "border-current", config.color)
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    <span>{config.label}</span>
                    <span className="text-xs opacity-70 font-normal">{config.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resource Links */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Link2 className="size-3.5 text-indigo-600" />
              Reference Links
              <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </label>

            {/* Existing links */}
            {item.resources && item.resources.length > 0 && (
              <div className="space-y-1.5">
                {item.resources.map((resource, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg text-sm">
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
                      onClick={() => {
                        const newResources = item.resources?.filter((_, i) => i !== idx);
                        updateField("resources", newResources?.length ? newResources : undefined);
                      }}
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
                onClick={() => {
                  if (newResourceUrl.trim()) {
                    const newResource: ResourceLink = {
                      url: newResourceUrl.trim(),
                      title: newResourceTitle.trim() || undefined,
                    };
                    updateField("resources", [...(item.resources || []), newResource]);
                    setNewResourceUrl("");
                    setNewResourceTitle("");
                  }
                }}
                className="shrink-0 touch-manipulation"
              >
                <Plus className="size-4 mr-1" />
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Add links to docs, tutorials, or examples that support your suggestion
            </p>
          </div>
        </div>
      )}

      {/* Completion indicator */}
      {isComplete && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          <span className="text-xs text-green-600 font-medium">✓ Complete</span>
          {/* Show insight badge */}
          {(item.principle || item.impact || item.afterState) && (
            <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Sparkles className="size-3" /> Has Insight
            </span>
          )}
          {/* Show premium field badges */}
          {item.isQuickWin && (
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Zap className="size-3" /> Quick Win
            </span>
          )}
          {item.effort && (
            <span className={cn("text-xs px-1.5 py-0.5 rounded-full", EFFORT_CONFIG[item.effort].bg, EFFORT_CONFIG[item.effort].color)}>
              {EFFORT_CONFIG[item.effort].label}
            </span>
          )}
          {item.resources && item.resources.length > 0 && (
            <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
              {item.resources.length} link{item.resources.length > 1 ? "s" : ""}
            </span>
          )}
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
