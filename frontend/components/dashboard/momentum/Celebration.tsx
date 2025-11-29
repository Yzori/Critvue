'use client';

/**
 * Celebration Component
 *
 * Micro-celebration animations for achievements:
 * - Confetti burst for major achievements
 * - Badge earned animation
 * - Streak milestone
 * - Goal completion
 *
 * Makes the app feel alive and rewarding.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Trophy, Award, Flame, Target, Star, Sparkles } from 'lucide-react';

export type CelebrationType =
  | 'badge_earned'
  | 'streak_milestone'
  | 'goal_complete'
  | 'rank_up'
  | 'karma_milestone';

export interface CelebrationProps {
  type: CelebrationType;
  title: string;
  subtitle?: string;
  value?: string | number;
  icon?: React.ReactNode;
  isVisible: boolean;
  onComplete?: () => void;
  className?: string;
}

const celebrationConfig: Record<CelebrationType, {
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
}> = {
  badge_earned: {
    icon: <Award className="h-12 w-12" />,
    color: '#A855F7',
    bgGradient: 'from-purple-500/20 to-pink-500/20',
  },
  streak_milestone: {
    icon: <Flame className="h-12 w-12" />,
    color: '#F97316',
    bgGradient: 'from-orange-500/20 to-red-500/20',
  },
  goal_complete: {
    icon: <Target className="h-12 w-12" />,
    color: '#22C55E',
    bgGradient: 'from-green-500/20 to-emerald-500/20',
  },
  rank_up: {
    icon: <Trophy className="h-12 w-12" />,
    color: '#EAB308',
    bgGradient: 'from-yellow-500/20 to-amber-500/20',
  },
  karma_milestone: {
    icon: <Star className="h-12 w-12" />,
    color: '#4CC9F0',
    bgGradient: 'from-blue-500/20 to-cyan-500/20',
  },
};

export const Celebration: React.FC<CelebrationProps> = ({
  type,
  title,
  subtitle,
  value,
  icon,
  isVisible,
  onComplete,
  className,
}) => {
  const config = celebrationConfig[type];

  React.useEffect(() => {
    if (isVisible && onComplete) {
      const timer = setTimeout(onComplete, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center pointer-events-none',
            className
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
            onClick={onComplete}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Confetti particles */}
          <ConfettiExplosion color={config.color} />

          {/* Main celebration card */}
          <motion.div
            className={cn(
              'relative z-10 bg-background rounded-3xl shadow-2xl border overflow-hidden max-w-sm mx-4 pointer-events-auto',
              `bg-gradient-to-br ${config.bgGradient}`
            )}
            initial={{ scale: 0.5, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: -50, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          >
            {/* Sparkle effects */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${15 + i * 15}%`,
                    top: `${10 + (i % 3) * 30}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                    rotate: [0, 180],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.2,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                >
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                </motion.div>
              ))}
            </div>

            <div className="relative p-8 text-center">
              {/* Icon */}
              <motion.div
                className="mx-auto mb-4 p-4 rounded-full bg-background/80 shadow-lg w-fit"
                style={{ color: config.color }}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', damping: 10 }}
              >
                {icon || config.icon}
              </motion.div>

              {/* Value (if provided) */}
              {value && (
                <motion.div
                  className="text-4xl font-bold mb-2"
                  style={{ color: config.color }}
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  {value}
                </motion.div>
              )}

              {/* Title */}
              <motion.h2
                className="text-xl font-bold text-foreground mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {title}
              </motion.h2>

              {/* Subtitle */}
              {subtitle && (
                <motion.p
                  className="text-sm text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {subtitle}
                </motion.p>
              )}

              {/* Dismiss hint */}
              <motion.p
                className="text-xs text-muted-foreground mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                Click anywhere to continue
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Confetti explosion effect
 */
interface ConfettiExplosionProps {
  color: string;
  particleCount?: number;
}

const ConfettiExplosion: React.FC<ConfettiExplosionProps> = ({
  color,
  particleCount = 30,
}) => {
  const particles = React.useMemo(() => {
    return [...Array(particleCount)].map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 400,
      y: Math.random() * -300 - 100,
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
      color: i % 3 === 0 ? color : i % 3 === 1 ? '#FFD700' : '#FF69B4',
    }));
  }, [color, particleCount]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute left-1/2 top-1/2 w-3 h-3 rounded-sm"
          style={{ backgroundColor: particle.color }}
          initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: particle.x,
            y: particle.y + 500,
            scale: particle.scale,
            rotate: particle.rotation,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random(),
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      ))}
    </div>
  );
};

/**
 * Hook to manage celebrations
 */
export function useCelebration() {
  const [celebration, setCelebration] = React.useState<{
    type: CelebrationType;
    title: string;
    subtitle?: string;
    value?: string | number;
  } | null>(null);

  const showCelebration = React.useCallback(
    (
      type: CelebrationType,
      title: string,
      subtitle?: string,
      value?: string | number
    ) => {
      setCelebration({ type, title, subtitle, value });
    },
    []
  );

  const hideCelebration = React.useCallback(() => {
    setCelebration(null);
  }, []);

  return {
    celebration,
    showCelebration,
    hideCelebration,
    isVisible: celebration !== null,
  };
}

export default Celebration;
