'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TierBadge } from '@/components/tier/tier-badge';
import { Button } from '@/components/ui/button';
import {
  LeaderboardEntry,
  LeaderboardStatType,
  formatLeaderboardStat,
} from '@/lib/api/leaderboard';

export interface CurrentUserPositionProps {
  entry: LeaderboardEntry;
  statType: LeaderboardStatType;
  percentile: number;
  onJumpToPosition?: () => void;
  className?: string;
}

/**
 * CurrentUserPosition Component
 *
 * Sticky card showing current user's leaderboard position.
 * Displays as bottom sticky on mobile, right sidebar on desktop.
 */
export function CurrentUserPosition({
  entry,
  statType,
  percentile,
  onJumpToPosition,
  className,
}: CurrentUserPositionProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPercentileText = () => {
    if (percentile >= 99) return 'Top 1%';
    if (percentile >= 95) return 'Top 5%';
    if (percentile >= 90) return 'Top 10%';
    if (percentile >= 75) return 'Top 25%';
    if (percentile >= 50) return 'Top 50%';
    return `Top ${(100 - percentile).toFixed(0)}%`;
  };

  const getPercentileColor = () => {
    if (percentile >= 99) return 'from-amber-500 to-yellow-500';
    if (percentile >= 95) return 'from-purple-500 to-pink-500';
    if (percentile >= 90) return 'from-blue-500 to-cyan-500';
    if (percentile >= 75) return 'from-green-500 to-emerald-500';
    return 'from-gray-500 to-slate-500';
  };

  return (
    <>
      {/* Mobile - Sticky Bottom */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className={cn(
          'fixed bottom-20 left-0 right-0 z-40 mx-4 lg:hidden',
          className
        )}
      >
        <div className="rounded-xl border-2 border-[#3B82F6] bg-card p-3 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* Avatar and Rank */}
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-[#3B82F6]">
                <AvatarImage src={entry.avatarUrl} alt={entry.displayName} />
                <AvatarFallback className="bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] text-white font-semibold">
                  {getInitials(entry.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#3B82F6] text-xs font-bold text-white shadow-md">
                {entry.rank}
              </div>
            </div>

            {/* Info */}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold text-sm">
                  Your Position
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded-full bg-gradient-to-r px-2 py-0.5 text-xs font-bold text-white',
                    getPercentileColor()
                  )}
                >
                  {getPercentileText()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#3B82F6] text-sm">
                  {formatLeaderboardStat(entry.primaryStat, statType)}
                </span>
                <TierBadge tier={entry.tier} size="sm" showTooltip={false} />
              </div>
            </div>

            {/* Jump Button */}
            {onJumpToPosition && (
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={onJumpToPosition}
                className="shrink-0 hover:bg-[#3B82F6]/10"
                aria-label="Jump to your position"
              >
                <ChevronUp className="h-4 w-4 text-[#3B82F6]" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Desktop - Right Sidebar */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className={cn('hidden lg:block', className)}
      >
        <div className="sticky top-24 rounded-xl border-2 border-[#3B82F6] bg-card p-6 shadow-lg">
          {/* Header */}
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#3B82F6]" />
            <h3 className="font-semibold text-foreground">Your Position</h3>
          </div>

          {/* Avatar and Rank */}
          <div className="mb-4 flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-[#3B82F6]">
                <AvatarImage src={entry.avatarUrl} alt={entry.displayName} />
                <AvatarFallback className="bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] text-white font-semibold text-lg">
                  {getInitials(entry.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#3B82F6] font-bold text-sm text-white shadow-md">
                {entry.rank}
              </div>
            </div>
            <div className="flex-1">
              <div className="mb-1 truncate font-semibold text-foreground">
                {entry.displayName}
              </div>
              <TierBadge tier={entry.tier} size="sm" showTooltip={true} />
            </div>
          </div>

          {/* Stats */}
          <div className="mb-4 space-y-3 rounded-lg bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Rank</span>
              <span className="font-bold text-[#3B82F6]">#{entry.rank}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Percentile</span>
              <span
                className={cn(
                  'rounded-full bg-gradient-to-r px-2 py-0.5 font-bold text-sm text-white',
                  getPercentileColor()
                )}
              >
                {getPercentileText()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Score</span>
              <span className="font-bold text-foreground">
                {formatLeaderboardStat(entry.primaryStat, statType)}
              </span>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="mb-4 space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Reviews</span>
              <span className="font-medium">{entry.totalReviews}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Acceptance Rate</span>
              <span className="font-medium">
                {entry.acceptanceRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Helpful Rating</span>
              <span className="font-medium">
                {entry.helpfulRating.toFixed(2)}/5.0
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Streak</span>
              <span className="font-medium">{entry.currentStreak} days</span>
            </div>
          </div>

          {/* Jump Button */}
          {onJumpToPosition && (
            <Button
              onClick={onJumpToPosition}
              className="w-full bg-[#3B82F6] hover:bg-[#3B82F6]/90"
              size="sm"
            >
              <ChevronUp className="mr-2 h-4 w-4" />
              Jump to Position
            </Button>
          )}
        </div>
      </motion.div>
    </>
  );
}
