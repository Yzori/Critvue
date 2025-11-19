/**
 * Smart Adaptive Review Editor
 *
 * Main orchestrator component that manages:
 * - 3-phase progressive disclosure workflow
 * - Auto-save with debouncing
 * - Real-time quality metrics
 * - Content-aware rubrics
 * - Phase navigation and validation
 */

"use client";

import * as React from "react";
import { Save, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  SmartReviewDraft,
  RubricConfig,
  PhaseNumber,
  Phase1QuickAssessment,
  Phase2RubricRatings,
  Phase3DetailedFeedback,
  QualityMetrics,
} from "@/lib/types/smart-review";
import {
  getRubric,
  saveSmartReviewDraft,
  getSmartReviewDraft,
  submitSmartReview,
} from "@/lib/api/smart-review";
import {
  calculateQualityMetrics,
  validatePhase1,
  validatePhase2,
  validatePhase3,
} from "@/lib/utils/quality-metrics";
import { PhaseNavigation } from "./PhaseNavigation";
import { Phase1QuickAssessment as Phase1Component } from "./Phase1QuickAssessment";
import { Phase2RubricRatings as Phase2Component } from "./Phase2RubricRatings";
import { Phase3DetailedFeedback as Phase3Component } from "./Phase3DetailedFeedback";
import { QualityIndicators } from "./QualityIndicators";

interface SmartReviewEditorProps {
  slotId: number;
  contentType: string;
  imageUrl?: string; // Optional image URL for design/art reviews with visual annotations
  onSubmitSuccess?: () => void;
  className?: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function SmartReviewEditor({
  slotId,
  contentType,
  imageUrl,
  onSubmitSuccess,
  className,
}: SmartReviewEditorProps) {
  // Core state
  const [currentPhase, setCurrentPhase] = React.useState<PhaseNumber>(1);
  const [draft, setDraft] = React.useState<SmartReviewDraft>({});
  const [rubric, setRubric] = React.useState<RubricConfig | null>(null);

  // Save state
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Submit state
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Loading state
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Auto-save timer ref
  const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load rubric and draft on mount
  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        // Load rubric
        const rubricData = await getRubric(contentType);
        setRubric(rubricData);

        // Load existing draft if available
        try {
          const draftData = await getSmartReviewDraft(slotId);
          if (draftData) {
            setDraft(draftData);
            // Start from the last incomplete phase
            if (!validatePhase1(draftData).isValid) {
              setCurrentPhase(1);
            } else if (!validatePhase2(draftData).isValid) {
              setCurrentPhase(2);
            } else if (!validatePhase3(draftData).isValid) {
              setCurrentPhase(3);
            }
          }
        } catch (draftError) {
          // No draft exists yet, that's fine
          console.log("No existing draft found");
        }
      } catch (error) {
        console.error("Error loading rubric:", error);
        setLoadError("Failed to load review template. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [slotId, contentType]);

  // Calculate quality metrics
  const qualityMetrics: QualityMetrics = React.useMemo(() => {
    return calculateQualityMetrics(draft);
  }, [draft]);

  // Calculate phase completion
  const phaseCompletion: Record<PhaseNumber, boolean> = React.useMemo(() => {
    if (!rubric) {
      return { 1: false, 2: false, 3: false };
    }

    return {
      1: validatePhase1(draft).isValid,
      2: validatePhase2(draft).isValid,
      3: validatePhase3(draft).isValid,
    };
  }, [draft, rubric]);

  // Auto-save function
  const saveToBackend = React.useCallback(async () => {
    setSaveStatus("saving");
    setSaveError(null);

    try {
      await saveSmartReviewDraft(slotId, draft);
      setSaveStatus("saved");
      setLastSaved(new Date());

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Error saving draft:", error);
      setSaveStatus("error");
      setSaveError(error instanceof Error ? error.message : "Failed to save");
    }
  }, [slotId, draft]);

  // Debounced auto-save
  React.useEffect(() => {
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Only auto-save if we have some data
    if (Object.keys(draft).length > 0) {
      autoSaveTimerRef.current = setTimeout(() => {
        saveToBackend();
      }, 3000); // 3 second debounce
    }

    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [draft, saveToBackend]);

  // Manual save handler
  const handleManualSave = async () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    await saveToBackend();
  };

  // Phase 1 change handler
  const handlePhase1Change = React.useCallback((data: Phase1QuickAssessment) => {
    setDraft((prev) => ({
      ...prev,
      phase1_quick_assessment: data,
    }));
  }, []);

  // Phase 2 change handler
  const handlePhase2Change = React.useCallback((data: Phase2RubricRatings) => {
    setDraft((prev) => ({
      ...prev,
      phase2_rubric: data,
    }));
  }, []);

  // Phase 3 change handler
  const handlePhase3Change = React.useCallback((data: Phase3DetailedFeedback) => {
    setDraft((prev) => ({
      ...prev,
      phase3_detailed_feedback: data,
    }));
  }, []);

  // Phase navigation handler
  const handlePhaseChange = (newPhase: PhaseNumber) => {
    setCurrentPhase(newPhase);
  };

  // Submit handler
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Clear auto-save timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Submit the review
      await submitSmartReview(slotId, draft);

      // Close dialog and call success callback
      setShowSubmitDialog(false);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      setSubmitError(error instanceof Error ? error.message : "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if ready to submit
  const canSubmit = phaseCompletion[1] && phaseCompletion[2];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-accent-blue" />
          <p className="text-sm text-muted-foreground">Loading review editor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError || !rubric) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="size-8 text-red-500" />
          <p className="text-sm text-red-600">{loadError || "Failed to load review template"}</p>
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with save status */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h2 className="text-2xl font-bold">Write Your Review</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Follow the 3-phase process to create a comprehensive review
          </p>
        </div>

        {/* Save status indicator */}
        <div className="flex items-center gap-3">
          {saveStatus === "saving" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>Saving...</span>
            </div>
          )}
          {saveStatus === "saved" && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="size-4" />
              <span>Saved</span>
            </div>
          )}
          {saveStatus === "error" && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="size-4" />
              <span>Save failed</span>
            </div>
          )}
          {lastSaved && saveStatus === "idle" && (
            <span className="text-xs text-muted-foreground">
              Last saved {new Date(lastSaved).toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            disabled={saveStatus === "saving"}
          >
            <Save className="size-4 mr-2" />
            Save Draft
          </Button>
        </div>
      </div>

      {/* Main content: 3-column layout on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left sidebar: Phase navigation (desktop) */}
        <div className="lg:col-span-3">
          <PhaseNavigation
            currentPhase={currentPhase}
            onPhaseChange={handlePhaseChange}
            phaseCompletion={phaseCompletion}
          />
        </div>

        {/* Center: Current phase content */}
        <div className="lg:col-span-6">
          <div className="rounded-xl border border-border bg-card p-6">
            {currentPhase === 1 && (
              <Phase1Component
                data={draft.phase1_quick_assessment || null}
                focusAreas={rubric.focus_areas}
                onChange={handlePhase1Change}
              />
            )}
            {currentPhase === 2 && (
              <Phase2Component
                data={draft.phase2_rubric || null}
                dimensions={rubric.rating_dimensions}
                contentType={contentType}
                onChange={handlePhase2Change}
              />
            )}
            {currentPhase === 3 && (
              <Phase3Component
                data={draft.phase3_detailed_feedback || null}
                onChange={handlePhase3Change}
                contentType={contentType}
                imageUrl={imageUrl}
              />
            )}

            {/* Phase navigation buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => handlePhaseChange(Math.max(1, currentPhase - 1) as PhaseNumber)}
                disabled={currentPhase === 1}
              >
                Previous Phase
              </Button>
              {currentPhase < 3 ? (
                <Button
                  onClick={() => handlePhaseChange(Math.min(3, currentPhase + 1) as PhaseNumber)}
                  disabled={!phaseCompletion[currentPhase]}
                >
                  Next Phase
                </Button>
              ) : (
                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  disabled={!canSubmit}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="size-4 mr-2" />
                  Submit Review
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar: Quality indicators */}
        <div className="lg:col-span-3">
          <QualityIndicators metrics={qualityMetrics} />
        </div>
      </div>

      {/* Submit confirmation dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Your Review?</DialogTitle>
            <DialogDescription>
              Once submitted, you won't be able to edit this review. Make sure you've completed all required sections.
            </DialogDescription>
          </DialogHeader>

          {/* Review summary */}
          <div className="space-y-3 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Rating:</span>
              <span className="font-medium">
                {draft.phase1_quick_assessment?.overall_rating || "N/A"}/5 stars
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completeness:</span>
              <span className="font-medium">{qualityMetrics.completeness_score}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Quality Score:</span>
              <span className="font-medium">
                {Math.round((qualityMetrics.clarity_score + qualityMetrics.actionability_score) / 2)}/100
              </span>
            </div>
          </div>

          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSubmitDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 mr-2" />
                  Confirm Submit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
