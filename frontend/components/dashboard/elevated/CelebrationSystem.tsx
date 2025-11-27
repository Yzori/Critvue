'use client';

/**
 * CelebrationSystem - Meaningful, Contextual Celebrations
 *
 * A celebration system that creates memorable moments for real achievements.
 * Each celebration type has unique visuals tied to the achievement:
 * - Star bursts for ratings
 * - Flame animations for streaks
 * - Money counters for earnings
 * - Badge reveals for tier promotions
 *
 * Key principle: Celebrations are rare enough to feel special and tied to actual achievement.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Star,
  Flame,
  DollarSign,
  Award,
  Trophy,
  Zap,
  Heart,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Crown,
} from 'lucide-react';

export type CelebrationType =
  | 'first_review'        // First review ever received
  | 'five_star'           // Received 5-star rating
  | 'streak_7'            // 7-day streak
  | 'streak_30'           // 30-day streak
  | 'streak_100'          // 100-day streak
  | 'tier_promotion'      // Leveled up tier
  | 'earnings_100'        // $100 milestone
  | 'earnings_500'        // $500 milestone
  | 'earnings_1000'       // $1000 milestone
  | 'review_published'    // Review published (impact moment)
  | 'completion'          // Completed a review/submission
  | 'welcome';            // Welcome to the platform

export interface CelebrationConfig {
  type: CelebrationType;
  title: string;
  subtitle: string;
  value?: string | number;
  duration?: number; // ms
  onComplete?: () => void;
}

interface CelebrationSystemProps {
  celebration: CelebrationConfig | null;
  onDismiss?: () => void;
}

// Celebration visual configs
const celebrationVisuals: Record<CelebrationType, {
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  particleColor: string;
  sound?: string; // Reserved for future audio
}> = {
  first_review: {
    icon: Heart,
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    particleColor: '#EC4899',
  },
  five_star: {
    icon: Star,
    gradient: 'from-amber-400 via-yellow-500 to-orange-500',
    particleColor: '#F59E0B',
  },
  streak_7: {
    icon: Flame,
    gradient: 'from-orange-500 via-red-500 to-rose-500',
    particleColor: '#EF4444',
  },
  streak_30: {
    icon: Flame,
    gradient: 'from-orange-600 via-red-600 to-rose-600',
    particleColor: '#DC2626',
  },
  streak_100: {
    icon: Crown,
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    particleColor: '#F97316',
  },
  tier_promotion: {
    icon: Award,
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    particleColor: '#8B5CF6',
  },
  earnings_100: {
    icon: DollarSign,
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    particleColor: '#10B981',
  },
  earnings_500: {
    icon: TrendingUp,
    gradient: 'from-emerald-600 via-green-600 to-teal-600',
    particleColor: '#059669',
  },
  earnings_1000: {
    icon: Trophy,
    gradient: 'from-amber-500 via-yellow-500 to-orange-400',
    particleColor: '#FBBF24',
  },
  review_published: {
    icon: CheckCircle2,
    gradient: 'from-blue-500 via-indigo-500 to-violet-500',
    particleColor: '#6366F1',
  },
  completion: {
    icon: Sparkles,
    gradient: 'from-blue-500 via-cyan-500 to-teal-500',
    particleColor: '#06B6D4',
  },
  welcome: {
    icon: Zap,
    gradient: 'from-violet-500 via-purple-500 to-indigo-500',
    particleColor: '#7C3AED',
  },
};

// Particle component for burst effects
function Particle({ delay, color, index }: { delay: number; color: string; index: number }) {
  const angle = (index / 12) * Math.PI * 2;
  const distance = 100 + Math.random() * 50;
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;

  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full"
      style={{ backgroundColor: color }}
      initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
      animate={{
        scale: [0, 1.5, 0],
        x: [0, x],
        y: [0, y],
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: 0.8,
        delay,
        ease: 'easeOut',
      }}
    />
  );
}

// Star burst for 5-star ratings
function StarBurst({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ scale: 0, rotate: i * 45 }}
          animate={{
            scale: [0, 1.2, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 0.6,
            delay: i * 0.05,
            ease: 'easeOut',
          }}
        >
          <Star className="w-6 h-6 fill-current" style={{ color }} />
        </motion.div>
      ))}
    </div>
  );
}

// Animated counter for earnings
function AnimatedCounter({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="tabular-nums">
      {prefix}{displayValue.toLocaleString()}
    </span>
  );
}

// Main celebration overlay
export function CelebrationOverlay({ celebration, onDismiss }: CelebrationSystemProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (celebration) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        celebration.onComplete?.();
        setTimeout(() => onDismiss?.(), 300);
      }, celebration.duration || 3000);
      return () => clearTimeout(timer);
    }
  }, [celebration, onDismiss]);

  if (!celebration) return null;

  const visual = celebrationVisuals[celebration.type];
  const Icon = visual.icon;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const contentVariants: Variants = {
    hidden: { scale: 0.8, opacity: 0, y: 20 },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
      },
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      y: -20,
      transition: { duration: 0.2 },
    },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={() => {
            setIsVisible(false);
            onDismiss?.();
          }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Content */}
          <motion.div
            className="relative z-10 flex flex-col items-center"
            variants={contentVariants}
          >
            {/* Particle burst */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(12)].map((_, i) => (
                <Particle
                  key={i}
                  index={i}
                  color={visual.particleColor}
                  delay={i * 0.03}
                />
              ))}
            </div>

            {/* Star burst for 5-star celebrations */}
            {celebration.type === 'five_star' && (
              <StarBurst color={visual.particleColor} />
            )}

            {/* Icon with glow */}
            <motion.div
              className={cn(
                'relative flex items-center justify-center w-24 h-24 rounded-full',
                'bg-gradient-to-br shadow-2xl',
                visual.gradient
              )}
              initial={{ scale: 0, rotate: -180 }}
              animate={{
                scale: [0, 1.2, 1],
                rotate: [-180, 10, 0],
              }}
              transition={{
                duration: 0.6,
                times: [0, 0.6, 1],
                ease: 'easeOut',
              }}
              style={{
                boxShadow: `0 0 60px ${visual.particleColor}40`,
              }}
            >
              <Icon className="w-12 h-12 text-white" />

              {/* Pulse ring */}
              <motion.div
                className={cn(
                  'absolute inset-0 rounded-full border-4',
                  'border-white/30'
                )}
                animate={{
                  scale: [1, 1.5],
                  opacity: [0.8, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: 2,
                  ease: 'easeOut',
                }}
              />
            </motion.div>

            {/* Title */}
            <motion.h2
              className="mt-6 text-3xl font-bold text-white text-center drop-shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {celebration.title}
            </motion.h2>

            {/* Value (if present) */}
            {celebration.value && (
              <motion.div
                className="mt-2 text-5xl font-bold text-white drop-shadow-lg"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
              >
                {typeof celebration.value === 'number' ? (
                  <AnimatedCounter
                    value={celebration.value}
                    prefix={celebration.type.includes('earnings') ? '$' : ''}
                  />
                ) : (
                  celebration.value
                )}
              </motion.div>
            )}

            {/* Subtitle */}
            <motion.p
              className="mt-3 text-lg text-white/80 text-center max-w-xs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {celebration.subtitle}
            </motion.p>

            {/* Dismiss hint */}
            <motion.p
              className="mt-6 text-sm text-white/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Tap anywhere to continue
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Inline celebration (smaller, non-blocking)
export function InlineCelebration({
  type,
  message,
  className,
}: {
  type: CelebrationType;
  message: string;
  className?: string;
}) {
  const visual = celebrationVisuals[type];
  const Icon = visual.icon;

  return (
    <motion.div
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full',
        'bg-gradient-to-r text-white font-medium shadow-lg',
        visual.gradient,
        className
      )}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 0.5, repeat: 2 }}
      >
        <Icon className="w-4 h-4" />
      </motion.div>
      <span>{message}</span>
    </motion.div>
  );
}

// Toast-style celebration (bottom of screen)
export function CelebrationToast({
  celebration,
  onDismiss,
}: CelebrationSystemProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (celebration) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss?.(), 300);
      }, celebration.duration || 4000);
      return () => clearTimeout(timer);
    }
  }, [celebration, onDismiss]);

  if (!celebration) return null;

  const visual = celebrationVisuals[celebration.type];
  const Icon = visual.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-6 left-1/2 z-50"
          initial={{ x: '-50%', y: 100, opacity: 0 }}
          animate={{ x: '-50%', y: 0, opacity: 1 }}
          exit={{ x: '-50%', y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <div
            className={cn(
              'flex items-center gap-4 px-6 py-4 rounded-2xl',
              'bg-gradient-to-r text-white shadow-2xl',
              visual.gradient
            )}
            style={{
              boxShadow: `0 20px 40px -10px ${visual.particleColor}50`,
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
            >
              <Icon className="w-6 h-6" />
            </motion.div>
            <div>
              <p className="font-semibold">{celebration.title}</p>
              <p className="text-sm text-white/80">{celebration.subtitle}</p>
            </div>
            {celebration.value && (
              <div className="pl-4 border-l border-white/20 text-2xl font-bold">
                {typeof celebration.value === 'number' ? (
                  <AnimatedCounter
                    value={celebration.value}
                    prefix={celebration.type.includes('earnings') ? '$' : ''}
                  />
                ) : (
                  celebration.value
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for triggering celebrations
export function useCelebrations() {
  const [queue, setQueue] = useState<CelebrationConfig[]>([]);
  const [current, setCurrent] = useState<CelebrationConfig | null>(null);

  const celebrate = useCallback((config: CelebrationConfig) => {
    setQueue(prev => [...prev, config]);
  }, []);

  const dismiss = useCallback(() => {
    setCurrent(null);
    setQueue(prev => prev.slice(1));
  }, []);

  // Process queue
  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
    }
  }, [current, queue]);

  return {
    current,
    celebrate,
    dismiss,
    hasPending: queue.length > 0,
  };
}

// Pre-configured celebration triggers
export const celebrations = {
  firstReview: (): CelebrationConfig => ({
    type: 'first_review',
    title: 'Welcome to the Community!',
    subtitle: 'Your first review is here. This is where growth begins.',
    duration: 4000,
  }),

  fiveStar: (reviewerName?: string): CelebrationConfig => ({
    type: 'five_star',
    title: 'Perfect Score!',
    subtitle: reviewerName
      ? `${reviewerName} gave you 5 stars`
      : 'You received a 5-star rating',
    value: '5 stars',
    duration: 3500,
  }),

  streak: (days: number): CelebrationConfig => ({
    type: days >= 100 ? 'streak_100' : days >= 30 ? 'streak_30' : 'streak_7',
    title: `${days}-Day Streak!`,
    subtitle: days >= 100
      ? 'Legendary dedication!'
      : days >= 30
      ? 'A whole month of consistency!'
      : 'One week strong!',
    value: days,
    duration: 4000,
  }),

  tierPromotion: (tierName: string): CelebrationConfig => ({
    type: 'tier_promotion',
    title: 'Level Up!',
    subtitle: `You've reached ${tierName} tier`,
    value: tierName,
    duration: 4500,
  }),

  earnings: (amount: number): CelebrationConfig => ({
    type: amount >= 1000 ? 'earnings_1000' : amount >= 500 ? 'earnings_500' : 'earnings_100',
    title: amount >= 1000
      ? 'Four Figures!'
      : amount >= 500
      ? 'Halfway to a Grand!'
      : 'First Hundred!',
    subtitle: 'Your expertise is paying off',
    value: amount,
    duration: 4000,
  }),

  reviewPublished: (creatorName?: string): CelebrationConfig => ({
    type: 'review_published',
    title: 'Impact Made!',
    subtitle: creatorName
      ? `Your review is helping ${creatorName} grow`
      : 'Your feedback is making a difference',
    duration: 3000,
  }),

  completion: (title?: string): CelebrationConfig => ({
    type: 'completion',
    title: 'Well Done!',
    subtitle: title ? `"${title}" is complete` : 'Another one in the books',
    duration: 2500,
  }),
};

export default CelebrationOverlay;
