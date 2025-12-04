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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl',
        'bg-card border border-border/60',
        // Dark mode - tier 2 with light blue accent border
        'dark:bg-[var(--dark-tier-2)] dark:border-accent-blue/30',
        'dark:hover:border-accent-blue/50 dark:hover:shadow-lg dark:hover:shadow-accent-blue/10',
        'transition-all duration-200',
        className
      )}
    >
      <div className="p-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-foreground">Earnings</span>
          </div>
          {goalAchieved && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-medium">
              <Trophy className="w-3 h-3" />
              Goal!
            </span>
          )}
        </div>

        {/* Main stat - Compact */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">
              <AnimatedCurrency value={thisWeek} duration={800} />
            </span>
            <span className="text-sm text-muted-foreground">
              / ${weeklyGoal}
            </span>
          </div>

          {/* Thinner progress bar */}
          <div className="mt-2">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${goalProgress}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {Math.round(goalProgress)}% weekly goal
            </p>
          </div>
        </div>

        {/* Compact stats row */}
        <div className="flex items-center gap-4 pt-3 border-t border-border/60 text-xs">
          <div>
            <p className="text-muted-foreground">Today</p>
            <p className="font-semibold"><AnimatedCurrency value={today} delay={200} /></p>
          </div>
          <div>
            <p className="text-muted-foreground">Month</p>
            <p className="font-semibold"><AnimatedCurrency value={thisMonth} delay={300} /></p>
          </div>
          <div>
            <p className="text-muted-foreground">Total</p>
            <p className="font-semibold"><AnimatedCurrency value={allTime} delay={400} /></p>
          </div>
        </div>
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
        // Dark mode - tier 2 with light blue accent border
        'dark:bg-[var(--dark-tier-2)] dark:border-accent-blue/30',
        'dark:hover:border-accent-blue/50 dark:hover:shadow-lg dark:hover:shadow-accent-blue/10',
        'transition-all duration-200',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-violet-500/10">
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
              <span className="text-xs text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
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
              <span className="text-xs text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
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
        'p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-violet-500/5',
        'border border-blue-500/20',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-1">
        <div className="p-2 rounded-lg bg-blue-500/10">
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
              className="block p-3 rounded-xl bg-background/60 border border-blue-500/20 hover:border-blue-500/30 hover:bg-background/80 transition-all group"
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
        <div className="p-1.5 rounded-lg bg-blue-500/10">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Active</p>
          <p className="font-semibold text-sm">{activeClaims}</p>
        </div>
      </div>

      <div className="w-px h-8 bg-border" />

      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-amber-500/10">
          <Target className="w-3.5 h-3.5 text-amber-600" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="font-semibold text-sm">{pendingSubmissions}</p>
        </div>
      </div>

      <div className="w-px h-8 bg-border" />

      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-emerald-500/10">
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
        'p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-yellow-500/5',
        'border border-orange-500/20',
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
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/60 border border-orange-500/20"
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
