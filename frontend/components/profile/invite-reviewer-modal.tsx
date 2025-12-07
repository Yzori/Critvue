"use client";

/**
 * Invite Reviewer Modal
 *
 * Modal that allows a user to invite a specific reviewer to one of their
 * review requests that has open slots.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Send,
} from "lucide-react";
import {
  getReviewsWithOpenSlots,
  inviteReviewer,
  CreateReviewResponse,
} from "@/lib/api/reviews";
import { cn } from "@/lib/utils";

interface InviteReviewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewerId: number;
  reviewerName: string;
}

type ModalStep = "select" | "message" | "success" | "error";

export function InviteReviewerModal({
  open,
  onOpenChange,
  reviewerId,
  reviewerName,
}: InviteReviewerModalProps) {
  const [step, setStep] = useState<ModalStep>("select");
  const [reviews, setReviews] = useState<CreateReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedReview, setSelectedReview] = useState<CreateReviewResponse | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Load reviews with open slots when modal opens
  useEffect(() => {
    if (open) {
      setStep("select");
      setSelectedReview(null);
      setMessage("");
      setError(null);
      loadReviews();
    }
  }, [open]);

  async function loadReviews() {
    setLoading(true);
    try {
      const response = await getReviewsWithOpenSlots();
      setReviews(response.items);
    } catch (err) {
      console.error("Failed to load reviews:", err);
      setError("Failed to load your review requests");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendInvitation() {
    if (!selectedReview) return;

    setSending(true);
    setError(null);

    try {
      await inviteReviewer(selectedReview.id, {
        reviewer_id: reviewerId,
        message: message.trim() || undefined,
      });
      setStep("success");
    } catch (err: unknown) {
      console.error("Failed to send invitation:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to send invitation";
      setError(errorMessage);
      setStep("error");
    } finally {
      setSending(false);
    }
  }

  function handleSelectReview(review: CreateReviewResponse) {
    setSelectedReview(review);
    setStep("message");
  }

  function handleBack() {
    if (step === "message") {
      setStep("select");
      setSelectedReview(null);
    }
  }

  function handleClose() {
    onOpenChange(false);
  }

  const getAvailableSlots = (review: CreateReviewResponse) => {
    return (review.reviews_requested || 1) - (review.reviews_claimed || 0);
  };

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      design: "Design",
      photography: "Photography",
      video: "Video",
      stream: "Stream",
      audio: "Audio",
      writing: "Writing",
      art: "Art",
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "select" && "Request Review"}
            {step === "message" && "Add a Message"}
            {step === "success" && "Invitation Sent!"}
            {step === "error" && "Something Went Wrong"}
          </DialogTitle>
          <DialogDescription>
            {step === "select" && `Select a review request to invite ${reviewerName} to`}
            {step === "message" && "Optionally add a personal message"}
            {step === "success" && `${reviewerName} has been notified about your request`}
            {step === "error" && "We couldn't send the invitation"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Loading State */}
          {step === "select" && loading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Loading your requests...</p>
            </div>
          )}

          {/* No Reviews State */}
          {step === "select" && !loading && reviews.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="size-12 text-muted-foreground/50" />
              <p className="mt-4 font-medium text-foreground">No open review requests</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a review request first, then come back to invite reviewers.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleClose}
              >
                Got it
              </Button>
            </div>
          )}

          {/* Review Selection */}
          {step === "select" && !loading && reviews.length > 0 && (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {reviews.map((review) => (
                <motion.button
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => handleSelectReview(review)}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border transition-all",
                    "hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">
                        {review.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {getContentTypeLabel(review.content_type)}
                        </Badge>
                        {review.review_type === "expert" && (
                          <Badge variant="warning" className="text-xs">
                            Expert
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                      <Users className="size-4" />
                      <span>{getAvailableSlots(review)} open</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {/* Message Step */}
          {step === "message" && selectedReview && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm font-medium">{selectedReview.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {getContentTypeLabel(selectedReview.content_type)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {getAvailableSlots(selectedReview)} slot{getAvailableSlots(selectedReview) !== 1 ? "s" : ""} available
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="invitation-message"
                  className="text-sm font-medium text-foreground"
                >
                  Personal message (optional)
                </label>
                <Textarea
                  id="invitation-message"
                  placeholder={`Hi ${reviewerName}, I'd love to get your feedback on...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                  className="mt-1.5 resize-none"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {message.length}/500 characters
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSendInvitation}
                  disabled={sending}
                  className="flex-1 gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Success Step */}
          {step === "success" && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center py-6 text-center"
            >
              <div className="size-16 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
                <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="mt-4 text-foreground">
                Your invitation has been sent to <strong>{reviewerName}</strong>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                They'll receive a notification and can claim a slot on your request.
              </p>
              <Button onClick={handleClose} className="mt-6">
                Done
              </Button>
            </motion.div>
          )}

          {/* Error Step */}
          {step === "error" && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center py-6 text-center"
            >
              <div className="size-16 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                <AlertCircle className="size-8 text-red-600 dark:text-red-400" />
              </div>
              <p className="mt-4 text-foreground">Failed to send invitation</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {error || "Please try again later."}
              </p>
              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={() => setStep("select")}>
                  Try Again
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
