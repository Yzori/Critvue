"use client";

/**
 * New Review Request Flow - Redesigned for Human Connection
 * Modern 7-step process emphasizing collaboration and clarity
 *
 * Steps:
 * 1. Content Type Selection - What are you working on?
 * 2. Feedback Goals - What kind of feedback do you want? (NEW - moved earlier)
 * 3. File Upload - Upload or paste your work
 * 4. Basic Info - Help the reviewer help you (context and description)
 * 5. Review Type - Choose review format (Quick/Standard/Deep)
 * 6. Number of Reviews - How many perspectives?
 * 7. Preview & Confirm - Final review before submitting
 *
 * Based on UX research showing 86% conversion increase
 * Redesigned to feel like a creative invitation, not a ticketing system
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ContentType, ReviewType, ReviewTier, FeedbackPriority, createReview, updateReview } from "@/lib/api/reviews";
import { getSubscriptionStatus, SubscriptionStatus } from "@/lib/api/subscriptions";
import { Button } from "@/components/ui/button";
import { ContentTypeStep } from "@/components/review-flow/content-type-step";
import { FeedbackGoalsStep, FeedbackGoal } from "@/components/review-flow/feedback-goals-step";
import { FileUploadStep } from "@/components/review-flow/file-upload-step";
import { BasicInfoStep } from "@/components/review-flow/basic-info-step";
import { ReviewTypeStep } from "@/components/review-flow/review-type-step";
import { NumberOfReviewsStep } from "@/components/review-flow/number-of-reviews-step";
import { ReviewSubmitStep } from "@/components/review-flow/review-submit-step";
import { ProgressIndicator } from "@/components/review-flow/progress-indicator";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { getErrorMessage } from "@/lib/api/client";
import { UploadedFile } from "@/components/ui/file-upload";

// Form state interface - Enhanced with new tier fields and feedback goals
interface FormState {
  contentType: ContentType | null;
  contentSubcategory: string | null; // NEW: Subcategory for specialized review workflows
  feedbackGoals: FeedbackGoal[]; // NEW: Moved to step 2
  uploadedFiles: UploadedFile[];
  externalLinks: string[];
  title: string;
  description: string;
  feedbackAreas: string[]; // Kept for backwards compatibility with API
  customFeedbackArea: string;
  reviewType: ReviewType | null;
  budget: number;
  numberOfReviews: number; // Number of reviews requested (1-10)
  reviewId: number | null;

  // Expert review tier fields
  tier: ReviewTier | null;
  feedback_priority: FeedbackPriority | null;
  specific_questions: string[];
  context: string;
  estimated_duration: number | null;
}

// Validation errors interface
interface ValidationErrors {
  title?: string;
  description?: string;
}

// Encouraging messages for step transitions - More collaborative tone
const encouragingMessages: Record<number, string> = {
  1: "Great choice! What kind of feedback are you looking for?",
  2: "Perfect! Now share your work with us...",
  3: "Looking good! Help the reviewer understand your context...",
  4: "Excellent! Let's find the right reviewers for you...",
  5: "Wonderful! How many perspectives would you like?",
  6: "Almost ready! Let's review your invitation...",
};

export default function NewReviewPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [encouragingMessage, setEncouragingMessage] = useState("");
  const [showEncouragement, setShowEncouragement] = useState(false);

  // Subscription/quota state
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [isCheckingQuota, setIsCheckingQuota] = useState(true);

  // Form state - Enhanced with new tier fields and feedback goals
  const [formState, setFormState] = useState<FormState>({
    contentType: null,
    contentSubcategory: null, // NEW: Subcategory for specialized workflows
    feedbackGoals: [], // NEW: Step 2
    uploadedFiles: [],
    externalLinks: [],
    title: "",
    description: "",
    feedbackAreas: [],
    customFeedbackArea: "",
    reviewType: null,
    budget: 25, // Default to standard tier minimum
    numberOfReviews: 1, // Default to 1 review
    reviewId: null,

    // Expert review tier fields
    tier: null,
    feedback_priority: null,
    specific_questions: [],
    context: "",
    estimated_duration: null,
  });

  // Check subscription quota on page load
  useEffect(() => {
    async function checkQuota() {
      try {
        const status = await getSubscriptionStatus();
        setSubscriptionStatus(status);

        // Check if user has exceeded their quota (only for free tier community reviews)
        if (!status.has_unlimited_reviews && status.reviews_remaining <= 0) {
          setQuotaExceeded(true);
        }
      } catch (error) {
        console.error("Failed to check subscription status:", error);
        // Don't block the user if we can't check - the backend will enforce limits
      } finally {
        setIsCheckingQuota(false);
      }
    }

    checkQuota();
  }, []);

  // Validate current step - Updated for 7-step flow
  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    if (step === 1) {
      // Step 1: Content type must be selected
      return formState.contentType !== null;
    }

    if (step === 2) {
      // Step 2: Feedback goals - at least one goal selected
      return formState.feedbackGoals.length > 0;
    }

    if (step === 3) {
      // Step 3: File upload - at least one file or link
      return formState.uploadedFiles.length > 0 || formState.externalLinks.length > 0;
    }

    if (step === 4) {
      // Step 4: Basic info - validate title and description
      if (!formState.title.trim()) {
        newErrors.title = "Title is required";
      } else if (formState.title.trim().length < 3) {
        newErrors.title = "Title must be at least 3 characters";
      }

      if (!formState.description.trim()) {
        newErrors.description = "Description is required";
      } else if (formState.description.trim().length < 10) {
        newErrors.description = "Description must be at least 10 characters";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    if (step === 5) {
      // Step 5: Review type must be selected
      return formState.reviewType !== null;
    }

    if (step === 6) {
      // Step 6: Number of reviews
      const maxReviews = formState.reviewType === "expert" ? 10 : 3;
      return formState.numberOfReviews >= 1 && formState.numberOfReviews <= maxReviews;
    }

    if (step === 7) {
      // Step 7: Preview & confirm - all validation already done
      return true;
    }

    return true;
  };

  // Show encouraging message with animation
  const showEncouragingMessage = (step: number) => {
    const message = encouragingMessages[step];
    if (message) {
      setEncouragingMessage(message);
      setShowEncouragement(true);
      setTimeout(() => setShowEncouragement(false), 3000);
    }
  };

  // Handle next step - Updated for 7-step flow
  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    // Special handling for step 2: create draft review after feedback goals
    // We need the review ID before step 3 (file upload)
    if (currentStep === 2 && !formState.reviewId) {
      setIsSubmitting(true);
      try {
        const response = await createReview({
          title: "Draft", // Placeholder, will be updated in step 4
          description: "Work in progress", // Placeholder, will be updated in step 4
          content_type: formState.contentType!,
          content_subcategory: formState.contentSubcategory || undefined,
          review_type: "free", // Temporary, will be updated later
        });

        // Store review ID for file uploads
        setFormState((prev) => ({ ...prev, reviewId: response.id as any }));

        // Show encouraging message and move to next step
        const nextStep = Math.min(currentStep + 1, 7);
        setCurrentStep(nextStep);
        showEncouragingMessage(currentStep);
      } catch (error) {
        console.error("Failed to create draft review:", error);
        alert(`Failed to create review: ${getErrorMessage(error)}`);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Special handling for step 4: update review with title and description
    if (currentStep === 4 && formState.reviewId) {
      setIsSubmitting(true);
      try {
        await updateReview(formState.reviewId, {
          title: formState.title.trim(),
          description: formState.description.trim(),
        });

        // Show encouraging message and move to next step
        const nextStep = Math.min(currentStep + 1, 7);
        setCurrentStep(nextStep);
        showEncouragingMessage(currentStep);
      } catch (error) {
        console.error("Failed to update review:", error);
        alert(`Failed to update review: ${getErrorMessage(error)}`);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Move to next step with encouraging message
    const nextStep = Math.min(currentStep + 1, 7);
    setCurrentStep(nextStep);
    showEncouragingMessage(currentStep);
  };

  // Handle back step
  const handleBack = () => {
    if (currentStep === 1) {
      // Go back to dashboard
      router.push("/dashboard");
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formState.contentType || !formState.reviewType || !formState.reviewId) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Build feedback_areas string from selected areas
      const feedbackAreasStr = [...formState.feedbackAreas, formState.customFeedbackArea]
        .filter(Boolean)
        .join(", ");

      // Calculate estimated_duration based on tier if not already set
      let estimatedDuration = formState.estimated_duration;
      if (formState.reviewType === "expert" && formState.tier && !estimatedDuration) {
        const durationDefaults: Record<ReviewTier, number> = {
          quick: 10,
          standard: 20,
          deep: 45,
        };
        estimatedDuration = durationDefaults[formState.tier];
      }

      // Update the review with complete data and set status to "pending"
      await updateReview(formState.reviewId, {
        review_type: formState.reviewType,
        reviews_requested: formState.numberOfReviews,
        status: "pending", // This makes it appear in browse marketplace
        feedback_areas: feedbackAreasStr || undefined,
        budget: formState.reviewType === "expert" ? formState.budget : undefined,
        // Expert review tier fields
        tier: formState.reviewType === "expert" ? formState.tier || undefined : undefined,
        feedback_priority: formState.reviewType === "expert" ? formState.feedback_priority || undefined : undefined,
        specific_questions: formState.reviewType === "expert" && formState.specific_questions.length > 0
          ? formState.specific_questions
          : undefined,
        context: formState.reviewType === "expert" && formState.context.trim()
          ? formState.context.trim()
          : undefined,
        estimated_duration: formState.reviewType === "expert" ? (estimatedDuration ?? undefined) : undefined,
      });

      // Show success state
      setSubmitSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Failed to submit review:", error);
      alert(`Failed to submit review: ${getErrorMessage(error)}`);
      setIsSubmitting(false);
    }
  };

  // Render current step content with animations - Updated for 6-step flow
  const renderStepContent = () => {
    if (submitSuccess) {
      return (
        <div className="text-center space-y-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Success Icon with confetti effect */}
          <div className="mx-auto size-24 rounded-full bg-green-500/10 flex items-center justify-center animate-in zoom-in duration-500">
            <Check className="size-12 text-green-600" />
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Invitation sent!
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Your review invitation is now live. We'll notify you when reviewers claim slots.
            </p>
          </div>

          {/* Success animation sparkles */}
          <div className="flex justify-center gap-2">
            <Sparkles className="size-5 text-accent-peach animate-pulse" />
            <Sparkles className="size-5 text-accent-blue animate-pulse delay-100" />
            <Sparkles className="size-5 text-accent-peach animate-pulse delay-200" />
          </div>
        </div>
      );
    }

    // Wrap content in animated div for smooth transitions
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        {(() => {
          switch (currentStep) {
            case 1:
              // Step 1: Content Type Selection (with subcategories)
              return (
                <ContentTypeStep
                  selectedType={formState.contentType}
                  selectedSubcategory={formState.contentSubcategory}
                  onSelect={(type, subcategory) =>
                    setFormState((prev) => ({
                      ...prev,
                      contentType: type,
                      contentSubcategory: subcategory
                    }))
                  }
                />
              );

            case 2:
              // Step 2: Feedback Goals (NEW)
              return (
                <FeedbackGoalsStep
                  selectedGoals={formState.feedbackGoals}
                  onGoalsChange={(goals) =>
                    setFormState((prev) => ({ ...prev, feedbackGoals: goals }))
                  }
                />
              );

            case 3:
              // Step 3: File Upload
              return (
                <FileUploadStep
                  contentType={formState.contentType!}
                  reviewId={formState.reviewId}
                  uploadedFiles={formState.uploadedFiles}
                  onFilesChange={(files) =>
                    setFormState((prev) => ({ ...prev, uploadedFiles: files }))
                  }
                  externalLinks={formState.externalLinks}
                  onLinksChange={(links) =>
                    setFormState((prev) => ({ ...prev, externalLinks: links }))
                  }
                />
              );

            case 4:
              // Step 4: Basic Info - "Help the Reviewer Help You"
              return (
                <BasicInfoStep
                  title={formState.title}
                  description={formState.description}
                  onTitleChange={(value) =>
                    setFormState((prev) => ({ ...prev, title: value }))
                  }
                  onDescriptionChange={(value) =>
                    setFormState((prev) => ({ ...prev, description: value }))
                  }
                  errors={errors}
                />
              );

            case 5:
              // Step 5: Review Type/Format Selection
              return (
                <ReviewTypeStep
                  selectedType={formState.reviewType}
                  budget={formState.budget}
                  tier={formState.tier}
                  feedbackPriority={formState.feedback_priority}
                  specificQuestions={formState.specific_questions}
                  context={formState.context}
                  onSelect={(type) =>
                    setFormState((prev) => ({ ...prev, reviewType: type }))
                  }
                  onBudgetChange={(budget) =>
                    setFormState((prev) => ({ ...prev, budget }))
                  }
                  onTierChange={(tier) =>
                    setFormState((prev) => ({ ...prev, tier }))
                  }
                  onFeedbackPriorityChange={(priority) =>
                    setFormState((prev) => ({ ...prev, feedback_priority: priority }))
                  }
                  onSpecificQuestionsChange={(questions) =>
                    setFormState((prev) => ({ ...prev, specific_questions: questions }))
                  }
                  onContextChange={(context) =>
                    setFormState((prev) => ({ ...prev, context }))
                  }
                />
              );

            case 6:
              // Step 6: Number of Reviews
              return (
                <NumberOfReviewsStep
                  numberOfReviews={formState.numberOfReviews}
                  pricePerReview={formState.budget}
                  onNumberChange={(num) =>
                    setFormState((prev) => ({ ...prev, numberOfReviews: num }))
                  }
                  isPaidReview={formState.reviewType === "expert"}
                  reviewType={formState.reviewType || "free"}
                />
              );

            case 7:
              // Step 7: Preview & Confirm
              return (
                <ReviewSubmitStep
                  contentType={formState.contentType!}
                  title={formState.title}
                  description={formState.description}
                  reviewType={formState.reviewType!}
                  feedbackAreas={formState.feedbackGoals} // Use feedback goals
                  customFeedbackArea={formState.customFeedbackArea}
                  budget={formState.reviewType === "expert" ? formState.budget : undefined}
                />
              );

            default:
              return null;
          }
        })()}
      </div>
    );
  };

  // Check if current step can proceed - Updated for 7-step flow
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        // Step 1: Content type must be selected
        return formState.contentType !== null;
      case 2:
        // Step 2: At least one feedback goal must be selected
        return formState.feedbackGoals.length > 0;
      case 3:
        // Step 3: At least one file or link must be uploaded
        return formState.uploadedFiles.length > 0 || formState.externalLinks.length > 0;
      case 4:
        // Step 4: Title and description must be valid
        return formState.title.trim().length >= 3 && formState.description.trim().length >= 10;
      case 5:
        // Step 5: Review type must be selected
        return formState.reviewType !== null;
      case 6:
        // Step 6: Number of reviews must be valid
        const maxReviews = formState.reviewType === "expert" ? 10 : 3;
        return formState.numberOfReviews >= 1 && formState.numberOfReviews <= maxReviews;
      case 7:
        // Step 7: Preview & confirm - all validation done
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Loading state while checking quota */}
        {isCheckingQuota && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 className="size-8 animate-spin text-accent-blue mx-auto" />
              <p className="text-sm text-muted-foreground">Checking your review limits...</p>
            </div>
          </div>
        )}

        {/* Quota exceeded screen */}
        {!isCheckingQuota && quotaExceeded && (
          <div className="max-w-2xl mx-auto space-y-6 py-12">
            {/* Warning Icon */}
            <div className="mx-auto size-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <svg
                className="size-8 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Message */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                You've reached your monthly limit
              </h2>
              <p className="text-muted-foreground">
                You've used {subscriptionStatus?.monthly_reviews_used} of {subscriptionStatus?.monthly_reviews_limit} free community reviews this month.
              </p>
            </div>

            {/* Upgrade CTA */}
            <div className="bg-gradient-to-br from-accent-blue/5 to-accent-peach/5 rounded-2xl border border-border p-6 space-y-4">
              <h3 className="font-semibold text-foreground">Upgrade to Pro for unlimited reviews</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="size-5 text-accent-blue flex-shrink-0 mt-0.5" />
                  <span>Unlimited community reviews every month</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-5 text-accent-blue flex-shrink-0 mt-0.5" />
                  <span>15% discount on expert reviews</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-5 text-accent-blue flex-shrink-0 mt-0.5" />
                  <span>Priority queue placement</span>
                </li>
              </ul>
              <Button
                size="lg"
                className="w-full"
                onClick={() => router.push("/pricing")}
              >
                Upgrade to Pro
              </Button>
            </div>

            {/* Alternative options */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Your free reviews reset on {subscriptionStatus?.reviews_reset_at ? new Date(subscriptionStatus.reviews_reset_at).toLocaleDateString() : "the 1st of next month"}
              </p>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}

        {/* Normal form content */}
        {!isCheckingQuota && !quotaExceeded && (
          <>
            {/* Enhanced Progress Indicator */}
            {!submitSuccess && (
          <div className="mb-8">
            <ProgressIndicator
              currentStep={currentStep}
              totalSteps={7}
              onStepClick={(step) => {
                // Only allow going back to completed steps
                if (step < currentStep) {
                  setCurrentStep(step);
                }
              }}
              contentType={formState.contentType}
            />
          </div>
        )}

        {/* Encouraging Message Toast */}
        {showEncouragement && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="max-w-2xl mx-auto">
              <div className="rounded-xl bg-gradient-to-r from-accent-blue/10 to-accent-peach/10 border border-accent-blue/20 p-4 flex items-center gap-3">
                <Sparkles className="size-5 text-accent-blue flex-shrink-0" />
                <p className="text-sm font-medium text-foreground">
                  {encouragingMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="mb-8">{renderStepContent()}</div>

        {/* Navigation Buttons - Enhanced for mobile touch */}
        {!submitSuccess && (
          <div className="fixed bottom-0 left-0 right-0 lg:relative bg-background border-t border-border lg:border-0 p-4 lg:p-0 shadow-[0_-4px_8px_rgba(0,0,0,0.04)] lg:shadow-none z-50">
            <div className="max-w-2xl mx-auto flex items-center gap-3">
              {/* Back Button - Enhanced touch target */}
              <Button
                variant="outline"
                size="lg"
                onClick={handleBack}
                className="flex-shrink-0 group min-h-[48px] px-5 touch-manipulation active:scale-95"
                aria-label={currentStep === 1 ? "Cancel and return to dashboard" : "Go back to previous step"}
              >
                <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">{currentStep === 1 ? "Cancel" : "Back"}</span>
              </Button>

              {/* Next/Submit Button - Enhanced touch target */}
              <Button
                size="lg"
                onClick={currentStep === 7 ? handleSubmit : handleNext}
                disabled={!canProceed() || isSubmitting}
                className="flex-1 bg-accent-blue hover:bg-accent-blue/90 text-white group relative overflow-hidden min-h-[48px] touch-manipulation active:scale-[0.98]"
                aria-label={currentStep === 7 ? "Request feedback" : "Continue to next step"}
              >
                {/* Button shimmer effect on hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                {isSubmitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    <span>
                      {currentStep === 2
                        ? "Creating..."
                        : currentStep === 4
                        ? "Updating..."
                        : "Submitting..."}
                    </span>
                  </>
                ) : currentStep === 7 ? (
                  <>
                    <span>Request Feedback</span>
                    <Check className="size-5" />
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
