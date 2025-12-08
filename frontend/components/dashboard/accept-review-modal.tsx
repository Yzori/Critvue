/**
 * AcceptReviewModal Component
 * Modal for accepting a submitted review with detailed reviewer rating
 *
 * Features:
 * - Detailed reviewer ratings (quality, professionalism, helpfulness)
 * - Optional feedback text
 * - Anonymous rating option
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Star,
  CheckCircle2,
  Loader2,
  Sparkles,
  UserCheck,
  MessageCircle,
  Eye,
  EyeOff,
} from "lucide-react";

export interface AcceptReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (data: AcceptReviewData) => Promise<void>;
  reviewerName?: string;
  isSubmitting?: boolean;
}

export interface AcceptReviewData {
  rating?: number; // 1-5 stars (overall helpful rating for backend)
  // Detailed reviewer ratings
  quality_rating: number;
  professionalism_rating: number;
  helpfulness_rating: number;
  feedback_text?: string;
  is_anonymous?: boolean;
}

// Star Rating Input Component
interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  label,
  icon,
  description,
}) => {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <Label className="font-medium text-foreground">{label}</Label>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className={cn(
              "p-1.5 transition-transform hover:scale-110 touch-manipulation",
              "min-h-[44px] min-w-[44px] flex items-center justify-center"
            )}
            aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
          >
            <Star
              className={cn(
                "size-7 transition-colors",
                (hovered || value) >= star
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {value > 0 ? `${value}/5` : "Not rated"}
        </span>
      </div>
    </div>
  );
};

export function AcceptReviewModal({
  isOpen,
  onClose,
  onAccept,
  reviewerName,
  isSubmitting = false,
}: AcceptReviewModalProps) {
  const [quality, setQuality] = useState<number>(0);
  const [professionalism, setProfessionalism] = useState<number>(0);
  const [helpfulness, setHelpfulness] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);

  const canSubmit = quality > 0 && professionalism > 0 && helpfulness > 0;

  // Calculate overall rating for display
  const overallRating = canSubmit
    ? Math.round(quality * 0.4 + professionalism * 0.3 + helpfulness * 0.3)
    : 0;

  const handleAccept = async () => {
    if (!canSubmit) return;

    await onAccept({
      rating: overallRating,
      quality_rating: quality,
      professionalism_rating: professionalism,
      helpfulness_rating: helpfulness,
      feedback_text: feedback.trim() || undefined,
      is_anonymous: isAnonymous,
    });
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form state
      setQuality(0);
      setProfessionalism(0);
      setHelpfulness(0);
      setFeedback("");
      setIsAnonymous(true);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-popover">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="size-6 text-green-600" />
            Accept & Rate Review
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {reviewerName
              ? `You're accepting ${reviewerName}'s review. `
              : "You're accepting this review. "}
            Rate the reviewer to help maintain quality standards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quality Rating */}
          <StarRating
            value={quality}
            onChange={setQuality}
            label="Review Quality *"
            icon={<Sparkles className="size-5 text-amber-500" />}
            description="Was the review thorough, detailed, and helpful?"
          />

          {/* Professionalism Rating */}
          <StarRating
            value={professionalism}
            onChange={setProfessionalism}
            label="Professionalism *"
            icon={<UserCheck className="size-5 text-blue-500" />}
            description="Was the feedback constructive and appropriate?"
          />

          {/* Helpfulness Rating */}
          <StarRating
            value={helpfulness}
            onChange={setHelpfulness}
            label="Helpfulness *"
            icon={<MessageCircle className="size-5 text-green-500" />}
            description="Did they respond to follow-up questions?"
          />

          {/* Overall Rating Preview */}
          {canSubmit && (
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Overall Rating</span>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "size-5",
                          star <= overallRating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted"
                        )}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-foreground">{overallRating}/5</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Calculated from your ratings (Quality 40%, Professionalism 30%, Helpfulness 30%)
              </p>
            </div>
          )}

          {/* Optional Feedback */}
          <div className="space-y-3">
            <Label
              htmlFor="feedback"
              className="text-base font-semibold text-foreground"
            >
              Additional Feedback (Optional)
            </Label>
            <p className="text-sm text-muted-foreground">
              Share what you appreciated or any constructive feedback for the reviewer.
            </p>

            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="This review was incredibly helpful because..."
              className="min-h-[100px] resize-none"
              maxLength={500}
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>May be displayed on reviewer's profile</span>
              <span>{feedback.length}/500</span>
            </div>
          </div>

          {/* Anonymous Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              {isAnonymous ? (
                <EyeOff className="size-5 text-muted-foreground" />
              ) : (
                <Eye className="size-5 text-muted-foreground" />
              )}
              <div>
                <Label className="text-sm font-semibold text-foreground">Anonymous Rating</Label>
                <p className="text-xs text-muted-foreground">
                  {isAnonymous ? "Your name will be hidden from the reviewer" : "Your name will be visible to the reviewer"}
                </p>
              </div>
            </div>
            <Switch
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
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
                <span>Your rating helps build the reviewer's reputation</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto min-h-[48px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!canSubmit || isSubmitting}
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
