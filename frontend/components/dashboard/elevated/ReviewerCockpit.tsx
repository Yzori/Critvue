'use client';

/**
 * ReviewerCockpit - Reviewer-Specific Dashboard Components
 *
 * Reviewers need a fundamentally different mental model - they're EARNING, not requesting.
 * This provides:
 * - Earnings dashboard with goals
 * - Efficiency metrics
 * - Queue optimization
 * - Smart suggestions based on success patterns
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  DollarSign,
  TrendingUp,
  Clock,
  Target,
  Award,
  Zap,
  BarChart3,
  Star,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Flame,
  Trophy,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { AnimatedNumber, AnimatedCurrency } from './AnimatedStats';

// =============================================================================
// EARNINGS DASHBOARD
// =============================================================================

interface EarningsDashboardProps {
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
  weeklyGoal?: number;
  bestDay?: { amount: number; date: string };
  className?: string;
}

export function EarningsDashboard({
  today,
  thisWeek,
  thisMonth,
  allTime,
  weeklyGoal = 200,
  bestDay,
  className,
}: EarningsDashboardProps) {
  const goalProgress = Math.min(100, (thisWeek / weeklyGoal) * 100);
  const goalAchieved = thisWeek >= weeklyGoal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50',
        'border border-emerald-200/60 shadow-sm',
        className
      )}
    >
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-200/30 rounded-full blur-2xl" />
      </div>

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Your Earnings</h3>
            <p className="text-xs text-muted-foreground">Track your progress</p>
          </div>
          {goalAchieved && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-auto flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium"
            >
              <Trophy className="w-3 h-3" />
              Goal reached!
            </motion.div>
          )}
        </div>

        {/* Main stat - This week with goal */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">This Week</p>
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-bold text-emerald-600">
              <AnimatedCurrency value={thisWeek} duration={1200} />
            </span>
            <span className="text-lg text-muted-foreground">
              / ${weeklyGoal} goal
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-3 bg-emerald-100 rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  goalAchieved
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${goalProgress}%` }}
                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{Math.round(goalProgress)}% of goal</span>
              {!goalAchieved && (
                <span>${weeklyGoal - thisWeek} to go</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-emerald-200/60">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Today</p>
            <p className="text-xl font-semibold text-foreground">
              <AnimatedCurrency value={today} delay={400} />
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">This Month</p>
            <p className="text-xl font-semibold text-foreground">
              <AnimatedCurrency value={thisMonth} delay={500} />
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">All Time</p>
            <p className="text-xl font-semibold text-foreground">
              <AnimatedCurrency value={allTime} delay={600} />
            </p>
          </div>
        </div>

        {/* Best day highlight */}
        {bestDay && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 border border-emerald-100"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">
              Best day this month:{' '}
              <span className="font-semibold text-foreground">
                ${bestDay.amount}
              </span>
              {' '}on {bestDay.date}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// EFFICIENCY METRICS
// =============================================================================

interface EfficiencyMetricsProps {
  avgTimePerReview: number; // minutes
  acceptanceRate: number; // percentage
  avgRating: number; // 1-5
  percentileRank?: number; // top X%
  totalReviews: number;
  className?: string;
}

export function EfficiencyMetrics({
  avgTimePerReview,
  acceptanceRate,
  avgRating,
  percentileRank,
  totalReviews,
  className,
}: EfficiencyMetricsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={cn(
        'p-5 rounded-2xl bg-card border border-border',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-violet-50">
          <BarChart3 className="w-4 h-4 text-violet-600" />
        </div>
        <h3 className="font-semibold text-foreground">Your Performance</h3>
      </div>

      <div className="space-y-4">
        {/* Time per review */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Avg. time per review</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{avgTimePerReview} min</span>
            {percentileRank && percentileRank <= 30 && (
              <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Top {percentileRank}%
              </span>
            )}
          </div>
        </div>

        {/* Acceptance rate */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Acceptance rate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{acceptanceRate}%</span>
            {acceptanceRate >= 95 && (
              <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Excellent
              </span>
            )}
          </div>
        </div>

        {/* Average rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Average rating</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold">{avgRating.toFixed(1)}</span>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
        </div>

        {/* Total reviews */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-sm text-muted-foreground">Total reviews</span>
          <span className="font-semibold">{totalReviews}</span>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// QUEUE OPTIMIZER
// =============================================================================

interface QueueSuggestion {
  id: string;
  title: string;
  reason: string;
  successLikelihood: number; // percentage
  estimatedTime: number; // minutes
  earnings: number;
  contentType: string;
  href: string;
}

interface QueueOptimizerProps {
  suggestions: QueueSuggestion[];
  userStrengths?: string[]; // e.g., ['UI/UX', 'Mobile Design']
  className?: string;
}

export function QueueOptimizer({
  suggestions,
  userStrengths = [],
  className,
}: QueueOptimizerProps) {
  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={cn(
        'p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-violet-50/40',
        'border border-blue-200/60',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-1">
        <div className="p-2 rounded-lg bg-blue-100">
          <Zap className="w-4 h-4 text-blue-600" />
        </div>
        <h3 className="font-semibold text-foreground">Smart Queue</h3>
      </div>

      {userStrengths.length > 0 && (
        <p className="text-xs text-muted-foreground mb-4 ml-11">
          Based on your {userStrengths.slice(0, 2).join(' & ')} expertise
        </p>
      )}

      <div className="space-y-3">
        {suggestions.slice(0, 3).map((suggestion, index) => (
          <motion.div
            key={suggestion.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <Link
              href={suggestion.href}
              className="block p-3 rounded-xl bg-white/60 border border-blue-100/80 hover:border-blue-200 hover:bg-white/80 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-foreground truncate group-hover:text-blue-600 transition-colors">
                    {suggestion.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {suggestion.reason}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-emerald-600 font-medium">
                      ${suggestion.earnings}
                    </span>
                    <span className="text-muted-foreground">
                      ~{suggestion.estimatedTime}min
                    </span>
                    <span className="text-blue-600">
                      {suggestion.successLikelihood}% match
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <Link
        href="/browse?optimized=true"
        className="flex items-center justify-center gap-2 mt-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
      >
        View optimized queue
        <ArrowRight className="w-4 h-4" />
      </Link>
    </motion.div>
  );
}

// =============================================================================
// REVIEWER QUICK STATS
// =============================================================================

interface ReviewerQuickStatsProps {
  activeClaims: number;
  pendingSubmissions: number;
  availableReviews: number;
  potentialEarnings: number;
  className?: string;
}

export function ReviewerQuickStats({
  activeClaims,
  pendingSubmissions,
  availableReviews,
  potentialEarnings,
  className,
}: ReviewerQuickStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'flex items-center gap-4 p-3 rounded-xl',
        'bg-muted/30 border border-border/50',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-blue-50">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Active</p>
          <p className="font-semibold text-sm">{activeClaims}</p>
        </div>
      </div>

      <div className="w-px h-8 bg-border" />

      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-amber-50">
          <Target className="w-3.5 h-3.5 text-amber-600" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="font-semibold text-sm">{pendingSubmissions}</p>
        </div>
      </div>

      <div className="w-px h-8 bg-border" />

      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-emerald-50">
          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Potential</p>
          <p className="font-semibold text-sm text-emerald-600">
            ${potentialEarnings}
          </p>
        </div>
      </div>

      {availableReviews > 0 && (
        <>
          <div className="w-px h-8 bg-border" />
          <Link
            href="/browse"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            {availableReviews} available
            <ArrowRight className="w-3 h-3" />
          </Link>
        </>
      )}
    </motion.div>
  );
}

// =============================================================================
// STREAK & BADGES DISPLAY
// =============================================================================

interface StreakBadgesProps {
  currentStreak: number;
  longestStreak: number;
  recentBadges: Array<{ name: string; icon: string; earnedAt: Date }>;
  className?: string;
}

export function StreakBadgesDisplay({
  currentStreak,
  longestStreak,
  recentBadges,
  className,
}: StreakBadgesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cn(
        'p-5 rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50',
        'border border-orange-200/60',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Flame className="w-4 h-4 text-white" />
          </motion.div>
          <div>
            <span className="text-3xl font-bold text-orange-600">
              <AnimatedNumber value={currentStreak} />
            </span>
            <span className="text-sm text-muted-foreground ml-2">day streak</span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-muted-foreground">Best</p>
          <p className="font-semibold text-orange-600">{longestStreak} days</p>
        </div>
      </div>

      {recentBadges.length > 0 && (
        <div className="pt-4 border-t border-orange-200/60">
          <p className="text-xs text-muted-foreground mb-2">Recent Badges</p>
          <div className="flex gap-2">
            {recentBadges.slice(0, 3).map((badge, index) => (
              <motion.div
                key={badge.name}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/60 border border-orange-100"
              >
                <span>{badge.icon}</span>
                <span className="text-xs font-medium">{badge.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default EarningsDashboard;
