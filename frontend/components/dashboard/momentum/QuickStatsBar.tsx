'use client';

/**
 * QuickStatsBar Component
 *
 * A horizontal bar showing key gamification stats at a glance:
 * - Total Karma with trend indicator
 * - Featured badges (mini carousel)
 * - Leaderboard position
 * - Quick link to full karma dashboard
 *
 * Designed to be compact but informative, encouraging engagement.
 */

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Award,
  Trophy,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Zap,
  Crown,
  Medal,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type Badge, getBadgeRarityColor } from '@/lib/api/karma';

export interface QuickStatsBarProps {
  karma: number;
  karmaChange?: number; // Change from last period
  xp: number;
  leaderboardRank?: number | null;
  leaderboardTotal?: number;
  featuredBadges?: Badge[];
  nextBadge?: { name: string; progress: number; icon?: string } | null;
  className?: string;
}

export const QuickStatsBar: React.FC<QuickStatsBarProps> = ({
  karma,
  karmaChange = 0,
  xp,
  leaderboardRank,
  leaderboardTotal,
  featuredBadges = [],
  nextBadge,
  className,
}) => {
  const [activeBadgeIndex, setActiveBadgeIndex] = React.useState(0);

  // Cycle through badges every 3 seconds
  React.useEffect(() => {
    if (featuredBadges.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBadgeIndex((prev) => (prev + 1) % featuredBadges.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [featuredBadges.length]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
    return <Trophy className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex items-center gap-1 p-1.5 rounded-2xl bg-muted/30 border border-border/50 backdrop-blur-sm',
          className
        )}
      >
        {/* Karma */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/dashboard/karma"
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-background/80 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-purple-500" />
                <span className="font-semibold text-sm">{karma.toLocaleString()}</span>
              </div>
              {karmaChange !== 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    'flex items-center gap-0.5 text-xs',
                    karmaChange > 0 ? 'text-green-600' : 'text-red-500'
                  )}
                >
                  {karmaChange > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{karmaChange > 0 ? '+' : ''}{karmaChange}</span>
                </motion.div>
              )}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Total Karma • Click to view details</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border/50" />

        {/* XP */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/dashboard/karma"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-background/80 transition-colors"
            >
              <Award className="h-4 w-4 text-blue-500" />
              <span className="font-semibold text-sm">{formatNumber(xp)} XP</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Experience Points (never decreases)</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border/50" />

        {/* Badges showcase */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/dashboard/karma?tab=badges"
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-background/80 transition-colors min-w-[100px]"
            >
              <div className="relative h-6 w-6">
                <AnimatePresence mode="wait">
                  {featuredBadges.length > 0 ? (
                    <motion.div
                      key={activeBadgeIndex}
                      initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                      exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div
                        className="h-6 w-6 rounded-full flex items-center justify-center text-xs border-2"
                        style={{
                          borderColor: getBadgeRarityColor(featuredBadges[activeBadgeIndex]?.rarity ?? 'common'),
                          backgroundColor: `${getBadgeRarityColor(featuredBadges[activeBadgeIndex]?.rarity ?? 'common')}20`,
                        }}
                      >
                        {featuredBadges[activeBadgeIndex]?.icon_url ? (
                          <img
                            src={featuredBadges[activeBadgeIndex]?.icon_url ?? ''}
                            alt=""
                            className="h-4 w-4"
                          />
                        ) : (
                          '🏆'
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground"
                    >
                      ?
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <span className="text-xs text-muted-foreground">
                {featuredBadges.length > 0
                  ? `${featuredBadges.length} badge${featuredBadges.length > 1 ? 's' : ''}`
                  : 'Earn badges'}
              </span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>
              {featuredBadges.length > 0 && featuredBadges[activeBadgeIndex]
                ? featuredBadges[activeBadgeIndex].badge_name
                : 'Complete reviews to earn badges'}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Next badge progress (if available) */}
        {nextBadge && (
          <>
            <div className="w-px h-6 bg-border/50" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard/karma?tab=badges"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-background/80 transition-colors"
                >
                  <div className="relative h-6 w-6">
                    <svg className="h-6 w-6 transform -rotate-90">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-muted/30"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={`${nextBadge.progress * 0.628} 62.8`}
                        className="text-accent-blue"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[8px]">
                      {nextBadge.icon || '🎯'}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground truncate max-w-[60px]">
                    {nextBadge.progress}%
                  </span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Next: {nextBadge.name} ({nextBadge.progress}% complete)</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {/* Leaderboard position */}
        {leaderboardRank && (
          <>
            <div className="w-px h-6 bg-border/50" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard/karma?tab=leaderboard"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-background/80 transition-colors"
                >
                  {getRankIcon(leaderboardRank)}
                  <span className="font-semibold text-sm">#{leaderboardRank}</span>
                  {leaderboardTotal && (
                    <span className="text-xs text-muted-foreground">
                      / {leaderboardTotal}
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Your leaderboard position this week</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {/* View all link */}
        <Link
          href="/dashboard/karma"
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors ml-auto"
        >
          <span>View All</span>
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </TooltipProvider>
  );
};

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export default QuickStatsBar;
