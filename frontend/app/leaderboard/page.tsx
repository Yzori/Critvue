'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, AlertCircle, RefreshCw, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserTier } from '@/lib/types/tier';
import { Button } from '@/components/ui/button';
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
  Season,
  DiscoverySection,
  DiscoveryUser,
} from '@/lib/api/leaderboard';

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
  // State
  const [category, setCategory] = React.useState<LeaderboardCategory>(
    LeaderboardCategory.OVERALL
  );
  const [period, setPeriod] = React.useState<LeaderboardPeriod>(
    LeaderboardPeriod.MONTHLY
  );
  const [tierFilter, setTierFilter] = React.useState<UserTier | 'all'>('all');
  const [leaderboardData, setLeaderboardData] =
    React.useState<LeaderboardData | null>(null);
  const [season, setSeason] = React.useState<Season | null>(null);
  const [discoverySections, setDiscoverySections] = React.useState<
    DiscoverySection[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingDiscovery, setIsLoadingDiscovery] = React.useState(true);
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
    [category, period, tierFilter, leaderboardData]
  );

  // Fetch season and discovery data
  const fetchSeasonAndDiscovery = React.useCallback(async () => {
    try {
      setIsLoadingDiscovery(true);
      const [seasonData, discovery] = await Promise.all([
        getCurrentSeason(),
        getDiscoverySections(),
      ]);
      setSeason(seasonData);
      setDiscoverySections(discovery);
    } catch (err) {
      console.error('Failed to fetch season/discovery:', err);
    } finally {
      setIsLoadingDiscovery(false);
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    fetchSeasonAndDiscovery();
  }, [fetchSeasonAndDiscovery]);

  // Refetch on filter changes
  React.useEffect(() => {
    setPage(1);
    hasShownConfetti.current = false;
    fetchLeaderboard(1, false);
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
            setIsPulling(true);
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
  }, [pullDistance, fetchLeaderboard, fetchSeasonAndDiscovery]);

  // Jump to current user position
  const handleJumpToPosition = () => {
    currentUserRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  // Handle user click
  const handleUserClick = (user: LeaderboardUser) => {
    // Navigate to user profile
    window.location.href = `/profile/${user.id}`;
  };

  // Handle discovery user click
  const handleDiscoveryUserClick = (user: DiscoveryUser) => {
    window.location.href = `/profile/${user.id}`;
  };

  // Split entries into podium (top 3) and list (4+)
  const podiumUsers = leaderboardData?.entries.slice(0, 3) || [];
  const listUsers = leaderboardData?.entries.slice(3) || [];

  return (
    <div className="min-h-screen bg-gray-50">
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

        {/* Category Tabs & Filters */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <StatCategoryTabs
              category={category}
              period={period}
              onCategoryChange={setCategory}
              onPeriodChange={setPeriod}
            />

            {/* Tier Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Tier:</span>
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

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Leaderboard Column */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="space-y-4">
                {/* Podium Skeleton */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
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
                            'rounded-full bg-gray-200 animate-pulse mb-2',
                            rank === 1 ? 'h-20 w-20' : 'h-14 w-14'
                          )}
                        />
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-1" />
                        <div
                          className={cn(
                            'w-20 bg-gray-100 rounded-t-lg mt-2 animate-pulse',
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
                <h3 className="mb-2 font-semibold text-lg text-gray-900">
                  Unable to Load Leaderboard
                </h3>
                <p className="mb-6 text-gray-600 text-sm">{error}</p>
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
                className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-12 text-center"
              >
                <Trophy className="mb-4 h-16 w-16 text-gray-300" />
                <h3 className="mb-2 font-semibold text-lg text-gray-900">
                  No Rankings Yet
                </h3>
                <p className="text-gray-500 text-sm">
                  Be the first to earn karma and climb the leaderboard!
                </p>
              </motion.div>
            ) : (
              <>
                {/* Podium - Top 3 */}
                {podiumUsers.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
                    <LeaderboardPodium
                      users={podiumUsers}
                      onUserClick={handleUserClick}
                    />
                  </div>
                )}

                {/* User List - 4+ */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 space-y-2">
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
                    <p className="text-center text-gray-500 text-sm py-4">
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
                    className="mt-6 text-center text-gray-500 text-sm"
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
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Your Position</h3>
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
                      <p className="text-xs text-gray-500">
                        of {leaderboardData.total}
                      </p>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="font-semibold text-gray-900">
                        {leaderboardData.currentUser.scoreLabel}
                      </p>
                      <p className="text-xs text-gray-500">
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
      </div>

      {/* Mobile Current User Sticky Bar */}
      {leaderboardData?.currentUser && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-200 shadow-lg p-3 safe-area-inset-bottom"
        >
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-xl font-bold text-accent-peach">
                  #{leaderboardData.currentUser.rank}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Your Position</p>
                <p className="text-xs text-gray-500">
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
