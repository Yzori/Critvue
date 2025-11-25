'use client';

/**
 * MomentumRing Component
 *
 * Simple, clear progress ring showing weekly goal progress.
 * Easy to understand at a glance.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Flame } from 'lucide-react';

export interface MomentumRingProps {
  /** Current streak count (days) */
  streak: number;
  /** Weekly reviews completed */
  weeklyProgress: number;
  /** Weekly goal target */
  weeklyGoal: number;
  /** Total XP points */
  xp: number;
  /** Reputation score */
  reputation: number;
  /** Whether to show the pulsing animation */
  isPulsing?: boolean;
  /** Size of the ring */
  size?: 'sm' | 'md' | 'lg';
  /** Optional className */
  className?: string;
}

const sizeMap = {
  sm: { outer: 120, stroke: 10 },
  md: { outer: 160, stroke: 12 },
  lg: { outer: 200, stroke: 14 },
};

export const MomentumRing: React.FC<MomentumRingProps> = ({
  streak,
  weeklyProgress,
  weeklyGoal,
  size = 'md',
  className,
}) => {
  const dimensions = sizeMap[size];
  const radius = (dimensions.outer - dimensions.stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate progress percentage
  const percent = Math.min(100, (weeklyProgress / weeklyGoal) * 100);
  const offset = circumference - (percent / 100) * circumference;

  // Determine color based on progress
  const getProgressColor = () => {
    if (percent >= 100) return '#22C55E'; // Green - goal complete
    if (percent >= 60) return '#3B82F6';  // Blue - good progress
    return '#6B7280';                      // Gray - getting started
  };

  const color = getProgressColor();
  const isComplete = weeklyProgress >= weeklyGoal;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {/* SVG Ring */}
      <svg
        width={dimensions.outer}
        height={dimensions.outer}
        className="transform -rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={dimensions.outer / 2}
          cy={dimensions.outer / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={dimensions.stroke}
          className="text-muted/20"
        />

        {/* Progress ring */}
        <motion.circle
          cx={dimensions.outer / 2}
          cy={dimensions.outer / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={dimensions.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Weekly progress - main metric */}
          <div className="flex items-baseline justify-center gap-0.5">
            <span className="text-3xl font-bold text-foreground">
              {weeklyProgress}
            </span>
            <span className="text-lg text-muted-foreground">
              /{weeklyGoal}
            </span>
          </div>

          {/* Label */}
          <p className="text-xs text-muted-foreground mt-0.5">
            {isComplete ? 'Goal complete!' : 'this week'}
          </p>

          {/* Streak indicator */}
          {streak > 0 && (
            <div className="flex items-center justify-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-orange-500/10">
              <Flame className="h-3 w-3 text-orange-500" />
              <span className="text-xs font-medium text-orange-600">
                {streak} day{streak !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MomentumRing;
