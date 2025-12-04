'use client';

/**
 * AmbientPresence - Community Activity Indicators
 *
 * Shows that the platform is alive without overwhelming.
 * Subtle indicators that others are active, creating urgency and belonging.
 *
 * Components:
 * - Online counter: "23 reviewers online"
 * - Activity pulses: Real-time activity on cards
 * - Trending indicators: What's popular
 * - Ghost avatars: "3 people viewing this"
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Users,
  Eye,
  TrendingUp,
  Activity,
  Zap,
  Globe,
  Clock,
  Star,
} from 'lucide-react';

// =============================================================================
// ONLINE COUNTER
// =============================================================================

interface OnlineCounterProps {
  count: number;
  label?: string;
  showPulse?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function OnlineCounter({
  count,
  label = 'reviewers online',
  showPulse = true,
  size = 'sm',
  className,
}: OnlineCounterProps) {
  const [displayCount, setDisplayCount] = useState(count);

  // Subtle random fluctuation to feel alive
  useEffect(() => {
    const interval = setInterval(() => {
      const variance = Math.floor(Math.random() * 5) - 2; // -2 to +2
      setDisplayCount(Math.max(1, count + variance));
    }, 5000);

    return () => clearInterval(interval);
  }, [count]);

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full',
        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        sizeClasses[size],
        className
      )}
    >
      {showPulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}
      <span className="font-medium tabular-nums">{displayCount}</span>
      <span className="text-emerald-600/70">{label}</span>
    </motion.div>
  );
}

// =============================================================================
// ACTIVITY PULSE
// =============================================================================

interface ActivityPulseProps {
  isActive?: boolean;
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
}

export function ActivityPulse({
  isActive = false,
  intensity = 'medium',
  className,
}: ActivityPulseProps) {
  if (!isActive) return null;

  const intensityConfig = {
    low: { scale: 1.5, duration: 2 },
    medium: { scale: 2, duration: 1.5 },
    high: { scale: 2.5, duration: 1 },
  };

  const config = intensityConfig[intensity];

  return (
    <motion.div
      className={cn('absolute inset-0 pointer-events-none', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="absolute inset-0 rounded-inherit border-2 border-blue-400"
        animate={{
          scale: [1, config.scale],
          opacity: [0.6, 0],
        }}
        transition={{
          duration: config.duration,
          repeat: Infinity,
          ease: 'easeOut',
        }}
        style={{ borderRadius: 'inherit' }}
      />
    </motion.div>
  );
}

// =============================================================================
// VIEWERS INDICATOR
// =============================================================================

interface ViewersIndicatorProps {
  count: number;
  maxAvatars?: number;
  className?: string;
}

export function ViewersIndicator({
  count,
  maxAvatars = 3,
  className,
}: ViewersIndicatorProps) {
  if (count === 0) return null;

  const displayCount = Math.min(count, maxAvatars);
  const overflow = count - displayCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex items-center gap-1.5', className)}
    >
      <div className="flex -space-x-2">
        {[...Array(displayCount)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, x: -10 }}
            animate={{ scale: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="w-6 h-6 rounded-full bg-gradient-to-br from-muted to-muted border-2 border-background flex items-center justify-center"
          >
            <Eye className="w-3 h-3 text-muted-foreground" />
          </motion.div>
        ))}
        {overflow > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: displayCount * 0.1 }}
            className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center"
          >
            <span className="text-[10px] font-medium text-muted-foreground">
              +{overflow}
            </span>
          </motion.div>
        )}
      </div>
      <span className="text-xs text-muted-foreground">
        {count === 1 ? 'viewing' : 'people viewing'}
      </span>
    </motion.div>
  );
}

// =============================================================================
// TRENDING BADGE
// =============================================================================

interface TrendingBadgeProps {
  label?: string;
  rank?: number;
  className?: string;
}

export function TrendingBadge({
  label = 'Trending',
  rank,
  className,
}: TrendingBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
        'bg-gradient-to-r from-rose-500 to-orange-500 text-white',
        'text-xs font-medium shadow-sm',
        className
      )}
    >
      <TrendingUp className="w-3 h-3" />
      {rank ? `#${rank}` : label}
    </motion.div>
  );
}

// =============================================================================
// PLATFORM STATUS BAR
// =============================================================================

interface PlatformStatusProps {
  reviewersOnline: number;
  activeReviews: number;
  recentCompletions: number;
  className?: string;
}

export function PlatformStatusBar({
  reviewersOnline,
  activeReviews,
  recentCompletions,
  className,
}: PlatformStatusProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center justify-center gap-4 px-4 py-2',
        'bg-muted/30 border-b border-border/50',
        'text-xs text-muted-foreground',
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="font-medium text-foreground">{reviewersOnline}</span>
        <span>experts online</span>
      </div>

      <div className="w-px h-4 bg-border" />

      <div className="flex items-center gap-1.5">
        <Activity className="w-3 h-3 text-blue-500" />
        <span className="font-medium text-foreground">{activeReviews}</span>
        <span>active reviews</span>
      </div>

      <div className="w-px h-4 bg-border" />

      <div className="flex items-center gap-1.5">
        <Zap className="w-3 h-3 text-amber-500" />
        <span className="font-medium text-foreground">{recentCompletions}</span>
        <span>completed today</span>
      </div>
    </motion.div>
  );
}

// =============================================================================
// LIVE TYPING INDICATOR
// =============================================================================

interface TypingIndicatorProps {
  name?: string;
  className?: string;
}

export function TypingIndicator({ name, className }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}
    >
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 bg-blue-400 rounded-full"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
      <span>{name ? `${name} is typing...` : 'Someone is typing...'}</span>
    </motion.div>
  );
}

// =============================================================================
// RECENT ACTIVITY INDICATOR (for cards)
// =============================================================================

interface RecentActivityProps {
  lastActivity: Date;
  activityType: 'view' | 'claim' | 'update';
  className?: string;
}

export function RecentActivityIndicator({
  lastActivity,
  activityType,
  className,
}: RecentActivityProps) {
  const timeSince = Date.now() - lastActivity.getTime();
  const isRecent = timeSince < 5 * 60 * 1000; // 5 minutes

  if (!isRecent) return null;

  const labels = {
    view: 'Recently viewed',
    claim: 'Just claimed',
    update: 'Recently updated',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md',
        'bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium',
        className
      )}
    >
      <motion.span
        className="w-1.5 h-1.5 bg-blue-500 rounded-full"
        animate={{ scale: [1, 1.5, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      {labels[activityType]}
    </motion.div>
  );
}

// =============================================================================
// GLOBAL ACTIVITY STREAM (floating)
// =============================================================================

interface GlobalActivityStreamProps {
  events: Array<{
    id: string;
    message: string;
    icon?: React.ComponentType<{ className?: string }>;
  }>;
  position?: 'top-right' | 'bottom-right';
  className?: string;
}

export function GlobalActivityStream({
  events,
  position = 'bottom-right',
  className,
}: GlobalActivityStreamProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (events.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [events.length]);

  if (events.length === 0) return null;

  const current = events[currentIndex];
  const Icon = current.icon || Globe;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <motion.div
      className={cn(
        'fixed z-40',
        positionClasses[position],
        className
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-full',
            'bg-background/90 backdrop-blur-sm border border-border/50',
            'shadow-lg text-sm'
          )}
        >
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">{current.message}</span>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// =============================================================================
// COMBINED PRESENCE HEADER
// =============================================================================

interface PresenceHeaderProps {
  reviewersOnline: number;
  className?: string;
}

export function PresenceHeader({
  reviewersOnline,
  className,
}: PresenceHeaderProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <OnlineCounter count={reviewersOnline} />
    </div>
  );
}

export default OnlineCounter;
