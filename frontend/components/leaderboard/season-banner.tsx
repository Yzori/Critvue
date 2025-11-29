'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Season,
  SeasonTheme,
  getTimeRemaining,
} from '@/lib/types/leaderboard';
import {
  Trophy,
  Clock,
  Gift,
  ChevronRight,
  Snowflake,
  Flower2,
  Sun,
  Leaf,
  Sparkles,
} from 'lucide-react';

interface SeasonBannerProps {
  season: Season;
  onViewPrizes?: () => void;
  onViewPastWinners?: () => void;
  className?: string;
}

const SEASON_ICONS = {
  winter: Snowflake,
  spring: Flower2,
  summer: Sun,
  fall: Leaf,
  special: Sparkles,
};

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = React.useState(() => getTimeRemaining(endDate));

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeRemaining(endDate));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [endDate]);

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm">
      <Clock className="h-4 w-4" />
      <span className="font-semibold">{timeLeft.label}</span>
    </div>
  );
}

function ParticleEffect({ effect, className }: { effect?: string; className?: string }) {
  if (!effect || effect === 'none') return null;

  // Simple CSS-based particle effects
  const particleCount = 12;

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {[...Array(particleCount)].map((_, i) => {
        const delay = Math.random() * 5;
        const duration = 8 + Math.random() * 6;
        const left = Math.random() * 100;
        const size = 4 + Math.random() * 8;

        let particleClass = '';
        switch (effect) {
          case 'snow':
            particleClass = 'bg-white/40 rounded-full';
            break;
          case 'leaves':
            particleClass = 'bg-orange-400/30 rounded-full rotate-45';
            break;
          case 'sparkles':
            particleClass = 'bg-yellow-300/50 rounded-full animate-pulse';
            break;
          case 'confetti':
            particleClass = `rounded-sm ${['bg-pink-400/40', 'bg-blue-400/40', 'bg-yellow-400/40', 'bg-green-400/40'][i % 4]}`;
            break;
          default:
            particleClass = 'bg-white/30 rounded-full';
        }

        return (
          <motion.div
            key={i}
            className={cn('absolute', particleClass)}
            style={{
              left: `${left}%`,
              width: size,
              height: size,
            }}
            initial={{ y: -20, opacity: 0 }}
            animate={{
              y: ['0%', '100vh'],
              opacity: [0, 1, 1, 0],
              x: effect === 'leaves' ? [0, 30, -20, 40] : undefined,
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        );
      })}
    </div>
  );
}

export function SeasonBanner({
  season,
  onViewPrizes,
  onViewPastWinners,
  className,
}: SeasonBannerProps) {
  const theme = season.theme;
  const SeasonIcon = SEASON_ICONS[theme.id] || Sparkles;

  return (
    <div
      className={cn(
        'relative rounded-2xl overflow-hidden',
        'text-white shadow-lg',
        className
      )}
    >
      {/* Gradient Background */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-r',
          theme.primaryGradient
        )}
      />

      {/* Particle Effect */}
      <ParticleEffect effect={theme.particleEffect} />

      {/* Content */}
      <div className="relative z-10 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left: Season Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
                className="p-2 rounded-xl bg-white/20 backdrop-blur-sm"
              >
                <SeasonIcon className="h-6 w-6" />
              </motion.div>
              <div>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl sm:text-2xl font-bold"
                >
                  {season.name}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-white/80"
                >
                  {theme.tagline}
                </motion.p>
              </div>
            </div>

            {/* Prizes Preview */}
            {season.prizes && season.prizes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 text-sm"
              >
                <Trophy className="h-4 w-4 text-yellow-300" />
                <span className="text-white/90">
                  Top prizes: {season.prizes[0].karmaReward.toLocaleString()}+ karma
                </span>
              </motion.div>
            )}
          </div>

          {/* Right: Countdown & Actions */}
          <div className="flex flex-col sm:items-end gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <CountdownTimer endDate={season.endDate} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex gap-2"
            >
              {onViewPrizes && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  onClick={onViewPrizes}
                >
                  <Gift className="h-3.5 w-3.5 mr-1.5" />
                  Prizes
                </Button>
              )}
              {onViewPastWinners && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                  onClick={onViewPastWinners}
                >
                  Past Winners
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SeasonBanner;
