'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { RankChange } from '@/lib/types/leaderboard';
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';

interface RankChangeIndicatorProps {
  direction: RankChange;
  change: number;
  showAnimation?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CONFIG = {
  sm: {
    pill: 'px-1.5 py-0.5 text-xs gap-0.5',
    icon: 'h-3 w-3',
  },
  md: {
    pill: 'px-2 py-1 text-xs gap-1',
    icon: 'h-3.5 w-3.5',
  },
  lg: {
    pill: 'px-3 py-1.5 text-sm gap-1.5',
    icon: 'h-4 w-4',
  },
};

const DIRECTION_CONFIG = {
  [RankChange.UP]: {
    icon: TrendingUp,
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  [RankChange.DOWN]: {
    icon: TrendingDown,
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
  [RankChange.SAME]: {
    icon: Minus,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-500',
    borderColor: 'border-gray-200',
  },
  [RankChange.NEW]: {
    icon: Sparkles,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
};

export function RankChangeIndicator({
  direction,
  change,
  showAnimation = true,
  size = 'md',
  className,
}: RankChangeIndicatorProps) {
  const sizeConfig = SIZE_CONFIG[size];
  const directionConfig = DIRECTION_CONFIG[direction];
  const Icon = directionConfig.icon;

  // Don't show anything for "same" with no change
  if (direction === RankChange.SAME && change === 0) {
    return null;
  }

  const content = (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        sizeConfig.pill,
        directionConfig.bgColor,
        directionConfig.textColor,
        directionConfig.borderColor,
        className
      )}
    >
      <Icon className={sizeConfig.icon} />
      {direction === RankChange.NEW ? (
        <span>New</span>
      ) : direction !== RankChange.SAME ? (
        <span>{change}</span>
      ) : null}
    </div>
  );

  if (!showAnimation) {
    return content;
  }

  // Animation variants
  const variants = {
    up: {
      initial: { opacity: 0, y: 10 },
      animate: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', bounce: 0.5 },
      },
    },
    down: {
      initial: { opacity: 0, y: -10 },
      animate: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', bounce: 0.3 },
      },
    },
    new: {
      initial: { opacity: 0, scale: 0.5 },
      animate: {
        opacity: 1,
        scale: 1,
        transition: { type: 'spring', bounce: 0.5 },
      },
    },
    same: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
    },
  };

  const animationKey =
    direction === RankChange.UP ? 'up' :
    direction === RankChange.DOWN ? 'down' :
    direction === RankChange.NEW ? 'new' : 'same';

  return (
    <motion.div
      variants={variants[animationKey]}
      initial="initial"
      animate="animate"
    >
      {content}
    </motion.div>
  );
}

export default RankChangeIndicator;
