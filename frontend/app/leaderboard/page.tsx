'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Trophy,
  TrendingUp,
  Award,
  Heart,
  Star,
  Filter,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserTier } from '@/lib/types/tier';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LeaderboardCard } from '@/components/leaderboard/leaderboard-card';
import { LeaderboardSkeleton } from '@/components/leaderboard/leaderboard-skeleton';
import { CurrentUserPosition } from '@/components/leaderboard/current-user-position';
import {
  getLeaderboard,
  getCurrentUserPosition,
  getUserPercentile,
  LeaderboardStatType,
  LeaderboardTimePeriod,
  LeaderboardEntry,
  LeaderboardResponse,
  getStatTypeLabel,
  getTimePeriodLabel,
} from '@/lib/api/leaderboard';

/**
 * Leaderboard Page
 *
 * Main leaderboard view with tabs for different stats, time period filters,
 * optional tier filters, and podium design for top performers.
 */
export default function LeaderboardPage() {
  // State
  const [statType, setStatType] = React.useState<LeaderboardStatType>(
    LeaderboardStatType.KARMA
  );
  const [timePeriod, setTimePeriod] = React.useState<LeaderboardTimePeriod>(
    LeaderboardTimePeriod.WEEKLY
  );
  const [tierFilter, setTierFilter] = React.useState<UserTier | 'all'>('all');
  const [leaderboardData, setLeaderboardData] =
    React.useState<LeaderboardResponse | null>(null);
  const [currentUserEntry, setCurrentUserEntry] =
    React.useState<LeaderboardEntry | null>(null);
  const [userPercentile, setUserPercentile] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  // Refs
  const currentUserRef = React.useRef<HTMLDivElement>(null);
  const hasShownConfetti = React.useRef(false);
  const touchStartY = React.useRef(0);
  const pullToRefreshThreshold = 80;
  const [isPulling, setIsPulling] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);

  // Fetch leaderboard data
  const fetchLeaderboard = React.useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        if (pageNum === 1) {
          setIsLoading(true);
          setError(null);
        } else {
          setIsLoadingMore(true);
        }

        const [leaderboard, userPosition, percentile] = await Promise.all([
          getLeaderboard({
            statType,
            timePeriod,
            tier: tierFilter === 'all' ? undefined : tierFilter,
            page: pageNum,
            pageSize: 50,
          }),
          getCurrentUserPosition(statType, timePeriod),
          getUserPercentile(),
        ]);

        if (append && leaderboardData) {
          setLeaderboardData({
            ...leaderboard,
            entries: [...leaderboardData.entries, ...leaderboard.entries],
          });
        } else {
          setLeaderboardData(leaderboard);
        }

        setCurrentUserEntry(userPosition);
        setUserPercentile(percentile.percentile);

        // Show confetti if user is in top 10 (only once)
        if (
          !hasShownConfetti.current &&
          userPosition.rank <= 10 &&
          pageNum === 1
        ) {
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#3B82F6', '#F97316', '#4ADE80'],
            });
          }, 500);
          hasShownConfetti.current = true;
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setError(
          'Failed to load leaderboard. Please check your connection and try again.'
        );
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [statType, timePeriod, tierFilter, leaderboardData]
  );

  // Initial load and refetch on filter changes
  React.useEffect(() => {
    setPage(1);
    hasShownConfetti.current = false;
    fetchLeaderboard(1, false);
  }, [statType, timePeriod, tierFilter]);

  // Infinite scroll
  React.useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 500 &&
        !isLoadingMore &&
        leaderboardData?.pagination.hasMore
      ) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchLeaderboard(nextPage, true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoadingMore, leaderboardData, page, fetchLeaderboard]);

  // Pull to refresh (mobile)
  React.useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0 && e.touches[0]) {
        touchStartY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && touchStartY.current > 0 && e.touches[0]) {
        const currentY = e.touches[0].clientY;
        const distance = currentY - touchStartY.current;
        if (distance > 0) {
          setPullDistance(Math.min(distance, pullToRefreshThreshold + 20));
          if (distance > 10) {
            setIsPulling(true);
          }
        }
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance >= pullToRefreshThreshold) {
        setPage(1);
        fetchLeaderboard(1, false);
      }
      setIsPulling(false);
      setPullDistance(0);
      touchStartY.current = 0;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, fetchLeaderboard]);

  // Jump to current user position
  const handleJumpToPosition = () => {
    currentUserRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  // Stat type icons
  const statIcons = {
    [LeaderboardStatType.KARMA]: Trophy,
    [LeaderboardStatType.ACCEPTANCE_RATE]: Award,
    [LeaderboardStatType.STREAK]: TrendingUp,
    [LeaderboardStatType.REVIEWS]: Star,
    [LeaderboardStatType.HELPFUL_RATING]: Heart,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {isPulling && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: pullDistance - 40 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed left-1/2 top-0 z-50 -translate-x-1/2"
          >
            <div className="flex items-center gap-2 rounded-full bg-[#3B82F6] px-4 py-2 text-white shadow-lg">
              <RefreshCw
                className={cn(
                  'h-4 w-4',
                  pullDistance >= pullToRefreshThreshold && 'animate-spin'
                )}
              />
              <span className="text-sm font-medium">
                {pullDistance >= pullToRefreshThreshold
                  ? 'Release to refresh'
                  : 'Pull to refresh'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="mb-2 flex items-center gap-2 font-bold text-3xl">
              <Trophy className="h-8 w-8 text-[#3B82F6]" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground">
              See how you stack up against the Critvue community
            </p>
          </motion.div>

          {/* Filters */}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Time Period */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Period:</span>
              <Select
                value={timePeriod}
                onValueChange={(value) =>
                  setTimePeriod(value as LeaderboardTimePeriod)
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(LeaderboardTimePeriod).map((period) => (
                    <SelectItem key={period} value={period}>
                      {getTimePeriodLabel(period)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tier Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Tier:</span>
              <Select
                value={tierFilter}
                onValueChange={(value) =>
                  setTierFilter(value as UserTier | 'all')
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  {Object.values(UserTier).map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {tier
                        .split('_')
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Type Tabs */}
      <div className="border-b bg-card">
        <div className="container mx-auto max-w-7xl px-4">
          <Tabs
            value={statType}
            onValueChange={(value) => setStatType(value as LeaderboardStatType)}
            className="w-full"
          >
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-transparent p-0 sm:flex sm:w-auto sm:justify-start">
              {Object.values(LeaderboardStatType).map((type) => {
                const Icon = statIcons[type];
                return (
                  <TabsTrigger
                    key={type}
                    value={type}
                    className="flex items-center gap-1.5 data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white sm:gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {getStatTypeLabel(type)}
                    </span>
                    <span className="sm:hidden">
                      {getStatTypeLabel(type).split(' ')[0]}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-6">
          {/* Leaderboard List */}
          <div className="flex-1">
            {isLoading ? (
              <LeaderboardSkeleton count={10} />
            ) : error ? (
              // Error State
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center rounded-xl border border-destructive/50 bg-destructive/5 p-12 text-center"
              >
                <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
                <h3 className="mb-2 font-semibold text-lg">
                  Unable to Load Leaderboard
                </h3>
                <p className="mb-6 text-muted-foreground text-sm">{error}</p>
                <Button
                  onClick={() => fetchLeaderboard(1, false)}
                  variant="outline"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </motion.div>
            ) : !leaderboardData || leaderboardData.entries.length === 0 ? (
              // Empty State
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center rounded-xl border bg-card p-12 text-center"
              >
                <Trophy className="mb-4 h-16 w-16 text-muted-foreground/50" />
                <h3 className="mb-2 font-semibold text-lg">
                  No Rankings Yet
                </h3>
                <p className="text-muted-foreground text-sm">
                  Be the first to earn karma and climb the leaderboard!
                </p>
              </motion.div>
            ) : (
              // Leaderboard Cards
              <>
                <div className="space-y-3">
                  {leaderboardData.entries.map((entry, index) => (
                    <div
                      key={entry.userId}
                      ref={
                        entry.isCurrentUser ? currentUserRef : undefined
                      }
                    >
                      <LeaderboardCard
                        entry={entry}
                        statType={statType}
                        index={index}
                      />
                    </div>
                  ))}
                </div>

                {/* Load More Indicator */}
                {isLoadingMore && (
                  <div className="mt-6">
                    <LeaderboardSkeleton count={3} />
                  </div>
                )}

                {/* Pagination (Desktop) */}
                {!leaderboardData.pagination.hasMore && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 hidden text-center text-muted-foreground text-sm lg:block"
                  >
                    You've reached the end of the leaderboard
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Current User Position - Desktop Sidebar */}
          {currentUserEntry && !isLoading && (
            <div className="hidden w-80 lg:block">
              <CurrentUserPosition
                entry={currentUserEntry}
                statType={statType}
                percentile={userPercentile}
                onJumpToPosition={handleJumpToPosition}
              />
            </div>
          )}
        </div>
      </div>

      {/* Current User Position - Mobile Sticky */}
      {currentUserEntry && !isLoading && (
        <CurrentUserPosition
          entry={currentUserEntry}
          statType={statType}
          percentile={userPercentile}
          onJumpToPosition={handleJumpToPosition}
        />
      )}
    </div>
  );
}
