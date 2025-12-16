'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, AlertCircle, RefreshCw, Navigation, Sparkles, Star, Medal, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserTier } from '@/lib/types/tier';
import { Button } from '@/components/ui/button';
import { useAsync, useToggle } from '@/hooks';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SeasonBanner,
  StatCategoryTabs,
  LeaderboardPodium,
  LeaderboardUserCard,
  DiscoverySidebar,
} from '@/components/leaderboard';
import { LeaderboardSkeleton } from '@/components/leaderboard/leaderboard-skeleton';
import {
  getLeaderboardData,
  getCurrentSeason,
  getDiscoverySections,
  LeaderboardCategory,
  LeaderboardPeriod,
  LeaderboardUser,
  LeaderboardData,
  DiscoveryUser,
} from '@/lib/api/gamification/leaderboard';
import {
  getLeaderboard as getChallengeLeaderboard,
} from '@/lib/api/challenges';

type LeaderboardMode = 'reviews' | 'challenges';

/**
 * Leaderboard Page - Modern Redesign
 *
 * Features:
 * - Seasonal theming with countdown
 * - Consolidated categories (Overall, Quality, Activity)
 * - Animated podium for top 3
 * - Enhanced user cards with badges and tier rings
 * - Social discovery sidebar
 */
export default function LeaderboardPage() {
  const searchParams = useSearchParams();

  // Mode state (Reviews vs Challenges) - read from URL if provided
  const initialMode = searchParams.get('mode') === 'challenges' ? 'challenges' : 'reviews';
  const [mode, setMode] = React.useState<LeaderboardMode>(initialMode);

  // Reviews filter state
  const [category, setCategory] = React.useState<LeaderboardCategory>(
    LeaderboardCategory.OVERALL
  );
  const [period, setPeriod] = React.useState<LeaderboardPeriod>(
    LeaderboardPeriod.MONTHLY
  );
  const [tierFilter, setTierFilter] = React.useState<UserTier | 'all'>('all');
  const [page, setPage] = React.useState(1);
  const [pullDistance, setPullDistance] = React.useState(0);

  // Leaderboard data with pagination accumulation
  const [leaderboardData, setLeaderboardData] = React.useState<LeaderboardData | null>(null);

  // Boolean states using useToggle
  const loadingMoreState = useToggle();
  const pullingState = useToggle();

  // Convenient aliases
  const isLoadingMore = loadingMoreState.value;
  const isPulling = pullingState.value;

  // Refs
  const currentUserRef = React.useRef<HTMLDivElement>(null);
  const hasShownConfetti = React.useRef(false);
  const touchStartY = React.useRef(0);
  const pullToRefreshThreshold = 80;

  // Season and discovery data
  const fetchSeasonAndDiscoveryFn = React.useCallback(async () => {
    const [seasonData, discovery] = await Promise.all([
      getCurrentSeason(),
      getDiscoverySections(),
    ]);
    return { season: seasonData, discoverySections: discovery };
  }, []);

  const {
    data: seasonDiscoveryData,
    isLoading: isLoadingDiscovery,
    refetch: fetchSeasonAndDiscovery,
  } = useAsync(fetchSeasonAndDiscoveryFn, { immediate: true });

  const season = seasonDiscoveryData?.season ?? null;
  const discoverySections = seasonDiscoveryData?.discoverySections ?? [];

  // Challenges leaderboard data
  const fetchChallengesFn = React.useCallback(async () => {
    return await getChallengeLeaderboard(50);
  }, []);

  const {
    data: challengesData,
    isLoading: isChallengesLoading,
    error: challengesError,
    refetch: fetchChallengesLeaderboard,
  } = useAsync(fetchChallengesFn, { immediate: false });

  // Loading and error states for reviews leaderboard (needs manual management due to pagination)
  const loadingState = useToggle(true);
  const [error, setError] = React.useState<string | null>(null);

  // Convenient alias
  const isLoading = loadingState.value;

  // Fetch leaderboard data
  const fetchLeaderboard = React.useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        if (pageNum === 1) {
          loadingState.setTrue();
          setError(null);
        } else {
          loadingMoreState.setTrue();
        }

        const data = await getLeaderboardData({
          category,
          period,
          tier: tierFilter === 'all' ? undefined : tierFilter,
          page: pageNum,
          pageSize: 50,
        });

        if (append && leaderboardData) {
          setLeaderboardData({
            ...data,
            entries: [...leaderboardData.entries, ...data.entries],
          });
        } else {
          setLeaderboardData(data);
        }

        // Show confetti if user is in top 10 (only once)
        if (
          !hasShownConfetti.current &&
          data.currentUser?.rank &&
          data.currentUser.rank <= 10 &&
          pageNum === 1
        ) {
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#F97316', '#4CC9F0', '#22C55E'],
            });
          }, 500);
          hasShownConfetti.current = true;
        }
      } catch {
        setError(
          'Failed to load leaderboard. Please check your connection and try again.'
        );
      } finally {
        loadingState.setFalse();
        loadingMoreState.setFalse();
      }
    },
    [category, period, tierFilter, leaderboardData, loadingState, loadingMoreState]
  );

  // Fetch data based on mode
  React.useEffect(() => {
    if (mode === 'reviews') {
      setPage(1);
      hasShownConfetti.current = false;
      fetchLeaderboard(1, false);
    } else {
      fetchChallengesLeaderboard();
    }
  }, [mode]);

  // Refetch on filter changes (reviews mode only)
  React.useEffect(() => {
    if (mode === 'reviews') {
      setPage(1);
      hasShownConfetti.current = false;
      fetchLeaderboard(1, false);
    }
  }, [category, period, tierFilter]);

  // Infinite scroll
  React.useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 500 &&
        !isLoadingMore &&
        leaderboardData?.hasMore
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
            pullingState.setTrue();
          }
        }
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance >= pullToRefreshThreshold) {
        setPage(1);
        fetchLeaderboard(1, false);
        fetchSeasonAndDiscovery();
      }
      pullingState.setFalse();
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
  }, [pullDistance, fetchLeaderboard, fetchSeasonAndDiscovery]);

  // Jump to current user position
  const handleJumpToPosition = () => {
    currentUserRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  // Handle user click - use username for SEO-friendly URLs
  const handleUserClick = (user: LeaderboardUser) => {
    // Navigate to user profile using username (falls back to ID if no username)
    window.location.href = `/profile/${user.username}`;
  };

  // Handle discovery user click - use username for SEO-friendly URLs
  const handleDiscoveryUserClick = (user: DiscoveryUser) => {
    window.location.href = `/profile/${user.username}`;
  };

  // Split entries into podium (top 3) and list (4+)
  const podiumUsers = leaderboardData?.entries.slice(0, 3) || [];
  const listUsers = leaderboardData?.entries.slice(3) || [];

  return (
    <div className="min-h-screen bg-muted">
      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {isPulling && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: pullDistance - 40 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed left-1/2 top-0 z-50 -translate-x-1/2"
          >
            <div className="flex items-center gap-2 rounded-full bg-accent-peach px-4 py-2 text-white shadow-lg">
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

      <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Season Banner */}
        {season && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SeasonBanner
              season={season}
              onViewPrizes={() => {
                // TODO: Open prizes modal
              }}
            />
          </motion.div>
        )}

        {/* Mode Toggle - Reviews vs Challenges */}
        <div className="flex justify-center">
          <div className="inline-flex bg-background rounded-xl border border-border p-1 shadow-sm">
            <button
              onClick={() => setMode('reviews')}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all',
                mode === 'reviews'
                  ? 'bg-accent-peach text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Star className="h-4 w-4" />
              Reviews
            </button>
            <button
              onClick={() => setMode('challenges')}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all',
                mode === 'challenges'
                  ? 'bg-accent-peach text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Sparkles className="h-4 w-4" />
              Challenges
            </button>
          </div>
        </div>

        {/* Category Tabs & Filters - Only for Reviews mode */}
        {mode === 'reviews' && (
          <div className="bg-background rounded-xl border border-border p-4 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <StatCategoryTabs
                category={category}
                period={period}
                onCategoryChange={setCategory}
                onPeriodChange={setPeriod}
              />

              {/* Tier Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tier:</span>
                <Select
                  value={tierFilter}
                  onValueChange={(value) =>
                    setTierFilter(value as UserTier | 'all')
                  }
                >
                  <SelectTrigger className="w-[140px] h-8 text-sm">
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
        )}

        {/* Main Content */}
        {mode === 'reviews' ? (
          <div className="flex gap-6">
            {/* Leaderboard Column */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
              <div className="space-y-4">
                {/* Podium Skeleton */}
                <div className="bg-background rounded-xl border border-border p-6">
                  <div className="flex items-end justify-center gap-4">
                    {[2, 1, 3].map((rank) => (
                      <div
                        key={rank}
                        className={cn(
                          'flex flex-col items-center',
                          rank === 1 ? 'order-2' : rank === 2 ? 'order-1' : 'order-3'
                        )}
                      >
                        <div
                          className={cn(
                            'rounded-full bg-muted animate-pulse mb-2',
                            rank === 1 ? 'h-20 w-20' : 'h-14 w-14'
                          )}
                        />
                        <div className="h-4 w-16 bg-muted rounded animate-pulse mb-1" />
                        <div
                          className={cn(
                            'w-20 bg-muted rounded-t-lg mt-2 animate-pulse',
                            rank === 1 ? 'h-28' : rank === 2 ? 'h-20' : 'h-16'
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <LeaderboardSkeleton count={7} />
              </div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-12 text-center"
              >
                <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
                <h3 className="mb-2 font-semibold text-lg text-foreground">
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
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center rounded-xl border border-border bg-background p-12 text-center"
              >
                <Trophy className="mb-4 h-16 w-16 text-gray-300" />
                <h3 className="mb-2 font-semibold text-lg text-foreground">
                  No Rankings Yet
                </h3>
                <p className="text-muted-foreground text-sm">
                  Be the first to earn sparks and climb the leaderboard!
                </p>
              </motion.div>
            ) : (
              <>
                {/* Podium - Top 3 */}
                {podiumUsers.length > 0 && (
                  <div className="bg-background rounded-xl border border-border shadow-sm mb-4">
                    <LeaderboardPodium
                      users={podiumUsers}
                      onUserClick={handleUserClick}
                    />
                  </div>
                )}

                {/* User List - 4+ */}
                <div className="bg-background rounded-xl border border-border shadow-sm p-3 space-y-2">
                  {listUsers.map((user, index) => (
                    <div
                      key={user.id}
                      ref={user.isCurrentUser ? currentUserRef : undefined}
                    >
                      <LeaderboardUserCard
                        user={user}
                        index={index}
                        onUserClick={handleUserClick}
                      />
                    </div>
                  ))}

                  {listUsers.length === 0 && podiumUsers.length > 0 && (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      Only top 3 users in this category
                    </p>
                  )}
                </div>

                {/* Load More Indicator */}
                {isLoadingMore && (
                  <div className="mt-4">
                    <LeaderboardSkeleton count={3} />
                  </div>
                )}

                {/* End of List */}
                {!leaderboardData.hasMore && listUsers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 text-center text-muted-foreground text-sm"
                  >
                    You've reached the end of the leaderboard
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Discovery Sidebar - Desktop Only */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-6 space-y-4">
              {/* Current User Position Card */}
              {leaderboardData?.currentUser && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-background rounded-xl border border-border shadow-sm p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">Your Position</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={handleJumpToPosition}
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Jump
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-accent-peach">
                        #{leaderboardData.currentUser.rank}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        of {leaderboardData.total}
                      </p>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="font-semibold text-foreground">
                        {leaderboardData.currentUser.scoreLabel}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Top{' '}
                        {Math.round(
                          (leaderboardData.currentUser.rank /
                            leaderboardData.total) *
                            100
                        )}
                        %
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Discovery Sections */}
              <DiscoverySidebar
                sections={discoverySections}
                isLoading={isLoadingDiscovery}
                onUserClick={handleDiscoveryUserClick}
              />
            </div>
          </div>
        </div>
        ) : (
          /* Challenges Leaderboard */
          <div className="bg-background rounded-xl border border-border shadow-sm">
            {isChallengesLoading ? (
              <div className="p-6 space-y-4">
                <LeaderboardSkeleton count={10} />
              </div>
            ) : challengesError ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
                <h3 className="mb-2 font-semibold text-lg text-foreground">
                  Unable to Load Challenge Rankings
                </h3>
                <p className="mb-6 text-muted-foreground text-sm">{challengesError}</p>
                <Button onClick={fetchChallengesLeaderboard} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            ) : !challengesData || challengesData.entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Sparkles className="mb-4 h-16 w-16 text-gray-300" />
                <h3 className="mb-2 font-semibold text-lg text-foreground">
                  No Challenge Champions Yet
                </h3>
                <p className="text-muted-foreground text-sm">
                  Win challenges to climb the leaderboard!
                </p>
              </div>
            ) : (
              <>
                {/* Challenges Podium - Top 3 */}
                <div className="p-6 bg-gradient-to-b from-muted to-background border-b border-border">
                  <div className="flex items-end justify-center gap-6">
                    {challengesData.entries.slice(0, 3).map((entry, index) => {
                      const rank = index + 1;
                      const order = rank === 1 ? 'order-2' : rank === 2 ? 'order-1' : 'order-3';
                      const size = rank === 1 ? 'h-20 w-20' : 'h-14 w-14';
                      const podiumHeight = rank === 1 ? 'h-28' : rank === 2 ? 'h-20' : 'h-16';
                      const medal = rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : 'text-amber-600';

                      return (
                        <motion.div
                          key={entry.userId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={cn('flex flex-col items-center', order)}
                        >
                          <div className="relative mb-2">
                            <div className={cn(
                              'rounded-full bg-muted overflow-hidden ring-4',
                              rank === 1 ? 'ring-yellow-400' : rank === 2 ? 'ring-gray-300' : 'ring-amber-500',
                              size
                            )}>
                              {entry.userAvatar ? (
                                <img
                                  src={entry.userAvatar}
                                  alt={entry.userName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground font-bold text-xl">
                                  {entry.userName.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className={cn('absolute -bottom-1 -right-1 rounded-full bg-background p-1', medal)}>
                              <Medal className="h-4 w-4" />
                            </div>
                          </div>
                          <p className="font-semibold text-foreground text-sm truncate max-w-[100px]">
                            {entry.userName}
                          </p>
                          <p className="text-xs text-muted-foreground">{entry.challengesWon} wins</p>
                          <div className={cn(
                            'w-20 rounded-t-lg mt-3 flex flex-col items-center justify-end pb-2',
                            rank === 1 ? 'bg-yellow-500/20' : rank === 2 ? 'bg-slate-500/20' : 'bg-amber-500/20',
                            podiumHeight
                          )}>
                            <span className={cn(
                              'text-2xl font-bold',
                              rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-slate-400' : 'text-amber-500'
                            )}>
                              {rank}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Challenges List - 4+ */}
                <div className="p-3 space-y-2">
                  {challengesData.entries.slice(3).map((entry, index) => (
                    <motion.div
                      key={entry.userId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => window.location.href = `/profile/${entry.username || entry.userId}`}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    >
                      <div className="w-8 text-center">
                        <span className="text-sm font-medium text-muted-foreground">#{entry.rank}</span>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                        {entry.userAvatar ? (
                          <img src={entry.userAvatar} alt={entry.userName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground font-semibold">
                            {entry.userName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{entry.userName}</p>
                        <p className="text-xs text-muted-foreground">{entry.winRate}% win rate</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-semibold text-foreground">{entry.challengesWon}</p>
                          <p className="text-xs text-muted-foreground">Wins</p>
                        </div>
                        {entry.bestStreak > 0 && (
                          <div className="flex items-center gap-1 text-orange-500">
                            <Flame className="h-4 w-4" />
                            <span className="font-medium">{entry.bestStreak}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Current User Rank */}
                {challengesData.currentUserRank && (
                  <div className="border-t border-border p-4 bg-muted">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Your Rank</span>
                      <span className="font-bold text-accent-peach">#{challengesData.currentUserRank}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile Current User Sticky Bar - Reviews mode only */}
      {mode === 'reviews' && leaderboardData?.currentUser && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 lg:hidden bg-background border-t border-border shadow-lg p-3 safe-area-inset-bottom"
        >
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-xl font-bold text-accent-peach">
                  #{leaderboardData.currentUser.rank}
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Your Position</p>
                <p className="text-xs text-muted-foreground">
                  {leaderboardData.currentUser.scoreLabel}
                </p>
              </div>
            </div>
            <Button size="sm" onClick={handleJumpToPosition}>
              <Navigation className="h-4 w-4 mr-1" />
              Find Me
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
