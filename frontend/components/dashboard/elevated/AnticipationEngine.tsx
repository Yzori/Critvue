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
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-1.5 px-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Live
        </span>
      </div>

      <div className="rounded-lg bg-card border border-border/60 divide-y divide-border/40">
        {visibleEvents.slice(0, 3).map((event) => {
          const Icon = activityIcons[event.type];
          const color = activityColors[event.type];

          return (
            <div key={event.id} className="flex items-center gap-2 px-3 py-2">
              <Icon className={cn('w-3 h-3 flex-shrink-0', color)} />
              <p className="flex-1 text-[11px] text-muted-foreground truncate">
                {event.message}
              </p>
              <span className="text-[10px] text-muted-foreground/50 flex-shrink-0">
                {formatTimeAgo(event.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
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
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        'p-3 rounded-lg',
        'bg-slate-50/80 border border-border/60',
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="p-1.5 rounded-md bg-slate-100">
          <Icon className="w-3.5 h-3.5 text-slate-500" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground leading-snug">
            {prediction.title}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {prediction.description}
          </p>

          {prediction.action && (
            <Link
              href={prediction.action.href}
              className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-blue-600 hover:text-blue-700"
            >
              {prediction.action.label}
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
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

  const iconColors: Record<CountdownMoment['type'], string> = {
    streak: 'bg-orange-50 text-orange-500',
    badge: 'bg-violet-50 text-violet-500',
    earnings: 'bg-emerald-50 text-emerald-500',
    tier: 'bg-amber-50 text-amber-500',
    deadline: 'bg-blue-50 text-blue-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-3 rounded-lg',
        'bg-card border border-border/60',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn('p-1.5 rounded-md', iconColors[moment.type])}>
          <Icon className="w-3.5 h-3.5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">
            {moment.title}
          </p>

          {/* Compact progress */}
          {moment.currentValue !== undefined && moment.targetValue !== undefined && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-400 rounded-full"
                  style={{ width: `${(moment.currentValue / moment.targetValue) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {moment.currentValue}/{moment.targetValue}
              </span>
            </div>
          )}
        </div>

        {/* Compact countdown */}
        <div className="text-right">
          {timeLeft.total > 0 ? (
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              {timeLeft.days > 0 ? `${timeLeft.days}d` : ''} {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}
            </span>
          ) : (
            <span className="text-xs font-medium text-emerald-600">Ready!</span>
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
    <div className={cn('space-y-2', className)}>
      {/* Countdown moments first */}
      {moments.slice(0, 2).map((moment) => (
        <CountdownCard key={moment.id} moment={moment} />
      ))}

      {/* Then predictions */}
      {predictions.slice(0, 1).map((prediction) => (
        <PredictionCard key={prediction.id} prediction={prediction} />
      ))}
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
