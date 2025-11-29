'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Trophy, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TierBadge } from '@/components/tier/tier-badge';
import {
  LeaderboardEntry,
  RankChangeDirection,
  LeaderboardStatType,
  formatLeaderboardStat,
} from '@/lib/api/leaderboard';

export interface LeaderboardCardProps {
  entry: LeaderboardEntry;
  statType: LeaderboardStatType;
  index: number;
  onClick?: () => void;
}

/**
 * LeaderboardCard Component
 *
 * Displays a user's leaderboard entry with podium styling for top 3,
 * rank change indicators, avatar, tier badge, and stats.
 */
export function LeaderboardCard({
  entry,
  statType,
  index,
  onClick,
}: LeaderboardCardProps) {
  const isPodium = entry.rank <= 3;
  const isCurrentUser = entry.isCurrentUser;

  // Podium configurations
  const podiumConfig = {
    1: {
      gradient: 'from-[#FCD34D] to-[#F59E0B]',
      bgColor: 'bg-gradient-to-br from-[#FCD34D] to-[#F59E0B]',
      textColor: 'text-amber-900',
      icon: Trophy,
      iconColor: 'text-amber-900',
      border: 'border-amber-400',
      shadow: 'shadow-lg shadow-amber-200',
      scale: 'md:scale-105',
    },
    2: {
      gradient: 'from-gray-200 to-gray-300',
      bgColor: 'bg-gradient-to-br from-gray-200 to-gray-300',
      textColor: 'text-gray-800',
      icon: Medal,
      iconColor: 'text-gray-600',
      border: 'border-gray-400',
      shadow: 'shadow-md shadow-gray-200',
      scale: 'md:scale-102',
    },
    3: {
      gradient: 'from-[#FDBA74] to-[#F97316]',
      bgColor: 'bg-gradient-to-br from-[#FDBA74] to-[#F97316]',
      textColor: 'text-orange-900',
      icon: Medal,
      iconColor: 'text-orange-800',
      border: 'border-orange-400',
      shadow: 'shadow-md shadow-orange-200',
      scale: '',
    },
  };

  const config = isPodium
    ? podiumConfig[entry.rank as 1 | 2 | 3]
    : undefined;

  // Rank change indicator
  const getRankChangeIcon = () => {
    switch (entry.rankChangeDirection) {
      case RankChangeDirection.UP:
        return <TrendingUp className="h-3 w-3" />;
      case RankChangeDirection.DOWN:
        return <TrendingDown className="h-3 w-3" />;
      case RankChangeDirection.NEW:
        return <span className="text-xs font-bold">NEW</span>;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getRankChangeColor = () => {
    switch (entry.rankChangeDirection) {
      case RankChangeDirection.UP:
        return 'text-green-600 bg-green-50 border-green-200';
      case RankChangeDirection.DOWN:
        return 'text-red-600 bg-red-50 border-red-200';
      case RankChangeDirection.NEW:
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Count-up animation hook
  const [displayValue, setDisplayValue] = React.useState(0);
  const hasAnimated = React.useRef(false);

  React.useEffect(() => {
    if (!hasAnimated.current) {
      hasAnimated.current = true;
      const duration = 400;
      const steps = 30;
      const increment = entry.primaryStat / steps;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayValue(entry.primaryStat);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(increment * currentStep));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    } else {
      setDisplayValue(entry.primaryStat);
    }
  }, [entry.primaryStat]);

  const PodiumIcon = config?.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.4, 0, 0.2, 1],
      }}
      whileHover={{
        y: -2,
        transition: { duration: 0.2 },
      }}
      onClick={onClick}
      className={cn(
        'group relative rounded-xl border transition-all duration-200',
        isPodium
          ? cn(
              config.bgColor,
              config.border,
              config.shadow,
              config.scale,
              'border-2'
            )
          : 'border-border bg-card hover:border-border/80 hover:shadow-md',
        isCurrentUser &&
          !isPodium &&
          'ring-2 ring-[#4CC9F0] ring-offset-2 ring-offset-background',
        onClick && 'cursor-pointer',
        'min-h-[44px]' // Mobile touch target
      )}
    >
      <div className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
        {/* Rank Number */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: index * 0.05 + 0.1,
          }}
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold sm:h-12 sm:w-12',
            isPodium
              ? cn(config.textColor, 'text-lg sm:text-xl')
              : 'bg-muted text-muted-foreground text-base sm:text-lg'
          )}
        >
          {isPodium && PodiumIcon ? (
            <PodiumIcon className={cn('h-6 w-6 sm:h-7 sm:w-7', config.iconColor)} />
          ) : (
            entry.rank
          )}
        </motion.div>

        {/* Avatar */}
        <Avatar className="h-10 w-10 shrink-0 border-2 border-background sm:h-12 sm:w-12">
          <AvatarImage src={entry.avatarUrl} alt={entry.displayName} />
          <AvatarFallback
            className={cn(
              isPodium ? config.textColor : 'bg-gradient-to-br from-[#4CC9F0] to-[#8B5CF6] text-white'
            )}
          >
            {getInitials(entry.displayName)}
          </AvatarFallback>
        </Avatar>

        {/* User Info */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                'truncate font-semibold text-sm sm:text-base',
                isPodium ? config.textColor : 'text-foreground'
              )}
            >
              {entry.displayName}
            </h3>
            {isCurrentUser && !isPodium && (
              <span className="shrink-0 rounded-full bg-[#4CC9F0] px-2 py-0.5 text-xs font-medium text-white">
                You
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <TierBadge
              tier={entry.tier}
              size="sm"
              showTooltip={true}
              className={isPodium ? 'opacity-90' : ''}
            />
            {/* Secondary stats - hidden on very small screens */}
            <div className="hidden items-center gap-3 text-xs sm:flex">
              <span
                className={cn(
                  'opacity-80',
                  isPodium ? config.textColor : 'text-muted-foreground'
                )}
              >
                {entry.totalReviews} reviews
              </span>
              <span
                className={cn(
                  'opacity-80',
                  isPodium ? config.textColor : 'text-muted-foreground'
                )}
              >
                {entry.acceptanceRate.toFixed(0)}% accepted
              </span>
            </div>
          </div>
        </div>

        {/* Stats and Rank Change */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {/* Primary Stat */}
          <motion.div
            className={cn(
              'text-right font-bold text-lg sm:text-xl',
              isPodium ? config.textColor : 'text-foreground'
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.2 }}
          >
            {formatLeaderboardStat(displayValue, statType)}
          </motion.div>

          {/* Rank Change Indicator */}
          {entry.rankChangeDirection !== RankChangeDirection.SAME && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
                delay: index * 0.05 + 0.3,
              }}
              className={cn(
                'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
                getRankChangeColor()
              )}
            >
              {getRankChangeIcon()}
              {entry.rankChangeDirection !== RankChangeDirection.NEW &&
                Math.abs(entry.rankChange) > 0 && (
                  <span>{Math.abs(entry.rankChange)}</span>
                )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Hover effect overlay for non-podium cards */}
      {!isPodium && (
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-accent/5 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      )}
    </motion.div>
  );
}
