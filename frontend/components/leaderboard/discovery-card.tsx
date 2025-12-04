'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DiscoveryUser } from '@/lib/types/leaderboard';
import { TIER_CONFIG } from '@/lib/types/tier';
import { BadgeIcon } from '@/components/karma/badge-icon';
import {
  TrendingUp,
  Clock,
  Sparkles,
  Star,
  ChevronRight,
} from 'lucide-react';

interface DiscoveryCardProps {
  user: DiscoveryUser;
  onClick?: (user: DiscoveryUser) => void;
  compact?: boolean;
  className?: string;
}

const HIGHLIGHT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  Clock,
  Sparkles,
  Star,
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function DiscoveryCard({
  user,
  onClick,
  compact = false,
  className,
}: DiscoveryCardProps) {
  const tierInfo = TIER_CONFIG[user.tier];
  const HighlightIcon = HIGHLIGHT_ICONS[user.highlight.icon || 'Star'] || Star;

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg cursor-pointer',
          'bg-muted hover:bg-muted/80 transition-colors',
          className
        )}
        onClick={() => onClick?.(user)}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.avatarUrl} alt={user.displayName} />
          <AvatarFallback
            className="text-xs font-medium text-white"
            style={{ backgroundColor: tierInfo.color }}
          >
            {getInitials(user.displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {user.displayName}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <HighlightIcon className="h-3 w-3" />
          <span>{user.highlight.value}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative rounded-xl border border-border p-4 cursor-pointer',
        'bg-background hover:shadow-md transition-all',
        className
      )}
      onClick={() => onClick?.(user)}
    >
      {/* Top Row: Avatar + Name */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="rounded-full p-0.5"
          style={{
            background: `linear-gradient(135deg, ${tierInfo.color}, ${tierInfo.color}80)`,
          }}
        >
          <Avatar className="h-10 w-10 border-2 border-background">
            <AvatarImage src={user.avatarUrl} alt={user.displayName} />
            <AvatarFallback
              className="text-sm font-semibold text-white"
              style={{ backgroundColor: tierInfo.color }}
            >
              {getInitials(user.displayName)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">
            {user.displayName}
          </p>
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
            style={{
              backgroundColor: `${tierInfo.color}15`,
              color: tierInfo.color,
            }}
          >
            {tierInfo.icon} {tierInfo.name}
          </span>
        </div>
      </div>

      {/* Highlight Stat */}
      <div className="flex items-center justify-between bg-muted rounded-lg p-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-accent-peach/10">
            <HighlightIcon className="h-4 w-4 text-accent-peach" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{user.highlight.label}</p>
            <p className="font-semibold text-foreground">{user.highlight.value}</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Bottom Row: Stats + Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 text-amber-400" />
            {user.rating.toFixed(1)}
          </span>
          <span>{user.reviews} reviews</span>
        </div>

        {user.featuredBadge && (
          <BadgeIcon
            badgeCode={user.featuredBadge.badge_code}
            rarity={user.featuredBadge.rarity}
            earned={true}
            size="sm"
          />
        )}
      </div>

      {/* Skills */}
      {user.skills && user.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {user.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500"
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default DiscoveryCard;
