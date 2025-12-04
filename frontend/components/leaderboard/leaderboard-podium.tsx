'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LeaderboardUser, formatRank } from '@/lib/types/leaderboard';
import { TIER_CONFIG } from '@/lib/types/tier';
import { Crown, Medal, Trophy } from 'lucide-react';
import { BadgeIcon } from '@/components/karma/badge-icon';

interface LeaderboardPodiumProps {
  users: LeaderboardUser[];
  onUserClick?: (user: LeaderboardUser) => void;
  className?: string;
}

const RANK_CONFIG = {
  1: {
    height: 'h-32',
    avatarSize: 'h-20 w-20',
    ringSize: 'h-24 w-24',
    label: '1st',
    gradient: 'from-amber-400 via-yellow-300 to-amber-500',
    borderColor: 'border-amber-400/50',
    glowColor: 'shadow-amber-300/50',
    bgColor: 'bg-amber-500/20 dark:bg-amber-500/30',
    icon: Crown,
    iconColor: 'text-amber-500',
    order: 1,
  },
  2: {
    height: 'h-24',
    avatarSize: 'h-16 w-16',
    ringSize: 'h-20 w-20',
    label: '2nd',
    gradient: 'from-slate-300 via-gray-200 to-slate-400',
    borderColor: 'border-slate-400/50',
    glowColor: 'shadow-slate-300/40',
    bgColor: 'bg-slate-400/20 dark:bg-slate-400/30',
    icon: Medal,
    iconColor: 'text-slate-400',
    order: 0,
  },
  3: {
    height: 'h-20',
    avatarSize: 'h-14 w-14',
    ringSize: 'h-18 w-18',
    label: '3rd',
    gradient: 'from-orange-400 via-amber-300 to-orange-500',
    borderColor: 'border-orange-400/50',
    glowColor: 'shadow-orange-300/40',
    bgColor: 'bg-orange-500/20 dark:bg-orange-500/30',
    icon: Trophy,
    iconColor: 'text-orange-400',
    order: 2,
  },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface PodiumUserProps {
  user: LeaderboardUser;
  rank: 1 | 2 | 3;
  onClick?: () => void;
}

function PodiumUser({ user, rank, onClick }: PodiumUserProps) {
  const config = RANK_CONFIG[rank];
  const tierInfo = TIER_CONFIG[user.tier];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * config.order, type: 'spring', bounce: 0.4 }}
      className={cn(
        'flex flex-col items-center cursor-pointer group',
        config.order === 1 ? 'order-2' : config.order === 0 ? 'order-1' : 'order-3'
      )}
      onClick={onClick}
    >
      {/* User Avatar with Tier Ring */}
      <div className="relative mb-2">
        {/* Glow effect for #1 */}
        {rank === 1 && (
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 blur-xl opacity-50"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Tier-colored ring */}
        <div
          className={cn(
            'relative rounded-full p-1',
            'bg-gradient-to-r',
            config.gradient
          )}
          style={{ boxShadow: `0 0 20px ${tierInfo.color}40` }}
        >
          <Avatar
            className={cn(
              config.avatarSize,
              'border-2 border-background transition-transform group-hover:scale-105'
            )}
          >
            <AvatarImage src={user.avatarUrl} alt={user.displayName} />
            <AvatarFallback
              className="text-lg font-bold"
              style={{ backgroundColor: tierInfo.color, color: 'white' }}
            >
              {getInitials(user.displayName)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Rank Badge */}
        <motion.div
          className={cn(
            'absolute -top-2 -right-2 rounded-full p-1.5',
            'bg-gradient-to-r',
            config.gradient,
            'shadow-lg'
          )}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3 + 0.1 * config.order, type: 'spring' }}
        >
          <Icon className={cn('h-4 w-4 text-white drop-shadow-md')} />
        </motion.div>
      </div>

      {/* User Info */}
      <div className="text-center space-y-1">
        <p className="font-semibold text-sm text-foreground truncate max-w-[100px]">
          {user.displayName}
        </p>
        <p className="text-xs text-muted-foreground">
          {user.scoreLabel}
        </p>

        {/* Featured Badge */}
        {user.featuredBadges && user.featuredBadges[0] && (
          <div className="flex justify-center mt-1">
            <BadgeIcon
              badgeCode={user.featuredBadges[0].badge_code}
              rarity={user.featuredBadges[0].rarity}
              earned={true}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Podium Stand */}
      <motion.div
        className={cn(
          'w-24 rounded-t-lg mt-3',
          config.height,
          config.bgColor,
          'border-t border-l border-r',
          config.borderColor,
          'shadow-inner'
        )}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.2 + 0.1 * config.order, duration: 0.4 }}
        style={{ transformOrigin: 'bottom' }}
      >
        <div className="h-full flex items-center justify-center">
          <span
            className={cn(
              'text-2xl font-bold',
              rank === 1 ? 'text-amber-600' : rank === 2 ? 'text-slate-500' : 'text-orange-500'
            )}
          >
            {formatRank(rank)}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function LeaderboardPodium({
  users,
  onUserClick,
  className,
}: LeaderboardPodiumProps) {
  // Take top 3 users
  const top3 = users.slice(0, 3);

  if (top3.length === 0) {
    return null;
  }

  // Pad with empty slots if less than 3
  const paddedUsers: (LeaderboardUser | null)[] = [...top3];
  while (paddedUsers.length < 3) {
    paddedUsers.push(null);
  }

  return (
    <div className={cn('py-6', className)}>
      <div className="flex items-end justify-center gap-4">
        {paddedUsers.map((user, index) => {
          const rank = (index + 1) as 1 | 2 | 3;

          if (!user) {
            return (
              <div
                key={`empty-${rank}`}
                className={cn(
                  'flex flex-col items-center opacity-30',
                  RANK_CONFIG[rank].order === 1 ? 'order-2' :
                  RANK_CONFIG[rank].order === 0 ? 'order-1' : 'order-3'
                )}
              >
                <div
                  className={cn(
                    'rounded-full bg-muted',
                    RANK_CONFIG[rank].avatarSize
                  )}
                />
                <div
                  className={cn(
                    'w-24 rounded-t-lg mt-3 bg-muted',
                    RANK_CONFIG[rank].height
                  )}
                />
              </div>
            );
          }

          return (
            <PodiumUser
              key={user.id}
              user={user}
              rank={rank}
              onClick={() => onUserClick?.(user)}
            />
          );
        })}
      </div>
    </div>
  );
}

export default LeaderboardPodium;
