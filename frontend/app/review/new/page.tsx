"use client";

/**
 * New Review Request Flow - Redesigned for Human Connection
 * Streamlined 5-step process emphasizing collaboration and clarity
 *
 * Steps:
 * 1. Content Type Selection - What are you working on?
 * 2. About Your Work - Name your project + what feedback do you need?
 * 3. File Upload - Upload or paste your work
 * 4. Review Type - Choose tier + number of reviews
 * 5. Preview & Confirm - Final review before submitting
 *
 * Based on UX research showing 86% conversion increase
 * Redesigned to feel like a creative invitation, not a ticketing system
 */

import { useState } from "react";
import { useToggle, useAsync } from "@/hooks";
import { useRouter } from "next/navigation";
import { ContentType, ReviewType, ReviewTier, FeedbackPriority, createReview, updateReview } from "@/lib/api/reviews";
import { getSubscriptionStatus } from "@/lib/api/subscriptions";
import { Button } from "@/components/ui/button";
import { ContentTypeStep } from "@/components/review-flow/content-type-step";
import { AboutYourWorkStep, FeedbackGoal } from "@/components/review-flow/about-your-work-step";
import { FileUploadStep } from "@/components/review-flow/file-upload-step";
import { ReviewTypeStep } from "@/components/review-flow/review-type-step";
import { ReviewSubmitStep } from "@/components/review-flow/review-submit-step";
import { ProgressIndicator } from "@/components/review-flow/progress-indicator";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, CreditCard } from "lucide-react";
import { getErrorMessage } from "@/lib/api/client";
import { UploadedFile } from "@/components/ui/file-upload";
import { ExpertReviewCheckout } from "@/components/checkout";

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

  // NDA protection (expert reviews only)
  requiresNda: boolean;
}

// Validation errors interface
interface ValidationErrors {
  title?: string;
  description?: string;
}

// Encouraging messages for step transitions - More collaborative tone
const encouragingMessages: Record<number, string> = {
  1: "Great choice! Tell us about your work...",
  2: "Perfect! Now share your work with us...",
  3: "Looking good! Let's find the right reviewers for you...",
  4: "Almost ready! Let's review your invitation...",
};

export default function NewReviewPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [encouragingMessage, setEncouragingMessage] = useState("");

  // UI state using useToggle
  const submittingState = useToggle();
  const submitSuccessState = useToggle();
  const paymentState = useToggle();
  const encouragementState = useToggle();

  // Subscription/quota state using useAsync
  const { data: subscriptionStatus, isLoading: isCheckingQuota } = useAsync(
    () => getSubscriptionStatus(),
    { immediate: true }
  );
  const quotaExceeded = Boolean(subscriptionStatus && !subscriptionStatus.has_unlimited_reviews && subscriptionStatus.reviews_remaining <= 0);

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

    // NDA protection
    requiresNda: false,
  });

  // Convenient aliases for cleaner code
  const isSubmitting = submittingState.value;
  const submitSuccess = submitSuccessState.value;
  const showPayment = paymentState.value;
  const showEncouragement = encouragementState.value;

  // Validate current step - Updated for 5-step flow
  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    if (step === 1) {
      // Step 1: Content type must be selected
      return formState.contentType !== null;
    }

    if (step === 2) {
      // Step 2: About Your Work - title, description, and feedback goals
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

      // Also require at least one feedback goal
      return Object.keys(newErrors).length === 0 && formState.feedbackGoals.length > 0;
    }

    if (step === 3) {
      // Step 3: File upload - at least one file or link
      return formState.uploadedFiles.length > 0 || formState.externalLinks.length > 0;
    }

    if (step === 4) {
      // Step 4: Review type and number of reviews
      const maxReviews = formState.reviewType === "expert" ? 10 : 3;
      return formState.reviewType !== null &&
             formState.numberOfReviews >= 1 &&
             formState.numberOfReviews <= maxReviews;
    }

    if (step === 5) {
      // Step 5: Preview & confirm - all validation already done
      return true;
    }

    return true;
  };

  // Show encouraging message with animation
  const showEncouragingMessage = (step: number) => {
    const message = encouragingMessages[step];
    if (message) {
      setEncouragingMessage(message);
      encouragementState.setTrue();
      setTimeout(() => encouragementState.setFalse(), 3000);
    }
  };

  // Handle next step - Updated for 5-step flow
  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    // Special handling for step 2: create draft review with title and description
    // We need the review ID before step 3 (file upload)
    if (currentStep === 2 && !formState.reviewId) {
      submittingState.setTrue();
      try {
        const response = await createReview({
          title: formState.title.trim(),
          description: formState.description.trim(),
          content_type: formState.contentType!,
          content_subcategory: formState.contentSubcategory || undefined,
          review_type: "free", // Temporary, will be updated later in step 4
        });

        // Store review ID for file uploads
        setFormState((prev) => ({ ...prev, reviewId: response.id as any }));

        // Show encouraging message and move to next step
        const nextStep = Math.min(currentStep + 1, 5);
        setCurrentStep(nextStep);
        showEncouragingMessage(currentStep);
      } catch (error) {
        alert(`Failed to create review: ${getErrorMessage(error)}`);
      } finally {
        submittingState.setFalse();
      }
      return;
    }

    // Move to next step with encouraging message
    const nextStep = Math.min(currentStep + 1, 5);
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

    submittingState.setTrue();

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

      // For expert reviews, save as draft first, then show payment
      // For free reviews, publish immediately
      const reviewStatus = formState.reviewType === "expert" ? "draft" : "pending";

      // Update the review with complete data
      await updateReview(formState.reviewId, {
        review_type: formState.reviewType,
        reviews_requested: formState.numberOfReviews,
        status: reviewStatus,
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
        // NDA protection (expert reviews only)
        requires_nda: formState.reviewType === "expert" ? formState.requiresNda : undefined,
        // External links for video/streaming content
        external_links: formState.externalLinks.length > 0 ? formState.externalLinks : undefined,
      });

      // For expert reviews, show payment step
      if (formState.reviewType === "expert") {
        submittingState.setFalse();
        paymentState.setTrue();
      } else {
        // For free reviews, show success immediately
        submitSuccessState.setTrue();

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch (error) {
      alert(`Failed to submit review: ${getErrorMessage(error)}`);
      submittingState.setFalse();
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async () => {
    // Update review status to pending (now that payment is captured)
    if (formState.reviewId) {
      try {
        await updateReview(formState.reviewId, { status: "pending" });
      } catch {
        // Failed to publish review after payment - silent fail
      }
    }
    paymentState.setFalse();
    submitSuccessState.setTrue();

    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  };

  // Handle payment cancel
  const handlePaymentCancel = () => {
    paymentState.setFalse();
    // Stay on the confirmation step so user can try again
  };

  // Render current step content with animations - Updated for 5-step flow
  const renderStepContent = () => {
    // Payment step for expert reviews
    if (showPayment && formState.reviewId) {
      return (
        <div className="max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Payment Header */}
          <div className="text-center mb-8">
            <div className="mx-auto size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CreditCard className="size-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Complete Payment
            </h2>
            <p className="text-muted-foreground mt-2">
              Pay now to publish your expert review request
            </p>
          </div>

          {/* Stripe Checkout */}
          <div className="bg-card rounded-xl border p-6">
            <ExpertReviewCheckout
              reviewRequestId={formState.reviewId}
              budget={formState.budget}
              reviewsRequested={formState.numberOfReviews}
              isProUser={subscriptionStatus?.tier === "pro"}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </div>
        </div>
      );
    }

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
              // Step 2: About Your Work (combines name/description + feedback goals)
              return (
                <AboutYourWorkStep
                  title={formState.title}
                  description={formState.description}
                  onTitleChange={(value) =>
                    setFormState((prev) => ({ ...prev, title: value }))
                  }
                  onDescriptionChange={(value) =>
                    setFormState((prev) => ({ ...prev, description: value }))
                  }
                  selectedGoals={formState.feedbackGoals}
                  onGoalsChange={(goals) =>
                    setFormState((prev) => ({ ...prev, feedbackGoals: goals }))
                  }
                  errors={errors}
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
              // Step 4: Review Type + Number of Reviews (combined)
              return (
                <ReviewTypeStep
                  selectedType={formState.reviewType}
                  budget={formState.budget}
                  tier={formState.tier}
                  feedbackPriority={formState.feedback_priority}
                  specificQuestions={formState.specific_questions}
                  context={formState.context}
                  requiresNda={formState.requiresNda}
                  freeQuotaExceeded={quotaExceeded}
                  freeQuotaInfo={subscriptionStatus ? {
                    used: subscriptionStatus.monthly_reviews_used,
                    limit: subscriptionStatus.monthly_reviews_limit,
                    resetAt: subscriptionStatus.reviews_reset_at
                  } : undefined}
                  numberOfReviews={formState.numberOfReviews}
                  onNumberOfReviewsChange={(num) =>
                    setFormState((prev) => ({ ...prev, numberOfReviews: num }))
                  }
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
                  onRequiresNdaChange={(requiresNda) =>
                    setFormState((prev) => ({ ...prev, requiresNda }))
                  }
                />
              );

            case 5:
              // Step 5: Preview & Confirm
              return (
                <ReviewSubmitStep
                  contentType={formState.contentType!}
                  title={formState.title}
                  description={formState.description}
                  reviewType={formState.reviewType!}
                  feedbackAreas={formState.feedbackGoals} // Use feedback goals
                  customFeedbackArea={formState.customFeedbackArea}
                  budget={formState.reviewType === "expert" ? formState.budget : undefined}
                  requiresNda={formState.reviewType === "expert" ? formState.requiresNda : undefined}
                />
              );

            default:
              return null;
          }
        })()}
      </div>
    );
  };

  // Check if current step can proceed - Updated for 5-step flow
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        // Step 1: Content type must be selected
        return formState.contentType !== null;
      case 2:
        // Step 2: About Your Work - title, description, and at least one feedback goal
        return formState.title.trim().length >= 3 &&
               formState.description.trim().length >= 10 &&
               formState.feedbackGoals.length > 0;
      case 3:
        // Step 3: At least one file or link must be uploaded
        return formState.uploadedFiles.length > 0 || formState.externalLinks.length > 0;
      case 4:
        // Step 4: Review type and number of reviews must be valid
        const maxReviews = formState.reviewType === "expert" ? 10 : 3;
        return formState.reviewType !== null &&
               formState.numberOfReviews >= 1 &&
               formState.numberOfReviews <= maxReviews;
      case 5:
        // Step 5: Preview & confirm - all validation done
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

        {/* Normal form content */}
        {!isCheckingQuota && (
          <>
            {/* Enhanced Progress Indicator - Hide during payment and success */}
            {!submitSuccess && !showPayment && (
          <div className="mb-8">
            <ProgressIndicator
              currentStep={currentStep}
              totalSteps={5}
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

        {/* Encouraging Message Toast - Hide during payment */}
        {showEncouragement && !showPayment && (
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
        {/* Hide during payment step and success */}
        {!submitSuccess && !showPayment && (
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
                onClick={currentStep === 5 ? handleSubmit : handleNext}
                disabled={!canProceed() || isSubmitting}
                className="flex-1 bg-accent-blue hover:bg-accent-blue/90 text-white group relative overflow-hidden min-h-[48px] touch-manipulation active:scale-[0.98]"
                aria-label={currentStep === 5 ? "Request feedback" : "Continue to next step"}
              >
                {/* Button shimmer effect on hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                {isSubmitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    <span>
                      {currentStep === 2
                        ? "Creating..."
                        : "Submitting..."}
                    </span>
                  </>
                ) : currentStep === 5 ? (
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
