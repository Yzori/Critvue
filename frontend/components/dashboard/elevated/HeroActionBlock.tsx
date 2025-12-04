'use client';

/**
 * HeroActionBlock - The Dashboard's Command Center
 *
 * A single, prominent block that answers "What should I do right now?"
 * Contextually chosen based on:
 * - Pending actions (reviews to accept, work to complete)
 * - Urgency (deadlines, auto-accepts)
 * - Progress (near-completion items)
 * - Time of day and user patterns
 *
 * This is the first thing users see and the primary call-to-action.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  Clock,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Play,
  Star,
  Zap,
  TrendingUp,
  Award,
} from 'lucide-react';

export type HeroActionType =
  | 'continue_review'     // Reviewer: Continue an in-progress review
  | 'accept_feedback'     // Creator: Review waiting for acceptance
  | 'urgent_deadline'     // Either: Something about to expire
  | 'complete_review'     // Reviewer: Review at 70%+ completion
  | 'start_fresh'         // Either: No urgent tasks, encourage new activity
  | 'celebrate'           // Either: Just achieved something
  | 'streak_risk'         // Either: Streak about to break
  | 'earnings_milestone'; // Reviewer: Close to earnings milestone

export interface HeroAction {
  type: HeroActionType;
  title: string;
  subtitle: string;
  description?: string;
  href: string;
  ctaLabel: string;
  urgency?: 'critical' | 'high' | 'medium' | 'low';
  progress?: {
    current: number;
    total: number;
    label?: string;
  };
  earnings?: number;
  timeRemaining?: string;
  secondaryInfo?: string;
  avatar?: {
    name: string;
    imageUrl?: string;
  };
}

interface HeroActionBlockProps {
  action: HeroAction | null;
  role: 'creator' | 'reviewer';
  alternateCount?: number;
  onAlternateClick?: () => void;
  className?: string;
  isLoading?: boolean;
}

// Icon mapping for action types
const actionIcons: Record<HeroActionType, React.ComponentType<{ className?: string }>> = {
  continue_review: Play,
  accept_feedback: CheckCircle2,
  urgent_deadline: AlertCircle,
  complete_review: FileText,
  start_fresh: Sparkles,
  celebrate: Award,
  streak_risk: Zap,
  earnings_milestone: TrendingUp,
};

// Gradient mapping for action types
const actionGradients: Record<HeroActionType, string> = {
  continue_review: 'from-blue-500 via-blue-600 to-indigo-600',
  accept_feedback: 'from-emerald-500 via-emerald-600 to-teal-600',
  urgent_deadline: 'from-red-500 via-red-600 to-rose-600',
  complete_review: 'from-violet-500 via-violet-600 to-purple-600',
  start_fresh: 'from-blue-500 via-indigo-500 to-violet-500',
  celebrate: 'from-amber-400 via-orange-500 to-rose-500',
  streak_risk: 'from-amber-500 via-orange-500 to-red-500',
  earnings_milestone: 'from-emerald-500 via-teal-500 to-cyan-500',
};

// Background pattern for different action types (dark mode compatible)
const actionBackgrounds: Record<HeroActionType, string> = {
  continue_review: 'bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-violet-500/5',
  accept_feedback: 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/5',
  urgent_deadline: 'bg-gradient-to-br from-red-500/10 via-rose-500/5 to-orange-500/5',
  complete_review: 'bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/5',
  start_fresh: 'bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-violet-500/5',
  celebrate: 'bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-rose-500/5',
  streak_risk: 'bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/5',
  earnings_milestone: 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/5',
};

// Border colors for action types (dark mode compatible)
const actionBorders: Record<HeroActionType, string> = {
  continue_review: 'border-blue-500/20',
  accept_feedback: 'border-emerald-500/20',
  urgent_deadline: 'border-red-500/20',
  complete_review: 'border-violet-500/20',
  start_fresh: 'border-blue-500/20',
  celebrate: 'border-amber-500/20',
  streak_risk: 'border-amber-500/20',
  earnings_milestone: 'border-emerald-500/20',
};

export function HeroActionBlock({
  action,
  role,
  alternateCount = 0,
  onAlternateClick,
  className,
  isLoading = false,
}: HeroActionBlockProps) {
  if (isLoading) {
    return <HeroActionSkeleton />;
  }

  // Empty state when no action
  if (!action) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative overflow-hidden rounded-2xl p-6',
          'bg-gradient-to-br from-muted via-muted to-muted',
          'border border-border/80 shadow-sm',
          className
        )}
      >
        <div className="flex items-center gap-5">
          <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-xl bg-muted border border-border/50">
            <Sparkles className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-lg">You're all caught up!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {role === 'creator'
                ? 'No pending feedback to review. Submit new work to get expert insights.'
                : 'No active reviews. Browse available work to start earning.'}
            </p>
          </div>
          <Link
            href={role === 'creator' ? '/review/new' : '/browse'}
            className={cn(
              'flex-shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl',
              'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600',
              'text-white font-medium shadow-lg shadow-blue-500/25',
              'hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02]',
              'transition-all duration-200'
            )}
          >
            {role === 'creator' ? 'Submit Work' : 'Browse Reviews'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>
    );
  }

  const Icon = actionIcons[action.type];
  const gradient = actionGradients[action.type];
  const background = actionBackgrounds[action.type];
  const border = actionBorders[action.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl',
        background,
        'border shadow-sm',
        border,
        className
      )}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-background/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-background/30 rounded-full blur-2xl" />
      </div>

      {/* Urgency indicator bar */}
      {action.urgency === 'critical' && (
        <motion.div
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      <div className="relative p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
          {/* Icon with gradient background */}
          <div
            className={cn(
              'flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-xl',
              'bg-gradient-to-br shadow-lg',
              gradient,
              'shadow-lg'
            )}
            style={{
              boxShadow: `0 8px 24px -4px ${
                action.type === 'urgent_deadline' ? 'rgba(239, 68, 68, 0.3)' :
                action.type === 'accept_feedback' ? 'rgba(16, 185, 129, 0.3)' :
                action.type === 'celebrate' ? 'rgba(251, 191, 36, 0.3)' :
                'rgba(59, 130, 246, 0.3)'
              }`
            }}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Label */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                Your Next Move
              </span>
              {action.urgency === 'critical' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Urgent
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-foreground text-lg leading-tight">
              {action.title}
            </h3>

            {/* Subtitle with context */}
            <p className="text-sm text-muted-foreground mt-1">
              {action.subtitle}
            </p>

            {/* Progress bar if applicable */}
            {action.progress && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{action.progress.label || 'Progress'}</span>
                  <span className="font-medium text-foreground">
                    {Math.round((action.progress.current / action.progress.total) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-background/60 rounded-full overflow-hidden border border-background/80">
                  <motion.div
                    className={cn('h-full rounded-full bg-gradient-to-r', gradient)}
                    initial={{ width: 0 }}
                    animate={{ width: `${(action.progress.current / action.progress.total) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}

            {/* Meta info row */}
            <div className="flex items-center gap-4 mt-3 text-sm">
              {action.earnings !== undefined && (
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">${action.earnings}</span>
                </div>
              )}
              {action.timeRemaining && (
                <div className={cn(
                  'flex items-center gap-1.5',
                  action.urgency === 'critical' ? 'text-red-600' : 'text-muted-foreground'
                )}>
                  <Clock className="h-4 w-4" />
                  <span className={action.urgency === 'critical' ? 'font-medium' : ''}>
                    {action.timeRemaining}
                  </span>
                </div>
              )}
              {action.avatar && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  {action.avatar.imageUrl ? (
                    <img
                      src={action.avatar.imageUrl}
                      alt={action.avatar.name}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {action.avatar.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>{action.avatar.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <Link
              href={action.href}
              className={cn(
                'inline-flex items-center gap-2 px-5 py-3 rounded-xl',
                'bg-gradient-to-r text-white font-medium',
                'shadow-lg hover:shadow-xl hover:scale-[1.02]',
                'transition-all duration-200',
                gradient
              )}
              style={{
                boxShadow: `0 8px 24px -4px ${
                  action.type === 'urgent_deadline' ? 'rgba(239, 68, 68, 0.35)' :
                  action.type === 'accept_feedback' ? 'rgba(16, 185, 129, 0.35)' :
                  action.type === 'celebrate' ? 'rgba(251, 191, 36, 0.35)' :
                  'rgba(59, 130, 246, 0.35)'
                }`
              }}
            >
              {action.ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Alternate actions count */}
            {alternateCount > 0 && onAlternateClick && (
              <button
                onClick={onAlternateClick}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                +{alternateCount} other {alternateCount === 1 ? 'task' : 'tasks'}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Loading skeleton
function HeroActionSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-muted via-muted to-muted border border-border/80 shadow-sm p-6">
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 rounded-xl bg-muted animate-pulse" />
        <div className="flex-1 space-y-3">
          <div className="h-3 w-24 bg-muted rounded animate-pulse" />
          <div className="h-5 w-64 bg-muted rounded animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="w-32 h-12 rounded-xl bg-muted animate-pulse" />
      </div>
    </div>
  );
}

// Helper to determine hero action from dashboard data
export function determineHeroAction(
  role: 'creator' | 'reviewer',
  data: {
    pendingReviews?: Array<{
      slot_id: number;
      review_request_id: number;
      review_request_title: string;
      reviewer?: { name?: string; avatar_url?: string };
      urgency_level: string;
      countdown_text: string;
      auto_accept_at?: string;
    }>;
    activeReviews?: Array<{
      slot_id: number;
      review_request?: { title?: string };
      urgency_level: string;
      countdown_text: string;
      earnings_potential: number;
      draft_progress: { has_draft: boolean; percentage?: number };
    }>;
    streak?: number;
    streakAtRisk?: boolean;
  }
): HeroAction | null {
  if (role === 'creator') {
    // Check for urgent pending reviews
    const urgentReview = data.pendingReviews?.find(
      r => r.urgency_level === 'CRITICAL' || r.urgency_level === 'HIGH'
    );

    if (urgentReview) {
      return {
        type: 'urgent_deadline',
        title: urgentReview.review_request_title,
        subtitle: `Review from ${urgentReview.reviewer?.name || 'an expert'} needs your attention`,
        href: `/review/${urgentReview.review_request_id}`,
        ctaLabel: 'Review Now',
        urgency: urgentReview.urgency_level === 'CRITICAL' ? 'critical' : 'high',
        timeRemaining: urgentReview.countdown_text,
        avatar: urgentReview.reviewer ? {
          name: urgentReview.reviewer.name || 'Expert',
          imageUrl: urgentReview.reviewer.avatar_url,
        } : undefined,
      };
    }

    // Regular pending review
    const pendingReview = data.pendingReviews?.[0];
    if (pendingReview) {
      return {
        type: 'accept_feedback',
        title: pendingReview.review_request_title,
        subtitle: `Expert feedback ready for your review`,
        href: `/review/${pendingReview.review_request_id}`,
        ctaLabel: 'View Feedback',
        timeRemaining: pendingReview.countdown_text,
        avatar: pendingReview.reviewer ? {
          name: pendingReview.reviewer.name || 'Expert',
          imageUrl: pendingReview.reviewer.avatar_url,
        } : undefined,
      };
    }
  }

  if (role === 'reviewer') {
    // Check for review near completion
    const nearComplete = data.activeReviews?.find(
      r => r.draft_progress.has_draft && (r.draft_progress.percentage ?? 0) >= 70
    );

    if (nearComplete) {
      return {
        type: 'complete_review',
        title: nearComplete.review_request?.title || 'Your review',
        subtitle: 'Almost done! Finish strong and submit',
        href: `/reviewer/review/${nearComplete.slot_id}`,
        ctaLabel: 'Complete Review',
        earnings: nearComplete.earnings_potential,
        progress: {
          current: nearComplete.draft_progress.percentage ?? 70,
          total: 100,
          label: 'Review progress',
        },
      };
    }

    // Check for urgent deadline
    const urgentReview = data.activeReviews?.find(
      r => r.urgency_level === 'CRITICAL' || r.urgency_level === 'HIGH'
    );

    if (urgentReview) {
      return {
        type: 'urgent_deadline',
        title: urgentReview.review_request?.title || 'Active review',
        subtitle: 'Deadline approaching - submit soon',
        href: `/reviewer/review/${urgentReview.slot_id}`,
        ctaLabel: 'Continue Review',
        urgency: urgentReview.urgency_level === 'CRITICAL' ? 'critical' : 'high',
        earnings: urgentReview.earnings_potential,
        timeRemaining: urgentReview.countdown_text,
      };
    }

    // Continue existing review
    const activeReview = data.activeReviews?.find(r => r.draft_progress.has_draft);
    if (activeReview) {
      return {
        type: 'continue_review',
        title: activeReview.review_request?.title || 'Your review',
        subtitle: 'Pick up where you left off',
        href: `/reviewer/review/${activeReview.slot_id}`,
        ctaLabel: 'Continue',
        earnings: activeReview.earnings_potential,
        progress: activeReview.draft_progress.percentage ? {
          current: activeReview.draft_progress.percentage,
          total: 100,
          label: 'Progress',
        } : undefined,
      };
    }

    // Start fresh review
    const freshReview = data.activeReviews?.[0];
    if (freshReview) {
      return {
        type: 'continue_review',
        title: freshReview.review_request?.title || 'New review',
        subtitle: 'Start your expert analysis',
        href: `/reviewer/review/${freshReview.slot_id}`,
        ctaLabel: 'Start Review',
        earnings: freshReview.earnings_potential,
        timeRemaining: freshReview.countdown_text,
      };
    }
  }

  // Check for streak risk (both roles)
  if (data.streakAtRisk && (data.streak ?? 0) > 0) {
    return {
      type: 'streak_risk',
      title: `${data.streak}-day streak at risk!`,
      subtitle: 'Complete an activity today to keep it going',
      href: role === 'creator' ? '/review/new' : '/browse',
      ctaLabel: role === 'creator' ? 'Submit Work' : 'Find Review',
      urgency: 'high',
    };
  }

  // Default: Encourage new activity based on role
  if (role === 'creator') {
    return {
      type: 'start_fresh',
      title: 'Ready for expert feedback?',
      subtitle: 'Get professional insights on your creative work',
      description: 'Submit your design, code, writing, or other creative work for expert review',
      href: '/review/new',
      ctaLabel: 'Get Feedback',
    };
  }

  // Reviewer with no active reviews
  return {
    type: 'start_fresh',
    title: 'Find your next review',
    subtitle: 'Browse available work and start earning',
    description: 'Discover creative projects that match your expertise',
    href: '/browse',
    ctaLabel: 'Browse Reviews',
  };
}

export default HeroActionBlock;
