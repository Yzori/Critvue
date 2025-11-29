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

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex items-center gap-1.5 p-2 rounded-2xl',
          'bg-gradient-to-r from-card/80 via-card/60 to-card/80',
          'backdrop-blur-xl border border-border/40',
          'shadow-lg shadow-black/5',
          className
        )}
      >
        {/* Karma - Primary stat with gradient highlight */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/dashboard/karma"
              className="group flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 hover:border-purple-500/40 hover:from-purple-500/15 hover:to-purple-500/10 transition-all duration-200"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-wider text-purple-600/70">Karma</span>
                <span className="font-bold text-sm text-foreground leading-none">{karma.toLocaleString()}</span>
              </div>
              {karmaChange !== 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    'flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                    karmaChange > 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'
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
          <TooltipContent side="bottom" className="bg-card/95 backdrop-blur-xl border-border/50">
            <p className="font-medium">Total Karma</p>
            <p className="text-xs text-muted-foreground">Click to view full breakdown</p>
          </TooltipContent>
        </Tooltip>

        {/* XP - with icon glow */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/dashboard/karma"
              className="group flex items-center gap-2.5 px-4 py-2.5 rounded-xl hover:bg-blue-500/5 border border-transparent hover:border-blue-500/20 transition-all duration-200"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
                <Award className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-wider text-blue-600/70">XP</span>
                <span className="font-bold text-sm text-foreground leading-none">{formatNumber(xp)}</span>
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-card/95 backdrop-blur-xl border-border/50">
            <p className="font-medium">Experience Points</p>
            <p className="text-xs text-muted-foreground">XP never decreases - keep growing!</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-8 bg-gradient-to-b from-transparent via-border/50 to-transparent" />

        {/* Badges showcase - with enhanced animation */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/dashboard/karma?tab=badges"
              className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-amber-500/5 border border-transparent hover:border-amber-500/20 transition-all duration-200 min-w-[120px]"
            >
              <div className="relative h-8 w-8">
                <AnimatePresence mode="wait">
                  {featuredBadges.length > 0 ? (
                    <motion.div
                      key={activeBadgeIndex}
                      initial={{ opacity: 0, scale: 0.5, rotateY: -180 }}
                      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                      exit={{ opacity: 0, scale: 0.5, rotateY: 180 }}
                      transition={{ duration: 0.4, type: 'spring' }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-sm shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${getBadgeRarityColor(featuredBadges[activeBadgeIndex]?.rarity ?? 'common')}30, ${getBadgeRarityColor(featuredBadges[activeBadgeIndex]?.rarity ?? 'common')}10)`,
                          borderWidth: 2,
                          borderColor: getBadgeRarityColor(featuredBadges[activeBadgeIndex]?.rarity ?? 'common'),
                          boxShadow: `0 4px 12px ${getBadgeRarityColor(featuredBadges[activeBadgeIndex]?.rarity ?? 'common')}25`,
                        }}
                      >
                        {featuredBadges[activeBadgeIndex]?.icon_url ? (
                          <img
                            src={featuredBadges[activeBadgeIndex]?.icon_url ?? ''}
                            alt=""
                            className="h-5 w-5"
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
                      className="h-8 w-8 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border-2 border-dashed border-muted-foreground/20 flex items-center justify-center text-xs text-muted-foreground"
                    >
                      ?
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-wider text-amber-600/70">Badges</span>
                <span className="text-xs font-medium text-foreground">
                  {featuredBadges.length > 0
                    ? `${featuredBadges.length} earned`
                    : 'Start earning'}
                </span>
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-card/95 backdrop-blur-xl border-border/50">
            <p className="font-medium">
              {featuredBadges.length > 0 && featuredBadges[activeBadgeIndex]
                ? featuredBadges[activeBadgeIndex].badge_name
                : 'Achievement Badges'}
            </p>
            <p className="text-xs text-muted-foreground">Complete reviews to earn badges</p>
          </TooltipContent>
        </Tooltip>

        {/* Next badge progress (if available) */}
        {nextBadge && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard/karma?tab=badges"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-accent-blue/5 border border-transparent hover:border-accent-blue/20 transition-all duration-200"
                >
                  <div className="relative h-8 w-8">
                    <svg className="h-8 w-8 transform -rotate-90">
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-muted/20"
                      />
                      <motion.circle
                        cx="16"
                        cy="16"
                        r="14"
                        fill="none"
                        stroke="url(#progress-gradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: '0 87.96' }}
                        animate={{ strokeDasharray: `${nextBadge.progress * 0.8796} 87.96` }}
                        className="text-accent-blue"
                      />
                      <defs>
                        <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#4CC9F0" />
                          <stop offset="100%" stopColor="#8B5CF6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm">
                      {nextBadge.icon || '🎯'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-accent-blue/70">Next</span>
                    <span className="text-xs font-semibold text-foreground">{nextBadge.progress}%</span>
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-card/95 backdrop-blur-xl border-border/50">
                <p className="font-medium">{nextBadge.name}</p>
                <p className="text-xs text-muted-foreground">{nextBadge.progress}% complete</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {/* Leaderboard position - with rank badge styling */}
        {leaderboardRank && (
          <>
            <div className="w-px h-8 bg-gradient-to-b from-transparent via-border/50 to-transparent" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard/karma?tab=leaderboard"
                  className={cn(
                    'group flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-200',
                    leaderboardRank <= 3
                      ? 'bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30 hover:border-amber-500/50'
                      : 'hover:bg-muted/50 border-transparent hover:border-border/50'
                  )}
                >
                  <div className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-lg shadow-lg',
                    leaderboardRank === 1 && 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-amber-500/30',
                    leaderboardRank === 2 && 'bg-gradient-to-br from-gray-300 to-gray-400 shadow-gray-400/30',
                    leaderboardRank === 3 && 'bg-gradient-to-br from-amber-600 to-orange-700 shadow-orange-600/30',
                    leaderboardRank > 3 && 'bg-gradient-to-br from-muted to-muted/80'
                  )}>
                    {leaderboardRank <= 3 ? (
                      leaderboardRank === 1 ? <Crown className="h-4 w-4 text-white" /> :
                      <Medal className="h-4 w-4 text-white" />
                    ) : (
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Rank</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold text-sm text-foreground leading-none">#{leaderboardRank}</span>
                      {leaderboardTotal && (
                        <span className="text-[10px] text-muted-foreground">/ {leaderboardTotal}</span>
                      )}
                    </div>
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-card/95 backdrop-blur-xl border-border/50">
                <p className="font-medium">Weekly Leaderboard</p>
                <p className="text-xs text-muted-foreground">
                  {leaderboardRank <= 3 ? 'Amazing! You\'re in the top 3!' : `Keep going to climb higher!`}
                </p>
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {/* View all link - subtle but clear */}
        <Link
          href="/dashboard/karma"
          className="flex items-center gap-1.5 px-3 py-2 ml-auto rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 group"
        >
          <span>View All</span>
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
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
