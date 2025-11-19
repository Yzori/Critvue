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
import { Save, CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp, TrendingUp, ArrowLeft, ArrowRight } from "lucide-react";
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

  // Track if user has started interacting (for delaying quality indicators)
  const [hasInteracted, setHasInteracted] = React.useState(false);
  const [showQualityPanel, setShowQualityPanel] = React.useState(true);

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

  // Track user interaction for delayed quality indicators
  React.useEffect(() => {
    if (draft.phase1_quick_assessment || draft.phase2_rubric || draft.phase3_detailed_feedback) {
      setHasInteracted(true);
    }
  }, [draft]);

  // Scroll behavior for sticky CTA bar (mobile only)
  React.useEffect(() => {
    const handleScroll = () => {
      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Debounce scroll handler
      scrollTimeout.current = setTimeout(() => {
        const currentScrollY = window.scrollY;

        // Always show at top of page
        if (currentScrollY < 50) {
          setShowStickyCTA(true);
          lastScrollY.current = currentScrollY;
          return;
        }

        // Show on scroll up, hide on scroll down
        if (currentScrollY < lastScrollY.current) {
          // Scrolling up
          setShowStickyCTA(true);
        } else if (currentScrollY > lastScrollY.current) {
          // Scrolling down
          setShowStickyCTA(false);
        }

        lastScrollY.current = currentScrollY;
      }, 10); // 10ms debounce for smooth response
    };

    // Only add listener on mobile/tablet
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

  // Manual save handler
  const handleManualSave = async () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    await saveToBackend();
  };

  // Save draft handler (for sticky CTA bar)
  const handleSaveDraft = async () => {
    await handleManualSave();
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

      {/* Step-by-step wizard layout */}
      <div className="space-y-6 max-w-4xl mx-auto pb-40 lg:pb-6">
        {/* Step Progress Indicator */}
        <div className="flex items-center justify-center gap-2 md:gap-3">
          {/* Step 1 */}
          <button
            onClick={() => handlePhaseChange(1)}
            className={cn(
              "flex items-center gap-2 rounded-lg transition-all",
              "min-h-[48px] md:min-h-[44px] touch-manipulation",
              "p-2 md:px-4 md:py-2",
              currentPhase === 1
                ? "bg-accent-blue text-white shadow-md"
                : phaseCompletion[1]
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <div className="size-7 md:size-6 rounded-full flex items-center justify-center font-bold text-sm bg-white/20 shrink-0">
              {phaseCompletion[1] ? "✓" : "1"}
            </div>
            <span className="hidden md:inline text-sm font-medium whitespace-nowrap">Quick Assessment</span>
          </button>

          {/* Connector */}
          <div className={cn(
            "h-0.5 w-4 md:w-8 transition-colors shrink-0",
            phaseCompletion[1] ? "bg-green-500" : "bg-border"
          )} />

          {/* Step 2 */}
          <button
            onClick={() => handlePhaseChange(2)}
            disabled={!phaseCompletion[1]}
            className={cn(
              "flex items-center gap-2 rounded-lg transition-all",
              "min-h-[48px] md:min-h-[44px] touch-manipulation",
              "p-2 md:px-4 md:py-2",
              currentPhase === 2
                ? "bg-accent-blue text-white shadow-md"
                : phaseCompletion[2]
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <div className="size-7 md:size-6 rounded-full flex items-center justify-center font-bold text-sm bg-white/20 shrink-0">
              {phaseCompletion[2] ? "✓" : "2"}
            </div>
            <span className="hidden md:inline text-sm font-medium whitespace-nowrap">Rubric Ratings</span>
          </button>

          {/* Connector */}
          <div className={cn(
            "h-0.5 w-4 md:w-8 transition-colors shrink-0",
            phaseCompletion[2] ? "bg-green-500" : "bg-border"
          )} />

          {/* Step 3 */}
          <button
            onClick={() => handlePhaseChange(3)}
            disabled={!phaseCompletion[2]}
            className={cn(
              "flex items-center gap-2 rounded-lg transition-all",
              "min-h-[48px] md:min-h-[44px] touch-manipulation",
              "p-2 md:px-4 md:py-2",
              currentPhase === 3
                ? "bg-accent-blue text-white shadow-md"
                : "bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <div className="size-7 md:size-6 rounded-full flex items-center justify-center font-bold text-sm bg-white/20 shrink-0">
              3
            </div>
            <span className="hidden md:inline text-sm font-medium whitespace-nowrap">Detailed Feedback</span>
          </button>
        </div>

        {/* Current Phase Content */}
        <div className="rounded-2xl border-2 border-accent-blue/20 bg-card p-4 sm:p-6 md:p-8 shadow-lg">
          {/* Phase Header */}
          <div className="mb-6 pb-6 border-b border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-full bg-accent-blue text-white flex items-center justify-center font-bold text-lg">
                {currentPhase}
              </div>
              <div>
                <h3 className="text-2xl font-bold">
                  {currentPhase === 1 && "Quick Assessment"}
                  {currentPhase === 2 && "Rubric Ratings"}
                  {currentPhase === 3 && "Detailed Feedback"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {currentPhase === 1 && "Provide your overall rating and first impressions"}
                  {currentPhase === 2 && "Rate specific dimensions of the work"}
                  {currentPhase === 3 && "Share detailed strengths, improvements, and annotations"}
                </p>
              </div>
            </div>
          </div>

          {/* Phase Content */}
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

          {/* Phase Navigation - Desktop Only */}
          <div className="hidden lg:flex items-center justify-between pt-8 mt-8 border-t border-border">
            <Button
              variant="outline"
              onClick={() => handlePhaseChange(Math.max(1, currentPhase - 1) as PhaseNumber)}
              disabled={currentPhase === 1}
              size="lg"
              className="h-12"
            >
              ← Previous
            </Button>
            {currentPhase < 3 ? (
              <Button
                onClick={() => handlePhaseChange(Math.min(3, currentPhase + 1) as PhaseNumber)}
                disabled={!phaseCompletion[currentPhase]}
                size="lg"
                className="h-12"
              >
                Next →
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
            onClick={() => handlePhaseChange(Math.max(1, currentPhase - 1) as PhaseNumber)}
            disabled={currentPhase === 1}
            className="h-12 min-w-[48px] touch-manipulation"
            aria-label="Go to previous phase"
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
          {currentPhase < 3 ? (
            <Button
              onClick={() => handlePhaseChange(Math.min(3, currentPhase + 1) as PhaseNumber)}
              disabled={!phaseCompletion[currentPhase]}
              className="h-12 min-w-[48px] touch-manipulation"
              aria-label="Go to next phase"
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

      {/* Responsive Quality Score Panel */}
      {hasInteracted && (
        <>
          {/* Desktop: Floating Panel (left side to avoid sidebar) */}
          <div className="hidden lg:block fixed bottom-6 left-6 w-80 z-40">
            <div className="rounded-xl border-2 border-accent-blue/30 bg-card shadow-2xl">
              {/* Collapsible Header */}
              <button
                onClick={() => setShowQualityPanel(!showQualityPanel)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-t-xl"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-5 text-accent-blue" />
                  <span className="font-semibold text-sm">Score: {qualityMetrics.completeness_score}%</span>
                </div>
                {showQualityPanel ? (
                  <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronUp className="size-4 text-muted-foreground" />
                )}
              </button>

              {/* Expandable Content */}
              {showQualityPanel && (
                <div className="p-4 pt-0 border-t border-border">
                  <QualityIndicators metrics={qualityMetrics} />

                  {/* Contextual Tips Based on Phase */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      💡 Phase {currentPhase} Tips:
                    </p>
                    {currentPhase === 1 && (
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Rate honestly and consider all aspects</li>
                        <li>• Select focus areas that truly matter</li>
                      </ul>
                    )}
                    {currentPhase === 2 && (
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Be specific with each dimension</li>
                        <li>• Use the full 1-5 scale thoughtfully</li>
                      </ul>
                    )}
                    {currentPhase === 3 && (
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Balance positive and constructive feedback</li>
                        <li>• Make suggestions actionable and specific</li>
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile: Bottom Sticky Bar */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t-2 border-accent-blue/30 shadow-2xl">
            <button
              onClick={() => setShowQualityPanel(!showQualityPanel)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="size-5 text-accent-blue" />
                <span className="font-semibold text-sm">Review Score: {qualityMetrics.completeness_score}%</span>
              </div>
              {showQualityPanel ? (
                <ChevronDown className="size-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="size-4 text-muted-foreground" />
              )}
            </button>

            {/* Expandable Content - Slide up from bottom */}
            {showQualityPanel && (
              <div className="p-4 pt-0 border-t border-border max-h-[50vh] overflow-y-auto">
                <QualityIndicators metrics={qualityMetrics} />

                {/* Contextual Tips Based on Phase */}
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    💡 Phase {currentPhase} Tips:
                  </p>
                  {currentPhase === 1 && (
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Rate honestly and consider all aspects</li>
                      <li>• Select focus areas that truly matter</li>
                    </ul>
                  )}
                  {currentPhase === 2 && (
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Be specific with each dimension</li>
                      <li>• Use the full 1-5 scale thoughtfully</li>
                    </ul>
                  )}
                  {currentPhase === 3 && (
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Balance positive and constructive feedback</li>
                      <li>• Make suggestions actionable and specific</li>
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

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
