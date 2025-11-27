'use client';

/**
 * AnticipationEngine - Creating "What's Next" Excitement
 *
 * Shows what's about to happen, creating anticipation rather than just
 * displaying what has happened. The brain releases more dopamine during
 * anticipation than consumption.
 *
 * Components:
 * - Live Activity Feed: Real-time updates from the platform
 * - Prediction Cards: Based on user patterns
 * - Countdown Moments: Upcoming milestones
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Clock,
  User,
  FileText,
  Star,
  Flame,
  Trophy,
  Bell,
  TrendingUp,
  Calendar,
  Zap,
  Eye,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Timer,
  Target,
} from 'lucide-react';
import Link from 'next/link';

// =============================================================================
// LIVE ACTIVITY FEED
// =============================================================================

export interface ActivityEvent {
  id: string;
  type: 'claim' | 'submit' | 'accept' | 'review' | 'join' | 'milestone';
  message: string;
  timestamp: Date;
  avatar?: { name: string; imageUrl?: string };
  highlight?: boolean;
}

interface LiveActivityFeedProps {
  events: ActivityEvent[];
  maxItems?: number;
  className?: string;
}

const activityIcons: Record<ActivityEvent['type'], React.ComponentType<{ className?: string }>> = {
  claim: FileText,
  submit: CheckCircle2,
  accept: Star,
  review: MessageSquare,
  join: User,
  milestone: Trophy,
};

const activityColors: Record<ActivityEvent['type'], string> = {
  claim: 'text-blue-500',
  submit: 'text-emerald-500',
  accept: 'text-amber-500',
  review: 'text-violet-500',
  join: 'text-cyan-500',
  milestone: 'text-rose-500',
};

export function LiveActivityFeed({
  events,
  maxItems = 5,
  className,
}: LiveActivityFeedProps) {
  const [visibleEvents, setVisibleEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    setVisibleEvents(events.slice(0, maxItems));
  }, [events, maxItems]);

  if (visibleEvents.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 rounded-2xl bg-card border border-border',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="relative">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          Right now on Critvue
        </span>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {visibleEvents.map((event, index) => {
            const Icon = activityIcons[event.type];
            const color = activityColors[event.type];

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'flex items-center gap-3 py-2',
                  index < visibleEvents.length - 1 && 'border-b border-border/50'
                )}
              >
                <div className={cn('p-1.5 rounded-lg bg-muted/50', color)}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <p className="flex-1 text-sm text-muted-foreground">
                  {event.message}
                </p>
                <span className="text-xs text-muted-foreground/60">
                  {formatTimeAgo(event.timestamp)}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// =============================================================================
// PREDICTION CARDS
// =============================================================================

export interface Prediction {
  id: string;
  type: 'pattern' | 'suggestion' | 'reminder';
  title: string;
  description: string;
  confidence?: number; // 0-100
  action?: {
    label: string;
    href: string;
  };
  icon?: React.ComponentType<{ className?: string }>;
}

interface PredictionCardProps {
  prediction: Prediction;
  onDismiss?: () => void;
  className?: string;
}

export function PredictionCard({
  prediction,
  onDismiss,
  className,
}: PredictionCardProps) {
  const Icon = prediction.icon || Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, height: 0 }}
      className={cn(
        'relative p-4 rounded-xl',
        'bg-gradient-to-br from-violet-50/80 via-indigo-50/60 to-blue-50/40',
        'border border-violet-200/60',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-white/60 border border-violet-100/80">
          <Icon className="w-4 h-4 text-violet-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-violet-600/70 uppercase tracking-wider">
              Based on your patterns
            </span>
            {prediction.confidence && prediction.confidence >= 80 && (
              <span className="text-xs text-violet-500">
                {prediction.confidence}% confident
              </span>
            )}
          </div>
          <h4 className="font-medium text-foreground text-sm">
            {prediction.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {prediction.description}
          </p>

          {prediction.action && (
            <Link
              href={prediction.action.href}
              className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors"
            >
              {prediction.action.label}
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-violet-100 rounded transition-colors"
          >
            <span className="sr-only">Dismiss</span>
            <span className="text-violet-400 text-lg leading-none">&times;</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Generate predictions based on user data
export function generatePredictions(data: {
  role: 'creator' | 'reviewer';
  lastActivityDay?: string; // e.g., "Thursday"
  lastActivityTime?: string; // e.g., "3:00 PM"
  preferredContentType?: string;
  avgReviewTime?: number; // minutes
  upcomingDeadlines?: number;
}): Prediction[] {
  const predictions: Prediction[] = [];

  if (data.lastActivityDay && data.lastActivityTime) {
    predictions.push({
      id: 'pattern-time',
      type: 'pattern',
      title: `You usually work on ${data.lastActivityDay}s around ${data.lastActivityTime}`,
      description: data.role === 'creator'
        ? 'Ready to submit new work?'
        : 'Good time to pick up a review?',
      action: {
        label: data.role === 'creator' ? 'Start submission' : 'Browse reviews',
        href: data.role === 'creator' ? '/review/new' : '/browse',
      },
      icon: Calendar,
      confidence: 85,
    });
  }

  if (data.avgReviewTime && data.role === 'reviewer') {
    predictions.push({
      id: 'pattern-duration',
      type: 'suggestion',
      title: `Your reviews typically take ~${data.avgReviewTime} minutes`,
      description: 'Block some time on your calendar?',
      action: {
        label: 'View active reviews',
        href: '/dashboard?role=reviewer',
      },
      icon: Timer,
      confidence: 78,
    });
  }

  if (data.upcomingDeadlines && data.upcomingDeadlines > 0) {
    predictions.push({
      id: 'reminder-deadlines',
      type: 'reminder',
      title: `${data.upcomingDeadlines} ${data.upcomingDeadlines === 1 ? 'deadline' : 'deadlines'} coming up`,
      description: 'Stay on top of your commitments',
      action: {
        label: 'View deadlines',
        href: '/dashboard',
      },
      icon: Clock,
      confidence: 100,
    });
  }

  return predictions;
}

// =============================================================================
// COUNTDOWN MOMENTS
// =============================================================================

export interface CountdownMoment {
  id: string;
  type: 'streak' | 'badge' | 'earnings' | 'tier' | 'deadline';
  title: string;
  targetDate: Date;
  currentValue?: number;
  targetValue?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

interface CountdownCardProps {
  moment: CountdownMoment;
  className?: string;
}

export function CountdownCard({ moment, className }: CountdownCardProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(moment.targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(moment.targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [moment.targetDate]);

  const Icon = moment.icon || Sparkles;

  const gradients: Record<CountdownMoment['type'], string> = {
    streak: 'from-orange-500 to-red-500',
    badge: 'from-violet-500 to-purple-500',
    earnings: 'from-emerald-500 to-teal-500',
    tier: 'from-amber-500 to-orange-500',
    deadline: 'from-blue-500 to-indigo-500',
  };

  const backgrounds: Record<CountdownMoment['type'], string> = {
    streak: 'from-orange-50 to-red-50 border-orange-200/60',
    badge: 'from-violet-50 to-purple-50 border-violet-200/60',
    earnings: 'from-emerald-50 to-teal-50 border-emerald-200/60',
    tier: 'from-amber-50 to-orange-50 border-amber-200/60',
    deadline: 'from-blue-50 to-indigo-50 border-blue-200/60',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden p-4 rounded-xl',
        'bg-gradient-to-br border',
        backgrounds[moment.type],
        className
      )}
    >
      {/* Animated background shimmer */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      />

      <div className="relative flex items-center gap-4">
        <div
          className={cn(
            'p-2.5 rounded-xl bg-gradient-to-br text-white',
            gradients[moment.type]
          )}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1">
          <p className="text-xs text-muted-foreground/70 uppercase tracking-wider mb-0.5">
            Coming up
          </p>
          <h4 className="font-medium text-foreground text-sm">
            {moment.title}
          </h4>

          {/* Progress if applicable */}
          {moment.currentValue !== undefined && moment.targetValue !== undefined && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {moment.currentValue} / {moment.targetValue}
                </span>
              </div>
              <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full bg-gradient-to-r', gradients[moment.type])}
                  initial={{ width: 0 }}
                  animate={{ width: `${(moment.currentValue / moment.targetValue) * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Countdown display */}
        <div className="text-right">
          {timeLeft.total > 0 ? (
            <div className="space-y-0.5">
              {timeLeft.days > 0 && (
                <div className="text-2xl font-bold tabular-nums">
                  {timeLeft.days}
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    {timeLeft.days === 1 ? 'day' : 'days'}
                  </span>
                </div>
              )}
              <div className="text-sm tabular-nums text-muted-foreground">
                {String(timeLeft.hours).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
            </div>
          ) : (
            <span className="text-sm font-medium text-emerald-600">Ready!</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// UPCOMING EVENTS SECTION
// =============================================================================

interface UpcomingEventsProps {
  moments: CountdownMoment[];
  predictions: Prediction[];
  className?: string;
}

export function UpcomingEventsSection({
  moments,
  predictions,
  className,
}: UpcomingEventsProps) {
  if (moments.length === 0 && predictions.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">What's Coming</h3>
      </div>

      <div className="space-y-3">
        {/* Countdown moments first */}
        {moments.slice(0, 2).map((moment) => (
          <CountdownCard key={moment.id} moment={moment} />
        ))}

        {/* Then predictions */}
        {predictions.slice(0, 2).map((prediction) => (
          <PredictionCard key={prediction.id} prediction={prediction} />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function calculateTimeLeft(targetDate: Date): {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const total = targetDate.getTime() - Date.now();

  if (total <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default LiveActivityFeed;
