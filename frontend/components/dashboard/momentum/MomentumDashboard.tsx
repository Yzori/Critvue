'use client';

/**
 * MomentumDashboard Component
 *
 * An innovative, distinctive dashboard that goes beyond standard SaaS patterns.
 * Combines gamification, contextual intelligence, and smooth interactions.
 *
 * Key Features:
 * - Central Momentum Ring showing flow state
 * - Smart contextual action cards
 * - Integrated gamification stats bar
 * - Role-fluid design (creator/reviewer)
 * - Micro-celebrations for achievements
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────┐
 * │  Quick Stats Bar (karma, XP, badges, leaderboard)  │
 * ├─────────────────────────────────────────────────────┤
 * │                                                     │
 * │   ┌──────────┐    ┌──────────────────────────┐     │
 * │   │ Momentum │    │ Smart Action Card        │     │
 * │   │   Ring   │    │ (contextual suggestion)  │     │
 * │   │          │    └──────────────────────────┘     │
 * │   │          │    ┌──────────────────────────┐     │
 * │   │          │    │ Smart Action Card 2      │     │
 * │   └──────────┘    └──────────────────────────┘     │
 * │                                                     │
 * ├─────────────────────────────────────────────────────┤
 * │           Kanban / Activity Section                 │
 * └─────────────────────────────────────────────────────┘
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Palette,
  Briefcase,
  Command as CommandIcon,
  RefreshCw,
  AlertTriangle,
  Plus,
  Search,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Momentum Components
import { MomentumRing } from './MomentumRing';
import { QuickStatsBar } from './QuickStatsBar';
import { SmartActionCard, generateSmartActions, type SmartAction } from './SmartActionCard';
import { Celebration, useCelebration } from './Celebration';

// Command Center Components (reused)
import { CommandPalette } from '../desktop/command-center/CommandPalette';
import { KanbanBoard, KanbanColumn, getDefaultColumns } from '../desktop/command-center/KanbanBoard';
import { QuickActionBar } from '../desktop/command-center/QuickActionBar';
import { ReviewActionCardProps } from '../desktop/command-center/ReviewActionCard';

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
  getMyBadges,
  getMyRanking,
  type KarmaSummary,
  type Badge as BadgeType,
  type UserRanking,
} from '@/lib/api/karma';
import { getErrorMessage, isRetryableError } from '@/lib/api/client';

export interface MomentumDashboardProps {
  role: 'creator' | 'reviewer';
  onRoleChange: (role: 'creator' | 'reviewer') => void;
  className?: string;
}

export function MomentumDashboard({
  role,
  onRoleChange,
  className,
}: MomentumDashboardProps) {
  const { user } = useAuth();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<{ message: string; isRetryable: boolean } | null>(null);

  // Karma/gamification state
  const [karmaSummary, setKarmaSummary] = React.useState<KarmaSummary | null>(null);
  const [featuredBadges, setFeaturedBadges] = React.useState<BadgeType[]>([]);
  const [leaderboardRank, setLeaderboardRank] = React.useState<UserRanking | null>(null);

  // Smart actions state
  const [smartActions, setSmartActions] = React.useState<SmartAction[]>([]);
  const [dismissedActions, setDismissedActions] = React.useState<Set<string>>(new Set());

  // Kanban state
  const [kanbanColumns, setKanbanColumns] = React.useState<KanbanColumn[]>([]);
  const [pendingCount, setPendingCount] = React.useState(0);

  // Celebrations
  // showCelebration reserved for future milestone/achievement triggering
  const { celebration, showCelebration: _showCelebration, hideCelebration, isVisible: isCelebrating } = useCelebration();

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'r') {
        e.preventDefault();
        onRoleChange(role === 'creator' ? 'reviewer' : 'creator');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [role, onRoleChange]);

  // Load all data
  React.useEffect(() => {
    loadAllData();
  }, [role]);

  async function loadAllData() {
    setIsLoading(true);
    setError(null);

    try {
      // Load karma data (for both roles)
      const karmaPromise = loadKarmaData();

      // Load role-specific data
      if (role === 'creator') {
        await Promise.all([karmaPromise, loadCreatorData()]);
      } else {
        await Promise.all([karmaPromise, loadReviewerData()]);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError({
        message: getErrorMessage(err),
        isRetryable: isRetryableError(err),
      });
      setKanbanColumns(getDefaultColumns(role).map(col => ({ ...col, items: [] })));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadKarmaData() {
    try {
      const [summary, badges, ranking] = await Promise.all([
        getKarmaSummary().catch(() => null),
        getMyBadges(false).catch(() => []),
        getMyRanking('weekly', 'overall').catch(() => null),
      ]);

      if (summary) {
        setKarmaSummary(summary);

        // Generate smart actions based on karma data
        const actions = generateSmartActions({
          streak: summary.current_streak,
          weeklyProgress: summary.weekly_reviews,
          weeklyGoal: summary.weekly_goal,
          pendingReviews: pendingCount,
          lastActiveDate: summary.last_active_date ? new Date(summary.last_active_date) : null,
          role,
        });
        setSmartActions(actions);
      }

      setFeaturedBadges(badges.filter(b => b.is_featured).slice(0, 3));
      setLeaderboardRank(ranking);
    } catch (err) {
      console.error('Error loading karma data:', err);
    }
  }

  async function loadCreatorData() {
    const actionsResponse = await getActionsNeeded(1, 20);
    const requestsResponse = await getMyRequests(undefined, 1, 50);

    setPendingCount(actionsResponse.items.length);

    const columns = transformCreatorDataToKanban(
      actionsResponse.items,
      requestsResponse.items
    );

    setKanbanColumns(columns);
  }

  async function loadReviewerData() {
    const [activeResponse, submittedResponse, completedResponse] = await Promise.all([
      getActiveReviews(1, 20),
      getSubmittedReviews(1, 20),
      getCompletedReviews(1, 20),
    ]);

    const columns = transformReviewerDataToKanban(
      activeResponse.items,
      submittedResponse.items,
      completedResponse.items
    );

    setKanbanColumns(columns);
  }

  const handleDismissAction = (actionType: string) => {
    setDismissedActions(prev => new Set([...prev, actionType]));
  };

  const visibleActions = smartActions.filter(a => !dismissedActions.has(a.type)).slice(0, 2);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Quick Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <QuickStatsBar
            karma={karmaSummary?.total_karma || 0}
            karmaChange={0} // TODO: Calculate from history
            xp={karmaSummary?.total_xp || 0}
            leaderboardRank={leaderboardRank?.rank}
            leaderboardTotal={leaderboardRank?.total_participants}
            featuredBadges={featuredBadges}
          />
        </motion.div>

        {/* Hero Section: Momentum Ring + Smart Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Momentum Ring + Welcome */}
            <div className="lg:col-span-4 flex flex-col items-center lg:items-start">
              <div className="flex flex-col lg:flex-row items-center gap-6">
                {/* Momentum Ring */}
                {karmaSummary ? (
                  <MomentumRing
                    streak={karmaSummary.current_streak}
                    weeklyProgress={karmaSummary.weekly_reviews}
                    weeklyGoal={karmaSummary.weekly_goal}
                    xp={karmaSummary.total_xp}
                    reputation={karmaSummary.reputation_score}
                    size="md"
                  />
                ) : (
                  <div className="h-[180px] w-[180px] rounded-full bg-muted/30 animate-pulse" />
                )}

                {/* Welcome text */}
                <div className="text-center lg:text-left">
                  <p className="text-sm text-muted-foreground mb-1">
                    {getGreeting()},
                  </p>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {user?.full_name || user?.email?.split('@')[0] || 'there'}!
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {role === 'creator'
                      ? "Let's check on your feedback"
                      : 'Ready to review some work?'}
                  </p>
                </div>
              </div>

              {/* Role Toggle (below ring on mobile) */}
              <div className="mt-6 flex items-center gap-2 p-1.5 rounded-2xl bg-muted/50 border border-border">
                <button
                  onClick={() => onRoleChange('creator')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl',
                    'font-medium text-sm transition-all duration-200',
                    role === 'creator'
                      ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/25'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Palette className="size-4" />
                  Creator
                </button>
                <button
                  onClick={() => onRoleChange('reviewer')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl',
                    'font-medium text-sm transition-all duration-200',
                    role === 'reviewer'
                      ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/25'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Briefcase className="size-4" />
                  Reviewer
                </button>
              </div>
            </div>

            {/* Right: Smart Action Cards */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Suggested Actions
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CommandIcon className="size-3.5" />
                  <span>
                    <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">⌘K</kbd> search
                    {' • '}
                    <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">⌘⇧R</kbd> switch role
                  </span>
                </div>
              </div>

              <AnimatePresence mode="popLayout">
                {visibleActions.length > 0 ? (
                  visibleActions.map((action) => (
                    <SmartActionCard
                      key={action.type}
                      action={action}
                      onDismiss={() => handleDismissAction(action.type)}
                    />
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-2xl border-2 border-dashed border-muted p-8 text-center"
                  >
                    <p className="text-muted-foreground mb-4">
                      You're all caught up!
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      {role === 'creator' ? (
                        <Button asChild>
                          <Link href="/submit">
                            <Plus className="h-4 w-4 mr-2" />
                            Request a Review
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild>
                          <Link href="/browse">
                            <Search className="h-4 w-4 mr-2" />
                            Find Reviews
                          </Link>
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Failed to load data</p>
                <p className="mt-1 text-sm text-red-700">{error.message}</p>
              </div>
              {error.isRetryable && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadAllData()}
                  disabled={isLoading}
                  className="flex-shrink-0 border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className={cn('size-4 mr-2', isLoading && 'animate-spin')} />
                  Retry
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Kanban Board */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <KanbanBoard
            role={role}
            columns={kanbanColumns}
            isLoading={isLoading}
          />
        </motion.div>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        role={role}
      />

      {/* Quick Action Bar */}
      <QuickActionBar role={role} />

      {/* Celebration overlay */}
      {celebration && (
        <Celebration
          type={celebration.type}
          title={celebration.title}
          subtitle={celebration.subtitle}
          value={celebration.value}
          isVisible={isCelebrating}
          onComplete={hideCelebration}
        />
      )}
    </div>
  );
}

// Transform functions (same as CommandCenterDashboard)
function transformCreatorDataToKanban(
  actionsNeeded: PendingReviewItem[],
  allRequests: MyRequestItem[]
): KanbanColumn[] {
  const baseColumns = getDefaultColumns('creator');

  const pendingItems: ReviewActionCardProps[] = actionsNeeded.map((item) => ({
    id: item.slot_id,
    title: item.review_request_title,
    description: `Review from ${item.reviewer?.name || 'Unknown'}`,
    contentType: 'design',
    status: 'pending',
    urgency: item.urgency_level as any,
    timeText: item.countdown_text,
    rating: item.rating,
    primaryAction: {
      label: 'Accept',
      onClick: () => console.log('Accept', item.slot_id),
      variant: 'success',
    },
    secondaryAction: {
      label: 'Decline',
      onClick: () => console.log('Decline', item.slot_id),
    },
    onView: () => window.location.href = `/review/${item.review_request_id}`,
  }));

  const inProgressRequests = allRequests.filter((r) =>
    (r.status === 'in_review' && r.progress.claimed > 0 && r.progress.submitted < r.progress.requested) ||
    r.status === 'draft' ||
    r.status === 'pending'
  );

  const inProgressItems: ReviewActionCardProps[] = inProgressRequests.map((item) => ({
    id: item.id,
    title: item.title,
    contentType: item.content_type as any,
    status: item.status === 'draft' || item.status === 'pending' ? 'available' : 'in_review',
    timeText: new Date(item.created_at).toLocaleDateString(),
    progress: {
      current: item.progress.submitted,
      total: item.progress.requested,
      percentage: item.progress.requested > 0
        ? Math.round((item.progress.submitted / item.progress.requested) * 100)
        : 0,
    },
    onView: () => window.location.href = `/review/${item.id}`,
  }));

  const completedRequests = allRequests.filter((r) => r.status === 'completed');

  const completedItems: ReviewActionCardProps[] = completedRequests.map((item) => ({
    id: item.id,
    title: item.title,
    contentType: item.content_type as any,
    status: 'completed',
    timeText: new Date(item.created_at).toLocaleDateString(),
    progress: {
      current: item.progress.accepted,
      total: item.progress.requested,
      percentage: 100,
    },
    onView: () => window.location.href = `/review/${item.id}`,
  }));

  return [
    { ...baseColumns[0], items: pendingItems } as KanbanColumn,
    { ...baseColumns[1], items: inProgressItems } as KanbanColumn,
    { ...baseColumns[2], items: completedItems } as KanbanColumn,
  ];
}

function transformReviewerDataToKanban(
  activeReviews: ActiveReviewItem[],
  submittedReviews: SubmittedReviewItem[],
  completedReviews: CompletedReviewItem[]
): KanbanColumn[] {
  const baseColumns = getDefaultColumns('reviewer');

  // Skip baseColumns[0] (Available) - users can find reviews via Browse page
  const workingOnItems: ReviewActionCardProps[] = activeReviews.map((item) => ({
    id: item.slot_id,
    title: item.review_request?.title || 'Untitled',
    description: item.review_request?.description_preview,
    contentType: item.review_request?.content_type as any || 'design',
    status: 'claimed',
    urgency: item.urgency_level as any,
    timeText: item.countdown_text,
    earnings: item.earnings_potential,
    primaryAction: {
      label: item.draft_progress.has_draft ? 'Continue' : 'Start',
      onClick: () => window.location.href = `/reviewer/review/${item.slot_id}`,
    },
    onView: () => window.location.href = `/reviewer/review/${item.slot_id}`,
  }));

  const submittedItems: ReviewActionCardProps[] = submittedReviews.map((item) => ({
    id: item.slot_id,
    title: item.review_request?.title || 'Untitled',
    contentType: item.review_request?.content_type as any || 'design',
    status: 'submitted',
    urgency: item.urgency_level as any,
    timeText: item.countdown_text,
    earnings: item.payment_amount,
    rating: item.rating,
    onView: () => window.location.href = `/reviewer/review/${item.slot_id}`,
  }));

  const completedItems: ReviewActionCardProps[] = completedReviews.map((item) => ({
    id: item.slot_id,
    title: item.review_request?.title || 'Untitled',
    contentType: item.review_request?.content_type as any || 'design',
    status: 'completed',
    timeText: item.accepted_at ? new Date(item.accepted_at).toLocaleDateString() : '',
    earnings: item.payment_amount,
    rating: item.rating,
    onView: () => window.location.href = `/reviewer/review/${item.slot_id}`,
  }));

  // Return only 3 columns: Working On, Submitted, Completed (skip Available)
  return [
    { ...baseColumns[1], items: workingOnItems } as KanbanColumn,
    { ...baseColumns[2], items: submittedItems } as KanbanColumn,
    { ...baseColumns[3], items: completedItems } as KanbanColumn,
  ];
}

export default MomentumDashboard;
