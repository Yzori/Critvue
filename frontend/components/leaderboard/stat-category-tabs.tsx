'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  LeaderboardCategory,
  LeaderboardPeriod,
  CATEGORY_CONFIG,
} from '@/lib/types/leaderboard';
import { Trophy, Star, Flame, Calendar, Clock, Infinity } from 'lucide-react';

interface StatCategoryTabsProps {
  category: LeaderboardCategory;
  period: LeaderboardPeriod;
  onCategoryChange: (category: LeaderboardCategory) => void;
  onPeriodChange: (period: LeaderboardPeriod) => void;
  className?: string;
}

const PERIOD_OPTIONS = [
  { value: LeaderboardPeriod.WEEKLY, label: 'Weekly', icon: Calendar },
  { value: LeaderboardPeriod.MONTHLY, label: 'Monthly', icon: Clock },
  { value: LeaderboardPeriod.ALL_TIME, label: 'All Time', icon: Infinity },
];

const CATEGORY_ICONS = {
  [LeaderboardCategory.OVERALL]: Trophy,
  [LeaderboardCategory.QUALITY]: Star,
  [LeaderboardCategory.ACTIVITY]: Flame,
};

const CATEGORY_COLORS = {
  [LeaderboardCategory.OVERALL]: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: 'text-amber-500',
    glow: 'shadow-amber-200/50',
  },
  [LeaderboardCategory.QUALITY]: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: 'text-blue-500',
    glow: 'shadow-blue-200/50',
  },
  [LeaderboardCategory.ACTIVITY]: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    icon: 'text-orange-500',
    glow: 'shadow-orange-200/50',
  },
};

export function StatCategoryTabs({
  category,
  period,
  onCategoryChange,
  onPeriodChange,
  className,
}: StatCategoryTabsProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Category Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          {Object.values(LeaderboardCategory).map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const Icon = CATEGORY_ICONS[cat];
            const colors = CATEGORY_COLORS[cat];
            const isActive = category === cat;

            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={cn(
                  'relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200',
                  'flex items-center gap-2',
                  isActive
                    ? cn(colors.bg, colors.border, colors.text, 'border shadow-sm', colors.glow)
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    isActive ? colors.icon : 'text-gray-400'
                  )}
                />
                <span>{config.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="category-indicator"
                    className={cn(
                      'absolute inset-0 rounded-lg -z-10',
                      colors.bg
                    )}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Period Selector */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {PERIOD_OPTIONS.map(({ value, label, icon: Icon }) => {
            const isActive = period === value;
            return (
              <button
                key={value}
                onClick={() => onPeriodChange(value)}
                className={cn(
                  'relative px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
                  'flex items-center gap-1.5',
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className={cn('h-3 w-3', isActive ? 'text-gray-700' : 'text-gray-400')} />
                <span className="hidden sm:inline">{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="period-indicator"
                    className="absolute inset-0 bg-white rounded-md shadow-sm -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Description */}
      <motion.p
        key={category}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm text-gray-500"
      >
        {CATEGORY_CONFIG[category].description}
      </motion.p>
    </div>
  );
}

export default StatCategoryTabs;
