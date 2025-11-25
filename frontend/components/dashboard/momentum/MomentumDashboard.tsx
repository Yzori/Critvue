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
  RefreshCw,
  AlertTriangle,
  Plus,
  Search,
  Star,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Momentum Components
import { TierProgressRing } from './TierProgressRing';
import { generateSmartActions, type SmartAction } from './SmartActionCard';
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
  // Reserved for future QuickStatsBar integration
  const [_featuredBadges, setFeaturedBadges] = React.useState<BadgeType[]>([]);
  const [_leaderboardRank, setLeaderboardRank] = React.useState<UserRanking | null>(null);

  // Smart actions state
  const [smartActions, setSmartActions] = React.useState<SmartAction[]>([]);
  const [dismissedActions, _setDismissedActions] = React.useState<Set<string>>(new Set());

  // Kanban state
  const [kanbanColumns, setKanbanColumns] = React.useState<KanbanColumn[]>([]);
  const [pendingCount, setPendingCount] = React.useState(0);

  // Celebrations
  // showCelebration reserved for future milestone/achievement triggering
  const { celebration, showCelebration: _showCelebration, hideCelebration, isVisible: isCelebrating } = useCelebration();

  // Expert banner state (with localStorage persistence)
  const [showExpertBanner, setShowExpertBanner] = React.useState(true);

  // Load expert banner preference from localStorage
  React.useEffect(() => {
    const dismissed = localStorage.getItem('expertBannerDismissed');
    if (dismissed === 'true') {
      setShowExpertBanner(false);
    }
  }, []);

  // Handle expert banner dismissal
  const handleDismissExpertBanner = () => {
    setShowExpertBanner(false);
    localStorage.setItem('expertBannerDismissed', 'true');
  };

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

  // Reserved for future action dismiss functionality
  // const handleDismissAction = (actionType: string) => {
  //   _setDismissedActions(prev => new Set([...prev, actionType]));
  // };

  const visibleActions = smartActions.filter(a => !dismissedActions.has(a.type)).slice(0, 2);
  const primaryAction = visibleActions[0] ?? null;

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className={cn('min-h-screen bg-[#FAFAFC]', className)}>
      <div className="max-w-[1400px] mx-auto px-6 py-4">

        {/* Hero Section - Compact horizontal layout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-2xl bg-white border border-border/60 shadow-sm"
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Left: Ring + Greeting */}
            <div className="flex items-center gap-4">
              {/* Tier Progress Ring - links to karma page */}
              {karmaSummary ? (
                <TierProgressRing
                  karma={karmaSummary.total_karma}
                  size="sm"
                />
              ) : (
                <div className="h-[88px] w-[88px] rounded-full bg-muted/30 animate-pulse" />
              )}

              {/* Greeting - tighter spacing */}
              <div>
                <p className="text-[11px] text-muted-foreground/70 leading-none">{getGreeting()}</p>
                <h2 className="text-lg font-semibold text-foreground mt-0.5 leading-tight">
                  {user?.full_name || user?.email?.split('@')[0] || 'there'}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5 leading-tight">
                  {role === 'creator'
                    ? "Let's check on your feedback"
                    : 'Ready to review some work?'}
                </p>
              </div>
            </div>

            {/* Spacer */}
            <div className="hidden lg:block flex-1" />

            {/* Right: Role Toggle + Expert CTA */}
            <div className="flex items-center gap-3">
              {/* Role Toggle */}
              <div className="flex items-center p-1 rounded-lg bg-muted/50 border border-border/50">
                <button
                  onClick={() => onRoleChange('creator')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                    role === 'creator'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                  )}
                >
                  <Palette className="size-3.5" />
                  Creator
                </button>
                <button
                  onClick={() => onRoleChange('reviewer')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                    role === 'reviewer'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                  )}
                >
                  <Briefcase className="size-3.5" />
                  Reviewer
                </button>
              </div>

              {/* Expert CTA - subtle inline upgrade prompt */}
              <AnimatePresence>
                {showExpertBanner && user?.role !== 'reviewer' && user?.role !== 'admin' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200/60"
                  >
                    <Star className="size-3.5 text-orange-500 fill-orange-500" />
                    <span className="text-xs text-orange-700 font-medium whitespace-nowrap">
                      Become an Expert
                    </span>
                    <Link
                      href="/apply/expert"
                      className="px-2 py-0.5 rounded-md bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 transition-colors"
                    >
                      Apply
                    </Link>
                    <button
                      onClick={handleDismissExpertBanner}
                      className="p-0.5 hover:bg-orange-100 rounded transition-colors"
                      aria-label="Dismiss"
                    >
                      <X className="size-3 text-orange-400" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Keyboard shortcuts hint */}
              <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground/60">
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">⌘K</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">⌘⇧R</kbd>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Suggested Actions - Elevated card with gradient accent */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-violet-50/40 border border-blue-100/80 shadow-sm">
            <div className="flex items-center gap-4">
              {/* Larger Icon - 44px */}
              <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-white shadow-md border border-blue-100/50">
                {role === 'reviewer' ? (
                  <Search className="h-5 w-5 text-blue-600" />
                ) : (
                  <Palette className="h-5 w-5 text-blue-600" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  {primaryAction ? (
                    <motion.div
                      key="actions"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <p className="font-semibold text-foreground text-sm">
                        {primaryAction.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {primaryAction.description}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <p className="font-semibold text-foreground text-sm">You're all caught up!</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {role === 'creator'
                          ? 'Submit work to get expert feedback.'
                          : 'Browse available reviews to keep going.'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* CTA Button - Gradient blue for primary action */}
              <div className="flex-shrink-0">
                {role === 'creator' ? (
                  <Link
                    href={primaryAction?.ctaHref ?? '/submit'}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white text-sm font-medium shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:scale-[1.02]"
                  >
                    <Plus className="h-4 w-4" />
                    {primaryAction?.ctaLabel ?? 'Submit Work'}
                  </Link>
                ) : (
                  <Link
                    href={primaryAction?.ctaHref ?? '/browse'}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white text-sm font-medium shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:scale-[1.02]"
                  >
                    <Search className="h-4 w-4" />
                    {primaryAction?.ctaLabel ?? 'Browse Reviews'}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3 rounded-xl border border-red-200 bg-red-50"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700 flex-1">{error.message}</p>
              {error.isRetryable && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => loadAllData()}
                  disabled={isLoading}
                  className="text-red-700 hover:bg-red-100 h-7"
                >
                  <RefreshCw className={cn('size-3.5 mr-1.5', isLoading && 'animate-spin')} />
                  Retry
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Activity Section Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-3"
        >
          <h3 className="text-sm font-semibold text-foreground">Your Activity</h3>
          <p className="text-xs text-muted-foreground/80">
            Track your work in progress
          </p>
        </motion.div>

        {/* Kanban Board */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
