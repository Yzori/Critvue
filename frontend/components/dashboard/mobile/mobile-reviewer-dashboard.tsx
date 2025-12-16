"use client";

/**
 * Mobile-First Reviewer Dashboard Component
 *
 * Optimized for mobile devices with:
 * - Swipeable review cards
 * - Pull-to-refresh functionality
 * - Progress tracking
 * - Earnings preview
 * - Touch-optimized interactions
 *
 * Features:
 * - Active Tab: Reviews in progress with progress bars
 * - Submitted Tab: Reviews awaiting acceptance
 * - Completed Tab: Finished reviews with earnings
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SwipeableReviewCard } from "./swipeable-review-card";
import { PullToRefresh } from "./pull-to-refresh";
import {
  getActiveReviews,
  getSubmittedReviews,
  getDashboardStats,
  type ReviewerStats,
} from "@/lib/api/dashboard/mobile";
import {
  Clock,
  CheckCircle2,
  FileText,
  TrendingUp,
  DollarSign,
  Search,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { useAsync } from "@/hooks";

type ReviewerTab = "active" | "submitted" | "completed";

interface MobileReviewerDashboardProps {
  className?: string;
}

export default function MobileReviewerDashboard({ className }: MobileReviewerDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<ReviewerTab>("active");

  // Async state for active reviews
  const {
    data: activeData,
    isLoading: isLoadingActive,
    refetch: fetchActiveReviews,
  } = useAsync(async () => {
    const response = await getActiveReviews(1, 20);
    return response;
  });

  const activeReviews = activeData?.items ?? [];

  // Async state for submitted reviews
  const {
    data: submittedData,
    isLoading: isLoadingSubmitted,
    refetch: fetchSubmittedReviews,
  } = useAsync(async () => {
    const response = await getSubmittedReviews(1, 20);
    return response;
  });

  const submittedReviews = submittedData?.items ?? [];

  // Async state for stats
  const {
    data: stats,
    isLoading: isLoadingStats,
    refetch: fetchStats,
  } = useAsync(async () => {
    const response = await getDashboardStats("reviewer", "week");
    return response.stats as ReviewerStats;
  });

  // Auto-refresh interval (30 seconds)
  const autoRefreshInterval = React.useRef<NodeJS.Timeout | null>(null);

  // Auto-refresh setup
  React.useEffect(() => {
    autoRefreshInterval.current = setInterval(() => {
      fetchActiveReviews();
      fetchSubmittedReviews();
      fetchStats();
    }, 30000);

    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, [fetchActiveReviews, fetchSubmittedReviews, fetchStats]);

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    await Promise.all([
      fetchActiveReviews(),
      fetchSubmittedReviews(),
      fetchStats(),
    ]);
    toast.success("Dashboard updated");
  };

  // Handle continue review
  const handleContinueReview = (slotId: number) => {
    router.push(`/reviewer/review/${slotId}`);
  };

  // Handle view review
  const handleViewReview = (requestId: number) => {
    router.push(`/review/${requestId}`);
  };

  // Calculate earnings
  const totalEarnings = stats?.total_earned || 0;
  const pendingEarnings = submittedReviews.reduce((sum, r) => sum + r.payment_amount, 0);

  return (
    <div className={cn("space-y-4 pb-20", className)}>
      {/* Stats Summary - Sticky */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-2 space-y-3">
        {/* Earnings Card */}
        <div className="rounded-xl border border-border bg-gradient-to-br from-accent-peach/10 to-accent-peach/5 p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-xs text-muted-foreground font-medium mb-1">Total Earnings</div>
              <div className="text-3xl font-bold text-foreground">
                ${totalEarnings.toFixed(2)}
              </div>
            </div>
            <div className="size-10 rounded-lg bg-accent-peach/20 flex items-center justify-center">
              <DollarSign className="size-5 text-accent-peach" />
            </div>
          </div>
          {pendingEarnings > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3" />
              <span>${pendingEarnings.toFixed(2)} pending release</span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
          <button
            onClick={() => setActiveTab("active")}
            className={cn(
              "flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all min-h-[48px]",
              "flex flex-col items-center justify-center gap-1",
              activeTab === "active"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <Clock className="size-4" />
              <span>Active</span>
            </div>
            <Badge variant="secondary" size="sm">
              {activeReviews.length}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab("submitted")}
            className={cn(
              "flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all min-h-[48px]",
              "flex flex-col items-center justify-center gap-1",
              activeTab === "submitted"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <FileText className="size-4" />
              <span>Submitted</span>
            </div>
            <Badge variant="info" size="sm">
              {submittedReviews.length}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={cn(
              "flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all min-h-[48px]",
              "flex flex-col items-center justify-center gap-1",
              activeTab === "completed"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4" />
              <span>Done</span>
            </div>
            <Badge variant="success" size="sm">
              {stats?.total_reviews || 0}
            </Badge>
          </button>
        </div>
      </div>

      {/* Content with Pull-to-Refresh */}
      <PullToRefresh onRefresh={handleRefresh}>
        <AnimatePresence mode="wait">
          {/* Active Reviews Tab */}
          {activeTab === "active" && (
            <motion.div
              key="active"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {isLoadingActive ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : activeReviews.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-8 text-center">
                  <div className="size-16 rounded-full bg-accent-blue/10 flex items-center justify-center mx-auto mb-4">
                    <Clock className="size-8 text-accent-blue" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No Active Reviews
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Browse available reviews and claim one to get started.
                  </p>
                  <Button
                    onClick={() => router.push("/browse")}
                    className="bg-accent-blue hover:bg-accent-blue/90 min-h-[48px]"
                  >
                    <Search className="size-4 mr-2" />
                    Browse Reviews
                  </Button>
                </div>
              ) : (
                activeReviews.map((review) => {
                  // Calculate progress from draft data
                  const progress = review.draft_progress.percentage || 0;

                  return (
                    <SwipeableReviewCard
                      key={review.slot_id}
                      mode="reviewer"
                      id={review.slot_id}
                      title={review.review_request?.title || "Untitled Review"}
                      description={review.review_request?.description_preview || ""}
                      contentType={review.review_request?.content_type || ""}
                      status="active"
                      deadline={review.claim_deadline || undefined}
                      progress={progress}
                      earnings={{
                        payment: review.earnings_potential,
                      }}
                      urgencyLevel={review.urgency_level}
                      onContinue={() => handleContinueReview(review.slot_id)}
                      onClick={() => handleContinueReview(review.slot_id)}
                    />
                  );
                })
              )}
            </motion.div>
          )}

          {/* Submitted Reviews Tab */}
          {activeTab === "submitted" && (
            <motion.div
              key="submitted"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {isLoadingSubmitted ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : submittedReviews.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-8 text-center">
                  <div className="size-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                    <FileText className="size-8 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No Submitted Reviews
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Complete an active review to see it here.
                  </p>
                </div>
              ) : (
                submittedReviews.map((review) => (
                  <SwipeableReviewCard
                    key={review.slot_id}
                    mode="reviewer"
                    id={review.slot_id}
                    title={review.review_request?.title || "Untitled Review"}
                    description={`Awaiting acceptance - Auto-accept in ${review.countdown_text}`}
                    contentType={review.review_request?.content_type || ""}
                    status="submitted"
                    autoAcceptDeadline={review.auto_accept_at || undefined}
                    earnings={{
                      payment: review.payment_amount,
                      potentialKarma: review.potential_karma,
                      potentialBonus: review.potential_bonus,
                    }}
                    urgencyLevel={review.urgency_level}
                    onView={() => handleViewReview(review.review_request?.id || 0)}
                    onClick={() => handleViewReview(review.review_request?.id || 0)}
                  />
                ))
              )}
            </motion.div>
          )}

          {/* Completed Reviews Tab */}
          {activeTab === "completed" && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Stats Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="size-5 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-medium text-muted-foreground">Rating</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {stats?.average_rating ? stats.average_rating.toFixed(1) : "N/A"}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="size-5 text-green-500" />
                    <span className="text-xs font-medium text-muted-foreground">Acceptance</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {stats?.acceptance_rate ? `${stats.acceptance_rate}%` : "N/A"}
                  </div>
                </div>
              </div>

              {/* Completed Reviews List */}
              {isLoadingStats ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-card p-8 text-center">
                  <div className="size-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="size-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Completed Reviews
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You have completed {stats?.reviews_given || 0} reviews.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Total Earned</div>
                      <div className="text-xl font-bold text-green-600">
                        ${totalEarnings.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Acceptance Rate</div>
                      <div className="text-xl font-bold text-foreground">
                        {stats?.acceptance_rate ? (stats.acceptance_rate * 100).toFixed(0) : "0"}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </PullToRefresh>
    </div>
  );
}
