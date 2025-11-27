"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getReviewDetail, ReviewRequestDetail, ContentType, ReviewType } from "@/lib/api/reviews";
import { ActionBar } from "@/components/review-detail/action-bar";
import { FileGallery } from "@/components/review-detail/file-gallery";
import { SlotsList } from "@/components/review-detail/slots-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  User,
  FileText,
  Target,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";

/**
 * Review Request Detail Page
 *
 * Features:
 * - Complete review request information
 * - Hero section with title, requester, and status
 * - Metadata cards (content type, review type, budget, deadline, slots)
 * - Description and feedback areas
 * - File gallery with preview and download
 * - Review slots list with status tracking
 * - Context-aware action bar
 * - Mobile-responsive glassmorphism design
 * - Loading and error states
 * - WCAG 2.1 Level AA compliant
 * - Breadcrumb navigation
 */

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const reviewId = parseInt(params.id as string, 10);

  const [review, setReview] = React.useState<ReviewRequestDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Get current user from auth context
  const currentUserId = user?.id;
  const isOwner = review?.user_id === currentUserId;

  // Fetch review details
  React.useEffect(() => {
    if (!reviewId || isNaN(reviewId)) {
      setError("Invalid review ID");
      setLoading(false);
      return;
    }

    async function fetchReview() {
      try {
        setLoading(true);
        setError(null);
        const data = await getReviewDetail(reviewId);
        setReview(data);
      } catch (err) {
        console.error("Error fetching review:", err);
        setError(err instanceof Error ? err.message : "Failed to load review request");
      } finally {
        setLoading(false);
      }
    }

    fetchReview();
  }, [reviewId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-12 mx-auto text-accent-blue animate-spin mb-4" />
          <p className="text-sm text-gray-600">Loading review details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !review) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="size-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Review Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "This review request does not exist or has been removed."}</p>
          <Button onClick={() => router.push("/browse")} variant="outline">
            Browse Reviews
          </Button>
        </div>
      </div>
    );
  }

  // Calculate available slots
  const availableSlots = review.slots?.filter((s) => s.status === "available").length || 0;
  const totalSlots = review.reviews_requested || 1;

  // Format deadline
  const formatDeadline = (deadline?: string) => {
    if (!deadline) return null;
    try {
      const date = new Date(deadline);
      const now = new Date();
      const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil < 0) {
        return { text: "Expired", variant: "error" as const, urgent: true };
      } else if (daysUntil === 0) {
        return { text: "Due Today", variant: "error" as const, urgent: true };
      } else if (daysUntil === 1) {
        return { text: "Due Tomorrow", variant: "warning" as const, urgent: true };
      } else if (daysUntil <= 3) {
        return { text: `${daysUntil} days left`, variant: "warning" as const, urgent: true };
      } else if (daysUntil <= 7) {
        return { text: `${daysUntil} days left`, variant: "warning" as const, urgent: false };
      } else {
        return { text: date.toLocaleDateString(), variant: "info" as const, urgent: false };
      }
    } catch {
      return null;
    }
  };

  const deadlineInfo = formatDeadline(review.deadline);

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "draft":
        return "neutral";
      case "pending":
        return "info";
      case "in_review":
        return "warning";
      case "completed":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "neutral";
    }
  };

  // Format content type label
  const formatContentType = (type: ContentType) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Format review type label
  const formatReviewType = (type: ReviewType) => {
    return type === "free" ? "Free Review" : "Expert Review";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Action Bar */}
      <ActionBar review={review} isOwner={isOwner} currentUserId={currentUserId} />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="mb-8">
          <div
            className={cn(
              "rounded-2xl overflow-hidden",
              "bg-white/70 backdrop-blur-md border border-gray-200/50",
              "shadow-xl shadow-gray-200/50",
              "p-6 sm:p-8"
            )}
          >
            {/* Status Badge */}
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <Badge variant={getStatusVariant(review.status)} size="lg" showDot pulse>
                {review.status.toUpperCase()}
              </Badge>
              {deadlineInfo && (
                <Badge
                  variant={deadlineInfo.variant}
                  size="md"
                  icon={<Clock className="size-4" />}
                  pulse={deadlineInfo.urgent}
                >
                  {deadlineInfo.text}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {review.title}
            </h1>

            {/* Requester Info */}
            <div className="flex items-center gap-3 text-gray-600">
              <User className="size-5" />
              <span className="text-sm font-medium">
                Posted by {review.requester_username || "Anonymous"}
              </span>
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </section>

        {/* Metadata Grid */}
        <section className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Content Type */}
            <div
              className={cn(
                "rounded-xl p-4",
                "bg-white/60 backdrop-blur-sm border border-gray-200/50",
                "hover:border-accent-blue/30 hover:shadow-md",
                "transition-all duration-300"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <FileText className="size-5 text-accent-blue" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Content Type
                </span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {formatContentType(review.content_type)}
              </p>
            </div>

            {/* Review Type */}
            <div
              className={cn(
                "rounded-xl p-4",
                "bg-white/60 backdrop-blur-sm border border-gray-200/50",
                "hover:border-accent-peach/30 hover:shadow-md",
                "transition-all duration-300"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <Target className="size-5 text-accent-peach" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Review Type
                </span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {formatReviewType(review.review_type)}
              </p>
            </div>

            {/* Budget (if expert review) */}
            {review.review_type === "expert" && review.budget && (
              <div
                className={cn(
                  "rounded-xl p-4",
                  "bg-gradient-to-br from-green-50/80 to-emerald-50/80",
                  "backdrop-blur-sm border border-green-200/50",
                  "hover:border-green-300/50 hover:shadow-md",
                  "transition-all duration-300"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="size-5 text-green-600" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Budget
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  ${review.budget}
                </p>
              </div>
            )}

            {/* Slots Available */}
            <div
              className={cn(
                "rounded-xl p-4",
                "bg-white/60 backdrop-blur-sm border border-gray-200/50",
                "hover:border-accent-sage/30 hover:shadow-md",
                "transition-all duration-300"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <User className="size-5 text-accent-sage" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Slots Available
                </span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {availableSlots} / {totalSlots}
              </p>
            </div>
          </div>
        </section>

        {/* Description Section */}
        <section className="mb-8">
          <div
            className={cn(
              "rounded-2xl overflow-hidden",
              "bg-white/60 backdrop-blur-sm border border-gray-200/50",
              "shadow-lg shadow-gray-200/30"
            )}
          >
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="size-5 text-accent-blue" />
                Description
              </h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {review.description}
                </p>
              </div>

              {/* Feedback Areas */}
              {review.feedback_areas && (
                <div className="mt-6 pt-6 border-t border-gray-200/50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="size-5 text-accent-peach" />
                    Feedback Areas
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {review.feedback_areas}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Files Section */}
        {review.files && review.files.length > 0 && (
          <section className="mb-8">
            <div
              className={cn(
                "rounded-2xl overflow-hidden",
                "bg-white/60 backdrop-blur-sm border border-gray-200/50",
                "shadow-lg shadow-gray-200/30"
              )}
            >
              <div className="p-6 sm:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FileText className="size-5 text-accent-blue" />
                  Files ({review.files.length})
                </h2>
                <FileGallery files={review.files} />
              </div>
            </div>
          </section>
        )}

        {/* Review Slots Section */}
        <section className="mb-8">
          <div
            className={cn(
              "rounded-2xl overflow-hidden",
              "bg-white/60 backdrop-blur-sm border border-gray-200/50",
              "shadow-lg shadow-gray-200/30"
            )}
          >
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <User className="size-5 text-accent-sage" />
                Review Slots ({review.slots?.length || 0})
              </h2>
              <SlotsList slots={review.slots || []} isOwner={isOwner} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
