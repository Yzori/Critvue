/**
 * Review & Submit Step
 * Final confirmation screen showing comprehensive summary before submission
 * Includes feedback areas and budget information
 */

import { ContentType, ReviewType } from "@/lib/api/reviews";
import { Palette, Code, Video, Mic, FileText, Image, Sparkles, Award, CheckCircle, DollarSign, MessageSquare, Shield } from "lucide-react";

interface ReviewSubmitStepProps {
  contentType: ContentType;
  title: string;
  description: string;
  reviewType: ReviewType;
  feedbackAreas: string[];
  customFeedbackArea?: string;
  budget?: number;
  requiresNda?: boolean;
}

// Helper to get content type display info
function getContentTypeInfo(type: ContentType) {
  const types = {
    design: {
      icon: <Palette className="size-5" />,
      label: "Design",
      color: "text-accent-blue",
      bgColor: "bg-accent-blue/10",
    },
    code: {
      icon: <Code className="size-5" />,
      label: "Code",
      color: "text-accent-peach",
      bgColor: "bg-accent-peach/10",
    },
    video: {
      icon: <Video className="size-5" />,
      label: "Video",
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
    },
    audio: {
      icon: <Mic className="size-5" />,
      label: "Audio",
      color: "text-pink-600",
      bgColor: "bg-pink-500/10",
    },
    writing: {
      icon: <FileText className="size-5" />,
      label: "Writing",
      color: "text-green-600",
      bgColor: "bg-green-500/10",
    },
    art: {
      icon: <Image className="size-5" />,
      label: "Art",
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
    },
  };
  return types[type];
}

// Helper to get review type display info
function getReviewTypeInfo(type: ReviewType) {
  const types = {
    free: {
      icon: <Sparkles className="size-5" />,
      label: "Quick Feedback",
      price: "Free",
      color: "text-accent-blue",
    },
    expert: {
      icon: <Award className="size-5" />,
      label: "Expert Review",
      price: "$29",
      color: "text-accent-peach",
    },
  };
  return types[type];
}

// Helper to format feedback area labels
function formatFeedbackAreaLabel(areaId: string): string {
  return areaId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function ReviewSubmitStep({
  contentType,
  title,
  description,
  reviewType,
  feedbackAreas,
  customFeedbackArea,
  budget,
  requiresNda,
}: ReviewSubmitStepProps) {
  const contentInfo = getContentTypeInfo(contentType);
  const reviewInfo = getReviewTypeInfo(reviewType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto size-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <CheckCircle className="size-8 text-green-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          Review your request
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Make sure everything looks good before submitting
        </p>
      </div>

      {/* Summary Card */}
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Content Type & Review Type Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Content Type Card */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <p className="text-xs text-muted-foreground font-medium mb-3">
              Content Type
            </p>
            <div className="flex items-center gap-3">
              <div className={`size-10 rounded-lg ${contentInfo.bgColor} flex items-center justify-center`}>
                <div className={contentInfo.color}>{contentInfo.icon}</div>
              </div>
              <span className="font-semibold text-foreground">
                {contentInfo.label}
              </span>
            </div>
          </div>

          {/* Review Type Card */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <p className="text-xs text-muted-foreground font-medium mb-3">
              Review Type
            </p>
            <div className="flex items-center gap-3">
              <div className={reviewInfo.color}>{reviewInfo.icon}</div>
              <div>
                <p className="font-semibold text-foreground">
                  {reviewInfo.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  {reviewType === "expert" && budget ? `$${budget}` : reviewInfo.price}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Project Details Card */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
          {/* Title */}
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2">
              Project Title
            </p>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground">
              {title}
            </h3>
          </div>

          {/* Divider */}
          <div className="border-t border-border-light" />

          {/* Description */}
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2">
              Description
            </p>
            <p className="text-sm sm:text-base text-foreground whitespace-pre-wrap">
              {description}
            </p>
          </div>
        </div>

        {/* Feedback Areas Card */}
        {feedbackAreas.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="size-5 text-accent-blue" />
              <p className="text-xs text-muted-foreground font-medium">
                Feedback Areas ({feedbackAreas.length} selected)
              </p>
            </div>

            {/* Feedback Areas Grid */}
            <div className="flex flex-wrap gap-2">
              {feedbackAreas.map((area) => (
                <span
                  key={area}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue/10 text-accent-blue text-sm font-medium"
                >
                  <CheckCircle className="size-3.5" />
                  {formatFeedbackAreaLabel(area)}
                </span>
              ))}
              {customFeedbackArea && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-peach/10 text-accent-peach text-sm font-medium">
                  <CheckCircle className="size-3.5" />
                  {customFeedbackArea}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Budget Summary for Expert Reviews */}
        {reviewType === "expert" && budget && (
          <div className="rounded-2xl border border-accent-peach/20 bg-gradient-to-br from-accent-peach/5 to-orange-500/5 p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-xl bg-gradient-to-br from-accent-peach to-orange-600 flex items-center justify-center">
                  <DollarSign className="size-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    Expert Review Budget
                  </p>
                  <p className="text-2xl font-bold text-accent-peach">
                    ${budget}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Expert Level
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {budget < 50 ? "Junior" : budget < 100 ? "Mid-Level" : "Senior"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* NDA Protection Indicator */}
        {requiresNda && (
          <div className="rounded-2xl border border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Shield className="size-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-purple-900 dark:text-purple-100">
                  NDA Protection Enabled
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Reviewers must sign a Non-Disclosure Agreement before viewing your work
                </p>
              </div>
            </div>
          </div>
        )}

        {/* What Happens Next */}
        <div className="rounded-xl bg-accent-blue/5 border border-accent-blue/20 p-4 sm:p-6">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            What happens next?
          </h4>
          <div className="space-y-3">
            {reviewType === "free" ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-accent-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-accent-blue">1</span>
                  </div>
                  <p className="text-sm text-foreground">
                    Your work will be instantly analyzed by our AI
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-accent-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-accent-blue">2</span>
                  </div>
                  <p className="text-sm text-foreground">
                    Your request will be shared with the community
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-accent-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-accent-blue">3</span>
                  </div>
                  <p className="text-sm text-foreground">
                    Receive feedback within 24-48 hours
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-accent-peach/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-accent-peach">1</span>
                  </div>
                  <p className="text-sm text-foreground">
                    We'll match you with a qualified expert in your field
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-accent-peach/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-accent-peach">2</span>
                  </div>
                  <p className="text-sm text-foreground">
                    Your expert will conduct a thorough review
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-accent-peach/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-accent-peach">3</span>
                  </div>
                  <p className="text-sm text-foreground">
                    Receive detailed written and video feedback within 2-6 hours
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="size-6 rounded-full bg-accent-peach/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-accent-peach">4</span>
                  </div>
                  <p className="text-sm text-foreground">
                    Schedule a 1-on-1 follow-up call to discuss the feedback
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Ready to Submit Message */}
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            Ready to get feedback? Click the submit button below to send your request!
          </p>
        </div>
      </div>
    </div>
  );
}
