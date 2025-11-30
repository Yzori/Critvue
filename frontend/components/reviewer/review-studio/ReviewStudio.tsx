/**
 * Review Studio
 *
 * Main shell component for the split-screen review workspace.
 * LEFT: Interactive Content Viewer with annotation support
 * RIGHT: Draggable card-based feedback deck
 */

"use client";

import * as React from "react";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  MousePointer,
  Crosshair,
  Plus,
  ThumbsUp,
  AlertTriangle,
  Image,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { ReviewStudioProvider, useReviewStudio } from "./context/ReviewStudioContext";
import { FeedbackDeck } from "./deck/FeedbackDeck";
import { ContentViewer } from "./viewer/ContentViewer";

// ===== Props =====

interface ReviewStudioProps {
  slotId: number;
  contentType: string;
  contentSubcategory?: string | null;
  imageUrl?: string;
  externalUrl?: string | null;
  onSubmitSuccess?: () => void;
  className?: string;
}

// ===== Inner Component (has access to context) =====

type MobilePanel = "content" | "feedback";

function ReviewStudioInner({
  contentType,
  contentSubcategory,
  imageUrl,
  externalUrl,
  onSubmitSuccess,
  className,
}: Omit<ReviewStudioProps, "slotId">) {
  const {
    state,
    addIssueCard,
    addStrengthCard,
    toggleSelectionMode,
    saveDraft,
    submitReview,
    isReadyToSubmit,
    getValidationErrors,
  } = useReviewStudio();

  // Mobile panel switcher
  const [mobilePanel, setMobilePanel] = React.useState<MobilePanel>("feedback");

  // Submit dialog state
  const [showSubmitDialog, setShowSubmitDialog] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Handle submit
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submitReview();
      setShowSubmitDialog(false);
      onSubmitSuccess?.();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to submit review"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format save time
  const formatSaveTime = (date: Date | null) => {
    if (!date) return null;
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 10) return "Just saved";
    if (diff < 60) return `Saved ${diff}s ago`;
    if (diff < 3600) return `Saved ${Math.floor(diff / 60)}m ago`;
    return `Saved at ${date.toLocaleTimeString()}`;
  };

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header Bar */}
      <header className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Selection Mode Toggle - Hidden on mobile when in feedback panel */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={state.selectionMode === "annotate" ? "default" : "outline"}
                  size="sm"
                  onClick={toggleSelectionMode}
                  className={cn(
                    "gap-2",
                    mobilePanel === "feedback" && "hidden sm:flex"
                  )}
                >
                  {state.selectionMode === "annotate" ? (
                    <>
                      <Crosshair className="h-4 w-4" />
                      <span className="hidden sm:inline">Annotating</span>
                    </>
                  ) : (
                    <>
                      <MousePointer className="h-4 w-4" />
                      <span className="hidden sm:inline">Select</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {state.selectionMode === "annotate"
                  ? "Click anywhere on the content to add annotations. ESC to cancel."
                  : "Click to enable annotation mode"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Quick Add Buttons */}
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addIssueCard()}
                    className="gap-1.5 h-8 px-2 sm:px-3"
                  >
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <Plus className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Issue Card</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addStrengthCard()}
                    className="gap-1.5 h-8 px-2 sm:px-3"
                  >
                    <ThumbsUp className="h-4 w-4 text-green-500" />
                    <Plus className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Strength Card</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Right side: Save status + Submit */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Save Status */}
          <div className="flex items-center gap-1 sm:gap-2 text-sm text-muted-foreground">
            {state.isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Saving...</span>
              </>
            ) : state.saveError ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => saveDraft()}
                      className="flex items-center gap-1 sm:gap-2 text-destructive hover:text-destructive/80 transition-colors"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <span className="hidden sm:inline text-xs">
                        Save failed - tap to retry
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px]">
                    <p className="text-xs">{state.saveError}</p>
                    <p className="text-xs text-muted-foreground mt-1">Click to retry</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : state.lastSavedAt ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="hidden lg:inline">
                  {formatSaveTime(state.lastSavedAt)}
                </span>
              </>
            ) : null}
          </div>

          {/* Manual Save */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => saveDraft()}
                  disabled={state.isSaving}
                  className="h-8 w-8 p-0"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save draft (auto-saves every 3s)</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Submit Button */}
          <Button
            size="sm"
            onClick={() => setShowSubmitDialog(true)}
            disabled={!isReadyToSubmit()}
            className="gap-2 h-8"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Submit</span>
          </Button>
        </div>
      </header>

      {/* Mobile Panel Switcher */}
      <div className="md:hidden flex items-center border-b bg-muted/50">
        <button
          onClick={() => setMobilePanel("content")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
            mobilePanel === "content"
              ? "bg-background text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Image className="h-4 w-4" />
          View Content
        </button>
        <button
          onClick={() => setMobilePanel("feedback")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
            mobilePanel === "feedback"
              ? "bg-background text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Feedback
          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
            {state.issueCards.length + state.strengthCards.length}
          </span>
        </button>
      </div>

      {/* Main Split Layout - Desktop */}
      <div className="flex-1 hidden md:flex overflow-hidden">
        {/* LEFT: Content Viewer */}
        <div className="w-1/2 border-r overflow-hidden bg-muted/30">
          <ContentViewer imageUrl={imageUrl} externalUrl={externalUrl} className="h-full" />
        </div>

        {/* RIGHT: Feedback Deck - subtle tint for visual separation */}
        <div className="w-1/2 overflow-hidden bg-[#fafafa] border-l border-border/50">
          <FeedbackDeck className="h-full" />
        </div>
      </div>

      {/* Mobile Layout - Stacked with panel switcher */}
      <div className="flex-1 md:hidden overflow-hidden">
        {mobilePanel === "content" ? (
          <ContentViewer imageUrl={imageUrl} externalUrl={externalUrl} className="h-full" />
        ) : (
          <FeedbackDeck className="h-full" />
        )}
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Review</DialogTitle>
            <DialogDescription>
              Are you ready to submit your review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {/* Validation Errors */}
          {!isReadyToSubmit() && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <h4 className="font-medium text-destructive mb-2">
                Please fix the following before submitting:
              </h4>
              <ul className="text-sm text-destructive space-y-1">
                {getValidationErrors().map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Submit Error */}
          {submitError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive">{submitError}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 py-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {state.issueCards.length}
              </div>
              <div className="text-xs text-muted-foreground">Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {state.strengthCards.length}
              </div>
              <div className="text-xs text-muted-foreground">Strengths</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {state.annotations.length}
              </div>
              <div className="text-xs text-muted-foreground">Annotations</div>
            </div>
          </div>

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
              disabled={isSubmitting || !isReadyToSubmit()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== Main Export (wraps with Provider) =====

export function ReviewStudio(props: ReviewStudioProps) {
  const { slotId, contentType, ...rest } = props;

  return (
    <ReviewStudioProvider slotId={slotId} contentType={contentType}>
      <ReviewStudioInner contentType={contentType} {...rest} />
    </ReviewStudioProvider>
  );
}

export default ReviewStudio;
