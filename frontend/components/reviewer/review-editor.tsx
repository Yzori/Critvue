/**
 * Review Editor Component
 *
 * Rich text editor for writing reviews with:
 * - Auto-save every 30 seconds
 * - Character count and validation
 * - Rating selector
 * - File upload for attachments
 * - Quality checklist
 * - Save status indicator
 *
 * Brand Compliance:
 * - Clean, focused writing interface
 * - Critvue brand colors for validation states
 * - Minimal distractions
 * - Clear save/submit states
 */

"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import {
  Star,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  saveDraft,
  submitReview,
  type ReviewDraft,
  type ReviewSubmission,
} from "@/lib/api/reviewer";

export interface ReviewEditorProps {
  slotId: number;
  initialDraft?: ReviewDraft | null;
  onSubmitSuccess: () => void;
}

export function ReviewEditor({
  slotId,
  initialDraft,
  onSubmitSuccess,
}: ReviewEditorProps) {
  // Form state - Convert from structured sections to simple text
  const [reviewText, setReviewText] = React.useState(() => {
    if (!initialDraft?.sections || initialDraft.sections.length === 0) {
      return "";
    }
    // Combine all sections into single text field
    return initialDraft.sections
      .map(section => `${section.section_label}:\n${section.content}`)
      .join("\n\n");
  });
  const [rating, setRating] = React.useState<number | null>(
    initialDraft?.rating || null
  );
  const [attachments, setAttachments] = React.useState<
    Array<{ file_url: string; file_name: string; file_type: string }>
  >([]);

  // Auto-save state
  const [saveStatus, setSaveStatus] = React.useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Quality checks
  const minLength = 50;
  const maxLength = 10000;
  const characterCount = reviewText.length;
  const hasMinLength = characterCount >= minLength;
  const hasRating = rating !== null;
  const canSubmit = hasMinLength && hasRating && !submitting;

  // Auto-save effect
  React.useEffect(() => {
    if (reviewText.length === 0 && rating === null) {
      return; // Don't save empty drafts
    }

    const timer = setTimeout(async () => {
      try {
        setSaveStatus("saving");

        // Convert simple text to structured sections format
        const sections = reviewText.trim() ? [
          {
            section_id: "general_feedback",
            section_label: "Feedback",
            content: reviewText,
            word_count: reviewText.split(/\s+/).length,
            required: true
          }
        ] : [];

        await saveDraft(slotId, {
          sections,
          rating,
        });
        setSaveStatus("saved");
        setLastSaved(new Date());

        // Reset to idle after 2 seconds
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [reviewText, rating, attachments, slotId]);

  // Handle manual save
  const handleManualSave = async () => {
    try {
      setSaveStatus("saving");

      // Convert simple text to structured sections format
      const sections = reviewText.trim() ? [
        {
          section_id: "general_feedback",
          section_label: "Feedback",
          content: reviewText,
          word_count: reviewText.split(/\s+/).length,
          required: true
        }
      ] : [];

      await saveDraft(slotId, {
        sections,
        rating,
      });
      setSaveStatus("saved");
      setLastSaved(new Date());
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!canSubmit) return;

    if (
      !confirm(
        "Are you sure you want to submit this review? You won't be able to edit it after submission."
      )
    ) {
      return;
    }

    try {
      setSubmitting(true);

      const submission: ReviewSubmission = {
        review_text: reviewText,
        rating: rating!,
        attachments: attachments.map((att) => ({
          ...att,
          file_size: 0, // Will be filled by upload handler
        })),
      };

      await submitReview(slotId, submission);
      onSubmitSuccess();
    } catch {
      alert(
        "Failed to submit review. Please check your connection and try again."
      );
      setSubmitting(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (files: File[]) => {
    // TODO: Implement actual file upload to server
    // For now, just simulate attachment
    const newAttachments = files.map((file) => ({
      file_url: URL.createObjectURL(file),
      file_name: file.name,
      file_type: file.type,
    }));
    setAttachments([...attachments, ...newAttachments]);
  };

  return (
    <div className="space-y-6">
      {/* Save Status Indicator */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center gap-2">
          {saveStatus === "saving" && (
            <>
              <Loader2 className="size-4 text-accent-blue animate-spin" />
              <span className="text-sm text-muted-foreground">Saving draft...</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <CheckCircle2 className="size-4 text-green-600" />
              <span className="text-sm text-green-600">Saved</span>
            </>
          )}
          {saveStatus === "error" && (
            <>
              <AlertCircle className="size-4 text-red-600" />
              <span className="text-sm text-red-600">Save failed</span>
            </>
          )}
          {saveStatus === "idle" && lastSaved && (
            <span className="text-sm text-muted-foreground">
              Last saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualSave}
          disabled={saveStatus === "saving"}
        >
          <Save className="size-4" />
          Save Now
        </Button>
      </div>

      {/* Rating Selector */}
      <div className="space-y-3">
        <Label htmlFor="rating" className="text-base font-semibold">
          Your Rating
        </Label>
        <div className="flex items-center gap-3 sm:gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={cn(
                "size-14 sm:size-12 rounded-lg transition-all duration-200",
                "flex items-center justify-center",
                "hover:scale-110 active:scale-95",
                rating && star <= rating
                  ? "text-amber-400 bg-amber-50 dark:bg-amber-500/20 border-2 border-amber-300 dark:border-amber-500/40"
                  : "text-gray-300 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:text-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-500/10"
              )}
              aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  "size-7 sm:size-6",
                  rating && star <= rating && "fill-current"
                )}
              />
            </button>
          ))}
          {rating && (
            <span className="ml-2 text-sm font-medium text-foreground">
              {rating}/5
            </span>
          )}
        </div>
      </div>

      {/* Review Text */}
      <div className="space-y-3">
        <Label htmlFor="review-text" className="text-base font-semibold">
          Your Review
        </Label>
        <Textarea
          id="review-text"
          placeholder="Write your detailed review here... Be specific and constructive."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          className={cn(
            "min-h-[300px] text-base resize-y",
            "focus:ring-2 focus:ring-accent-blue/50"
          )}
          aria-describedby="character-count quality-checks"
        />
        <div
          id="character-count"
          className="flex items-center justify-between text-sm"
        >
          <span
            className={cn(
              characterCount < minLength
                ? "text-amber-600"
                : characterCount > maxLength
                  ? "text-red-600"
                  : "text-green-600"
            )}
          >
            {characterCount} character{characterCount !== 1 ? "s" : ""}
          </span>
          <span className="text-muted-foreground">
            Minimum: {minLength} characters
          </span>
        </div>
      </div>

      {/* File Attachments */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          Attachments (Optional)
        </Label>
        <p className="text-sm text-muted-foreground">
          Upload screenshots, annotations, or other supporting files
        </p>
        <FileUpload
          onUpload={handleFileUpload}
          accept="image/*,.pdf"
          maxSize={10 * 1024 * 1024} // 10MB
          multiple
        />
        {attachments.length > 0 && (
          <div className="space-y-2">
            {attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
              >
                <Upload className="size-4 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">{att.file_name}</span>
                <button
                  type="button"
                  onClick={() =>
                    setAttachments(attachments.filter((_, idx) => idx !== i))
                  }
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quality Checklist */}
      <div
        id="quality-checks"
        className="rounded-xl border border-border bg-card p-4 space-y-2"
      >
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Quality Checklist
        </h3>
        <div className="space-y-2">
          <ChecklistItem
            checked={hasMinLength}
            label={`At least ${minLength} characters`}
          />
          <ChecklistItem checked={hasRating} label="Rating provided (1-5 stars)" />
          <ChecklistItem
            checked={reviewText.length > 0}
            label="Detailed feedback included"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="sticky bottom-0 pt-4 pb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            "w-full h-12 text-base font-semibold",
            canSubmit
              ? "bg-accent-blue hover:bg-accent-blue/90"
              : "bg-muted text-muted-foreground"
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 className="size-5" />
              Submit Review
            </>
          )}
        </Button>
        {!canSubmit && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            {!hasMinLength && `Need ${minLength - characterCount} more characters. `}
            {!hasRating && "Please provide a rating."}
          </p>
        )}
      </div>
    </div>
  );
}

interface ChecklistItemProps {
  checked: boolean;
  label: string;
}

function ChecklistItem({ checked, label }: ChecklistItemProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "size-5 rounded flex items-center justify-center border-2 transition-all",
          checked
            ? "bg-green-100 border-green-500"
            : "bg-gray-50 border-gray-300"
        )}
      >
        {checked && <CheckCircle2 className="size-3 text-green-600" />}
      </div>
      <span
        className={cn(
          "text-sm",
          checked ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
  );
}
