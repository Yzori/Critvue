/**
 * AcceptReviewModal Component
 * Modal for accepting a submitted review with optional rating
 *
 * Features:
 * - Star rating input (1-5 stars)
 * - Aspect ratings (checkboxes for quality indicators)
 * - Optional testimonial text
 * - Brand-compliant design with glassmorphism
 * - Mobile-optimized with 44px touch targets
 * - Accessibility support (keyboard navigation, ARIA labels)
 */

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Star, CheckCircle2, Loader2, Sparkles } from "lucide-react";

export interface AcceptReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (data: AcceptReviewData) => Promise<void>;
  reviewerName?: string;
  isSubmitting?: boolean;
}

export interface AcceptReviewData {
  rating?: number; // 1-5 stars
  aspects: {
    thorough: boolean;
    addressed_questions: boolean;
    actionable: boolean;
    professional: boolean;
  };
  testimonial?: string;
}

const ASPECT_OPTIONS = [
  {
    id: "thorough",
    label: "Thorough and detailed",
    description: "The review covered all important areas comprehensively",
  },
  {
    id: "addressed_questions",
    label: "Addressed my specific questions",
    description: "The reviewer responded to my key concerns",
  },
  {
    id: "actionable",
    label: "Actionable feedback",
    description: "I received specific, implementable suggestions",
  },
  {
    id: "professional",
    label: "Professional and constructive",
    description: "The feedback was delivered respectfully and helpfully",
  },
] as const;

export function AcceptReviewModal({
  isOpen,
  onClose,
  onAccept,
  reviewerName,
  isSubmitting = false,
}: AcceptReviewModalProps) {
  const [rating, setRating] = useState<number>(5); // Default to 5 stars
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [aspects, setAspects] = useState({
    thorough: false,
    addressed_questions: false,
    actionable: false,
    professional: false,
  });
  const [testimonial, setTestimonial] = useState("");

  const handleAccept = async () => {
    await onAccept({
      rating,
      aspects,
      testimonial: testimonial.trim() || undefined,
    });
  };

  const handleAspectChange = (
    aspectId: keyof typeof aspects,
    checked: boolean
  ) => {
    setAspects((prev) => ({ ...prev, [aspectId]: checked }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="size-6 text-green-600" />
            Accept Review
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {reviewerName
              ? `You're accepting ${reviewerName}'s review. `
              : "You're accepting this review. "}
            This will release payment (for expert reviews) and mark the review as complete.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-foreground">
              Rate this review (optional)
            </Label>
            <p className="text-sm text-muted-foreground">
              Help other users by rating the quality of this review
            </p>

            {/* Star Rating Input */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className={cn(
                    "size-12 rounded-lg transition-all duration-200 flex items-center justify-center",
                    "hover:scale-110 active:scale-95 touch-manipulation",
                    "min-h-[48px] min-w-[48px]", // Accessibility: 44px+ touch target
                    star <= (hoveredRating || rating)
                      ? "text-amber-500"
                      : "text-muted-foreground"
                  )}
                  aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
                >
                  <Star
                    className={cn(
                      "size-8 transition-all duration-200",
                      star <= (hoveredRating || rating) && "fill-current"
                    )}
                  />
                </button>
              ))}
            </div>

            <p className="text-sm font-medium text-foreground">
              {rating === 1 && "Poor - Needs significant improvement"}
              {rating === 2 && "Fair - Below expectations"}
              {rating === 3 && "Good - Met expectations"}
              {rating === 4 && "Very Good - Exceeded expectations"}
              {rating === 5 && "Excellent - Outstanding review!"}
            </p>
          </div>

          {/* Aspect Ratings */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-foreground">
              What made this review helpful?
            </Label>
            <p className="text-sm text-muted-foreground">
              Select all that apply (optional)
            </p>

            <div className="space-y-3">
              {ASPECT_OPTIONS.map((aspect) => (
                <div
                  key={aspect.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border-2 transition-all duration-200",
                    "hover:bg-accent-blue/5 cursor-pointer",
                    aspects[aspect.id as keyof typeof aspects]
                      ? "border-accent-blue bg-accent-blue/5"
                      : "border-border"
                  )}
                  onClick={() =>
                    handleAspectChange(
                      aspect.id as keyof typeof aspects,
                      !aspects[aspect.id as keyof typeof aspects]
                    )
                  }
                >
                  <Checkbox
                    id={aspect.id}
                    checked={aspects[aspect.id as keyof typeof aspects]}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleAspectChange(
                        aspect.id as keyof typeof aspects,
                        e.target.checked
                      );
                    }}
                    className="mt-0.5 min-h-[24px] min-w-[24px]"
                  />
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor={aspect.id}
                      className="text-sm font-semibold text-foreground cursor-pointer"
                    >
                      {aspect.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {aspect.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Testimonial */}
          <div className="space-y-3">
            <Label
              htmlFor="testimonial"
              className="text-base font-semibold text-foreground"
            >
              Leave a testimonial (optional)
            </Label>
            <p className="text-sm text-muted-foreground">
              Share what you appreciated most about this review. Your testimonial
              may be displayed on the reviewer's profile.
            </p>

            <Textarea
              id="testimonial"
              value={testimonial}
              onChange={(e) => setTestimonial(e.target.value)}
              placeholder="This review was incredibly helpful because..."
              className="min-h-[100px] resize-none"
              maxLength={500}
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>This will be visible on the reviewer's profile</span>
              <span>{testimonial.length}/500</span>
            </div>
          </div>

          {/* Info Box */}
          <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
              <Sparkles className="size-4" />
              <span>What happens next?</span>
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="size-1.5 rounded-full bg-green-600 mt-1.5 flex-shrink-0" />
                <span>The review will be marked as accepted</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="size-1.5 rounded-full bg-green-600 mt-1.5 flex-shrink-0" />
                <span>Payment will be released to the reviewer (for expert reviews)</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="size-1.5 rounded-full bg-green-600 mt-1.5 flex-shrink-0" />
                <span>Your rating will help improve review quality</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto min-h-[48px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white min-h-[48px] font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-5" />
                Accept & Rate Review
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
