/**
 * Phase 3: Detailed Feedback + Final Verdict
 *
 * - Strengths (bullet list, 1-10 items)
 * - Areas for improvement (bullet list, 1-10 items)
 * - Additional notes (optional, rich text)
 * - Visual annotations (for design/art reviews)
 * - Final Verdict: Overall rating + Summary (moved from Phase 1)
 */

"use client";

import * as React from "react";
import { Plus, HelpCircle, ChevronDown, ChevronUp, Star, Award, FileText, CheckCircle2, ArrowRight, MessageCircle, Clock, Target } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Phase3DetailedFeedback as Phase3Data, VisualAnnotation, VoiceMemo, StructuredImprovement, StructuredStrength, ExecutiveSummary, FollowUpOffer, TopTakeaway } from "@/lib/types/smart-review";
import { ImageAnnotation } from "./ImageAnnotation";
import { VoiceMemoRecorder } from "./VoiceMemoRecorder";
import {
  StructuredImprovementItem,
  StructuredStrengthItem,
  createNewImprovement,
  createNewStrength,
} from "./StructuredFeedbackItem";

interface Phase3DetailedFeedbackProps {
  data: Phase3Data | null;
  onChange: (data: Phase3Data) => void;
  contentType?: string; // Content type to determine if visual annotations should be shown
  imageUrl?: string; // Image URL for design/art reviews
  _selectedFocusAreas?: string[]; // Focus areas from Phase 1 for suggestion filtering (reserved for future use)
  // Final Verdict props (stored in Phase1 data but edited in Phase3)
  overallRating?: number;
  quickSummary?: string;
  onVerdictChange?: (rating: number, summary: string) => void;
}

export function Phase3DetailedFeedback({
  data,
  onChange,
  contentType,
  imageUrl,
  overallRating = 0,
  quickSummary = "",
  onVerdictChange,
}: Phase3DetailedFeedbackProps) {
  // Initialize structured strengths - convert legacy data if present
  const initStructuredStrengths = (): StructuredStrength[] => {
    if (data?.structured_strengths && data.structured_strengths.length > 0) {
      return data.structured_strengths;
    }
    // Convert legacy strengths if present
    if (data?.strengths && data.strengths.length > 0) {
      return data.strengths.map((what, i) => ({
        id: `str-legacy-${i}`,
        what,
        why: undefined,
      }));
    }
    return [createNewStrength()];
  };

  // Initialize structured improvements - convert legacy data if present
  const initStructuredImprovements = (): StructuredImprovement[] => {
    if (data?.structured_improvements && data.structured_improvements.length > 0) {
      return data.structured_improvements;
    }
    // Convert legacy improvements if present
    if (data?.improvements && data.improvements.length > 0) {
      return data.improvements.map((text, i) => ({
        id: `imp-legacy-${i}`,
        issue: text,
        location: undefined,
        suggestion: "",
        priority: "important" as const,
      }));
    }
    return [createNewImprovement()];
  };

  const [structuredStrengths, setStructuredStrengths] = React.useState<StructuredStrength[]>(initStructuredStrengths);
  const [structuredImprovements, setStructuredImprovements] = React.useState<StructuredImprovement[]>(initStructuredImprovements);
  const [additionalNotes, setAdditionalNotes] = React.useState(
    data?.additional_notes || ""
  );
  const [visualAnnotations, setVisualAnnotations] = React.useState<VisualAnnotation[]>(
    data?.visual_annotations || []
  );
  const [voiceMemo, setVoiceMemo] = React.useState<VoiceMemo | undefined>(
    data?.voice_memo
  );
  const [notesExpanded, setNotesExpanded] = React.useState(false);

  // Executive Summary state
  const [executiveSummary, setExecutiveSummary] = React.useState<ExecutiveSummary>(
    data?.executive_summary || {
      tldr: "",
      keyStrengths: ["", "", ""],
      keyActions: ["", "", ""],
      overallReadiness: undefined,
    }
  );
  const [showExecutiveSummary, setShowExecutiveSummary] = React.useState(
    !!(data?.executive_summary?.tldr)
  );

  // Follow-up Offer state
  const [followUpOffer, setFollowUpOffer] = React.useState<FollowUpOffer>(
    data?.follow_up_offer || {
      available: false,
      type: undefined,
      description: "",
      responseTime: "",
    }
  );
  const [showFollowUpOffer, setShowFollowUpOffer] = React.useState(
    data?.follow_up_offer?.available || false
  );

  // Top 3 Takeaways state - the TL;DR action items
  const [topTakeaways, setTopTakeaways] = React.useState<TopTakeaway[]>(
    data?.top_takeaways || [
      { issue: "", fix: "" },
      { issue: "", fix: "" },
      { issue: "", fix: "" },
    ]
  );

  // Final Verdict state
  const [rating, setRating] = React.useState(overallRating);
  const [summary, setSummary] = React.useState(quickSummary);

  // Sync verdict state with props
  React.useEffect(() => {
    setRating(overallRating);
    setSummary(quickSummary);
  }, [overallRating, quickSummary]);

  // Notify parent of verdict changes
  React.useEffect(() => {
    if (onVerdictChange && (rating !== overallRating || summary !== quickSummary)) {
      onVerdictChange(rating, summary);
    }
  }, [rating, summary, onVerdictChange, overallRating, quickSummary]);

  // Section collapse state
  const [strengthsCollapsed, setStrengthsCollapsed] = React.useState(false);
  const [improvementsCollapsed, setImprovementsCollapsed] = React.useState(false);
  const [annotationsCollapsed, setAnnotationsCollapsed] = React.useState(false);

  // Compact summary view (when revisiting completed phase)
  const [showCompactSummary, setShowCompactSummary] = React.useState(false);

  // Determine if we should show image annotations (for design/art content)
  const showImageAnnotations = (contentType === "design" || contentType === "art") && imageUrl;

  // Update parent when any field changes
  React.useEffect(() => {
    // Get valid structured items
    const validStrengths = structuredStrengths.filter((s) => s.what.length >= 10);
    const validImprovements = structuredImprovements.filter(
      (i) => i.issue.length >= 10 && i.suggestion.length >= 10
    );

    // Convert to legacy format for backward compatibility
    const legacyStrengths = validStrengths.map((s) => s.what);
    const legacyImprovements = validImprovements.map((i) => `${i.issue} → ${i.suggestion}`);

    // Build executive summary if valid
    const validExecutiveSummary = executiveSummary.tldr.length >= 50 ? {
      tldr: executiveSummary.tldr,
      keyStrengths: executiveSummary.keyStrengths.filter(s => s.trim().length > 0),
      keyActions: executiveSummary.keyActions.filter(a => a.trim().length > 0),
      overallReadiness: executiveSummary.overallReadiness,
    } : undefined;

    // Build follow-up offer if valid
    const validFollowUpOffer = followUpOffer.available ? {
      available: true,
      type: followUpOffer.type,
      description: followUpOffer.description?.trim() || undefined,
      responseTime: followUpOffer.responseTime?.trim() || undefined,
    } : undefined;

    // Build valid top takeaways (filter out empty ones)
    const validTopTakeaways = topTakeaways.filter(
      (t) => t.issue.trim().length >= 5 && t.fix.trim().length >= 5
    );

    if (validStrengths.length > 0 || validImprovements.length > 0) {
      onChange({
        // Legacy format (for backward compatibility)
        strengths: legacyStrengths,
        improvements: legacyImprovements,
        // New structured format
        structured_strengths: validStrengths,
        structured_improvements: validImprovements,
        additional_notes: additionalNotes.trim() || undefined,
        visual_annotations: visualAnnotations.length > 0 ? visualAnnotations : undefined,
        voice_memo: voiceMemo,
        // Top takeaways
        top_takeaways: validTopTakeaways.length > 0 ? validTopTakeaways : undefined,
        // Premium fields
        executive_summary: validExecutiveSummary,
        follow_up_offer: validFollowUpOffer,
      });
    }
  }, [structuredStrengths, structuredImprovements, additionalNotes, visualAnnotations, voiceMemo, topTakeaways, executiveSummary, followUpOffer, onChange]);

  // Voice memo handlers
  const handleVoiceRecordingComplete = (audioBlob: Blob, duration: number) => {
    const url = URL.createObjectURL(audioBlob);
    setVoiceMemo({
      id: `memo-${Date.now()}`,
      duration,
      url,
    });
  };

  const handleVoiceMemoDelete = () => {
    if (voiceMemo?.url) {
      URL.revokeObjectURL(voiceMemo.url);
    }
    setVoiceMemo(undefined);
  };

  // Auto-collapse annotations when they reach minimum content
  React.useEffect(() => {
    if (visualAnnotations.length >= 1 && !annotationsCollapsed) {
      setAnnotationsCollapsed(true);
    }
  }, [visualAnnotations, annotationsCollapsed]);

  // Check if phase is complete (for compact summary view)
  const isPhaseComplete = React.useMemo(() => {
    const validStrengths = structuredStrengths.filter((s) => s.what.length >= 10);
    const validImprovements = structuredImprovements.filter(
      (i) => i.issue.length >= 10 && i.suggestion.length >= 10
    );
    return validStrengths.length >= 1 && validImprovements.length >= 1;
  }, [structuredStrengths, structuredImprovements]);

  // Structured feedback handlers
  const updateStructuredStrength = (index: number, updated: StructuredStrength) => {
    const newStrengths = [...structuredStrengths];
    newStrengths[index] = updated;
    setStructuredStrengths(newStrengths);
  };

  const addStructuredStrength = () => {
    if (structuredStrengths.length < 10) {
      setStructuredStrengths([...structuredStrengths, createNewStrength()]);
    }
  };

  const removeStructuredStrength = (index: number) => {
    if (structuredStrengths.length > 1) {
      setStructuredStrengths(structuredStrengths.filter((_, i) => i !== index));
    }
  };

  const updateStructuredImprovement = (index: number, updated: StructuredImprovement) => {
    const newImprovements = [...structuredImprovements];
    newImprovements[index] = updated;
    setStructuredImprovements(newImprovements);
  };

  const addStructuredImprovement = () => {
    if (structuredImprovements.length < 10) {
      setStructuredImprovements([...structuredImprovements, createNewImprovement()]);
    }
  };

  const removeStructuredImprovement = (index: number) => {
    if (structuredImprovements.length > 1) {
      setStructuredImprovements(structuredImprovements.filter((_, i) => i !== index));
    }
  };

  // Count valid items
  const validStrengthsCount = structuredStrengths.filter((s) => s.what.length >= 10).length;
  const validImprovementsCount = structuredImprovements.filter(
    (i) => i.issue.length >= 10 && i.suggestion.length >= 10
  ).length;

  // Section refs for scroll navigation
  const strengthsRef = React.useRef<HTMLDivElement>(null);
  const improvementsRef = React.useRef<HTMLDivElement>(null);
  const annotationsRef = React.useRef<HTMLDivElement>(null);
  const notesRef = React.useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
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
              <div className="space-y-3">
                {structuredStrengths.map((strength, index) => (
                  <StructuredStrengthItem
                    key={strength.id}
                    item={strength}
                    onChange={(updated) => updateStructuredStrength(index, updated)}
                    onRemove={() => removeStructuredStrength(index)}
                    canRemove={structuredStrengths.length > 1}
                    index={index}
                  />
                ))}
              </div>

              {structuredStrengths.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addStructuredStrength}
                  className="w-full min-h-[48px]"
                >
                  <Plus className="size-4 mr-2" />
                  Add Another Strength
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
              <div className="space-y-3">
                {structuredImprovements.map((improvement, index) => (
                  <StructuredImprovementItem
                    key={improvement.id}
                    item={improvement}
                    onChange={(updated) => updateStructuredImprovement(index, updated)}
                    onRemove={() => removeStructuredImprovement(index)}
                    canRemove={structuredImprovements.length > 1}
                    index={index}
                  />
                ))}
              </div>

              {structuredImprovements.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addStructuredImprovement}
                  className="w-full min-h-[48px]"
                >
                  <Plus className="size-4 mr-2" />
                  Add Another Improvement
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

      {/* Voice Memo Section */}
      <VoiceMemoRecorder
        onRecordingComplete={handleVoiceRecordingComplete}
        onDelete={handleVoiceMemoDelete}
        existingAudioUrl={voiceMemo?.url}
        existingDuration={voiceMemo?.duration}
      />

      {/* Final Verdict Section - Moved BEFORE Executive Summary */}
      <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-amber-50/30 p-4 md:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-gradient-to-br from-purple-500 to-amber-500 flex items-center justify-center">
            <Award className="size-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Final Verdict</h3>
            <p className="text-sm text-muted-foreground">
              Wrap up your review with an overall rating and summary
            </p>
          </div>
        </div>

        {/* Overall Rating */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Overall Rating</Label>
          <div className="flex items-center gap-1.5 md:gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={cn(
                  "size-12 md:size-14 rounded-lg transition-all duration-200",
                  "flex items-center justify-center",
                  "hover:scale-105 active:scale-95",
                  "touch-manipulation",
                  rating >= star
                    ? "text-amber-400 bg-amber-50 border-2 border-amber-300 shadow-md"
                    : "text-gray-300 bg-white border-2 border-gray-200 hover:text-amber-300 hover:bg-amber-50/50"
                )}
                aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                aria-pressed={rating >= star}
              >
                <Star
                  className={cn(
                    "size-6 md:size-7",
                    rating >= star && "fill-current"
                  )}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-lg font-bold text-foreground">
                {rating}/5
              </span>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="verdict-summary" className="text-base font-semibold">
              Summary
            </Label>
            <span className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              summary.length < 50 && "bg-amber-100 text-amber-700",
              summary.length >= 50 && summary.length <= 300 && "bg-green-100 text-green-700",
              summary.length > 300 && "bg-red-100 text-red-700"
            )}>
              {summary.length}/300
            </span>
          </div>
          <Textarea
            id="verdict-summary"
            placeholder="Summarize your overall impression... What should the creator take away from your review?"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className={cn(
              "min-h-[100px] text-base resize-y",
              "rounded-xl border-2",
              "bg-white",
              "px-4 py-3 leading-relaxed",
              "placeholder:text-muted-foreground/60",
              "focus:ring-2 focus:ring-purple-500/50 focus:border-purple-300",
              "transition-all duration-200",
              summary.length >= 50 && summary.length <= 300 && "border-green-300",
              summary.length > 300 && "border-red-300"
            )}
            maxLength={300}
          />
          <p className="text-xs text-muted-foreground">
            {summary.length < 50
              ? `${50 - summary.length} more characters needed`
              : summary.length <= 300
                ? "Looking good!"
                : "Please shorten your summary"
            }
          </p>
        </div>

        {/* Top 3 Takeaways - The TL;DR action list */}
        <div className="space-y-4 pt-4 border-t border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="size-5 text-purple-600" />
              <Label className="text-base font-semibold">Top 3 Takeaways</Label>
              <span className="text-xs text-red-500">*required</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {topTakeaways.filter(t => t.issue.length >= 5 && t.fix.length >= 5).length}/3 complete
            </span>
          </div>
          <p className="text-sm text-muted-foreground -mt-2">
            Give creators a clear, actionable checklist. What are the 3 most important things to fix right now?
          </p>

          <div className="space-y-3">
            {topTakeaways.map((takeaway, index) => (
              <div
                key={index}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all",
                  takeaway.issue.length >= 5 && takeaway.fix.length >= 5
                    ? "bg-green-50 border-green-200"
                    : "bg-white border-gray-200"
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn(
                    "size-7 rounded-full flex items-center justify-center text-sm font-bold",
                    takeaway.issue.length >= 5 && takeaway.fix.length >= 5
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  )}>
                    {takeaway.issue.length >= 5 && takeaway.fix.length >= 5 ? "✓" : index + 1}
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Takeaway #{index + 1}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-amber-700">
                      Issue
                    </label>
                    <Input
                      placeholder={
                        index === 0
                          ? "e.g., Hero contrast too low"
                          : index === 1
                            ? "e.g., Naming inconsistencies"
                            : "e.g., Layout collapse on tablet"
                      }
                      value={takeaway.issue}
                      onChange={(e) => {
                        const newTakeaways = [...topTakeaways];
                        newTakeaways[index] = { ...takeaway, issue: e.target.value };
                        setTopTakeaways(newTakeaways);
                      }}
                      className="text-sm bg-white"
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-green-700">
                      Fix
                    </label>
                    <Input
                      placeholder={
                        index === 0
                          ? "e.g., Increase to 4.5:1 contrast ratio"
                          : index === 1
                            ? "e.g., Use camelCase consistently"
                            : "e.g., Add tablet breakpoint at 768px"
                      }
                      value={takeaway.fix}
                      onChange={(e) => {
                        const newTakeaways = [...topTakeaways];
                        newTakeaways[index] = { ...takeaway, fix: e.target.value };
                        setTopTakeaways(newTakeaways);
                      }}
                      className="text-sm bg-white"
                      maxLength={100}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {topTakeaways.every(t => t.issue.length >= 5 && t.fix.length >= 5) && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-100 border border-green-300">
              <CheckCircle2 className="size-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                All takeaways complete! Creators will love this clear action plan.
              </span>
            </div>
          )}
        </div>

        {/* Verdict Progress */}
        {(() => {
          const takeawaysComplete = topTakeaways.every(t => t.issue.length >= 5 && t.fix.length >= 5);
          const verdictComplete = rating > 0 && summary.length >= 50 && summary.length <= 300 && takeawaysComplete;
          return (
            <div className="flex items-center gap-3 pt-2 border-t border-purple-200">
              <div className={cn(
                "size-6 rounded-full flex items-center justify-center text-xs font-bold",
                verdictComplete
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}>
                {verdictComplete ? "✓" : "!"}
              </div>
              <span className={cn(
                "text-sm font-medium",
                verdictComplete
                  ? "text-green-600"
                  : "text-muted-foreground"
              )}>
                {rating === 0 && "Select a rating"}
                {rating > 0 && summary.length < 50 && "Add your summary (50+ chars)"}
                {rating > 0 && summary.length >= 50 && summary.length <= 300 && !takeawaysComplete && "Complete your top 3 takeaways"}
                {verdictComplete && "Ready to submit!"}
                {summary.length > 300 && "Summary too long"}
              </span>
            </div>
          );
        })()}
      </div>

      {/* Executive Summary - Premium Section */}
      {/* Auto-populated top 3 from existing strengths/improvements */}
      <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <FileText className="size-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">Executive Summary</h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">Premium</span>
              </div>
              <p className="text-sm text-muted-foreground">
                TL;DR for busy creators
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant={showExecutiveSummary ? "outline" : "default"}
            size="sm"
            onClick={() => setShowExecutiveSummary(!showExecutiveSummary)}
            className="min-h-[40px]"
          >
            {showExecutiveSummary ? "Collapse" : "Add Summary"}
          </Button>
        </div>

        {showExecutiveSummary && (
          <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
            {/* TL;DR */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="tldr" className="text-base font-semibold">TL;DR</Label>
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full",
                  executiveSummary.tldr.length < 50 && "bg-amber-100 text-amber-700",
                  executiveSummary.tldr.length >= 50 && executiveSummary.tldr.length <= 200 && "bg-green-100 text-green-700",
                  executiveSummary.tldr.length > 200 && "bg-red-100 text-red-700"
                )}>
                  {executiveSummary.tldr.length}/200
                </span>
              </div>
              <Textarea
                id="tldr"
                placeholder="1-3 sentence takeaway: What's the single most important thing the creator should know?"
                value={executiveSummary.tldr}
                onChange={(e) => setExecutiveSummary({ ...executiveSummary, tldr: e.target.value })}
                className={cn(
                  "min-h-[80px] text-base resize-y",
                  "rounded-xl border-2 bg-white px-4 py-3",
                  "focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300"
                )}
                maxLength={200}
              />
            </div>

            {/* Auto-populated Top 3 Strengths */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-base font-semibold">Top 3 Strengths</Label>
                <span className="text-xs text-muted-foreground">(Auto-populated from your feedback)</span>
              </div>
              <div className="space-y-2 p-3 rounded-lg bg-green-50 border border-green-200">
                {structuredStrengths.filter(s => s.what.length >= 10).slice(0, 3).map((strength) => (
                  <div key={strength.id} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-foreground">{strength.what}</span>
                  </div>
                ))}
                {structuredStrengths.filter(s => s.what.length >= 10).length === 0 && (
                  <p className="text-sm text-muted-foreground italic">Add strengths above to auto-populate</p>
                )}
              </div>
            </div>

            {/* Auto-populated Top 3 Actions */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-base font-semibold">Top 3 Actions</Label>
                <span className="text-xs text-muted-foreground">(Auto-populated from improvements)</span>
              </div>
              <div className="space-y-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                {structuredImprovements.filter(i => i.suggestion.length >= 10).slice(0, 3).map((improvement) => (
                  <div key={improvement.id} className="flex items-start gap-2 text-sm">
                    <ArrowRight className="size-4 text-amber-600 mt-0.5 shrink-0" />
                    <span className="text-foreground">{improvement.suggestion}</span>
                  </div>
                ))}
                {structuredImprovements.filter(i => i.suggestion.length >= 10).length === 0 && (
                  <p className="text-sm text-muted-foreground italic">Add improvements above to auto-populate</p>
                )}
              </div>
            </div>

            {/* Overall Readiness */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Overall Readiness</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: 'ready', label: 'Ship It! 🚀', color: 'green' },
                  { value: 'almost-ready', label: 'Almost There', color: 'blue' },
                  { value: 'needs-work', label: 'Needs Work', color: 'amber' },
                  { value: 'major-revision', label: 'Major Revision', color: 'red' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setExecutiveSummary({
                      ...executiveSummary,
                      overallReadiness: option.value as ExecutiveSummary['overallReadiness']
                    })}
                    className={cn(
                      "px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      "border-2 min-h-[44px] touch-manipulation",
                      executiveSummary.overallReadiness === option.value
                        ? option.color === 'green' ? "bg-green-100 border-green-400 text-green-800"
                        : option.color === 'blue' ? "bg-blue-100 border-blue-400 text-blue-800"
                        : option.color === 'amber' ? "bg-amber-100 border-amber-400 text-amber-800"
                        : "bg-red-100 border-red-400 text-red-800"
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Follow-up Offer - Optional Premium Section */}
      <div className="rounded-xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50/50 to-blue-50/30 p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <MessageCircle className="size-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">Offer Follow-up Support</h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 text-xs font-semibold">Optional</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Build client relationships
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant={followUpOffer.available ? "outline" : "ghost"}
            size="sm"
            onClick={() => {
              setFollowUpOffer({ ...followUpOffer, available: !followUpOffer.available });
              setShowFollowUpOffer(!followUpOffer.available);
            }}
            className="min-h-[40px]"
          >
            {followUpOffer.available ? "Remove Offer" : "Add Offer"}
          </Button>
        </div>

        {showFollowUpOffer && followUpOffer.available && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            {/* Offer Type */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">What are you offering?</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'code-review', label: 'Code Review' },
                  { value: 'design-feedback', label: 'Design Feedback' },
                  { value: 'consultation', label: 'Consultation' },
                  { value: 'pair-session', label: 'Pair Session' },
                  { value: 'other', label: 'Other' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFollowUpOffer({
                      ...followUpOffer,
                      type: option.value as FollowUpOffer['type']
                    })}
                    className={cn(
                      "px-3 py-2 rounded-full text-sm font-medium transition-all",
                      "border min-h-[36px] touch-manipulation",
                      followUpOffer.type === option.value
                        ? "bg-cyan-100 border-cyan-400 text-cyan-800"
                        : "bg-white border-gray-200 text-gray-700 hover:border-cyan-300"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="follow-up-desc" className="text-sm font-semibold">Brief description (optional)</Label>
              <Input
                id="follow-up-desc"
                placeholder="e.g., Happy to review your revised version or answer questions"
                value={followUpOffer.description || ""}
                onChange={(e) => setFollowUpOffer({ ...followUpOffer, description: e.target.value })}
                className="bg-white"
                maxLength={200}
              />
            </div>

            {/* Response Time */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Response time</Label>
              <div className="flex flex-wrap gap-2">
                {['Within 24h', '2-3 days', 'Within a week'].map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setFollowUpOffer({ ...followUpOffer, responseTime: time })}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all",
                      "border min-h-[36px] touch-manipulation",
                      followUpOffer.responseTime === time
                        ? "bg-cyan-100 border-cyan-400 text-cyan-800"
                        : "bg-white border-gray-200 text-gray-700 hover:border-cyan-300"
                    )}
                  >
                    <Clock className="size-3.5" />
                    {time}
                  </button>
                ))}
              </div>
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
          <li
            className={cn(
              rating > 0
                ? "text-green-600"
                : "text-muted-foreground"
            )}
          >
            {rating > 0 ? "✓" : "○"} Overall rating ({rating}/5)
          </li>
          <li
            className={cn(
              summary.length >= 50 && summary.length <= 300
                ? "text-green-600"
                : "text-muted-foreground"
            )}
          >
            {summary.length >= 50 && summary.length <= 300 ? "✓" : "○"} Final summary
          </li>
        </ul>
        {validStrengthsCount >= 1 && validImprovementsCount >= 1 && rating > 0 && summary.length >= 50 && summary.length <= 300 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs font-medium text-green-600 flex items-center gap-1">
              <span className="text-base">🎯</span> Your review is complete and ready to submit!
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
