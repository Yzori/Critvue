'use client';

/**
 * SmartActionCard Component
 *
 * Contextual action cards that change based on:
 * - Time of day
 * - User's current state (near goal, on streak, etc.)
 * - Pending tasks urgency
 *
 * Creates a personalized, engaging experience.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';

export type ActionType =
  | 'morning_start'
  | 'near_goal'
  | 'streak_risk'
  | 'celebration'
  | 'urgent_review'
  | 'keep_going'
  | 'welcome_back';

export interface SmartAction {
  type: ActionType;
  title: string;
  description: string;
  ctaLabel: string;
  ctaAction: () => void;
  secondaryLabel?: string;
  secondaryAction?: () => void;
  priority: 'low' | 'medium' | 'high';
  icon?: React.ReactNode;
  gradient?: string;
}

export interface SmartActionCardProps {
  action: SmartAction;
  onDismiss?: () => void;
  className?: string;
}

const actionStyles: Record<ActionType, { icon: React.ReactNode; gradient: string; accent: string }> = {
  morning_start: {
    icon: <Sunrise className="h-6 w-6" />,
    gradient: 'from-amber-50 to-orange-50',
    accent: 'text-amber-600',
  },
  near_goal: {
    icon: <Target className="h-6 w-6" />,
    gradient: 'from-blue-50 to-cyan-50',
    accent: 'text-blue-600',
  },
  streak_risk: {
    icon: <AlertCircle className="h-6 w-6" />,
    gradient: 'from-red-50 to-orange-50',
    accent: 'text-red-600',
  },
  celebration: {
    icon: <Trophy className="h-6 w-6" />,
    gradient: 'from-yellow-50 to-amber-50',
    accent: 'text-yellow-600',
  },
  urgent_review: {
    icon: <Clock className="h-6 w-6" />,
    gradient: 'from-purple-50 to-pink-50',
    accent: 'text-purple-600',
  },
  keep_going: {
    icon: <Flame className="h-6 w-6" />,
    gradient: 'from-orange-50 to-red-50',
    accent: 'text-orange-600',
  },
  welcome_back: {
    icon: <Sparkles className="h-6 w-6" />,
    gradient: 'from-indigo-50 to-purple-50',
    accent: 'text-indigo-600',
  },
};

export const SmartActionCard: React.FC<SmartActionCardProps> = ({
  action,
  onDismiss,
  className,
}) => {
  const style = actionStyles[action.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border shadow-sm',
        `bg-gradient-to-br ${style.gradient}`,
        className
      )}
    >
      {/* Priority indicator */}
      {action.priority === 'high' && (
        <motion.div
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <motion.div
            className={cn(
              'flex-shrink-0 p-3 rounded-xl bg-white/80 shadow-sm',
              style.accent
            )}
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            {action.icon || style.icon}
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground mb-1">
              {action.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {action.description}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={action.ctaAction}
                className="gap-2"
              >
                {action.ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>

              {action.secondaryLabel && action.secondaryAction && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={action.secondaryAction}
                >
                  {action.secondaryLabel}
                </Button>
              )}
            </div>
          </div>

          {/* Dismiss button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Dismiss"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Decorative element */}
      <div
        className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-10"
        style={{
          background: `radial-gradient(circle, currentColor 0%, transparent 70%)`,
        }}
      />
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
  const { streak, weeklyProgress, weeklyGoal, pendingReviews, lastActiveDate, role } = params;
  const actions: SmartAction[] = [];
  const hour = new Date().getHours();
  const today = new Date();
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;

  // Check if returning after absence
  if (lastActiveDate) {
    const daysSinceActive = Math.floor(
      (today.getTime() - new Date(lastActiveDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceActive > 2) {
      actions.push({
        type: 'welcome_back',
        title: 'Welcome back!',
        description: `We missed you! Your streak is safe thanks to weekend grace. Ready to dive back in?`,
        ctaLabel: role === 'reviewer' ? 'Find Reviews' : 'View Dashboard',
        ctaAction: () => {},
        priority: 'medium',
      });
    }
  }

  // Morning motivation (6am - 10am)
  if (hour >= 6 && hour < 10 && weeklyProgress < weeklyGoal) {
    actions.push({
      type: 'morning_start',
      title: 'Start your day strong',
      description: isWeekend
        ? 'Weekend reviews count double toward next week\'s goal!'
        : `Complete ${weeklyGoal - weeklyProgress} more review${weeklyGoal - weeklyProgress > 1 ? 's' : ''} to hit your weekly goal.`,
      ctaLabel: role === 'reviewer' ? 'Start a Review' : 'Check Pending',
      ctaAction: () => {},
      priority: 'low',
    });
  }

  // Near weekly goal (within 1-2 of goal)
  const remaining = weeklyGoal - weeklyProgress;
  if (remaining > 0 && remaining <= 2) {
    actions.push({
      type: 'near_goal',
      title: `Just ${remaining} more to go!`,
      description: `You're so close to your weekly goal. Finish strong and earn bonus XP!`,
      ctaLabel: 'Complete Goal',
      ctaAction: () => {},
      priority: 'high',
    });
  }

  // Weekly goal completed - celebration
  if (weeklyProgress >= weeklyGoal) {
    actions.push({
      type: 'celebration',
      title: 'Weekly goal achieved!',
      description: `Amazing work! You've completed ${weeklyProgress} reviews this week. Keep going for bonus rewards!`,
      ctaLabel: 'View Achievements',
      ctaAction: () => {},
      secondaryLabel: 'Keep Going',
      secondaryAction: () => {},
      priority: 'medium',
    });
  }

  // Streak at risk (no activity today and it's past noon)
  if (streak > 0 && hour >= 12 && !isWeekend) {
    actions.push({
      type: 'streak_risk',
      title: 'Keep your streak alive!',
      description: `Your ${streak}-day streak is at risk. Complete a review before midnight to maintain it.`,
      ctaLabel: 'Quick Review',
      ctaAction: () => {},
      priority: 'high',
    });
  }

  // Keep going (on a roll - completed multiple today)
  if (streak >= 3 && weeklyProgress > 0) {
    actions.push({
      type: 'keep_going',
      title: 'You\'re on fire!',
      description: `${streak} day streak! You're in the top 10% of active reviewers this week.`,
      ctaLabel: 'Continue',
      ctaAction: () => {},
      priority: 'medium',
    });
  }

  // Urgent reviews pending (for creators)
  if (role === 'creator' && pendingReviews > 0) {
    actions.push({
      type: 'urgent_review',
      title: `${pendingReviews} review${pendingReviews > 1 ? 's' : ''} awaiting action`,
      description: 'Reviews expire in 48 hours. Accept them to receive feedback!',
      ctaLabel: 'Review Now',
      ctaAction: () => {},
      priority: pendingReviews > 2 ? 'high' : 'medium',
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

export default SmartActionCard;
