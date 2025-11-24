"use client";

/**
 * Creator Dashboard Component
 *
 * Extracted from the original dashboard page.tsx
 * Shows creator-specific content: reviews, stats, quick actions
 */

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  FolderOpen,
  MessageSquare,
  Plus,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  Zap,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Palette,
  Code,
  Video,
  Mic,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { type CreateReviewResponse } from "@/lib/api/reviews";
import { useReviews } from "@/hooks/useReviews";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import SubscriptionStatusCard from "./subscription-status-card";
import { PendingFeedbacksSection } from "./pending-feedbacks-section";

export default function CreatorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [mobileSection, setMobileSection] = useState<"overview" | "activity" | "account">("overview");
  const [accountExpanded, setAccountExpanded] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // React Query hook for reviews with automatic caching & refetching
  const { data: reviews = [], isLoading: reviewsLoading } = useReviews();

  // Calculate real stats from reviews
  const totalReviews = reviews.length;
  const completedReviews = reviews.filter(r => r.status === "completed").length;
  const pendingReviews = reviews.filter(r => r.status === "pending" || r.status === "in_review").length;
  const draftReviews = reviews.filter(r => r.status === "draft").length;

  // Sample trend data for sparklines (will be replaced with real historical data later)
  const projectTrendData = [1, 1, 2, 2, 3, 3, totalReviews || 3];
  const completedTrendData = [8, 9, 9, 10, 11, 11, completedReviews];
  const pendingTrendData = [8, 7, 6, 7, 5, 5, pendingReviews];

  // Quick Actions data
  const quickActions = [
    {
      icon: <Plus className="size-6 text-white" />,
      title: "New Project",
      description: "Start a new creative project",
      gradientClass: "from-accent-blue to-accent-blue/70",
      onClick: () => {
        // TODO: Navigate to new project page
      },
    },
    {
      icon: <MessageSquare className="size-6 text-white" />,
      title: "Request Feedback",
      description: "Get AI or human reviews",
      gradientClass: "from-accent-peach to-accent-peach/70",
      onClick: () => router.push("/review/new"),
    },
    {
      icon: <FileText className="size-6 text-white" />,
      title: "View Reports",
      description: "See detailed analytics",
      gradientClass: "from-accent-blue via-accent-blue to-accent-blue/60",
      onClick: () => {
        // TODO: Navigate to reports page
      },
    },
    {
      icon: <Users className="size-6 text-white" />,
      title: "Manage Team",
      description: "Invite collaborators",
      gradientClass: "from-accent-peach via-accent-peach to-accent-peach/60",
      onClick: () => {
        // TODO: Navigate to team page
      },
    },
  ];

  // Handle scroll position tracking for card indicators
  const handleCardScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const container = e.currentTarget;
    const cardWidth = container.scrollWidth / quickActions.length;
    const index = Math.round(scrollLeft / cardWidth);
    setActiveCardIndex(Math.min(index, quickActions.length - 1));
  };

  // Scroll to specific card
  const scrollToCard = (index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cardWidth = container.scrollWidth / quickActions.length;
    container.scrollTo({
      left: cardWidth * index,
      behavior: "smooth",
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Pending Feedbacks Section - NEW! Shows all submitted reviews awaiting action */}
      <PendingFeedbacksSection />

      {/* Stats Section - Responsive Layout */}
      {/* Mobile: Bento Grid - Apple-style asymmetric layout */}
      <div className="lg:hidden grid grid-cols-2 gap-3 auto-rows-[minmax(100px,auto)]">
        {/* Primary stat - Takes full left column height */}
        <div className="row-span-2">
          <BentoStatLarge
            icon={<FolderOpen className="size-6" />}
            value={reviewsLoading ? "..." : totalReviews}
            label="Total Reviews"
            trend={totalReviews > 0 ? `${totalReviews} total` : "No reviews yet"}
            trendDirection="neutral"
            color="blue"
          />
        </div>

        {/* Secondary stats - Smaller compact pills on right */}
        <BentoStatSmall
          icon={<MessageSquare className="size-5" />}
          value={reviewsLoading ? "..." : totalReviews}
          label="All Reviews"
          color="peach"
        />
        <BentoStatSmall
          icon={<CheckCircle2 className="size-5" />}
          value={reviewsLoading ? "..." : completedReviews}
          label="Completed"
          color="green"
        />

        {/* Full width bottom stat with progress */}
        <div className="col-span-2">
          <BentoStatProgress
            icon={<Clock className="size-5" />}
            value={reviewsLoading ? "..." : pendingReviews}
            label="Pending Reviews"
            total={totalReviews || 1}
            trend={pendingReviews > 0 ? `${pendingReviews} awaiting feedback` : "All caught up"}
            color="amber"
          />
        </div>
      </div>

      {/* Desktop: Full stat cards grid with all details - Animated */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-6">
        {[
          {
            icon: <FolderOpen className="text-accent-blue" />,
            label: "Total Reviews",
            value: reviewsLoading ? "..." : String(totalReviews),
            trend: totalReviews > 0 ? `${totalReviews} total` : "Get started",
            trendDirection: "neutral" as const,
            trendData: projectTrendData,
            comparison: "All time",
            bgColor: "bg-accent-blue/10",
            sparklineColor: "hsl(217 91% 60%)", // #3B82F6 in HSL
          },
          {
            icon: <MessageSquare className="text-accent-peach" />,
            label: "In Progress",
            value: reviewsLoading ? "..." : String(pendingReviews),
            trend: pendingReviews > 0 ? "Being reviewed" : "No pending",
            trendDirection: "neutral" as const,
            trendData: pendingTrendData,
            comparison: "Current status",
            bgColor: "bg-accent-peach/10",
            sparklineColor: "hsl(27 94% 54%)", // #F97316 in HSL
          },
          {
            icon: <CheckCircle2 className="text-green-600" />,
            label: "Completed",
            value: reviewsLoading ? "..." : String(completedReviews),
            trend: completedReviews > 0 ? `${completedReviews} finished` : "None yet",
            trendDirection: "up" as const,
            trendData: completedTrendData,
            comparison: "All time",
            bgColor: "bg-green-50",
            sparklineColor: "hsl(142 71% 45%)", // #10B981 in HSL
          },
          {
            icon: <Clock className="text-amber-600" />,
            label: "Drafts",
            value: reviewsLoading ? "..." : String(draftReviews),
            trend: draftReviews > 0 ? "Not submitted" : "All submitted",
            trendDirection: "neutral" as const,
            trendData: [0, 0, 0, 0, 0, 0, draftReviews],
            comparison: "Saved drafts",
            bgColor: "bg-amber-50",
            sparklineColor: "hsl(38 92% 50%)", // #F59E0B in HSL
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.4,
              delay: prefersReducedMotion ? 0 : index * 0.15
            }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Mobile Section Tabs - Only visible on mobile */}
      <div className="lg:hidden flex gap-1 p-1 bg-muted/50 rounded-xl border border-border">
        <button
          onClick={() => setMobileSection("overview")}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
            mobileSection === "overview"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setMobileSection("activity")}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
            mobileSection === "activity"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Activity
        </button>
        <button
          onClick={() => setMobileSection("account")}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
            mobileSection === "account"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Account
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Quick Actions Card - Show on "overview" tab on mobile, always on desktop */}
        <div className={`lg:col-span-2 rounded-2xl border border-border bg-card p-4 sm:p-6 lg:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] transition-all duration-200 ${
          mobileSection !== "overview" ? "hidden lg:block" : ""
        }`}>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="space-y-0.5 sm:space-y-1">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground">
                Quick Actions
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Start your workflow
              </p>
            </div>
            <div className="size-8 sm:size-10 rounded-lg sm:rounded-xl bg-accent-blue/10 flex items-center justify-center">
              <Zap className="size-4 sm:size-5 text-accent-blue" />
            </div>
          </div>

          {/* Mobile: Horizontal scroll with centered cards + navigation */}
          <div className="lg:hidden">
            <div className="relative">
              {/* Scrollable container - centered with padding */}
              <div
                ref={scrollContainerRef}
                className="overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
                onScroll={handleCardScroll}
              >
                <div className="flex gap-4 px-8">
                  {quickActions.map((action, i) => (
                    <div key={i} className="snap-center flex-shrink-0 w-[calc(100vw-96px)] max-w-[280px]">
                      <ActionButton {...action} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation arrows - outside cards */}
              {activeCardIndex > 0 && (
                <button
                  onClick={() => scrollToCard(activeCardIndex - 1)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 size-8 rounded-full
                    bg-background border border-border shadow-md
                    flex items-center justify-center
                    hover:bg-muted transition-colors"
                  aria-label="Previous card"
                >
                  <ChevronLeft className="size-5 text-foreground" />
                </button>
              )}

              {activeCardIndex < quickActions.length - 1 && (
                <button
                  onClick={() => scrollToCard(activeCardIndex + 1)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 size-8 rounded-full
                    bg-background border border-border shadow-md
                    flex items-center justify-center
                    hover:bg-muted transition-colors"
                  aria-label="Next card"
                >
                  <ChevronRight className="size-5 text-foreground" />
                </button>
              )}
            </div>

            {/* Swipe hint + dots indicator */}
            <div className="flex flex-col items-center gap-2 mt-4">
              {/* Scroll position dots */}
              <div className="flex justify-center gap-1.5" role="tablist" aria-label="Quick action cards">
                {quickActions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToCard(i)}
                    role="tab"
                    aria-selected={i === activeCardIndex}
                    aria-label={`Go to card ${i + 1} of ${quickActions.length}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === activeCardIndex
                        ? 'w-6 bg-accent-blue'
                        : 'w-1.5 bg-border hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </div>

              {/* Swipe hint text */}
              {activeCardIndex === 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 animate-pulse">
                  <span>Swipe to see more</span>
                  <ChevronRight className="size-3" />
                </p>
              )}
            </div>
          </div>

          {/* Desktop: Grid layout */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-4">
            {quickActions.map((action, i) => (
              <ActionButton key={i} {...action} />
            ))}
          </div>
        </div>

        {/* Account Info Card - Collapsible on mobile, show on "account" tab */}
        <div className={`rounded-2xl border border-border bg-card p-4 sm:p-6 lg:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] transition-all duration-200 ${
          mobileSection !== "account" ? "hidden lg:block" : ""
        }`}>
          {/* Header - Collapsible on mobile */}
          <button
            onClick={() => setAccountExpanded(!accountExpanded)}
            className="lg:pointer-events-none w-full flex items-center gap-3 mb-4 sm:mb-6"
          >
            <div className="size-10 sm:size-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-accent-blue to-accent-peach flex items-center justify-center shadow-sm ring-2 ring-accent-blue/20 flex-shrink-0">
              <span className="text-white font-bold text-lg sm:text-xl">
                {user?.full_name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <h2 className="text-base sm:text-lg font-semibold text-foreground truncate">
                Your Account
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Account details</p>
            </div>
            <ChevronDown className={`size-5 text-muted-foreground transition-transform lg:hidden ${accountExpanded ? "rotate-180" : ""}`} />
          </button>

          {/* Content - Collapsible on mobile, always visible on desktop */}
          <div className={`${accountExpanded ? "block" : "hidden"} lg:block space-y-3 sm:space-y-4`}>
            <InfoRow label="Full Name" value={user?.full_name || "N/A"} />
            <InfoRow label="Email" value={user?.email || "N/A"} />
            <InfoRow
              label="Status"
              value={
                <Badge
                  variant={user?.is_active ? "success" : "error"}
                  showDot
                  pulse={user?.is_active}
                  size="sm"
                >
                  {user?.is_active ? "Active" : "Inactive"}
                </Badge>
              }
            />
            <InfoRow
              label="Verified"
              value={
                <Badge
                  variant={user?.is_verified ? "info" : "warning"}
                  icon={user?.is_verified ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
                  size="sm"
                >
                  {user?.is_verified ? "Verified" : "Not Verified"}
                </Badge>
              }
            />
          </div>

          <button
            className={`w-full mt-4 sm:mt-6 flex items-center justify-between px-4 py-3 rounded-lg
              border border-border hover:bg-muted/50
              transition-colors text-left group min-h-[44px] ${accountExpanded ? "block" : "hidden"} lg:block`}
            onClick={() => {
              // Navigate to settings
            }}
          >
            <span className="text-sm font-medium text-foreground">Account Settings</span>

            <ArrowRight className="size-4 text-muted-foreground
              group-hover:text-foreground group-hover:translate-x-1
              transition-all duration-200" />
          </button>
        </div>

        {/* Subscription Status Card - Show on "account" tab on mobile, always on desktop */}
        <div className={`${mobileSection !== "account" ? "hidden lg:block" : ""}`}>
          <SubscriptionStatusCard />
        </div>
      </div>

      {/* Recent Reviews - Show on "activity" tab on mobile, always on desktop */}
      <div id="reviews-section" className={`rounded-2xl border border-border bg-card p-4 sm:p-6 lg:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] transition-all duration-200 ${
        mobileSection !== "activity" ? "hidden lg:block" : ""
      }`}>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="space-y-0.5 sm:space-y-1">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground">
              Your Reviews
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {reviewsLoading ? "Loading..." : reviews.length > 0 ? `${reviews.length} review${reviews.length !== 1 ? 's' : ''} requested` : "No reviews yet"}
            </p>
          </div>
          <div className="size-8 sm:size-10 rounded-lg sm:rounded-xl bg-accent-peach/10 flex items-center justify-center">
            <MessageSquare className="size-4 sm:size-5 text-accent-peach" />
          </div>
        </div>

        {reviewsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <>
            <div className="space-y-2 sm:space-y-3">
              <AnimatePresence mode="popLayout">
                {reviews.slice(0, 4).map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={prefersReducedMotion ? undefined : { opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, x: 20 }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.3,
                      delay: prefersReducedMotion ? 0 : index * 0.05
                    }}
                    layout={!prefersReducedMotion}
                  >
                    <ReviewItem review={review} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {reviews.length > 4 && (
              <Button
                variant="outline"
                className="w-full mt-6 min-h-[44px] group hover:bg-accent-blue/5 hover:border-accent-blue/30 transition-all"
                onClick={() => {
                  // TODO: Navigate to all reviews page
                }}
              >
                View All {reviews.length} Reviews
                <ArrowRight className="size-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="size-16 rounded-2xl bg-accent-blue/10 flex items-center justify-center mb-4">
              <MessageSquare className="size-8 text-accent-blue" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No reviews yet
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Create your first review request to get AI or expert feedback on your work.
            </p>
            <Button
              onClick={() => router.push("/review/new")}
              className="bg-accent-blue hover:bg-accent-blue/90"
            >
              <Plus className="size-4 mr-2" />
              Request Feedback
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components

interface ActionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradientClass: string;
  onClick?: () => void;
}

function ActionButton({ icon, title, description, gradientClass, onClick }: ActionButtonProps) {
  return (
    <button
      className="group relative overflow-hidden rounded-2xl bg-background
        hover:shadow-lg
        active:scale-[0.98]
        transition-all duration-200 text-left p-6 min-h-[140px] flex flex-col justify-between"
      onClick={onClick}
    >
      {/* Icon with gradient background */}
      <div className={`size-12 rounded-xl bg-gradient-to-br ${gradientClass}
        flex items-center justify-center mb-4
        group-hover:scale-110 group-hover:shadow-lg
        transition-all duration-200`}>
        {icon}
      </div>

      {/* Text content */}
      <div>
        <h3 className="font-semibold text-base mb-1 text-foreground group-hover:text-blue-700 transition-colors">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </div>
    </button>
  );
}

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border-light last:border-0">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">
        {value}
      </span>
    </div>
  );
}

interface ReviewItemProps {
  review: CreateReviewResponse;
}

function ReviewItem({ review }: ReviewItemProps) {
  const router = useRouter();

  // Map content types to icons and colors
  const contentTypeConfig = {
    design: { icon: <Palette className="size-4" />, color: "text-blue-600", bg: "bg-blue-500/10" },
    code: { icon: <Code className="size-4" />, color: "text-blue-600", bg: "bg-blue-500/10" },
    video: { icon: <Video className="size-4" />, color: "text-purple-600", bg: "bg-purple-500/10" },
    audio: { icon: <Mic className="size-4" />, color: "text-pink-600", bg: "bg-pink-500/10" },
    writing: { icon: <FileText className="size-4" />, color: "text-green-600", bg: "bg-green-500/10" },
    art: { icon: <ImageIcon className="size-4" />, color: "text-amber-600", bg: "bg-amber-500/10" },
  };

  // Map status to badge variants
  const statusConfig = {
    draft: { variant: "secondary" as const, label: "Draft" },
    pending: { variant: "warning" as const, label: "Pending" },
    in_review: { variant: "info" as const, label: "In Review" },
    completed: { variant: "success" as const, label: "Completed" },
    cancelled: { variant: "error" as const, label: "Cancelled" },
  };

  const config = contentTypeConfig[review.content_type];
  const statusInfo = statusConfig[review.status as keyof typeof statusConfig] || statusConfig.pending;

  // Calculate claim progress for multi-review requests
  const reviewsRequested = review.reviews_requested || 1;
  const reviewsClaimed = review.reviews_claimed || 0;
  const availableSlots = review.available_slots ?? (reviewsRequested - reviewsClaimed);
  const hasMultipleReviews = reviewsRequested > 1;

  // Format date
  const createdDate = new Date(review.created_at);
  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  let timeText = "";
  if (diffHours < 1) {
    timeText = "Just now";
  } else if (diffHours < 24) {
    timeText = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    timeText = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    timeText = createdDate.toLocaleDateString();
  }

  return (
    <div
      onClick={() => router.push(`/review/${review.id}`)}
      className="group flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl hover:bg-accent-blue/5 transition-all duration-200 cursor-pointer border border-transparent hover:border-accent-blue/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)] min-h-[68px]"
    >
      <div className={`size-8 sm:size-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
        <div className={config.color}>
          {config.icon}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-foreground text-xs sm:text-sm line-clamp-1">{review.title}</h4>
          <Badge variant={statusInfo.variant} size="sm">
            {statusInfo.label}
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-none">{review.description}</p>

        {/* Claim Progress - Only for multi-review requests */}
        {hasMultipleReviews && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-[10px] sm:text-xs">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Users className="size-3" />
                {reviewsClaimed} of {reviewsRequested} reviews claimed
              </span>
              {availableSlots > 0 && (
                <span className="text-green-700 font-semibold">
                  {availableSlots} slot{availableSlots !== 1 ? 's' : ''} available
                </span>
              )}
            </div>
            <div className="relative h-1.5 bg-accent-sage/20 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                  availableSlots === 0 ? "bg-green-500" :
                  availableSlots === 1 ? "bg-amber-500" :
                  "bg-accent-sage"
                }`}
                style={{
                  width: `${(reviewsClaimed / reviewsRequested) * 100}%`
                }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mt-1">
          <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="size-3" />
            {timeText}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground capitalize">
            {review.review_type === "free" ? "Quick Feedback" : "Expert Review"}
          </p>
        </div>
      </div>
      <ArrowRight className="size-3 sm:size-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 hidden sm:block" />
    </div>
  );
}

/**
 * Bento Grid Components - Apple-style Asymmetric Layout
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
              of {total}
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
