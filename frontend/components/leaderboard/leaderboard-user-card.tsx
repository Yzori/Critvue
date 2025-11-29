'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LeaderboardUser, formatRank } from '@/lib/types/leaderboard';
import { TIER_CONFIG } from '@/lib/types/tier';
import { RankChangeIndicator } from './rank-change-indicator';
import { BadgeIcon } from '@/components/karma/badge-icon';
import { Star, Flame, MessageSquare } from 'lucide-react';

interface LeaderboardUserCardProps {
  user: LeaderboardUser;
  index: number;
  onUserClick?: (user: LeaderboardUser) => void;
  onUserHover?: (user: LeaderboardUser | null) => void;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function LeaderboardUserCard({
  user,
  index,
  onUserClick,
  onUserHover,
  className,
}: LeaderboardUserCardProps) {
  const tierInfo = TIER_CONFIG[user.tier];
  const isCurrentUser = user.isCurrentUser;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        'relative flex items-center gap-4 p-3 sm:p-4 rounded-xl',
        'transition-all duration-200 cursor-pointer',
        'hover:bg-gray-50 hover:shadow-md hover:-translate-y-0.5',
        'border',
        isCurrentUser
          ? 'bg-accent-peach/5 border-accent-peach/30'
          : 'bg-white border-gray-100',
        className
      )}
      onClick={() => onUserClick?.(user)}
      onMouseEnter={() => onUserHover?.(user)}
      onMouseLeave={() => onUserHover?.(null)}
    >
      {/* Rank */}
      <div className="flex-shrink-0 w-8 sm:w-12 text-center">
        <span
          className={cn(
            'font-bold text-lg',
            user.rank <= 3 ? 'text-amber-600' : 'text-gray-400'
          )}
        >
          {user.rank}
        </span>
      </div>

      {/* Avatar with Tier Ring */}
      <div className="relative flex-shrink-0">
        <div
          className="rounded-full p-0.5"
          style={{
            background: `linear-gradient(135deg, ${tierInfo.color}, ${tierInfo.color}80)`,
          }}
        >
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-white">
            <AvatarImage src={user.avatarUrl} alt={user.displayName} />
            <AvatarFallback
              className="text-sm font-semibold text-white"
              style={{ backgroundColor: tierInfo.color }}
            >
              {getInitials(user.displayName)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Current user indicator */}
        {isCurrentUser && (
          <div className="absolute -bottom-1 -right-1 bg-accent-peach text-white text-[10px] font-bold px-1 py-0.5 rounded">
            YOU
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-900 truncate">
            {user.displayName}
          </p>

          {/* Tier Badge */}
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
            style={{
              backgroundColor: `${tierInfo.color}15`,
              color: tierInfo.color,
            }}
          >
            {tierInfo.icon} {tierInfo.name}
          </span>

          {/* Rank Change */}
          <RankChangeIndicator
            direction={user.rankDirection}
            change={user.rankChange}
            size="sm"
          />
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 text-amber-400" />
            {user.stats.helpfulRating.toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3 text-blue-400" />
            {user.stats.reviews}
          </span>
          {user.stats.streak > 0 && (
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-400" />
              {user.stats.streak}
            </span>
          )}
        </div>
      </div>

      {/* Score & Badges */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Featured Badges */}
        {user.featuredBadges && user.featuredBadges.length > 0 && (
          <div className="hidden sm:flex items-center gap-1">
            {user.featuredBadges.slice(0, 2).map((badge, i) => (
              <BadgeIcon
                key={badge.badge_code}
                badgeCode={badge.badge_code}
                rarity={badge.rarity}
                earned={true}
                size="sm"
              />
            ))}
          </div>
        )}

        {/* Score */}
        <div className="text-right">
          <p className="font-bold text-gray-900">
            {user.score.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">
            {user.scoreLabel.split(' ').pop()}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default LeaderboardUserCard;
