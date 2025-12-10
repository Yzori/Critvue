/**
 * Reviewer Dashboard Component
 *
 * Extracted from the original reviewer/dashboard/page.tsx
 * Shows reviewer-specific content: active claims, submissions, earnings, stats
 *
 * Brand Compliance:
 * - Critvue purple/blue gradients
 * - Glassmorphism effects on cards
 * - Smooth animations with reduced motion support
 * - Mobile-first responsive design
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
  Star,
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

export default function ReviewerDashboard() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  // State
  const [dashboard, setDashboard] = React.useState<Awaited<ReturnType<typeof getReviewerDashboard>> | null>(null);
  const [activeReviews, setActiveReviews] = React.useState<ReviewSlot[]>([]);
  const [submittedReviews, setSubmittedReviews] = React.useState<ReviewSlot[]>([]);
  const [completedReviews, setCompletedReviews] = React.useState<ReviewSlot[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch dashboard data on mount
  React.useEffect(() => {
    let cancelled = false;

    const fetchDashboard = async () => {
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

        if (cancelled) {
          return;
        }

        setDashboard(dashboardData);
        setActiveReviews(claimed);
        setSubmittedReviews(submitted);
        setCompletedReviews(accepted.slice(0, 5)); // Show last 5
      } catch {
        if (!cancelled) {
          setError("Failed to load dashboard. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, []); // Empty dependency array - only run once on mount

  // Handle abandon review
  const handleAbandonReview = async (slotId: number) => {
    // Refresh after abandon
    setLoading(true);
    await abandonReviewSlot(slotId);

    // Re-fetch data
    try {
      const [dashboardData, claimed, submitted, accepted] = await Promise.all([
        getReviewerDashboard(),
        getMyReviews("claimed"),
        getMyReviews("submitted"),
        getMyReviews("accepted"),
      ]);

      setDashboard(dashboardData);
      setActiveReviews(claimed);
      setSubmittedReviews(submitted);
      setCompletedReviews(accepted.slice(0, 5));
    } catch {
      // Error refreshing after abandon - silent fail
    } finally {
      setLoading(false);
    }
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

  const stats = dashboard?.stats || {
    total_reviews: 0,
    acceptance_rate: 0,
    average_rating: 0,
    total_earned: 0,
    pending_payment: 0,
  };

  return (
    <div className="space-y-6 sm:space-y-8">
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
      {/* Mobile: Bento Grid - Apple-style asymmetric layout */}
      <div className="lg:hidden grid grid-cols-2 gap-3 auto-rows-[minmax(100px,auto)]">
        {/* Primary stat - Total Earnings - Takes full left column height */}
        <div className="row-span-2">
          <BentoStatLarge
            icon={<TrendingUp className="size-6" />}
            value={loading ? "..." : `$${stats.total_earned.toFixed(2)}`}
            label="Total Earnings"
            trend={stats.pending_payment > 0 ? `$${stats.pending_payment.toFixed(2)} pending` : "All released"}
            trendDirection={stats.total_earned > 0 ? "up" : "neutral"}
            color="peach"
          />
        </div>

        {/* Secondary stats - Smaller compact pills on right */}
        <BentoStatSmall
          icon={<Clock className="size-5" />}
          value={loading ? "..." : activeReviews.length}
          label="Active"
          color="blue"
        />
        <BentoStatSmall
          icon={<CheckCircle2 className="size-5" />}
          value={loading ? "..." : stats.total_reviews}
          label="Completed"
          color="green"
        />

        {/* Full width bottom stat with rating */}
        <div className="col-span-2">
          <BentoStatProgress
            icon={<Star className="size-5" />}
            value={stats.average_rating ? stats.average_rating.toFixed(1) : "0"}
            label="Average Rating"
            total={5}
            trend={stats.average_rating
              ? stats.average_rating >= 4.5
                ? "Excellent reviews"
                : stats.average_rating >= 4.0
                  ? "Very good reviews"
                  : "Good reviews"
              : "No ratings yet"}
            color="amber"
          />
        </div>
      </div>

      {/* Desktop: Full stat cards grid with all details */}
      <div className="hidden lg:block">
        <DashboardStats
          stats={stats}
          activeClaimsCount={activeReviews.length}
          isLoading={loading}
        />
      </div>

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

/**
 * Bento Grid Components - Apple-style Asymmetric Layout
 * Matching the creator dashboard mobile experience
 */

interface BentoStatLargeProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  color: "blue" | "peach" | "green" | "amber";
}

interface BentoStatSmallProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: "blue" | "peach" | "green" | "amber";
}

interface BentoStatProgressProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  total: number;
  trend?: string;
  color: "blue" | "peach" | "green" | "amber";
}

// Large primary stat - Takes 2 rows
function BentoStatLarge({ icon, value, label, trend, trendDirection = "neutral", color }: BentoStatLargeProps) {
  const iconColors = {
    blue: "text-accent-blue",
    peach: "text-accent-peach",
    green: "text-green-600",
    amber: "text-amber-600",
  };

  const iconBgColors = {
    blue: "bg-accent-blue/10",
    peach: "bg-accent-peach/10",
    green: "bg-green-500/10",
    amber: "bg-amber-500/10",
  };

  const getTrendColor = () => {
    switch (trendDirection) {
      case "up": return "text-green-600";
      case "down": return "text-red-600";
      default: return "text-muted-foreground";
    }
  };

  const TrendIcon = () => {
    const iconClass = "size-3.5";
    switch (trendDirection) {
      case "up": return <TrendingUp className={iconClass} />;
      case "down": return <TrendingUp className={`${iconClass} rotate-180`} />;
      default: return null;
    }
  };

  return (
    <div
      className="h-full rounded-2xl border border-border bg-card p-5
        shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]
        hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.08)]
        transition-all duration-200
        flex flex-col items-center justify-between
        cursor-pointer active:scale-[0.98]"
    >
      {/* Icon at top - centered */}
      <div className={`size-12 rounded-xl ${iconBgColors[color]}
        flex items-center justify-center`}>
        <div className={iconColors[color]}>
          {icon}
        </div>
      </div>

      {/* Value and label - Centered vertically and horizontally */}
      <div className="flex-1 flex flex-col items-center justify-center my-4 text-center">
        <div className="text-4xl font-bold text-foreground leading-none mb-2 tracking-tight">
          {value}
        </div>
        <div className="text-sm text-foreground font-medium">
          {label}
        </div>
      </div>

      {/* Trend at bottom - centered */}
      {trend && (
        <div className={`flex items-center justify-center gap-1.5 text-xs font-medium ${getTrendColor()}`}>
          <TrendIcon />
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}

// Small compact stat
function BentoStatSmall({ icon, value, label, color }: BentoStatSmallProps) {
  const iconColors = {
    blue: "text-accent-blue",
    peach: "text-accent-peach",
    green: "text-green-600",
    amber: "text-amber-600",
  };

  const iconBgColors = {
    blue: "bg-accent-blue/10",
    peach: "bg-accent-peach/10",
    green: "bg-green-500/10",
    amber: "bg-amber-500/10",
  };

  return (
    <div
      className="rounded-2xl border border-border bg-card p-4
        shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]
        hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.08)]
        transition-all duration-200
        flex flex-col items-center justify-center text-center
        cursor-pointer active:scale-[0.98]
        min-h-[100px]"
    >
      {/* Icon - centered */}
      <div className={`size-9 rounded-lg ${iconBgColors[color]}
        flex items-center justify-center mb-2`}>
        <div className={iconColors[color]}>
          {icon}
        </div>
      </div>

      {/* Value - centered */}
      <div className="text-2xl font-bold text-foreground leading-none mb-1">
        {value}
      </div>

      {/* Label - centered */}
      <div className="text-xs text-muted-foreground font-medium">
        {label}
      </div>
    </div>
  );
}

// Full-width stat with progress bar
function BentoStatProgress({ icon, value, label, total, trend, color }: BentoStatProgressProps) {
  const iconColors = {
    blue: "text-accent-blue",
    peach: "text-accent-peach",
    green: "text-green-600",
    amber: "text-amber-600",
  };

  const iconBgColors = {
    blue: "bg-accent-blue/10",
    peach: "bg-accent-peach/10",
    green: "bg-green-500/10",
    amber: "bg-amber-500/10",
  };

  const progressColors = {
    blue: "bg-accent-blue",
    peach: "bg-accent-peach",
    green: "bg-green-500",
    amber: "bg-amber-500",
  };

  const percentage = Math.round((Number(value) / total) * 100);

  return (
    <div
      className="rounded-2xl border border-border bg-card p-4
        shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]
        hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.08)]
        transition-all duration-200
        cursor-pointer active:scale-[0.98]"
    >
      <div className="flex items-center gap-3 mb-3">
        {/* Icon */}
        <div className={`size-10 rounded-lg ${iconBgColors[color]}
          flex items-center justify-center flex-shrink-0`}>
          <div className={iconColors[color]}>
            {icon}
          </div>
        </div>

        {/* Label and value */}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-muted-foreground font-medium mb-0.5">
            {label}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground leading-none">
              {value}
            </span>
            <span className="text-sm text-muted-foreground">
              / {total}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${progressColors[color]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Trend text */}
      {trend && (
        <p className="text-xs text-muted-foreground mt-2">
          {trend}
        </p>
      )}
    </div>
  );
}
