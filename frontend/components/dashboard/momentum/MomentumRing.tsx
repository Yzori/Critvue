'use client';

/**
 * MomentumRing Component
 *
 * An animated circular progress indicator that visualizes your "flow state"
 * by combining streak, weekly goal progress, and recent activity.
 *
 * Distinctive Features:
 * - Dual-ring design (inner: streak, outer: weekly goal)
 * - Pulsing animation when user is "on a roll"
 * - Color transitions based on momentum level
 * - Particle effects for high momentum
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Flame, Target } from 'lucide-react';

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
  sm: { outer: 120, inner: 90, stroke: 8, innerStroke: 6 },
  md: { outer: 180, inner: 140, stroke: 12, innerStroke: 8 },
  lg: { outer: 240, inner: 190, stroke: 16, innerStroke: 10 },
};

export const MomentumRing: React.FC<MomentumRingProps> = ({
  streak,
  weeklyProgress,
  weeklyGoal,
  xp: _xp, // Reserved for future XP visualization
  reputation,
  isPulsing = false,
  size = 'md',
  className,
}) => {
  const dimensions = sizeMap[size];
  const outerRadius = (dimensions.outer - dimensions.stroke) / 2;
  const innerRadius = (dimensions.inner - dimensions.innerStroke) / 2;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const innerCircumference = 2 * Math.PI * innerRadius;

  // Calculate progress percentages
  const weeklyPercent = Math.min(100, (weeklyProgress / weeklyGoal) * 100);
  const streakPercent = Math.min(100, (streak / 7) * 100); // 7-day cycle

  // Calculate momentum score (0-100)
  const momentumScore = Math.min(100, Math.round(
    (weeklyPercent * 0.5) + (streakPercent * 0.3) + Math.min(20, reputation / 10)
  ));

  // Determine momentum level and colors
  const getMomentumLevel = () => {
    if (momentumScore >= 80) return { label: 'On Fire', color: '#F97316', glow: '#F9731650' };
    if (momentumScore >= 60) return { label: 'Rolling', color: '#22C55E', glow: '#22C55E50' };
    if (momentumScore >= 40) return { label: 'Building', color: '#3B82F6', glow: '#3B82F650' };
    if (momentumScore >= 20) return { label: 'Starting', color: '#6B7280', glow: '#6B728050' };
    return { label: 'Warming Up', color: '#9CA3AF', glow: '#9CA3AF50' };
  };

  const momentum = getMomentumLevel();

  // Stroke dash offset for progress
  const outerOffset = outerCircumference - (weeklyPercent / 100) * outerCircumference;
  const innerOffset = innerCircumference - (streakPercent / 100) * innerCircumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {/* Glow effect */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: dimensions.outer + 20,
          height: dimensions.outer + 20,
          background: `radial-gradient(circle, ${momentum.glow} 0%, transparent 70%)`,
        }}
        animate={isPulsing || momentumScore >= 60 ? {
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* SVG Rings */}
      <svg
        width={dimensions.outer}
        height={dimensions.outer}
        className="transform -rotate-90"
      >
        {/* Outer ring background */}
        <circle
          cx={dimensions.outer / 2}
          cy={dimensions.outer / 2}
          r={outerRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth={dimensions.stroke}
          className="text-muted/20"
        />

        {/* Outer ring progress (weekly goal) */}
        <motion.circle
          cx={dimensions.outer / 2}
          cy={dimensions.outer / 2}
          r={outerRadius}
          fill="none"
          stroke={momentum.color}
          strokeWidth={dimensions.stroke}
          strokeLinecap="round"
          strokeDasharray={outerCircumference}
          initial={{ strokeDashoffset: outerCircumference }}
          animate={{ strokeDashoffset: outerOffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />

        {/* Inner ring background */}
        <circle
          cx={dimensions.outer / 2}
          cy={dimensions.outer / 2}
          r={innerRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth={dimensions.innerStroke}
          className="text-muted/20"
        />

        {/* Inner ring progress (streak) */}
        <motion.circle
          cx={dimensions.outer / 2}
          cy={dimensions.outer / 2}
          r={innerRadius}
          fill="none"
          stroke="#F97316"
          strokeWidth={dimensions.innerStroke}
          strokeLinecap="round"
          strokeDasharray={innerCircumference}
          initial={{ strokeDashoffset: innerCircumference }}
          animate={{ strokeDashoffset: innerOffset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {/* Momentum Score */}
          <div className="flex items-center justify-center gap-1 mb-1">
            {momentumScore >= 60 && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
              >
                <Flame className="h-5 w-5 text-orange-500" />
              </motion.div>
            )}
            <span
              className="text-3xl font-bold"
              style={{ color: momentum.color }}
            >
              {momentumScore}
            </span>
          </div>

          {/* Momentum Label */}
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {momentum.label}
          </p>

          {/* Quick Stats */}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              {streak}d
            </span>
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3 text-accent-blue" />
              {weeklyProgress}/{weeklyGoal}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Floating particles for high momentum */}
      <AnimatePresence>
        {momentumScore >= 80 && (
          <>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-orange-400"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  y: [0, -30 - Math.random() * 20],
                  x: [0, (Math.random() - 0.5) * 40],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.4,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
                style={{
                  top: dimensions.outer / 2,
                  left: dimensions.outer / 2,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MomentumRing;
