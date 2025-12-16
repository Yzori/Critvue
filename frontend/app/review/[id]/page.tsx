"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getReviewDetail, ReviewRequestDetail } from "@/lib/api/reviews/requests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApplicationsPanel } from "@/components/reviewer/applications-panel";
import { UserTier } from "@/lib/types/tier";
import { toast } from "sonner";
import {
  DollarSign,
  FileText,
  Target,
  Clock,
  AlertCircle,
  Shield,
  ArrowLeft,
  Share2,
  Flag,
  Edit,
  MessageSquare,
  Calendar,
} from "lucide-react";

import {
  contentTypeIcons,
  getRequiredTierForPrice,
  canTierClaimPrice,
  getFileUrl,
  isImageFile,
  formatDeadline,
  getStatusConfig,
  Lightbox,
  FilesGallery,
  SlotsSection,
  Sidebar,
  MobileBar,
} from "./components";

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const reviewId = parseInt(params.id as string, 10);

  const [review, setReview] = React.useState<ReviewRequestDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  const currentUserId = user?.id;
  const isOwner = review?.user_id === currentUserId;
  const userTier = (user?.user_tier as UserTier) || UserTier.NEWCOMER;

  // Fetch review details
  const fetchReview = React.useCallback(async (showLoading = true) => {
    if (!reviewId || isNaN(reviewId)) {
      setError("Invalid review ID");
      setLoading(false);
      return;
    }

    try {
      if (showLoading) setLoading(true);
      setError(null);
      const data = await getReviewDetail(reviewId);
      setReview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load review request");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [reviewId]);

  React.useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  // Get image files for lightbox navigation
  const imageFiles = React.useMemo(() => {
    return review?.files?.filter(isImageFile) || [];
  }, [review?.files]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent-blue/5 dark:from-[var(--dark-tier-1)] dark:via-[var(--dark-tier-1)] dark:to-[var(--dark-tier-1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-3xl" />
            <div className="flex gap-8">
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
              </div>
              <div className="w-[380px] h-96 bg-gray-200 dark:bg-gray-700 rounded-3xl hidden lg:block" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !review) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30 dark:from-[var(--dark-tier-1)] dark:via-[var(--dark-tier-1)] dark:to-[var(--dark-tier-1)] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="size-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-red-50 dark:from-red-500/20 dark:to-red-500/10 flex items-center justify-center shadow-lg shadow-red-100 dark:shadow-red-900/20">
            <AlertCircle className="size-12 text-red-500 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Review Not Found</h1>
          <p className="text-foreground-muted mb-8">{error || "This review request does not exist or has been removed."}</p>
          <Button
            onClick={() => router.push("/browse")}
            className="bg-accent-blue hover:bg-accent-blue/90 shadow-lg shadow-accent-blue/25 px-8"
            size="lg"
          >
            Browse Reviews
          </Button>
        </div>
      </div>
    );
  }

  // Computed values
  const availableSlots = review.slots?.filter((s) => s.status === "available").length || 0;
  const totalSlots = review.reviews_requested || 1;
  const isPaidReview = review.review_type === "expert" && review.budget && review.budget > 0;
  const reviewPrice = review.budget || 0;
  const heroImage = review.files?.find(isImageFile);
  const deadlineInfo = formatDeadline(review.deadline);
  const statusConfig = getStatusConfig(review.status);

  // Tier restriction check
  const tierRestriction = (() => {
    if (!isPaidReview) return { isLocked: false, requiredTier: null };
    const canClaim = canTierClaimPrice(userTier, reviewPrice);
    if (canClaim) return { isLocked: false, requiredTier: null };
    return { isLocked: true, requiredTier: getRequiredTierForPrice(reviewPrice) };
  })();

  // Can claim slot check
  const canClaimSlot = (() => {
    if (!currentUserId || isOwner) return false;
    if (review.status !== "pending" && review.status !== "in_review") return false;
    if (availableSlots === 0) return false;
    const userSlots = review.slots?.filter((s) => s.reviewer_id === currentUserId) || [];
    return userSlots.length === 0;
  })();

  // Parse feedback areas into tags
  const feedbackTags = review.feedback_areas
    ? review.feedback_areas.split(",").map(tag => tag.trim()).filter(Boolean)
    : [];

  // Handle share
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: review.title, text: review.description, url });
      } catch {
        // Share cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      } catch {
        toast.error("Failed to copy link");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent-blue/5 dark:from-[var(--dark-tier-1)] dark:via-[var(--dark-tier-1)] dark:to-[var(--dark-tier-1)]">
      {/* Lightbox */}
      <Lightbox
        imageFiles={imageFiles}
        lightboxIndex={lightboxIndex}
        setLightboxIndex={setLightboxIndex}
        isOwner={isOwner}
        onShare={handleShare}
      />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {heroImage && (
          <div className="absolute inset-0 z-0">
            <img
              src={getFileUrl(heroImage)}
              alt=""
              className="w-full h-full object-cover scale-110 blur-2xl opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white dark:from-[var(--dark-tier-1)]/80 dark:via-[var(--dark-tier-1)]/60 dark:to-[var(--dark-tier-1)]" />
          </div>
        )}

        {/* Top Navigation */}
        <nav className="relative z-10 sticky top-0 bg-white/70 dark:bg-[var(--dark-tier-2)]/70 backdrop-blur-xl border-b border-white/50 dark:border-white/10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="gap-2 hover:bg-white/50 dark:hover:bg-white/10"
              >
                <ArrowLeft className="size-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>

              <div className="flex items-center gap-2">
                {isOwner && review.status === "draft" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/review/${review.id}/edit`)}
                    className="gap-2 bg-white/50 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20"
                  >
                    <Edit className="size-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={handleShare} className="hover:bg-white/50 dark:hover:bg-white/10">
                  <Share2 className="size-4" />
                </Button>
                {!isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toast.info("Report feature coming soon")}
                    className="text-foreground-muted hover:text-destructive hover:bg-white/50 dark:hover:bg-white/10"
                  >
                    <Flag className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          {/* Status & Type Row */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <Badge
              variant={statusConfig.variant}
              size="lg"
              showDot
              pulse={review.status === "in_review"}
              className="shadow-sm"
            >
              {statusConfig.label}
            </Badge>

            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-sm",
              isPaidReview
                ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
                : "bg-white dark:bg-[var(--dark-tier-2)] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
            )}>
              {isPaidReview ? <DollarSign className="size-4" /> : <MessageSquare className="size-4" />}
              {isPaidReview ? "Expert Review" : "Free Review"}
            </div>

            {review.requires_nda && (
              <Badge
                variant="info"
                size="md"
                icon={<Shield className="size-3.5" />}
                className="bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30 shadow-sm"
              >
                NDA Required
              </Badge>
            )}

            {deadlineInfo && (
              <Badge
                variant={deadlineInfo.variant}
                size="md"
                icon={<Clock className="size-3.5" />}
                pulse={deadlineInfo.urgent}
                className="shadow-sm"
              >
                {deadlineInfo.text}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight tracking-tight">
            {review.title}
          </h1>

          {/* Content Type & Meta */}
          <div className="flex items-center gap-4 text-foreground-muted">
            <div className="flex items-center gap-2">
              {contentTypeIcons[review.content_type] || <FileText className="size-5" />}
              <span className="capitalize font-medium">{review.content_type}</span>
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4" />
              <span>{new Date(review.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column */}
          <div className="flex-1 min-w-0 space-y-6 order-2 lg:order-1">
            {/* Description Card */}
            <section className="rounded-3xl bg-white dark:bg-[var(--dark-tier-2)] border border-gray-100 dark:border-gray-800 p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="size-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
                  <FileText className="size-4 text-accent-blue" />
                </div>
                About This Project
              </h2>
              <p className="text-foreground-muted leading-relaxed whitespace-pre-wrap text-base">
                {review.description}
              </p>

              {feedbackTags.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Target className="size-4 text-accent-blue" />
                    Looking for feedback on
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {feedbackTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-accent-blue/10 to-accent-blue/5 text-accent-blue border border-accent-blue/20 hover:border-accent-blue/40 transition-colors cursor-default"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Files Gallery */}
            <FilesGallery
              files={review.files || []}
              isOwner={isOwner}
              onOpenLightbox={(idx) => setLightboxIndex(idx)}
            />

            {/* Applications Panel */}
            {isOwner && isPaidReview && (
              <div id="applications">
                <ApplicationsPanel
                  reviewRequestId={review.id}
                  availableSlots={availableSlots}
                  onApplicationAccepted={() => fetchReview(false)}
                />
              </div>
            )}

            {/* Slots Section */}
            <SlotsSection
              slots={review.slots || []}
              totalSlots={totalSlots}
              isPaidReview={isPaidReview}
            />
          </div>

          {/* Right Column - Sidebar */}
          <Sidebar
            review={review}
            isPaidReview={isPaidReview}
            availableSlots={availableSlots}
            totalSlots={totalSlots}
            isOwner={isOwner}
            canClaimSlot={canClaimSlot}
            tierRestriction={tierRestriction}
            userTier={userTier}
            deadlineInfo={deadlineInfo}
          />
        </div>
      </main>

      {/* Mobile Bottom Bar */}
      <MobileBar
        review={review}
        isPaidReview={isPaidReview}
        availableSlots={availableSlots}
        isOwner={isOwner}
        canClaimSlot={canClaimSlot}
        tierRestriction={tierRestriction}
        userTier={userTier}
      />
    </div>
  );
}
