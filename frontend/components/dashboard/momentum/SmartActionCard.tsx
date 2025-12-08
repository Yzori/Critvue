'use client';

/**
 * SmartActionCard Component
 *
 * Clean, compact action cards with clear CTAs.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sunrise,
  Target,
  Flame,
  Trophy,
  ArrowRight,
  Sparkles,
  Clock,
  AlertCircle,
  Search,
  X,
} from 'lucide-react';

export type ActionType =
  | 'morning_start'
  | 'near_goal'
  | 'streak_risk'
  | 'celebration'
  | 'urgent_review'
  | 'keep_going'
  | 'welcome_back'
  | 'find_reviews'
  | 'submit_work';

export interface SmartAction {
  type: ActionType;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref?: string;
  ctaAction?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
  secondaryAction?: () => void;
  priority: 'low' | 'medium' | 'high';
}

export interface SmartActionCardProps {
  action: SmartAction;
  onDismiss?: () => void;
  className?: string;
}

const actionStyles: Record<ActionType, {
  icon: React.ReactNode;
  accentColor: string;
  bgColor: string;
}> = {
  morning_start: {
    icon: <Sunrise className="h-4 w-4" />,
    accentColor: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
  },
  near_goal: {
    icon: <Target className="h-4 w-4" />,
    accentColor: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
  },
  streak_risk: {
    icon: <AlertCircle className="h-4 w-4" />,
    accentColor: 'text-red-600',
    bgColor: 'bg-red-500/10',
  },
  celebration: {
    icon: <Trophy className="h-4 w-4" />,
    accentColor: 'text-yellow-600',
    bgColor: 'bg-yellow-500/10',
  },
  urgent_review: {
    icon: <Clock className="h-4 w-4" />,
    accentColor: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
  },
  keep_going: {
    icon: <Flame className="h-4 w-4" />,
    accentColor: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
  },
  welcome_back: {
    icon: <Sparkles className="h-4 w-4" />,
    accentColor: 'text-indigo-600',
    bgColor: 'bg-indigo-500/10',
  },
  find_reviews: {
    icon: <Search className="h-4 w-4" />,
    accentColor: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
  },
  submit_work: {
    icon: <Target className="h-4 w-4" />,
    accentColor: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
  },
};

export const SmartActionCard: React.FC<SmartActionCardProps> = ({
  action,
  onDismiss,
  className,
}) => {
  const style = actionStyles[action.type];

  const CtaButton = action.ctaHref ? (
    <Button size="sm" asChild className="gap-1.5 h-8">
      <Link href={action.ctaHref}>
        {action.ctaLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </Button>
  ) : (
    <Button size="sm" onClick={action.ctaAction} className="gap-1.5 h-8">
      {action.ctaLabel}
      <ArrowRight className="h-3.5 w-3.5" />
    </Button>
  );

  const SecondaryButton = action.secondaryLabel && (
    action.secondaryHref ? (
      <Button size="sm" variant="ghost" asChild className="h-8">
        <Link href={action.secondaryHref}>{action.secondaryLabel}</Link>
      </Button>
    ) : action.secondaryAction ? (
      <Button size="sm" variant="ghost" onClick={action.secondaryAction} className="h-8">
        {action.secondaryLabel}
      </Button>
    ) : null
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-xl',
        'bg-card border border-border/60',
        'hover:border-border hover:shadow-sm transition-all',
        className
      )}
    >
      {/* Icon */}
      <div className={cn(
        'flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg',
        style.bgColor,
        style.accentColor
      )}>
        {style.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-medium text-sm text-foreground leading-tight">
              {action.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {action.description}
            </p>
          </div>

          {/* Priority badge */}
          {action.priority === 'high' && (
            <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-600">
              Urgent
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          {CtaButton}
          {SecondaryButton}
        </div>
      </div>

      {/* Dismiss */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.div>
  );
};

/**
 * Generate smart actions based on user state
 */
export function generateSmartActions(params: {
  streak: number;
  weeklyProgress: number;
  weeklyGoal: number;
  pendingReviews: number;
  lastActiveDate: Date | null;
  role: 'creator' | 'reviewer';
}): SmartAction[] {
  const { streak, weeklyProgress, weeklyGoal, pendingReviews, role } = params;
  const actions: SmartAction[] = [];
  const remaining = weeklyGoal - weeklyProgress;

  // Role-specific primary action (always show one)
  if (role === 'reviewer') {
    // Reviewer: encourage finding reviews
    if (remaining > 0) {
      actions.push({
        type: 'find_reviews',
        title: 'Find reviews to complete',
        description: `${remaining} more review${remaining > 1 ? 's' : ''} to reach your weekly goal.`,
        ctaLabel: 'Browse Reviews',
        ctaHref: '/browse',
        priority: 'medium',
      });
    } else {
      actions.push({
        type: 'keep_going',
        title: 'Keep the momentum going',
        description: 'You hit your goal! Extra reviews earn bonus sparks.',
        ctaLabel: 'Find More',
        ctaHref: '/browse',
        priority: 'low',
      });
    }
  } else {
    // Creator: show pending reviews or encourage submissions
    if (pendingReviews > 0) {
      actions.push({
        type: 'urgent_review',
        title: `${pendingReviews} review${pendingReviews > 1 ? 's' : ''} ready`,
        description: 'Accept reviews to get your feedback.',
        ctaLabel: 'View Reviews',
        ctaHref: '/dashboard',
        priority: pendingReviews > 2 ? 'high' : 'medium',
      });
    } else {
      actions.push({
        type: 'submit_work',
        title: 'Get expert feedback',
        description: 'Submit your work for professional review.',
        ctaLabel: 'Submit Work',
        ctaHref: '/submit',
        priority: 'medium',
      });
    }
  }

  // Near weekly goal - high priority nudge
  if (remaining > 0 && remaining <= 2 && role === 'reviewer') {
    actions.unshift({
      type: 'near_goal',
      title: `Just ${remaining} more to go!`,
      description: 'Finish strong and earn bonus XP.',
      ctaLabel: 'Complete Goal',
      ctaHref: '/browse',
      priority: 'high',
    });
  }

  // Streak celebration or risk
  if (streak >= 5) {
    actions.push({
      type: 'celebration',
      title: `${streak} day streak!`,
      description: 'You\'re on fire. Keep it going!',
      ctaLabel: 'View Stats',
      ctaHref: '/dashboard/karma',
      priority: 'low',
    });
  }

  // Limit to 2 most relevant actions
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return actions
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 2);
}

export default SmartActionCard;
