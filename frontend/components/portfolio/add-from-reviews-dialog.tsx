"use client";

/**
 * Add from Reviews Dialog
 *
 * Allows users to create verified portfolio items from their completed reviews.
 * These items are unlimited and show a "Verified" badge.
 */

import { useState, useEffect } from "react";
import { useFormState } from "@/hooks";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BadgeCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Image as ImageIcon,
  FileImage,
  Calendar,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getEligibleReviews,
  createPortfolioFromReview,
  type EligibleReview,
  type EligibleReviewFile,
} from "@/lib/api/portfolio";
import { formatDistanceToNow } from "date-fns";

interface AddFromReviewsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Step = "loading" | "select-review" | "configure" | "submitting" | "success" | "error";

export function AddFromReviewsDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddFromReviewsDialogProps) {
  const [step, setStep] = useState<Step>("loading");
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<EligibleReview[]>([]);
  const [selectedReview, setSelectedReview] = useState<EligibleReview | null>(null);

  // Form state using useFormState
  const form = useFormState({
    title: "",
    description: "",
    selectedImageUrl: null as string | null,
    projectUrl: "",
  });

  // Load reviews when dialog opens
  useEffect(() => {
    if (open) {
      loadReviews();
    }
  }, [open]);

  const loadReviews = async () => {
    setStep("loading");
    setError(null);
    try {
      const data = await getEligibleReviews();
      setReviews(data);
      setStep("select-review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews");
      setStep("error");
    }
  };

  const handleSelectReview = (review: EligibleReview) => {
    if (review.has_portfolio_item) return;

    setSelectedReview(review);
    form.setValue("title", review.title);
    form.setValue("description", review.description);

    // Auto-select first image file if available
    const imageFile = review.files.find((f) =>
      f.file_type.startsWith("image/")
    );
    form.setValue("selectedImageUrl", imageFile?.file_url || null);

    setStep("configure");
  };

  const handleBack = () => {
    setSelectedReview(null);
    form.reset();
    setStep("select-review");
  };

  const handleSubmit = async () => {
    if (!selectedReview || !form.values.selectedImageUrl) {
      setError("Please select an image for your portfolio item");
      return;
    }

    setStep("submitting");
    setError(null);

    try {
      await createPortfolioFromReview(selectedReview.id, {
        title: form.values.title.trim() || undefined,
        description: form.values.description.trim() || undefined,
        image_url: form.values.selectedImageUrl,
        project_url: form.values.projectUrl.trim() || undefined,
      });

      setStep("success");

      // Close and refresh after brief delay
      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 1500);
    } catch (err) {
      setStep("error");
      setError(err instanceof Error ? err.message : "Failed to add to portfolio");
    }
  };

  const handleClose = () => {
    if (step !== "submitting") {
      onOpenChange(false);
      // Reset state after close
      setTimeout(() => {
        setStep("loading");
        setSelectedReview(null);
        form.reset();
        setError(null);
      }, 200);
    }
  };

  const eligibleReviews = reviews.filter((r) => !r.has_portfolio_item);
  const addedReviews = reviews.filter((r) => r.has_portfolio_item);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgeCheck className="size-5 text-emerald-500" />
            Add Verified Work
          </DialogTitle>
          <DialogDescription>
            Add completed reviews to your portfolio with a verified badge.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Loading State */}
          {step === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <Loader2 className="size-10 mx-auto text-accent-blue animate-spin mb-4" />
              <p className="text-muted-foreground">Loading your completed reviews...</p>
            </motion.div>
          )}

          {/* Select Review Step */}
          {step === "select-review" && (
            <motion.div
              key="select-review"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4 overflow-hidden"
            >
              {reviews.length === 0 ? (
                <div className="py-12 text-center">
                  <Sparkles className="size-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium">No completed reviews yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Once you receive reviews and accept them, they&apos;ll appear here.
                  </p>
                </div>
              ) : (
                <>
                  {eligibleReviews.length > 0 && (
                    <div className="space-y-2 overflow-hidden">
                      <p className="text-sm font-medium text-muted-foreground">
                        Available to add ({eligibleReviews.length})
                      </p>
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2 pr-4">
                          {eligibleReviews.map((review) => (
                            <ReviewCard
                              key={review.id}
                              review={review}
                              onClick={() => handleSelectReview(review)}
                            />
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {addedReviews.length > 0 && (
                    <div className="space-y-2 pt-4 border-t">
                      <p className="text-sm font-medium text-muted-foreground">
                        Already in portfolio ({addedReviews.length})
                      </p>
                      <div className="space-y-2 opacity-60">
                        {addedReviews.slice(0, 3).map((review) => (
                          <ReviewCard
                            key={review.id}
                            review={review}
                            disabled
                          />
                        ))}
                        {addedReviews.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{addedReviews.length - 3} more already added
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}

          {/* Configure Step */}
          {step === "configure" && selectedReview && (
            <motion.div
              key="configure"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Back button */}
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-4" />
                Back to reviews
              </button>

              {/* Selected review info */}
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{selectedReview.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedReview.content_type} &middot; Completed{" "}
                      {selectedReview.completed_at
                        ? formatDistanceToNow(new Date(selectedReview.completed_at), {
                            addSuffix: true,
                          })
                        : "recently"}
                    </p>
                  </div>
                  <Badge variant="success" className="gap-1">
                    <BadgeCheck className="size-3" />
                    Verified
                  </Badge>
                </div>
              </div>

              {/* Title override */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.values.title}
                  onChange={(e) => form.setValue("title", e.target.value)}
                  placeholder={selectedReview.title}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use the review title
                </p>
              </div>

              {/* Description override */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.values.description}
                  onChange={(e) => form.setValue("description", e.target.value)}
                  placeholder="Describe your work..."
                  rows={3}
                />
              </div>

              {/* Image Selection */}
              <div className="space-y-2">
                <Label>Portfolio Image *</Label>
                <p className="text-sm text-muted-foreground">
                  Select an image from your review files
                </p>

                {selectedReview.files.filter((f) => f.file_type.startsWith("image/"))
                  .length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {selectedReview.files
                      .filter((f) => f.file_type.startsWith("image/"))
                      .map((file) => (
                        <ImageSelectCard
                          key={file.id}
                          file={file}
                          selected={form.values.selectedImageUrl === file.file_url}
                          onClick={() => form.setValue("selectedImageUrl", file.file_url)}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-lg border-2 border-dashed text-center">
                    <FileImage className="size-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No images found in this review
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You may need to add images via the self-documented upload instead
                    </p>
                  </div>
                )}
              </div>

              {/* Project URL */}
              <div className="space-y-2">
                <Label htmlFor="projectUrl">Project URL (Optional)</Label>
                <Input
                  id="projectUrl"
                  type="url"
                  placeholder="https://example.com/project"
                  value={form.values.projectUrl}
                  onChange={(e) => form.setValue("projectUrl", e.target.value)}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="size-4" />
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!form.values.selectedImageUrl}
                  className="gap-2"
                >
                  <BadgeCheck className="size-4" />
                  Add to Portfolio
                </Button>
              </div>
            </motion.div>
          )}

          {/* Submitting State */}
          {step === "submitting" && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <Loader2 className="size-12 mx-auto text-accent-blue animate-spin mb-4" />
              <p className="text-lg font-medium">Adding to portfolio...</p>
            </motion.div>
          )}

          {/* Success State */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
              >
                <CheckCircle2 className="size-16 mx-auto text-emerald-500 mb-4" />
              </motion.div>
              <p className="text-lg font-medium text-foreground">Added Successfully!</p>
              <p className="text-sm text-muted-foreground">
                Your verified work is now in your portfolio
              </p>
            </motion.div>
          )}

          {/* Error State */}
          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <AlertCircle className="size-16 mx-auto text-destructive mb-4" />
              <p className="text-lg font-medium text-foreground">Something went wrong</p>
              <p className="text-sm text-destructive mb-4">{error}</p>
              <Button onClick={loadReviews}>Try Again</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// Sub-components

interface ReviewCardProps {
  review: EligibleReview;
  onClick?: () => void;
  disabled?: boolean;
}

function ReviewCard({ review, onClick, disabled }: ReviewCardProps) {
  const imageFile = review.files.find((f) => f.file_type.startsWith("image/"));

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-4 p-3 rounded-lg border text-left transition-colors overflow-hidden",
        disabled
          ? "cursor-not-allowed bg-muted/30"
          : "hover:bg-muted/50 hover:border-accent-blue/50 cursor-pointer"
      )}
    >
      {/* Thumbnail */}
      <div className="size-16 rounded-md bg-muted flex-shrink-0 overflow-hidden">
        {imageFile?.file_url ? (
          <img
            src={imageFile.file_url}
            alt={review.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="size-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 w-0">
        <p className="font-medium truncate">{review.title}</p>
        <p className="text-sm text-muted-foreground truncate">
          {review.description}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-xs capitalize">
            {review.content_type}
          </Badge>
          <span className="flex items-center gap-1">
            <Calendar className="size-3" />
            {review.completed_at
              ? formatDistanceToNow(new Date(review.completed_at), { addSuffix: true })
              : "Recently"}
          </span>
        </div>
      </div>

      {/* Arrow or Added badge */}
      {disabled ? (
        <Badge variant="outline" className="text-xs">
          Added
        </Badge>
      ) : (
        <ChevronRight className="size-5 text-muted-foreground flex-shrink-0" />
      )}
    </button>
  );
}

interface ImageSelectCardProps {
  file: EligibleReviewFile;
  selected: boolean;
  onClick: () => void;
}

function ImageSelectCard({ file, selected, onClick }: ImageSelectCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative aspect-video rounded-lg overflow-hidden border-2 transition-all",
        selected
          ? "border-accent-blue ring-2 ring-accent-blue/20"
          : "border-transparent hover:border-muted-foreground/30"
      )}
    >
      <img
        src={file.file_url || ""}
        alt={file.original_filename}
        className="w-full h-full object-cover"
      />
      {selected && (
        <div className="absolute inset-0 bg-accent-blue/20 flex items-center justify-center">
          <CheckCircle2 className="size-6 text-accent-blue" />
        </div>
      )}
    </button>
  );
}
