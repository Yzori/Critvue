'use client';

/**
 * Progressive Badge System
 *
 * Displays badges with three states:
 * - Earned: Full color with animated shine
 * - In Progress: Colored outline with progress bar
 * - Locked: Grayscale with unlock requirements
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Lock,
  Trophy,
  Zap,
  Clock,
  MessageSquare,
  Target,
  Heart,
  Shield,
  Star,
  Flame,
  Award,
  Users,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

export type BadgeStatus = 'earned' | 'in_progress' | 'locked';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof badgeIcons;
  category: 'milestone' | 'expertise' | 'behavior' | 'streak' | 'community';
  status: BadgeStatus;
  progress?: number;       // 0-100 for in_progress
  requirement?: string;    // "100 reviews", "Help 10 users", etc.
  currentValue?: number;   // Current progress value
  targetValue?: number;    // Target value to achieve
  earnedAt?: string;       // ISO date for earned badges
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

const badgeIcons = {
  trophy: Trophy,
  zap: Zap,
  clock: Clock,
  message: MessageSquare,
  target: Target,
  heart: Heart,
  shield: Shield,
  star: Star,
  flame: Flame,
  award: Award,
  users: Users,
  trending: TrendingUp,
};

const categoryColors = {
  milestone: { bg: 'from-amber-400 to-amber-600', ring: 'ring-amber-400/30' },
  expertise: { bg: 'from-blue-400 to-blue-600', ring: 'ring-blue-400/30' },
  behavior: { bg: 'from-green-400 to-green-600', ring: 'ring-green-400/30' },
  streak: { bg: 'from-orange-400 to-red-500', ring: 'ring-orange-400/30' },
  community: { bg: 'from-purple-400 to-purple-600', ring: 'ring-purple-400/30' },
};

const rarityGlow = {
  common: '',
  uncommon: 'shadow-green-400/20',
  rare: 'shadow-blue-400/30',
  epic: 'shadow-purple-400/40',
  legendary: 'shadow-amber-400/50 animate-pulse',
};

interface ProgressiveBadgeProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ProgressiveBadge({
  badge,
  size = 'md',
  showDetails = true,
  onClick,
  className,
}: ProgressiveBadgeProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const IconComponent = badgeIcons[badge.icon];
  const colors = categoryColors[badge.category];

  const sizeClasses = {
    sm: { container: 'w-20', icon: 'size-10', iconInner: 'size-5', text: 'text-[10px]' },
    md: { container: 'w-28', icon: 'size-14', iconInner: 'size-7', text: 'text-xs' },
    lg: { container: 'w-36', icon: 'size-18', iconInner: 'size-9', text: 'text-sm' },
  };

  const sizes = sizeClasses[size];

  return (
    <motion.div
      className={cn(
        'relative flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer',
        'transition-all duration-300',
        badge.status === 'earned' && 'bg-background/50 hover:bg-background/80',
        badge.status === 'in_progress' && 'bg-muted/50 hover:bg-muted/80',
        badge.status === 'locked' && 'bg-muted/30 hover:bg-muted/50',
        sizes.container,
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Badge Icon Container */}
      <div className="relative">
        {/* Background ring for earned badges */}
        {badge.status === 'earned' && (
          <motion.div
            className={cn(
              'absolute -inset-1 rounded-full ring-4',
              colors.ring,
              badge.rarity && rarityGlow[badge.rarity]
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          />
        )}

        {/* Progress ring for in_progress badges */}
        {badge.status === 'in_progress' && badge.progress !== undefined && (
          <svg
            className={cn('absolute -inset-1', sizes.icon)}
            style={{ width: `calc(100% + 8px)`, height: `calc(100% + 8px)` }}
            viewBox="0 0 100 100"
          >
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="6"
            />
            {/* Progress arc */}
            <motion.circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="url(#progress-gradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${badge.progress * 2.89} 289`}
              transform="rotate(-90 50 50)"
              initial={{ strokeDasharray: '0 289' }}
              animate={{ strokeDasharray: `${badge.progress * 2.89} 289` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4CC9F0" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
        )}

        {/* Icon container */}
        <div
          className={cn(
            'relative rounded-full flex items-center justify-center',
            sizes.icon,
            badge.status === 'earned' && `bg-gradient-to-br ${colors.bg} shadow-lg`,
            badge.status === 'in_progress' && 'bg-background border-2 border-border',
            badge.status === 'locked' && 'bg-muted'
          )}
        >
          {badge.status === 'locked' ? (
            <Lock className={cn(sizes.iconInner, 'text-muted-foreground')} />
          ) : (
            <IconComponent
              className={cn(
                sizes.iconInner,
                badge.status === 'earned' && 'text-white',
                badge.status === 'in_progress' && 'text-muted-foreground'
              )}
            />
          )}

          {/* Shine effect for earned badges */}
          {badge.status === 'earned' && isHovered && (
            <motion.div
              className="absolute inset-0 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              />
            </motion.div>
          )}
        </div>

        {/* Checkmark for earned */}
        {badge.status === 'earned' && (
          <motion.div
            className="absolute -bottom-0.5 -right-0.5 size-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            <CheckCircle2 className="size-3 text-white" />
          </motion.div>
        )}
      </div>

      {/* Badge Name */}
      <div className="text-center">
        <p
          className={cn(
            'font-semibold leading-tight line-clamp-2',
            sizes.text,
            badge.status === 'earned' && 'text-foreground',
            badge.status === 'in_progress' && 'text-foreground/80',
            badge.status === 'locked' && 'text-muted-foreground'
          )}
        >
          {badge.name}
        </p>

        {/* Progress indicator for in_progress */}
        {badge.status === 'in_progress' && badge.currentValue !== undefined && badge.targetValue !== undefined && (
          <p className={cn('text-blue-600 dark:text-blue-400 font-medium mt-0.5', sizes.text)}>
            {badge.currentValue}/{badge.targetValue}
          </p>
        )}

        {/* Earned date */}
        {badge.status === 'earned' && badge.earnedAt && showDetails && (
          <p className={cn('text-muted-foreground mt-0.5', sizes.text)}>
            {new Date(badge.earnedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {isHovered && showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full z-20"
          >
            <div className="px-3 py-2 rounded-lg bg-gray-900 text-white text-xs min-w-[160px] max-w-[200px] shadow-xl">
              <p className="font-semibold mb-1">{badge.name}</p>
              <p className="text-gray-300 text-[11px] leading-relaxed">{badge.description}</p>
              {badge.status === 'locked' && badge.requirement && (
                <p className="mt-2 pt-2 border-t border-gray-700 text-amber-400 text-[11px]">
                  Unlock: {badge.requirement}
                </p>
              )}
              {badge.status === 'in_progress' && badge.progress !== undefined && (
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-blue-400">{badge.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${badge.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Badge Grid Display
 */
interface BadgeGridProps {
  badges: Badge[];
  maxDisplay?: number;
  showAll?: boolean;
  onViewAll?: () => void;
  className?: string;
}

export function BadgeGrid({
  badges,
  maxDisplay = 6,
  showAll = false,
  onViewAll,
  className,
}: BadgeGridProps) {
  const [expanded, setExpanded] = React.useState(showAll);

  // Sort badges: earned first, then in_progress, then locked
  const sortedBadges = [...badges].sort((a, b) => {
    const statusOrder = { earned: 0, in_progress: 1, locked: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const displayBadges = expanded ? sortedBadges : sortedBadges.slice(0, maxDisplay);
  const hiddenCount = sortedBadges.length - maxDisplay;

  const earnedCount = badges.filter(b => b.status === 'earned').length;
  const inProgressCount = badges.filter(b => b.status === 'in_progress').length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header stats */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-600" />
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">{earnedCount}</span> earned
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500" />
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">{inProgressCount}</span> in progress
          </span>
        </div>
      </div>

      {/* Badge grid */}
      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {displayBadges.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
            >
              <ProgressiveBadge badge={badge} size="md" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* View more button */}
      {!expanded && hiddenCount > 0 && (
        <motion.button
          onClick={() => onViewAll ? onViewAll() : setExpanded(true)}
          className="w-full py-2.5 px-4 rounded-xl border border-border bg-muted hover:bg-muted/80 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          View {hiddenCount} more badges
          <Award className="size-4" />
        </motion.button>
      )}
    </div>
  );
}

export default ProgressiveBadge;
