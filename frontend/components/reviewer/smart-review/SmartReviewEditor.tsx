/**
 * Smart Adaptive Review Editor
 *
 * Streamlined 2-step workflow:
 * - Step 1: Assessment (Focus Areas + Rubric Ratings)
 * - Step 2: Feedback & Verdict (Strengths, Improvements, Final Verdict)
 */

"use client";

import * as React from "react";
import { Save, CheckCircle2, AlertCircle, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
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
import { AssessmentPhase } from "./AssessmentPhase";
import { Phase3DetailedFeedback as FeedbackComponent } from "./Phase3DetailedFeedback";

// Now using 2 steps instead of 3
type StepNumber = 1 | 2;

interface SmartReviewEditorProps {
  slotId: number;
  contentType: string;
  contentSubcategory?: string | null;
  imageUrl?: string;
  onSubmitSuccess?: () => void;
  className?: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function SmartReviewEditor({
  slotId,
  contentType,
  contentSubcategory,
  imageUrl,
  onSubmitSuccess,
  className,
}: SmartReviewEditorProps) {
  // Core state - now 2 steps
  const [currentStep, setCurrentStep] = React.useState<StepNumber>(1);
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

  // Sticky CTA bar scroll state (mobile only)
  const [showStickyCTA, setShowStickyCTA] = React.useState(true);
  const lastScrollY = React.useRef(0);
  const scrollTimeout = React.useRef<NodeJS.Timeout | null>(null);

  // Auto-save timer ref
  const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load rubric and draft on mount
  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const rubricData = await getRubric(contentType, contentSubcategory);
        setRubric(rubricData);

        try {
          const draftData = await getSmartReviewDraft(slotId);
          if (draftData) {
            setDraft(draftData);
            // Determine starting step based on completion
            const step1Complete = validatePhase1(draftData).isValid && validatePhase2(draftData).isValid;
            if (step1Complete) {
              setCurrentStep(2);
            }
          }
        } catch (draftError) {
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
  }, [slotId, contentType, contentSubcategory]);

  // Calculate quality metrics
  const qualityMetrics: QualityMetrics = React.useMemo(() => {
    return calculateQualityMetrics(draft);
  }, [draft]);

  // Calculate step completion (now 2 steps)
  const stepCompletion: Record<StepNumber, boolean> = React.useMemo(() => {
    if (!rubric) {
      return { 1: false, 2: false };
    }

    // Step 1 = Phase 1 + Phase 2 combined
    const step1Complete = validatePhase1(draft).isValid && validatePhase2(draft).isValid;
    // Step 2 = Phase 3 (feedback + verdict)
    const step2Complete = validatePhase3(draft).isValid;

    return {
      1: step1Complete,
      2: step2Complete,
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
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    if (Object.keys(draft).length > 0) {
      autoSaveTimerRef.current = setTimeout(() => {
        saveToBackend();
      }, 3000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [draft, saveToBackend]);

  // Scroll behavior for sticky CTA bar
  React.useEffect(() => {
    const handleScroll = () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      scrollTimeout.current = setTimeout(() => {
        const currentScrollY = window.scrollY;

        if (currentScrollY < 50) {
          setShowStickyCTA(true);
          lastScrollY.current = currentScrollY;
          return;
        }

        if (currentScrollY < lastScrollY.current) {
          setShowStickyCTA(true);
        } else if (currentScrollY > lastScrollY.current) {
          setShowStickyCTA(false);
        }

        lastScrollY.current = currentScrollY;
      }, 10);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("scroll", handleScroll);
      }
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  // Save draft handler
  const handleSaveDraft = async () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    await saveToBackend();
  };

  // Phase 1 change handler (focus areas)
  const handlePhase1Change = React.useCallback((data: Phase1QuickAssessment) => {
    setDraft((prev) => ({
      ...prev,
      phase1_quick_assessment: data,
    }));
  }, []);

  // Phase 2 change handler (rubric ratings)
  const handlePhase2Change = React.useCallback((data: Phase2RubricRatings) => {
    setDraft((prev) => ({
      ...prev,
      phase2_rubric: data,
    }));
  }, []);

  // Phase 3 change handler (feedback)
  const handlePhase3Change = React.useCallback((data: Phase3DetailedFeedback) => {
    setDraft((prev) => ({
      ...prev,
      phase3_detailed_feedback: data,
    }));
  }, []);

  // Verdict change handler
  const handleVerdictChange = React.useCallback((rating: number, summary: string) => {
    setDraft((prev) => ({
      ...prev,
      phase1_quick_assessment: {
        ...(prev.phase1_quick_assessment || { primary_focus_areas: [] }),
        overall_rating: rating,
        quick_summary: summary,
      },
    }));
  }, []);

  // Step navigation handler
  const handleStepChange = (newStep: StepNumber) => {
    setCurrentStep(newStep);
  };

  // Submit handler
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      await submitSmartReview(slotId, {
        smart_review: draft,
        attachments: []
      });

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
  const canSubmit = stepCompletion[1] && stepCompletion[2];

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
      {/* Compact save status bar */}
      <div className="flex items-center justify-end gap-3">
        {saveStatus === "saving" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            <span>Saving...</span>
          </div>
        )}
        {saveStatus === "saved" && (
          <div className="flex items-center gap-2 text-xs text-green-600">
            <CheckCircle2 className="size-3" />
            <span>Saved</span>
          </div>
        )}
        {lastSaved && saveStatus === "idle" && (
          <span className="text-xs text-muted-foreground">
            Last saved {new Date(lastSaved).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* 2-Step wizard layout */}
      <div className="space-y-6 max-w-4xl mx-auto pb-20 lg:pb-6">
        {/* Step Progress Indicator - Now 2 steps */}
        <div className="flex items-center justify-center gap-3 md:gap-4">
          {/* Step 1 */}
          <button
            onClick={() => handleStepChange(1)}
            className={cn(
              "flex items-center gap-2 rounded-xl transition-all",
              "min-h-[52px] md:min-h-[48px] touch-manipulation",
              "px-4 py-2.5 md:px-5 md:py-3",
              currentStep === 1
                ? "bg-accent-blue text-white shadow-lg"
                : stepCompletion[1]
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <div className="size-8 md:size-7 rounded-full flex items-center justify-center font-bold text-sm bg-white/20 shrink-0">
              {stepCompletion[1] ? "✓" : "1"}
            </div>
            <span className="text-sm font-semibold whitespace-nowrap">Assessment</span>
          </button>

          {/* Connector */}
          <div className={cn(
            "h-1 w-8 md:w-16 rounded-full transition-colors shrink-0",
            stepCompletion[1] ? "bg-green-500" : "bg-border"
          )} />

          {/* Step 2 */}
          <button
            onClick={() => handleStepChange(2)}
            disabled={!stepCompletion[1]}
            className={cn(
              "flex items-center gap-2 rounded-xl transition-all",
              "min-h-[52px] md:min-h-[48px] touch-manipulation",
              "px-4 py-2.5 md:px-5 md:py-3",
              currentStep === 2
                ? "bg-accent-blue text-white shadow-lg"
                : stepCompletion[2]
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <div className="size-8 md:size-7 rounded-full flex items-center justify-center font-bold text-sm bg-white/20 shrink-0">
              {stepCompletion[2] ? "✓" : "2"}
            </div>
            <span className="text-sm font-semibold whitespace-nowrap">Feedback & Verdict</span>
          </button>
        </div>

        {/* Current Step Content */}
        <div className="rounded-2xl border-2 border-accent-blue/20 bg-card p-4 sm:p-6 md:p-8 shadow-lg">
          {/* Step Header */}
          <div className="mb-6 pb-6 border-b border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-full bg-accent-blue text-white flex items-center justify-center font-bold text-lg">
                {currentStep}
              </div>
              <div>
                <h3 className="text-2xl font-bold">
                  {currentStep === 1 && "Assessment"}
                  {currentStep === 2 && "Feedback & Verdict"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {currentStep === 1 && "Select focus areas and rate key dimensions"}
                  {currentStep === 2 && "Share detailed feedback and give your final verdict"}
                </p>
              </div>
            </div>
          </div>

          {/* Step Content */}
          {currentStep === 1 && (
            <AssessmentPhase
              phase1Data={draft.phase1_quick_assessment || null}
              phase2Data={draft.phase2_rubric || null}
              focusAreas={rubric.focus_areas}
              dimensions={rubric.rating_dimensions}
              contentType={contentType}
              onPhase1Change={handlePhase1Change}
              onPhase2Change={handlePhase2Change}
            />
          )}
          {currentStep === 2 && (
            <FeedbackComponent
              data={draft.phase3_detailed_feedback || null}
              onChange={handlePhase3Change}
              contentType={contentType}
              imageUrl={imageUrl}
              selectedFocusAreas={draft.phase1_quick_assessment?.primary_focus_areas}
              overallRating={draft.phase1_quick_assessment?.overall_rating || 0}
              quickSummary={draft.phase1_quick_assessment?.quick_summary || ""}
              onVerdictChange={handleVerdictChange}
            />
          )}

          {/* Step Navigation - Desktop Only */}
          <div className="hidden lg:flex items-center justify-between pt-8 mt-8 border-t border-border">
            <Button
              variant="outline"
              onClick={() => handleStepChange(1)}
              disabled={currentStep === 1}
              size="lg"
              className="h-12"
            >
              <ArrowLeft className="size-4 mr-2" />
              Previous
            </Button>
            {currentStep === 1 ? (
              <Button
                onClick={() => handleStepChange(2)}
                disabled={!stepCompletion[1]}
                size="lg"
                className="h-12"
              >
                Next
                <ArrowRight className="size-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={() => setShowSubmitDialog(true)}
                disabled={!canSubmit}
                className="bg-green-600 hover:bg-green-700 h-12"
                size="lg"
              >
                <CheckCircle2 className="size-5 mr-2" />
                Submit Review
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom CTA Bar - Mobile Only */}
      <div
        className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 z-50",
          "bg-card border-t-2 border-border shadow-2xl",
          "transition-transform duration-300 ease-in-out",
          showStickyCTA ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex items-center justify-between gap-2 p-3 safe-area-inset-bottom">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => handleStepChange(1)}
            disabled={currentStep === 1}
            className="h-12 min-w-[48px] touch-manipulation"
            aria-label="Go to previous step"
          >
            <ArrowLeft className="size-5 mr-1" />
            <span className="hidden xs:inline">Back</span>
          </Button>

          {/* Save Draft Button */}
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={saveStatus === "saving" || Object.keys(draft).length === 0}
            className="h-12 min-w-[48px] flex-1 max-w-[140px] touch-manipulation"
            aria-label="Save draft"
          >
            {saveStatus === "saving" ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <Save className="size-5" />
                <span className="hidden xs:inline ml-1">Save</span>
              </>
            )}
          </Button>

          {/* Next/Submit Button */}
          {currentStep === 1 ? (
            <Button
              onClick={() => handleStepChange(2)}
              disabled={!stepCompletion[1]}
              className="h-12 min-w-[48px] touch-manipulation"
              aria-label="Go to next step"
            >
              <span className="hidden xs:inline">Next</span>
              <ArrowRight className="size-5 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={() => setShowSubmitDialog(true)}
              disabled={!canSubmit}
              className="bg-green-600 hover:bg-green-700 h-12 min-w-[48px] touch-manipulation"
              aria-label="Submit review"
            >
              <CheckCircle2 className="size-5" />
              <span className="hidden xs:inline ml-1">Submit</span>
            </Button>
          )}
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
