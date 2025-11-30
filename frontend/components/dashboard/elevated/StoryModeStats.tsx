'use client';

/**
 * StoryModeStats - Narrative-Driven Statistics
 *
 * Transforms raw numbers into narrative arcs that tell the user's story.
 * Instead of "Total Reviews: 47", we show:
 * "Chapter 12: The Momentum Builder - 47 reviews have shaped your work this year."
 *
 * This creates emotional connection and context for achievements.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  TrendingUp,
  Award,
  Target,
  Flame,
  Star,
  Clock,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Heart,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export interface StoryStats {
  // Core numbers
  totalReviews: number;
  completedReviews: number;
  inProgressReviews: number;
  averageRating: number;
  currentStreak: number;

  // Time-based
  memberSince: Date;
  thisWeekActivity: number;
  lastMonthActivity: number;

  // Community context
  percentileRank?: number; // Top X%
  communityAverage?: number;

  // Reviewer specific
  totalEarnings?: number;
  acceptanceRate?: number;

  // Creator specific
  improvementScore?: number; // How much they've improved
}

interface StoryModeStatsProps {
  stats: StoryStats;
  role: 'creator' | 'reviewer';
  userName?: string;
  className?: string;
}

// Generate chapter based on total activity
function generateChapter(totalReviews: number): { number: number; name: string } {
  if (totalReviews === 0) return { number: 1, name: 'The Beginning' };
  if (totalReviews < 5) return { number: 2, name: 'First Steps' };
  if (totalReviews < 10) return { number: 3, name: 'Finding Your Voice' };
  if (totalReviews < 25) return { number: 4, name: 'Building Momentum' };
  if (totalReviews < 50) return { number: 5, name: 'The Rising' };
  if (totalReviews < 100) return { number: 6, name: 'Hitting Stride' };
  if (totalReviews < 200) return { number: 7, name: 'The Expert' };
  if (totalReviews < 500) return { number: 8, name: 'Master Class' };
  return { number: 9, name: 'Legend' };
}

// Generate narrative based on stats
function generateNarrative(
  stats: StoryStats,
  role: 'creator' | 'reviewer'
): { primary: string; secondary: string; highlight?: string } {
  const memberMonths = Math.floor(
    (Date.now() - stats.memberSince.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  if (role === 'creator') {
    if (stats.totalReviews === 0) {
      return {
        primary: 'Your creative journey awaits',
        secondary: 'Submit your first work to begin receiving expert feedback.',
      };
    }

    if (stats.currentStreak >= 7) {
      return {
        primary: `${stats.totalReviews} reviews have shaped your work`,
        secondary: `You're on a ${stats.currentStreak}-day streak of growth.`,
        highlight: 'On fire!',
      };
    }

    if (stats.percentileRank && stats.percentileRank <= 20) {
      return {
        primary: `${stats.totalReviews} reviews and counting`,
        secondary: `Your ${stats.averageRating.toFixed(1)} average rating puts you in the top ${stats.percentileRank}% of creators.`,
        highlight: `Top ${stats.percentileRank}%`,
      };
    }

    return {
      primary: `${stats.totalReviews} expert ${stats.totalReviews === 1 ? 'review has' : 'reviews have'} guided your growth`,
      secondary: memberMonths > 0
        ? `${memberMonths} ${memberMonths === 1 ? 'month' : 'months'} of continuous improvement.`
        : 'Just getting started on your creative journey.',
    };
  }

  // Reviewer narrative
  if (stats.totalReviews === 0) {
    return {
      primary: 'Your expertise is needed',
      secondary: 'Start reviewing to earn and help creators grow.',
    };
  }

  if (stats.totalEarnings && stats.totalEarnings >= 1000) {
    return {
      primary: `$${stats.totalEarnings.toLocaleString()} earned sharing your expertise`,
      secondary: `${stats.completedReviews} creators improved because of you.`,
      highlight: 'Four figures!',
    };
  }

  if (stats.acceptanceRate && stats.acceptanceRate >= 95) {
    return {
      primary: `${stats.completedReviews} reviews with ${stats.acceptanceRate}% acceptance`,
      secondary: 'Creators trust your insights.',
      highlight: 'Trusted Expert',
    };
  }

  return {
    primary: `${stats.completedReviews} ${stats.completedReviews === 1 ? 'review' : 'reviews'} delivered`,
    secondary: stats.totalEarnings
      ? `$${stats.totalEarnings.toLocaleString()} earned helping creators improve.`
      : 'Making an impact in the creative community.',
  };
}

// Animated number component
function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  duration = 1000,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(value, Math.floor(increment * step));
      setDisplayValue(current);

      if (step >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <span className="tabular-nums">
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}

// Quick stat pill
function StatPill({
  icon: Icon,
  value,
  label,
  color = 'blue',
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  color?: 'blue' | 'green' | 'orange' | 'purple';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200/60',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    orange: 'bg-orange-50 text-orange-700 border-orange-200/60',
    purple: 'bg-violet-50 text-violet-700 border-violet-200/60',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-xl border',
        colors[color]
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="font-semibold">{value}</span>
      <span className="text-sm opacity-70">{label}</span>
    </div>
  );
}

export function StoryModeStats({
  stats,
  role,
  userName,
  className,
}: StoryModeStatsProps) {
  const chapter = generateChapter(stats.totalReviews);
  const narrative = generateNarrative(stats, role);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl',
        'bg-card border border-border/60',
        className
      )}
    >
      <div className="p-4">
        {/* Compact header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100">
            <BookOpen className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Ch. {chapter.number}
              </span>
              {narrative.highlight && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                  {narrative.highlight}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-foreground truncate">{chapter.name}</p>
          </div>
        </div>

        {/* Narrative - compact */}
        <p className="text-sm font-medium text-foreground leading-snug mb-1">
          {narrative.primary}
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          {narrative.secondary}
        </p>

        {/* Minimal stats - inline */}
        <div className="flex flex-wrap gap-2 text-xs">
          {stats.currentStreak > 0 && (
            <div className="flex items-center gap-1 text-orange-600">
              <Flame className="w-3 h-3" />
              <span className="font-medium">{stats.currentStreak}d</span>
            </div>
          )}
          {stats.averageRating > 0 && (
            <div className="flex items-center gap-1 text-amber-600">
              <Star className="w-3 h-3 fill-current" />
              <span className="font-medium">{stats.averageRating.toFixed(1)}</span>
            </div>
          )}
          {stats.inProgressReviews > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{stats.inProgressReviews} active</span>
            </div>
          )}
        </div>

        {/* Compact progress bar */}
        {stats.totalReviews > 0 && (
          <div className="mt-3 pt-3 border-t border-border/60">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>Next chapter</span>
              <span>{getProgressToNextChapter(stats.totalReviews).current}/{getProgressToNextChapter(stats.totalReviews).target}</span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-slate-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${getProgressToNextChapter(stats.totalReviews).percentage}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Helper to calculate progress to next chapter
function getProgressToNextChapter(totalReviews: number): {
  current: number;
  target: number;
  percentage: number;
} {
  const thresholds = [0, 5, 10, 25, 50, 100, 200, 500, 1000];

  let current = totalReviews;
  let target = thresholds[thresholds.length - 1];
  let prevThreshold = 0;

  for (let i = 0; i < thresholds.length; i++) {
    if (totalReviews < thresholds[i]) {
      target = thresholds[i];
      prevThreshold = thresholds[i - 1] || 0;
      break;
    }
  }

  const progressInChapter = totalReviews - prevThreshold;
  const chapterSize = target - prevThreshold;
  const percentage = Math.min(100, (progressInChapter / chapterSize) * 100);

  return { current: totalReviews, target, percentage };
}

// Compact version for sidebar or mobile
export function StoryModeCompact({
  stats,
  role,
  className,
}: {
  stats: StoryStats;
  role: 'creator' | 'reviewer';
  className?: string;
}) {
  const chapter = generateChapter(stats.totalReviews);
  const narrative = generateNarrative(stats, role);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900',
        'border border-slate-700/50',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">Ch. {chapter.number}</span>
            <span className="text-sm font-medium text-white truncate">
              {chapter.name}
            </span>
          </div>
          <p className="text-xs text-white/60 truncate mt-0.5">
            {narrative.primary}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-white/40" />
      </div>
    </motion.div>
  );
}

export default StoryModeStats;
