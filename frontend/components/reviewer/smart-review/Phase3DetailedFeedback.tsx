/**
 * Phase 3: Detailed Feedback
 *
 * - Strengths (bullet list, 1-10 items)
 * - Areas for improvement (bullet list, 1-10 items)
 * - Additional notes (optional, rich text)
 * - Visual annotations (for design/art reviews)
 */

"use client";

import * as React from "react";
import { Plus, X, HelpCircle, ChevronDown, ChevronUp, Sparkles, Lightbulb, EyeOff, Eye } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Phase3DetailedFeedback as Phase3Data, VisualAnnotation } from "@/lib/types/smart-review";
import { ImageAnnotation } from "./ImageAnnotation";
import { getTopSuggestions, Suggestion } from "@/lib/constants/review-suggestions";

interface Phase3DetailedFeedbackProps {
  data: Phase3Data | null;
  onChange: (data: Phase3Data) => void;
  contentType?: string; // Content type to determine if visual annotations should be shown
  imageUrl?: string; // Image URL for design/art reviews
  selectedFocusAreas?: string[]; // Focus areas from Phase 1 for suggestion filtering
}

export function Phase3DetailedFeedback({
  data,
  onChange,
  contentType,
  imageUrl,
  selectedFocusAreas,
}: Phase3DetailedFeedbackProps) {
  const [strengths, setStrengths] = React.useState<string[]>(
    data?.strengths || [""]
  );
  const [improvements, setImprovements] = React.useState<string[]>(
    data?.improvements || [""]
  );
  const [additionalNotes, setAdditionalNotes] = React.useState(
    data?.additional_notes || ""
  );
  const [visualAnnotations, setVisualAnnotations] = React.useState<VisualAnnotation[]>(
    data?.visual_annotations || []
  );
  const [notesExpanded, setNotesExpanded] = React.useState(false);

  // Suggestion visibility state
  const [showStrengthSuggestions, setShowStrengthSuggestions] = React.useState(true);
  const [showImprovementSuggestions, setShowImprovementSuggestions] = React.useState(true);

  // Track recently used suggestions to fade them out
  const [usedSuggestions, setUsedSuggestions] = React.useState<Set<string>>(new Set());

  // Section collapse state
  const [strengthsCollapsed, setStrengthsCollapsed] = React.useState(false);
  const [improvementsCollapsed, setImprovementsCollapsed] = React.useState(false);
  const [annotationsCollapsed, setAnnotationsCollapsed] = React.useState(false);

  // Compact summary view (when revisiting completed phase)
  const [showCompactSummary, setShowCompactSummary] = React.useState(false);

  // Determine if we should show image annotations (for design/art content)
  const showImageAnnotations = (contentType === "design" || contentType === "art") && imageUrl;

  // Get context-aware suggestions
  const strengthSuggestions = React.useMemo(
    () => getTopSuggestions("strength", contentType, selectedFocusAreas, 5),
    [contentType, selectedFocusAreas]
  );

  const improvementSuggestions = React.useMemo(
    () => getTopSuggestions("improvement", contentType, selectedFocusAreas, 5),
    [contentType, selectedFocusAreas]
  );

  // Update parent when any field changes
  React.useEffect(() => {
    const validStrengths = strengths.filter((s) => s.trim().length > 0);
    const validImprovements = improvements.filter((i) => i.trim().length > 0);

    if (validStrengths.length > 0 || validImprovements.length > 0) {
      onChange({
        strengths: validStrengths,
        improvements: validImprovements,
        additional_notes: additionalNotes.trim() || undefined,
        visual_annotations: visualAnnotations.length > 0 ? visualAnnotations : undefined,
      });
    }
  }, [strengths, improvements, additionalNotes, visualAnnotations, onChange]);

  // Auto-collapse sections when they reach minimum content (2 items)
  React.useEffect(() => {
    const validStrengths = strengths.filter((s) => s.trim().length > 0);
    const validImprovements = improvements.filter((i) => i.trim().length > 0);

    // Auto-collapse strengths when >= 2 items
    if (validStrengths.length >= 2 && !strengthsCollapsed) {
      setStrengthsCollapsed(true);
    }

    // Auto-collapse improvements when >= 2 items
    if (validImprovements.length >= 2 && !improvementsCollapsed) {
      setImprovementsCollapsed(true);
    }

    // Auto-collapse annotations when >= 1 annotation
    if (visualAnnotations.length >= 1 && !annotationsCollapsed) {
      setAnnotationsCollapsed(true);
    }
  }, [strengths, improvements, visualAnnotations, strengthsCollapsed, improvementsCollapsed, annotationsCollapsed]);

  // Check if phase is complete (for compact summary view)
  const isPhaseComplete = React.useMemo(() => {
    const validStrengths = strengths.filter((s) => s.trim().length > 0);
    const validImprovements = improvements.filter((i) => i.trim().length > 0);
    return validStrengths.length >= 2 && validImprovements.length >= 2;
  }, [strengths, improvements]);

  const updateStrength = (index: number, value: string) => {
    const newStrengths = [...strengths];
    newStrengths[index] = value;
    setStrengths(newStrengths);
  };

  const addStrength = () => {
    if (strengths.length < 10) {
      setStrengths([...strengths, ""]);
    }
  };

  const removeStrength = (index: number) => {
    if (strengths.length > 1) {
      setStrengths(strengths.filter((_, i) => i !== index));
    }
  };

  const updateImprovement = (index: number, value: string) => {
    const newImprovements = [...improvements];
    newImprovements[index] = value;
    setImprovements(newImprovements);
  };

  const addImprovement = () => {
    if (improvements.length < 10) {
      setImprovements([...improvements, ""]);
    }
  };

  const removeImprovement = (index: number) => {
    if (improvements.length > 1) {
      setImprovements(improvements.filter((_, i) => i !== index));
    }
  };

  // Suggestion tap handlers
  const handleSuggestionTap = (suggestion: Suggestion, category: "strength" | "improvement") => {
    const fields = category === "strength" ? strengths : improvements;
    const setFields = category === "strength" ? setStrengths : setImprovements;
    const maxItems = 10;

    // Find first empty field
    const emptyIndex = fields.findIndex((field) => field.trim().length === 0);

    if (emptyIndex !== -1) {
      // Insert into first empty field
      const newFields = [...fields];
      newFields[emptyIndex] = suggestion.text;
      setFields(newFields);
    } else if (fields.length < maxItems) {
      // All fields filled, create new one
      setFields([...fields, suggestion.text]);
    } else {
      // All fields filled and at max, do nothing (could show toast)
      return;
    }

    // Mark suggestion as used (for visual feedback)
    setUsedSuggestions((prev) => new Set(prev).add(suggestion.id));

    // Optional: Remove from used after 2 seconds for re-use
    setTimeout(() => {
      setUsedSuggestions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(suggestion.id);
        return newSet;
      });
    }, 2000);
  };

  const validStrengthsCount = strengths.filter((s) => s.trim().length > 0).length;
  const validImprovementsCount = improvements.filter((i) => i.trim().length > 0).length;

  // Reusable Suggestion Chips Component
  const SuggestionChips = ({
    suggestions,
    category,
    show,
    onToggle,
  }: {
    suggestions: Suggestion[];
    category: "strength" | "improvement";
    show: boolean;
    onToggle: () => void;
  }) => {
    const isStrength = category === "strength";
    const icon = isStrength ? Sparkles : Lightbulb;
    const IconComponent = icon;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <IconComponent className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Quick suggestions
            </span>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[32px] px-2 -mr-2"
            aria-label={show ? "Hide suggestions" : "Show suggestions"}
          >
            {show ? (
              <>
                <EyeOff className="size-3" />
                Hide
              </>
            ) : (
              <>
                <Eye className="size-3" />
                Show
              </>
            )}
          </button>
        </div>

        {show && (
          <div className="relative">
            {/* Horizontal scroll container with mobile optimizations */}
            <div
              className={cn(
                "flex gap-2 overflow-x-auto pb-2 px-1 -mx-1",
                "snap-x snap-mandatory scrollbar-hide",
                "scroll-smooth"
              )}
              style={{
                // Hide scrollbar
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {suggestions.map((suggestion) => {
                const isUsed = usedSuggestions.has(suggestion.id);
                return (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => handleSuggestionTap(suggestion, category)}
                    className={cn(
                      "flex-shrink-0 snap-start",
                      "h-8 px-3 py-1.5 rounded-full border-2",
                      "text-xs font-medium whitespace-nowrap",
                      "transition-all duration-200",
                      "active:scale-95 touch-manipulation",
                      "flex items-center gap-1.5",
                      isStrength
                        ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200 hover:border-green-400"
                        : "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200 hover:border-amber-400",
                      isUsed && "opacity-50"
                    )}
                    aria-label={`Add suggestion: ${suggestion.text}`}
                  >
                    {isUsed ? "✓ Added" : suggestion.text}
                  </button>
                );
              })}
            </div>
            {/* Fade effect on right edge to indicate scrollability */}
            <div
              className="absolute right-0 top-0 bottom-2 w-8 pointer-events-none"
              style={{
                background: isStrength
                  ? "linear-gradient(to left, rgb(240 253 244 / 0.5), transparent)"
                  : "linear-gradient(to left, rgb(254 252 232 / 0.5), transparent)",
              }}
            />
          </div>
        )}
      </div>
    );
  };

  // Section refs for scroll navigation
  const strengthsRef = React.useRef<HTMLDivElement>(null);
  const improvementsRef = React.useRef<HTMLDivElement>(null);
  const annotationsRef = React.useRef<HTMLDivElement>(null);
  const notesRef = React.useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Sticky Section Navigation - Mobile only */}
        {isPhaseComplete && (
          <div className="lg:hidden sticky top-0 z-10 bg-card border-b border-border shadow-sm -mx-4 sm:-mx-5 md:-mx-6 px-4 sm:px-5 md:px-6 py-2 mb-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <span className="text-xs font-medium text-muted-foreground shrink-0 mr-1">Jump to:</span>
              <button
                type="button"
                onClick={() => scrollToSection(strengthsRef)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-medium whitespace-nowrap hover:bg-green-200 transition-colors touch-manipulation"
              >
                ✅ Strengths
              </button>
              <button
                type="button"
                onClick={() => scrollToSection(improvementsRef)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium whitespace-nowrap hover:bg-amber-200 transition-colors touch-manipulation"
              >
                🔧 Improvements
              </button>
              {showImageAnnotations && (
                <button
                  type="button"
                  onClick={() => scrollToSection(annotationsRef)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium whitespace-nowrap hover:bg-blue-200 transition-colors touch-manipulation"
                >
                  📍 Annotations
                </button>
              )}
              <button
                type="button"
                onClick={() => scrollToSection(notesRef)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium whitespace-nowrap hover:bg-purple-200 transition-colors touch-manipulation"
              >
                📝 Notes
              </button>
            </div>
          </div>
        )}

        {/* Compact Summary View Toggle */}
        {isPhaseComplete && (
          <div className="flex items-center justify-between p-3 rounded-lg border border-green-200 bg-green-50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-green-700">✨ Phase 3 Complete!</span>
              <span className="text-xs text-muted-foreground">
                {validStrengthsCount + validImprovementsCount} items added
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowCompactSummary(!showCompactSummary)}
              className="text-xs font-medium text-green-700 hover:text-green-800 px-3 py-1.5 rounded hover:bg-green-100 transition-colors min-h-[32px] touch-manipulation"
            >
              {showCompactSummary ? "Expand All" : "Show Summary"}
            </button>
          </div>
        )}

        {/* Compact Summary Cards */}
        {showCompactSummary && isPhaseComplete && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
            {/* Strengths Summary */}
            <button
              type="button"
              onClick={() => {
                setShowCompactSummary(false);
                setStrengthsCollapsed(false);
              }}
              className="w-full text-left p-4 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 transition-colors touch-manipulation"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-green-700">✅ Strengths</span>
                <span className="text-xs text-muted-foreground">{validStrengthsCount} items</span>
              </div>
              <p className="text-xs text-muted-foreground">Tap to expand and edit</p>
            </button>

            {/* Improvements Summary */}
            <button
              type="button"
              onClick={() => {
                setShowCompactSummary(false);
                setImprovementsCollapsed(false);
              }}
              className="w-full text-left p-4 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors touch-manipulation"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-amber-700">🔧 Areas for Improvement</span>
                <span className="text-xs text-muted-foreground">{validImprovementsCount} items</span>
              </div>
              <p className="text-xs text-muted-foreground">Tap to expand and edit</p>
            </button>

            {/* Annotations Summary */}
            {showImageAnnotations && visualAnnotations.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowCompactSummary(false);
                  setAnnotationsCollapsed(false);
                }}
                className="w-full text-left p-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors touch-manipulation"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-blue-700">📍 Visual Annotations</span>
                  <span className="text-xs text-muted-foreground">{visualAnnotations.length} annotation{visualAnnotations.length !== 1 ? "s" : ""}</span>
                </div>
                <p className="text-xs text-muted-foreground">Tap to expand and edit</p>
              </button>
            )}
          </div>
        )}

        {/* Full Detail View (hidden when compact summary is shown) */}
        {!showCompactSummary && (
          <>
            {/* Strengths - Color-coded green background */}
            <div ref={strengthsRef}>
        <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-lg font-semibold">✅ Strengths</Label>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="size-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label="Tips for listing strengths"
                  >
                    <HelpCircle className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">Be specific: Reference exact elements, lines, or sections that work well</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              {validStrengthsCount > 0 && (
                <span className="text-sm font-medium text-green-600">
                  {validStrengthsCount} item{validStrengthsCount !== 1 ? "s" : ""}
                </span>
              )}
              {validStrengthsCount >= 2 && (
                <button
                  type="button"
                  onClick={() => setStrengthsCollapsed(!strengthsCollapsed)}
                  className="flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-800 px-2 py-1 rounded hover:bg-green-100 transition-colors min-h-[32px] touch-manipulation"
                >
                  {strengthsCollapsed ? (
                    <>
                      <ChevronDown className="size-3" />
                      Expand
                    </>
                  ) : (
                    <>
                      <ChevronUp className="size-3" />
                      Collapse
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Collapsed Summary */}
          {strengthsCollapsed && validStrengthsCount >= 2 && (
            <div className="p-3 rounded-lg bg-white/50 border border-green-200">
              <p className="text-xs text-muted-foreground">
                {validStrengthsCount} strength{validStrengthsCount !== 1 ? "s" : ""} added. Tap "Expand" to view or edit.
              </p>
            </div>
          )}

          {/* Full Content */}
          {!strengthsCollapsed && (
            <>

          {/* Suggestion Chips for Strengths */}
          <SuggestionChips
            suggestions={strengthSuggestions}
            category="strength"
            show={showStrengthSuggestions}
            onToggle={() => setShowStrengthSuggestions(!showStrengthSuggestions)}
          />

        <div className="space-y-2">
          {strengths.map((strength, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder={`e.g., "Clear function names and good documentation"`}
                  value={strength}
                  onChange={(e) => updateStrength(index, e.target.value)}
                  className="text-base"
                />
              </div>
              {strengths.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStrength(index)}
                  className="flex-shrink-0 size-12 md:size-11"
                  aria-label="Remove strength"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {strengths.length < 10 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addStrength}
            className="w-full min-h-[48px]"
          >
            <Plus className="size-4 mr-2" />
            Add Strength
          </Button>
        )}
            </>
          )}
        </div>
      </div>

        {/* Areas for Improvement - Color-coded amber background */}
        <div ref={improvementsRef}>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-lg font-semibold">🔧 Areas for Improvement</Label>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="size-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label="Tips for improvement suggestions"
                  >
                    <HelpCircle className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">Be actionable: Suggest concrete steps for improvement, not just problems</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              {validImprovementsCount > 0 && (
                <span className="text-sm font-medium text-amber-600">
                  {validImprovementsCount} item{validImprovementsCount !== 1 ? "s" : ""}
                </span>
              )}
              {validImprovementsCount >= 2 && (
                <button
                  type="button"
                  onClick={() => setImprovementsCollapsed(!improvementsCollapsed)}
                  className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800 px-2 py-1 rounded hover:bg-amber-100 transition-colors min-h-[32px] touch-manipulation"
                >
                  {improvementsCollapsed ? (
                    <>
                      <ChevronDown className="size-3" />
                      Expand
                    </>
                  ) : (
                    <>
                      <ChevronUp className="size-3" />
                      Collapse
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Collapsed Summary */}
          {improvementsCollapsed && validImprovementsCount >= 2 && (
            <div className="p-3 rounded-lg bg-white/50 border border-amber-200">
              <p className="text-xs text-muted-foreground">
                {validImprovementsCount} improvement{validImprovementsCount !== 1 ? "s" : ""} added. Tap "Expand" to view or edit.
              </p>
            </div>
          )}

          {/* Full Content */}
          {!improvementsCollapsed && (
            <>

          {/* Suggestion Chips for Improvements */}
          <SuggestionChips
            suggestions={improvementSuggestions}
            category="improvement"
            show={showImprovementSuggestions}
            onToggle={() => setShowImprovementSuggestions(!showImprovementSuggestions)}
          />

        <div className="space-y-2">
          {improvements.map((improvement, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder={`e.g., "Add unit tests for edge cases"`}
                  value={improvement}
                  onChange={(e) => updateImprovement(index, e.target.value)}
                  className="text-base"
                />
              </div>
              {improvements.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeImprovement(index)}
                  className="flex-shrink-0 size-12 md:size-11"
                  aria-label="Remove improvement"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {improvements.length < 10 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addImprovement}
            className="w-full min-h-[48px]"
          >
            <Plus className="size-4 mr-2" />
            Add Improvement
          </Button>
        )}
            </>
          )}
        </div>
      </div>

      {/* Visual Annotations (Design/Art only) */}
      <div ref={annotationsRef}>
      {showImageAnnotations && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-lg font-semibold">📍 Visual Annotations</Label>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="size-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label="About visual annotations"
                  >
                    <HelpCircle className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">Click on the design to add pin-points with specific feedback</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              {visualAnnotations.length > 0 && (
                <span className="text-sm font-medium text-blue-600">
                  {visualAnnotations.length} annotation{visualAnnotations.length !== 1 ? "s" : ""}
                </span>
              )}
              {visualAnnotations.length >= 1 && (
                <button
                  type="button"
                  onClick={() => setAnnotationsCollapsed(!annotationsCollapsed)}
                  className="flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-100 transition-colors min-h-[32px] touch-manipulation"
                >
                  {annotationsCollapsed ? (
                    <>
                      <ChevronDown className="size-3" />
                      Expand
                    </>
                  ) : (
                    <>
                      <ChevronUp className="size-3" />
                      Collapse
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Collapsed Summary */}
          {annotationsCollapsed && visualAnnotations.length >= 1 && (
            <div className="p-3 rounded-lg bg-white/50 border border-blue-200">
              <p className="text-xs text-muted-foreground">
                {visualAnnotations.length} annotation{visualAnnotations.length !== 1 ? "s" : ""} added. Tap "Expand" to view or edit.
              </p>
            </div>
          )}

          {/* Full Content */}
          {!annotationsCollapsed && (
            <>
              <ImageAnnotation
                imageUrl={imageUrl!}
                annotations={visualAnnotations}
                onChange={setVisualAnnotations}
              />
            </>
          )}
        </div>
      )}
      </div>

      {/* Additional Notes - Collapsible with blue background */}
      <div ref={notesRef} className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 md:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-lg font-semibold">📝 Additional Notes (Optional)</Label>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="size-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label="About additional notes"
                >
                  <HelpCircle className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">Add any context, explanations, or suggestions that don't fit in the categories above</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setNotesExpanded(!notesExpanded)}
            className="min-h-[48px] text-sm font-medium"
          >
            {notesExpanded ? (
              <>
                <ChevronUp className="size-4 mr-1" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="size-4 mr-1" />
                Add optional notes
              </>
            )}
          </Button>
        </div>

        {notesExpanded && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
            <Textarea
              id="additional-notes"
              placeholder="Add any additional context that doesn't fit in the categories above..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className={cn(
                "min-h-[150px] text-base resize-y",
                "focus:ring-2 focus:ring-accent-blue/50"
              )}
              maxLength={5000}
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {additionalNotes.length} / 5000 characters
              </span>
              {additionalNotes.length > 0 && (
                <span className="text-green-600">✓ Notes added</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Progress Summary */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <h4 className="text-sm font-semibold mb-2">Phase 3 Progress:</h4>
        <ul className="space-y-1 text-sm">
          <li
            className={cn(
              validStrengthsCount >= 1
                ? "text-green-600"
                : "text-muted-foreground"
            )}
          >
            {validStrengthsCount >= 1 ? "✓" : "○"} Strengths listed (
            {validStrengthsCount})
          </li>
          <li
            className={cn(
              validImprovementsCount >= 1
                ? "text-green-600"
                : "text-muted-foreground"
            )}
          >
            {validImprovementsCount >= 1 ? "✓" : "○"} Improvements listed (
            {validImprovementsCount})
          </li>
          {showImageAnnotations && (
            <li
              className={cn(
                visualAnnotations.length > 0
                  ? "text-green-600"
                  : "text-muted-foreground"
              )}
            >
              {visualAnnotations.length > 0 ? "✓" : "○"} Visual annotations (
              {visualAnnotations.length})
            </li>
          )}
          <li
            className={cn(
              additionalNotes.length > 0
                ? "text-green-600"
                : "text-muted-foreground"
            )}
          >
            {additionalNotes.length > 0 ? "✓" : "○"} Additional notes (optional)
          </li>
        </ul>
        {validStrengthsCount >= 2 && validImprovementsCount >= 2 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs font-medium text-green-600 flex items-center gap-1">
              <span className="text-base">🎯</span> Excellent! Your feedback is comprehensive and actionable.
            </p>
          </div>
        )}
      </div>
          </>
        )}
    </div>
    </TooltipProvider>
  );
}
