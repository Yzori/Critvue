'use client';

/**
 * ElevatedDashboard - The Next-Level Dashboard Experience
 *
 * This is the main elevated dashboard component that integrates all the
 * innovative features:
 * - User Pulse (emotional intelligence)
 * - Hero Action Block (what to do next)
 * - Story Mode Stats (narrative-driven data)
 * - Celebration System (meaningful celebrations)
 * - Anticipation Engine (what's coming)
 * - Ambient Presence (community activity)
 * - Reviewer Cockpit (earnings focus)
 * - Role Transformation (smooth transitions)
 * - Ambient Modes (dark/focus/zen)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

// Elevated components
import { HeroActionBlock, determineHeroAction, HeroAction } from './HeroActionBlock';
import { StoryModeStats, StoryModeCompact, StoryStats } from './StoryModeStats';
import { AnimatedStatsGrid, StatCardData, EarningsDisplay, StreakCounter } from './AnimatedStats';
import { CelebrationOverlay, CelebrationToast, useCelebrations, celebrations, CelebrationConfig } from './CelebrationSystem';
import { LiveActivityFeed, UpcomingEventsSection, CountdownMoment, Prediction, generatePredictions, ActivityEvent } from './AnticipationEngine';
import { OnlineCounter, PresenceHeader } from './AmbientPresence';
import { EarningsDashboard, EfficiencyMetrics, ReviewerQuickStats, QueueOptimizer, QueueSuggestion } from './ReviewerCockpit';
import { AnimatedRoleToggle, DashboardTransition, RoleBadge } from './RoleTransition';
import { ModeSwitcher, useAmbientMode, HideInZenMode } from './AmbientModeSystem';

// Existing components
import { CommandPalette } from '../desktop/command-center/CommandPalette';
import { QuickActionBar } from '../desktop/command-center/QuickActionBar';
import { KanbanBoard, KanbanColumn, getDefaultColumns } from '../desktop/command-center/KanbanBoard';
import { TierProgressRing } from '../momentum/TierProgressRing';

// API imports
import {
  getActionsNeeded,
  getMyRequests,
  getActiveReviews,
  getSubmittedReviews,
  getCompletedReviews,
  type PendingReviewItem,
  type MyRequestItem,
  type ActiveReviewItem,
  type SubmittedReviewItem,
  type CompletedReviewItem,
} from '@/lib/api/dashboard';
import {
  getKarmaSummary,
  type KarmaSummary,
} from '@/lib/api/karma';
import {
  getPlatformActivity,
  getPlatformStats,
  getUserStoryStats,
  pollPlatformStats,
  type PlatformStats,
  type UserStoryStats,
  type ActivityEvent as PlatformActivityEvent,
} from '@/lib/api/platform';

// Icons
import {
  Keyboard,
  Star,
  Clock,
  FileText,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  X,
  Plus,
  Briefcase,
} from 'lucide-react';

type Role = 'creator' | 'reviewer';

interface ElevatedDashboardProps {
  initialRole?: Role;
  onRoleChange?: (role: Role) => void;
  className?: string;
}

export function ElevatedDashboard({
  initialRole = 'creator',
  onRoleChange,
  className,
}: ElevatedDashboardProps) {
  const { user } = useAuth();
  const { shouldHideStreak, shouldMinimizeChrome } = useAmbientMode();

  // Role state
  const [role, setRole] = useState<Role>(initialRole);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // UI state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Data state
  const [karmaSummary, setKarmaSummary] = useState<KarmaSummary | null>(null);
  const [pendingReviews, setPendingReviews] = useState<PendingReviewItem[]>([]);
  const [myRequests, setMyRequests] = useState<MyRequestItem[]>([]);
  const [activeReviews, setActiveReviews] = useState<ActiveReviewItem[]>([]);
  const [submittedReviews, setSubmittedReviews] = useState<SubmittedReviewItem[]>([]);
  const [completedReviews, setCompletedReviews] = useState<CompletedReviewItem[]>([]);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>([]);

  // Platform-wide data (real API)
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [platformActivity, setPlatformActivity] = useState<PlatformActivityEvent[]>([]);
  const [userStoryStats, setUserStoryStats] = useState<UserStoryStats | null>(null);

  // Celebration system
  const { current: celebration, celebrate, dismiss: dismissCelebration } = useCelebrations();

  // Track milestone celebrations (only trigger once per session)
  const [celebratedMilestones, setCelebratedMilestones] = useState<Set<string>>(new Set());

  // Handle role change with animation
  const handleRoleChange = (newRole: Role) => {
    if (newRole === role) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setRole(newRole);
      onRoleChange?.(newRole);
      setIsTransitioning(false);
    }, 150);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'r') {
        e.preventDefault();
        handleRoleChange(role === 'creator' ? 'reviewer' : 'creator');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [role]);

  // Load all data
  useEffect(() => {
    loadAllData();
  }, [role]);

  async function loadAllData() {
    setIsLoading(true);
    try {
      // Load all data in parallel for efficiency
      const [
        karmaSummaryData,
        platformStatsData,
        platformActivityData,
        userStoryStatsData,
      ] = await Promise.all([
        getKarmaSummary().catch(() => null),
        getPlatformStats().catch(() => null),
        getPlatformActivity(10, 60).catch(() => ({ events: [], has_more: false })),
        getUserStoryStats(role).catch(() => null),
      ]);

      // Set platform data
      if (karmaSummaryData) setKarmaSummary(karmaSummaryData);
      if (platformStatsData) setPlatformStats(platformStatsData);
      if (platformActivityData) setPlatformActivity(platformActivityData.events);
      if (userStoryStatsData) setUserStoryStats(userStoryStatsData);

      if (role === 'creator') {
        const [actionsResponse, requestsResponse] = await Promise.all([
          getActionsNeeded(1, 20),
          getMyRequests(undefined, 1, 50),
        ]);
        setPendingReviews(actionsResponse.items);
        setMyRequests(requestsResponse.items);

        // Transform to kanban
        const columns = transformCreatorToKanban(actionsResponse.items, requestsResponse.items);
        setKanbanColumns(columns);
      } else {
        const [activeResponse, submittedResponse, completedResponse] = await Promise.all([
          getActiveReviews(1, 20),
          getSubmittedReviews(1, 20),
          getCompletedReviews(1, 20),
        ]);
        setActiveReviews(activeResponse.items);
        setSubmittedReviews(submittedResponse.items);
        setCompletedReviews(completedResponse.items);

        // Transform to kanban
        const columns = transformReviewerToKanban(
          activeResponse.items,
          submittedResponse.items,
          completedResponse.items
        );
        setKanbanColumns(columns);
      }
    } catch {
      // Error loading dashboard data - silent fail, UI shows empty state
    } finally {
      setIsLoading(false);
    }
  }

  // Poll platform stats for real-time updates
  useEffect(() => {
    const cleanup = pollPlatformStats(
      (stats) => setPlatformStats(stats),
      60000 // Update every minute
    );
    return cleanup;
  }, []);

  // Check for milestone celebrations when data loads
  useEffect(() => {
    if (!userStoryStats && !karmaSummary) return;

    const checkMilestone = (key: string, condition: boolean, celebration: CelebrationConfig) => {
      if (condition && !celebratedMilestones.has(key)) {
        setCelebratedMilestones(prev => new Set(prev).add(key));
        celebrate(celebration);
      }
    };

    // Streak milestones
    const streak = userStoryStats?.current_streak ?? karmaSummary?.current_streak ?? 0;
    if (streak === 7) {
      checkMilestone('streak_7', true, celebrations.streak(7));
    } else if (streak === 30) {
      checkMilestone('streak_30', true, celebrations.streak(30));
    } else if (streak === 100) {
      checkMilestone('streak_100', true, celebrations.streak(100));
    }

    // Earnings milestones (reviewer only)
    if (role === 'reviewer' && userStoryStats?.total_earnings) {
      const earnings = userStoryStats.total_earnings;
      if (earnings >= 1000 && earnings < 1100) {
        checkMilestone('earnings_1000', true, celebrations.earnings(1000));
      } else if (earnings >= 500 && earnings < 600) {
        checkMilestone('earnings_500', true, celebrations.earnings(500));
      } else if (earnings >= 100 && earnings < 150) {
        checkMilestone('earnings_100', true, celebrations.earnings(100));
      }
    }

    // First review milestone
    const totalReviews = role === 'creator'
      ? userStoryStats?.total_reviews_received ?? 0
      : userStoryStats?.total_reviews_given ?? 0;
    if (totalReviews === 1) {
      checkMilestone('first_review', true, celebrations.firstReview());
    }

  }, [userStoryStats, karmaSummary, role, celebrate, celebratedMilestones]);

  // Compute hero action
  const heroAction = useMemo(() => {
    return determineHeroAction(role, {
      pendingReviews: pendingReviews,
      activeReviews: activeReviews,
      streak: karmaSummary?.current_streak,
      streakAtRisk: (karmaSummary?.current_streak ?? 0) > 0 &&
        (!karmaSummary?.last_active_date ||
          (Date.now() - new Date(karmaSummary.last_active_date).getTime()) > 20 * 60 * 60 * 1000),
    });
  }, [role, pendingReviews, activeReviews, karmaSummary]);

  // Compute story stats from real API data
  const storyStats: StoryStats = useMemo(() => {
    // Prefer API data, fall back to computed data
    if (userStoryStats) {
      return {
        totalReviews: role === 'creator'
          ? userStoryStats.total_reviews_received
          : userStoryStats.total_reviews_given,
        completedReviews: userStoryStats.completed_reviews,
        inProgressReviews: userStoryStats.in_progress_reviews,
        averageRating: userStoryStats.average_rating ?? 4.5,
        currentStreak: userStoryStats.current_streak,
        memberSince: new Date(userStoryStats.member_since),
        thisWeekActivity: userStoryStats.this_week_activity,
        lastMonthActivity: userStoryStats.last_month_activity,
        totalEarnings: role === 'reviewer' ? (userStoryStats.total_earnings ?? undefined) : undefined,
        acceptanceRate: userStoryStats.acceptance_rate ?? undefined,
        percentileRank: userStoryStats.percentile_rank ?? undefined,
        communityAverage: userStoryStats.community_avg_reviews,
      };
    }

    // Fallback to local computed values
    return {
      totalReviews: role === 'creator'
        ? myRequests.reduce((sum, r) => sum + r.progress.accepted, 0)
        : completedReviews.length,
      completedReviews: role === 'creator'
        ? myRequests.filter(r => r.status === 'completed').length
        : completedReviews.length,
      inProgressReviews: role === 'creator'
        ? pendingReviews.length
        : activeReviews.length,
      averageRating: 4.5,
      currentStreak: karmaSummary?.current_streak ?? 0,
      memberSince: new Date(user?.created_at || Date.now() - 90 * 24 * 60 * 60 * 1000),
      thisWeekActivity: karmaSummary?.weekly_reviews ?? 0,
      lastMonthActivity: 0,
      totalEarnings: role === 'reviewer'
        ? completedReviews.reduce((sum, r) => sum + (r.payment_amount || 0), 0)
        : undefined,
      acceptanceRate: 95,
    };
  }, [role, myRequests, completedReviews, pendingReviews, activeReviews, karmaSummary, user, userStoryStats]);

  // Creator stats
  const creatorStats: StatCardData[] = useMemo(() => [
    {
      label: 'Total Reviews',
      value: myRequests.reduce((sum, r) => sum + r.progress.accepted, 0),
      icon: FileText,
      color: 'blue',
      sparklineData: [3, 5, 4, 7, 6, 8, 10],
    },
    {
      label: 'In Progress',
      value: pendingReviews.length + myRequests.filter(r => r.status === 'in_review').length,
      icon: Clock,
      color: 'orange',
    },
    {
      label: 'Completed',
      value: myRequests.filter(r => r.status === 'completed').length,
      icon: CheckCircle2,
      color: 'green',
    },
    {
      label: 'Avg Rating',
      value: 4.5,
      decimals: 1,
      suffix: ' stars',
      icon: Star,
      color: 'purple',
    },
  ], [myRequests, pendingReviews]);

  // Convert platform activity to local ActivityEvent format
  const activityEvents: ActivityEvent[] = useMemo(() => {
    if (platformActivity.length > 0) {
      return platformActivity.map((event) => ({
        id: event.id,
        type: event.type as ActivityEvent['type'],
        message: event.message,
        timestamp: new Date(event.timestamp),
        highlight: event.highlight,
      }));
    }

    // Fallback to simulated data if no real activity
    return [
      { id: '1', type: 'claim', message: 'An expert claimed a review', timestamp: new Date(Date.now() - 2 * 60 * 1000) },
      { id: '2', type: 'submit', message: 'Feedback submitted', timestamp: new Date(Date.now() - 5 * 60 * 1000) },
      { id: '3', type: 'accept', message: 'A review was accepted', timestamp: new Date(Date.now() - 15 * 60 * 1000) },
    ];
  }, [platformActivity]);

  // Generate predictions
  const predictions: Prediction[] = useMemo(() => {
    return generatePredictions({
      role,
      lastActivityDay: 'Thursday',
      lastActivityTime: '3:00 PM',
      avgReviewTime: role === 'reviewer' ? 35 : undefined,
      upcomingDeadlines: activeReviews.filter(r => r.urgency_level === 'HIGH' || r.urgency_level === 'CRITICAL').length,
    });
  }, [role, activeReviews]);

  // Generate countdown moments
  const countdownMoments: CountdownMoment[] = useMemo(() => {
    const moments: CountdownMoment[] = [];

    // Streak milestone
    const streak = karmaSummary?.current_streak ?? 0;
    if (streak > 0 && streak < 7) {
      moments.push({
        id: 'streak-7',
        type: 'streak',
        title: '7-day streak badge',
        targetDate: new Date(Date.now() + (7 - streak) * 24 * 60 * 60 * 1000),
        currentValue: streak,
        targetValue: 7,
      });
    }

    return moments;
  }, [karmaSummary]);

  // Reviewer earnings data
  const reviewerEarnings = useMemo(() => {
    const today = completedReviews
      .filter(r => r.accepted_at && new Date(r.accepted_at).toDateString() === new Date().toDateString())
      .reduce((sum, r) => sum + (r.payment_amount || 0), 0);

    const thisWeek = completedReviews
      .filter(r => {
        if (!r.accepted_at) return false;
        const date = new Date(r.accepted_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      })
      .reduce((sum, r) => sum + (r.payment_amount || 0), 0);

    const thisMonth = completedReviews
      .filter(r => {
        if (!r.accepted_at) return false;
        const date = new Date(r.accepted_at);
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return date >= monthAgo;
      })
      .reduce((sum, r) => sum + (r.payment_amount || 0), 0);

    const allTime = completedReviews.reduce((sum, r) => sum + (r.payment_amount || 0), 0);

    return { today, thisWeek, thisMonth, allTime };
  }, [completedReviews]);

  // Greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className={cn('min-h-screen bg-[var(--background-subtle)]', className)}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3">

        {/* Main Content with Role Transition */}
        <DashboardTransition role={role}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_300px] gap-3">

            {/* Main Column */}
            <div className="space-y-3">

              {/* Header Row - Single baseline, two clusters */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
              >
                {/* LEFT: "Who am I right now?" */}
                <div className="flex items-center gap-3">
                  {/* Role Toggle */}
                  <AnimatedRoleToggle
                    role={role}
                    onRoleChange={handleRoleChange}
                    disabled={isTransitioning}
                    variant="compact"
                  />

                  {/* Divider */}
                  <div className="w-px h-6 bg-border/60" />

                  {/* Identity: Tier + Greeting + Progress */}
                  <div className="flex items-center gap-2">
                    {karmaSummary && (
                      <TierProgressRing
                        karma={karmaSummary.total_karma}
                        userTier={karmaSummary.user_tier}
                        size="sm"
                      />
                    )}
                    <div className="leading-tight">
                      <p className="text-sm font-medium text-foreground">
                        {getGreeting()}, {user?.full_name || user?.email?.split('@')[0] || 'there'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {karmaSummary ? `${karmaSummary.total_karma} sparks · ${karmaSummary.user_tier}` : 'Building momentum...'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* RIGHT: "What can I do now?" */}
                <div className="flex items-center gap-2">
                  <OnlineCounter count={platformStats?.reviewers_online ?? 15} size="sm" />
                  {role === 'creator' ? (
                    <Link
                      href="/review/new"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent-blue to-blue-600 text-white text-xs font-medium shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Review</span>
                    </Link>
                  ) : (
                    <Link
                      href="/browse"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-medium shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Find Reviews</span>
                    </Link>
                  )}
                </div>
              </motion.div>

              {/* Hero Action Block - starts on same grid */}
              <HeroActionBlock
                action={heroAction}
                role={role}
                alternateCount={role === 'creator' ? Math.max(0, pendingReviews.length - 1) : Math.max(0, activeReviews.length - 1)}
                isLoading={isLoading}
              />

              {/* Role-specific content */}
              {role === 'creator' ? (
                <>
                  {/* Creator Stats */}
                  <AnimatedStatsGrid stats={creatorStats} columns={4} />

                  {/* Activity Kanban */}
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">Your Pipeline</p>
                    <KanbanBoard
                      role={role}
                      columns={kanbanColumns}
                      isLoading={isLoading}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Reviewer Quick Stats */}
                  <ReviewerQuickStats
                    activeClaims={activeReviews.length}
                    pendingSubmissions={submittedReviews.length}
                    availableReviews={12}
                    potentialEarnings={activeReviews.reduce((sum, r) => sum + (r.earnings_potential || 0), 0)}
                  />

                  {/* Earnings Dashboard */}
                  <EarningsDashboard
                    today={reviewerEarnings.today}
                    thisWeek={reviewerEarnings.thisWeek}
                    thisMonth={reviewerEarnings.thisMonth}
                    allTime={reviewerEarnings.allTime}
                    weeklyGoal={200}
                  />

                  {/* Activity Kanban */}
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">Your Review Pipeline</p>
                    <KanbanBoard
                      role={role}
                      columns={kanbanColumns}
                      isLoading={isLoading}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Sidebar - Unified Insights Rail */}
            <div className="rounded-xl border border-border/60 bg-background/50 backdrop-blur-sm overflow-hidden">
              {/* Rail Header with Streak */}
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Insights
                </p>
                <HideInZenMode>
                  {(karmaSummary?.current_streak ?? 0) > 0 && (
                    <StreakCounter
                      streak={karmaSummary?.current_streak ?? 0}
                      atRisk={false}
                    />
                  )}
                </HideInZenMode>
              </div>

              {/* Rail Content */}
              <div className="divide-y divide-border">
                {/* Story Stats */}
                <div className="p-3">
                  <StoryModeStats
                    stats={storyStats}
                    role={role}
                    userName={user?.full_name || undefined}
                  />
                </div>

                {/* Upcoming Events */}
                <HideInZenMode>
                  <div className="p-3">
                    <UpcomingEventsSection
                      moments={countdownMoments}
                      predictions={predictions}
                    />
                  </div>
                </HideInZenMode>

                {/* Live Activity */}
                <div className="p-3">
                  <LiveActivityFeed events={activityEvents} maxItems={3} />
                </div>

                {/* Performance - Reviewer only */}
                {role === 'reviewer' && (
                  <div className="p-3">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Performance
                    </p>
                    <EfficiencyMetrics
                      avgTimePerReview={35}
                      acceptanceRate={userStoryStats?.acceptance_rate ?? 95}
                      avgRating={userStoryStats?.average_rating ?? 4.7}
                      percentileRank={userStoryStats?.percentile_rank ?? 50}
                      totalReviews={userStoryStats?.total_reviews_given ?? completedReviews.length}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </DashboardTransition>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        role={role}
      />

      {/* Quick Action Bar */}
      <QuickActionBar role={role} />

      {/* Celebrations */}
      <CelebrationToast celebration={celebration} onDismiss={dismissCelebration} />
    </div>
  );
}

// =============================================================================
// TRANSFORM FUNCTIONS
// =============================================================================

function transformCreatorToKanban(
  pending: PendingReviewItem[],
  requests: MyRequestItem[]
): KanbanColumn[] {
  const baseColumns = getDefaultColumns('creator');

  const pendingItems = pending.map((item) => ({
    id: item.slot_id,
    title: item.review_request_title,
    description: `Review from ${item.reviewer?.name || 'Unknown'}`,
    contentType: 'design' as const,
    status: 'pending' as const,
    urgency: item.urgency_level as any,
    timeText: item.countdown_text,
    rating: item.rating,
    onView: () => window.location.href = `/review/${item.review_request_id}`,
  }));

  const inProgressRequests = requests.filter(
    (r) => r.status === 'in_review' || r.status === 'pending'
  );

  const inProgressItems = inProgressRequests.map((item) => ({
    id: item.id,
    title: item.title,
    contentType: item.content_type as any,
    status: 'in_review' as const,
    timeText: new Date(item.created_at).toLocaleDateString(),
    progress: {
      current: item.progress.submitted,
      total: item.progress.requested,
      percentage: item.progress.percentage,
    },
    onView: () => window.location.href = `/review/${item.id}`,
  }));

  const completedRequests = requests.filter((r) => r.status === 'completed');

  const completedItems = completedRequests.map((item) => ({
    id: item.id,
    title: item.title,
    contentType: item.content_type as any,
    status: 'completed' as const,
    timeText: new Date(item.created_at).toLocaleDateString(),
    onView: () => window.location.href = `/review/${item.id}`,
  }));

  return [
    { ...baseColumns[0], items: pendingItems } as KanbanColumn,
    { ...baseColumns[1], items: inProgressItems } as KanbanColumn,
    { ...baseColumns[2], items: completedItems } as KanbanColumn,
  ];
}

function transformReviewerToKanban(
  active: ActiveReviewItem[],
  submitted: SubmittedReviewItem[],
  completed: CompletedReviewItem[]
): KanbanColumn[] {
  const baseColumns = getDefaultColumns('reviewer');

  const workingItems = active.map((item) => ({
    id: item.slot_id,
    title: item.review_request?.title || 'Untitled',
    contentType: item.review_request?.content_type as any || 'design',
    status: 'claimed' as const,
    urgency: item.urgency_level as any,
    timeText: item.countdown_text,
    earnings: item.earnings_potential,
    onView: () => window.location.href = `/reviewer/review/${item.slot_id}`,
  }));

  const submittedItems = submitted.map((item) => ({
    id: item.slot_id,
    title: item.review_request?.title || 'Untitled',
    contentType: item.review_request?.content_type as any || 'design',
    status: 'submitted' as const,
    urgency: item.urgency_level as any,
    timeText: item.countdown_text,
    earnings: item.payment_amount,
    rating: item.rating,
    onView: () => window.location.href = `/reviewer/review/${item.slot_id}`,
  }));

  const completedItems = completed.map((item) => ({
    id: item.slot_id,
    title: item.review_request?.title || 'Untitled',
    contentType: item.review_request?.content_type as any || 'design',
    status: 'completed' as const,
    timeText: item.accepted_at ? new Date(item.accepted_at).toLocaleDateString() : '',
    earnings: item.payment_amount,
    rating: item.rating,
    onView: () => window.location.href = `/reviewer/review/${item.slot_id}`,
  }));

  return [
    { ...baseColumns[1], items: workingItems } as KanbanColumn,
    { ...baseColumns[2], items: submittedItems } as KanbanColumn,
    { ...baseColumns[3], items: completedItems } as KanbanColumn,
  ];
}

export default ElevatedDashboard;
