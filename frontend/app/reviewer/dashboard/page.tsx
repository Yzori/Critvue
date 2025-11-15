/**
 * Reviewer Dashboard Page
 *
 * Comprehensive dashboard for reviewers showing:
 * - Key statistics (active, completed, earnings, rating)
 * - Active claimed reviews with deadlines
 * - Submitted reviews awaiting acceptance
 * - Recent completed reviews
 *
 * Brand Compliance:
 * - Critvue purple/blue gradients throughout
 * - Glassmorphism effects on cards
 * - Smooth animations with reduced motion support
 * - Mobile-first responsive bento grid layout
 * - Consistent with existing dashboard design patterns
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardStats } from "@/components/reviewer/dashboard-stats";
import { ActiveReviewsList } from "@/components/reviewer/active-reviews-list";
import {
  Search,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronRight,
  Palette,
  Code,
  Video,
  Mic,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getReviewerDashboard,
  getMyReviews,
  abandonReviewSlot,
  calculateDaysRemaining,
  formatPayment,
  type ReviewSlot,
} from "@/lib/api/reviewer";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export default function ReviewerDashboardPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  // State
  const [dashboard, setDashboard] = React.useState<Awaited<ReturnType<typeof getReviewerDashboard>> | null>(null);
  const [activeReviews, setActiveReviews] = React.useState<ReviewSlot[]>([]);
  const [submittedReviews, setSubmittedReviews] = React.useState<ReviewSlot[]>([]);
  const [completedReviews, setCompletedReviews] = React.useState<ReviewSlot[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch dashboard data
  const fetchDashboard = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [dashboardData, claimed, submitted, accepted] = await Promise.all([
        getReviewerDashboard(),
        getMyReviews("claimed"),
        getMyReviews("submitted"),
        getMyReviews("accepted"),
      ]);

      setDashboard(dashboardData);
      setActiveReviews(claimed);
      setSubmittedReviews(submitted);
      setCompletedReviews(accepted.slice(0, 5)); // Show last 5
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      setError("Failed to load dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Handle abandon review
  const handleAbandonReview = async (slotId: number) => {
    await abandonReviewSlot(slotId);
    // Refresh dashboard
    await fetchDashboard();
  };

  const contentTypeConfig = {
    design: {
      icon: <Palette className="size-4" />,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
    },
    code: {
      icon: <Code className="size-4" />,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
    },
    video: {
      icon: <Video className="size-4" />,
      color: "text-purple-600",
      bg: "bg-purple-500/10",
    },
    audio: {
      icon: <Mic className="size-4" />,
      color: "text-pink-600",
      bg: "bg-pink-500/10",
    },
    writing: {
      icon: <FileText className="size-4" />,
      color: "text-green-600",
      bg: "bg-green-500/10",
    },
    art: {
      icon: <ImageIcon className="size-4" />,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
    },
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-24 lg:pb-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
            Reviewer Dashboard
          </h1>
          <Badge variant="primary" showDot pulse size="sm" className="sm:text-sm">
            Reviewer
          </Badge>
        </div>
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl">
          Manage your review claims, track earnings, and view your performance.
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboard}
            className="mt-3"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Stats Section */}
      <DashboardStats
        stats={
          dashboard?.stats || {
            total_reviews: 0,
            acceptance_rate: 0,
            average_rating: 0,
            total_earned: 0,
            pending_payment: 0,
          }
        }
        activeClaimsCount={activeReviews.length}
        isLoading={loading}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Reviews - Takes 2 columns on desktop */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] transition-all duration-200">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                Active Reviews
              </h2>
              <p className="text-sm text-muted-foreground">
                {activeReviews.length > 0
                  ? `${activeReviews.length} review${activeReviews.length !== 1 ? "s" : ""} in progress`
                  : "No active claims"}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
              <Clock className="size-5 text-accent-blue" />
            </div>
          </div>

          <ActiveReviewsList
            reviews={activeReviews}
            onAbandon={handleAbandonReview}
            isLoading={loading}
          />

          {!loading && activeReviews.length === 0 && (
            <Button
              onClick={() => router.push("/browse")}
              className="w-full mt-4 bg-accent-blue hover:bg-accent-blue/90 min-h-[44px]"
            >
              <Search className="size-4" />
              Browse Available Reviews
            </Button>
          )}
        </div>

        {/* Submitted Reviews - Sidebar */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] transition-all duration-200">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                Submitted
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Awaiting acceptance
              </p>
            </div>
            <div className="size-10 rounded-xl bg-accent-peach/10 flex items-center justify-center">
              <TrendingUp className="size-5 text-accent-peach" />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : submittedReviews.length > 0 ? (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {submittedReviews.map((review, index) => {
                  if (!review.review_request) return null;

                  const daysRemaining = review.auto_accept_at
                    ? calculateDaysRemaining(review.auto_accept_at)
                    : 0;
                  const config =
                    contentTypeConfig[
                      review.review_request.content_type as keyof typeof contentTypeConfig
                    ] || contentTypeConfig.design;

                  return (
                    <motion.div
                      key={review.id}
                      initial={
                        prefersReducedMotion
                          ? undefined
                          : { opacity: 0, x: 20 }
                      }
                      animate={{ opacity: 1, x: 0 }}
                      exit={
                        prefersReducedMotion
                          ? undefined
                          : { opacity: 0, x: -20 }
                      }
                      transition={{
                        duration: prefersReducedMotion ? 0 : 0.3,
                        delay: prefersReducedMotion ? 0 : index * 0.05,
                      }}
                      className="group p-4 rounded-xl border border-border hover:bg-accent-blue/5 hover:border-accent-blue/20 transition-all cursor-pointer"
                      onClick={() =>
                        router.push(`/review/${review.review_request_id}`)
                      }
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("size-8 rounded-lg flex items-center justify-center", config.bg)}>
                          <div className={config.color}>{config.icon}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-1">
                            {review.review_request.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Auto-accept in {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="size-12 rounded-xl bg-accent-peach/10 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="size-6 text-accent-peach" />
              </div>
              <p className="text-sm text-muted-foreground">
                No submitted reviews
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Completions */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] transition-all duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
              Recent Completions
            </h2>
            <p className="text-sm text-muted-foreground">
              {completedReviews.length > 0
                ? `Last ${completedReviews.length} completed review${completedReviews.length !== 1 ? "s" : ""}`
                : "No completed reviews yet"}
            </p>
          </div>
          <div className="size-10 rounded-xl bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="size-5 text-green-600" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : completedReviews.length > 0 ? (
          <div className="space-y-2">
            {completedReviews.map((review, index) => {
              if (!review.review_request) return null;

              const config =
                contentTypeConfig[
                  review.review_request.content_type as keyof typeof contentTypeConfig
                ] || contentTypeConfig.design;

              return (
                <motion.div
                  key={review.id}
                  initial={
                    prefersReducedMotion ? undefined : { opacity: 0, y: 10 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.3,
                    delay: prefersReducedMotion ? 0 : index * 0.05,
                  }}
                  className="group flex items-center gap-4 p-4 rounded-xl hover:bg-green-50/50 hover:border-green-200/50 border border-transparent transition-all cursor-pointer"
                  onClick={() =>
                    router.push(`/review/${review.review_request_id}`)
                  }
                >
                  <div className={cn("size-10 rounded-lg flex items-center justify-center", config.bg)}>
                    <div className={config.color}>{config.icon}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1">
                      {review.review_request.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Completed{" "}
                      {review.reviewed_at
                        ? new Date(review.reviewed_at).toLocaleDateString()
                        : "recently"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="success" size="sm">
                      {formatPayment(review.payment_amount)}
                    </Badge>
                    {review.requester_helpful_rating && (
                      <div className="flex items-center gap-1 text-amber-500">
                        <span className="text-sm font-medium">
                          {review.requester_helpful_rating}/5
                        </span>
                      </div>
                    )}
                    <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="size-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="size-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No completed reviews yet
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Complete your first review to start building your reviewer profile.
            </p>
            <Button
              onClick={() => router.push("/browse")}
              className="bg-accent-blue hover:bg-accent-blue/90"
            >
              <Search className="size-4" />
              Find Reviews to Claim
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
