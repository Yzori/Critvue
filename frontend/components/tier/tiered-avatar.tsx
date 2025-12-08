'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { UserTier, TIER_CONFIG } from '@/lib/types/tier';

/**
 * TieredAvatar Component
 *
 * Premium avatar borders inspired by League of Legends, Valorant, and Discord.
 * Uses layered approach with progressive enhancement per tier:
 *
 * - NEWCOMER: Simple solid border
 * - SUPPORTER: Solid border + subtle glow
 * - GUIDE: Solid border + pulsing glow
 * - MENTOR: Rotating gradient border + glow
 * - CURATOR: Multi-layer rotating gradients + shimmer + particles
 * - VISIONARY: Full premium treatment with all effects maximized
 */

export type TieredAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const sizeConfig: Record<TieredAvatarSize, {
  container: number;
  avatar: number;
  borderWidth: number;
  fontSize: string;
}> = {
  xs: { container: 32, avatar: 26, borderWidth: 3, fontSize: 'text-[10px]' },
  sm: { container: 40, avatar: 32, borderWidth: 4, fontSize: 'text-xs' },
  md: { container: 56, avatar: 46, borderWidth: 5, fontSize: 'text-sm' },
  lg: { container: 72, avatar: 60, borderWidth: 6, fontSize: 'text-base' },
  xl: { container: 96, avatar: 80, borderWidth: 8, fontSize: 'text-lg' },
  '2xl': { container: 144, avatar: 120, borderWidth: 12, fontSize: 'text-2xl' },
};

// Tier color palettes - each tier has a distinct color story
const tierPalettes: Record<UserTier, {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
}> = {
  [UserTier.NEWCOMER]: {
    primary: '#6B7280',
    secondary: '#9CA3AF',
    accent: '#D1D5DB',
    glow: '#6B7280',
  },
  [UserTier.SUPPORTER]: {
    primary: '#3B82F6',
    secondary: '#60A5FA',
    accent: '#93C5FD',
    glow: '#3B82F6',
  },
  [UserTier.GUIDE]: {
    primary: '#10B981',
    secondary: '#34D399',
    accent: '#6EE7B7',
    glow: '#10B981',
  },
  [UserTier.MENTOR]: {
    primary: '#F59E0B',
    secondary: '#FBBF24',
    accent: '#FCD34D',
    glow: '#F59E0B',
  },
  [UserTier.CURATOR]: {
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    accent: '#EC4899',
    glow: '#8B5CF6',
  },
  [UserTier.VISIONARY]: {
    primary: '#EC4899',
    secondary: '#F472B6',
    accent: '#FFD700',
    glow: '#EC4899',
  },
};

// Effect configuration per tier
const tierEffects: Record<UserTier, {
  glowIntensity: number;
  hasRotation: boolean;
  hasShimmer: boolean;
  hasParticles: boolean;
  hasPulse: boolean;
  hasMultiLayer: boolean;
  rotationSpeed: number;
}> = {
  [UserTier.NEWCOMER]: {
    glowIntensity: 0,
    hasRotation: false,
    hasShimmer: false,
    hasParticles: false,
    hasPulse: false,
    hasMultiLayer: false,
    rotationSpeed: 0,
  },
  [UserTier.SUPPORTER]: {
    glowIntensity: 0.4,
    hasRotation: false,
    hasShimmer: false,
    hasParticles: false,
    hasPulse: false,
    hasMultiLayer: false,
    rotationSpeed: 0,
  },
  [UserTier.GUIDE]: {
    glowIntensity: 0.6,
    hasRotation: false,
    hasShimmer: false,
    hasParticles: false,
    hasPulse: true,
    hasMultiLayer: false,
    rotationSpeed: 0,
  },
  [UserTier.MENTOR]: {
    glowIntensity: 0.7,
    hasRotation: true,
    hasShimmer: false,
    hasParticles: false,
    hasPulse: true,
    hasMultiLayer: false,
    rotationSpeed: 8,
  },
  [UserTier.CURATOR]: {
    glowIntensity: 0.85,
    hasRotation: true,
    hasShimmer: true,
    hasParticles: true,
    hasPulse: true,
    hasMultiLayer: true,
    rotationSpeed: 6,
  },
  [UserTier.VISIONARY]: {
    glowIntensity: 1,
    hasRotation: true,
    hasShimmer: true,
    hasParticles: true,
    hasPulse: true,
    hasMultiLayer: true,
    rotationSpeed: 4,
  },
};

export interface TieredAvatarProps {
  avatarUrl?: string | null;
  fullName?: string;
  tier: UserTier;
  size?: TieredAvatarSize;
  showTierEffects?: boolean;
  className?: string;
}

export function TieredAvatar({
  avatarUrl,
  fullName = 'User',
  tier,
  size = 'md',
  showTierEffects = true,
  className,
}: TieredAvatarProps) {
  const config = sizeConfig[size];
  const palette = tierPalettes[tier];
  const effects = tierEffects[tier];

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Build gradient string based on tier
  const getGradient = (offset = 0) => {
    switch (tier) {
      case UserTier.MENTOR:
        return `conic-gradient(from ${offset}deg, ${palette.primary}, ${palette.secondary}, ${palette.accent}, ${palette.secondary}, ${palette.primary})`;
      case UserTier.CURATOR:
        return `conic-gradient(from ${offset}deg, ${palette.primary}, ${palette.secondary}, ${palette.accent}, #3B82F6, ${palette.secondary}, ${palette.primary})`;
      case UserTier.VISIONARY:
        return `conic-gradient(from ${offset}deg, #EC4899, #F43F5E, #F59E0B, #EAB308, #22C55E, #06B6D4, #3B82F6, #8B5CF6, #EC4899)`;
      default:
        return palette.primary;
    }
  };

  // Generate glow shadow
  const getGlowShadow = (intensity: number) => {
    if (!showTierEffects || intensity === 0) return 'none';
    const baseIntensity = 15 * intensity;

    if (tier === UserTier.VISIONARY) {
      return `
        0 0 ${baseIntensity}px ${palette.primary}90,
        0 0 ${baseIntensity * 2}px ${palette.accent}70,
        0 0 ${baseIntensity * 3}px ${palette.primary}50,
        0 0 ${baseIntensity * 4}px ${palette.accent}30
      `;
    }

    if (tier === UserTier.CURATOR) {
      return `
        0 0 ${baseIntensity}px ${palette.primary}80,
        0 0 ${baseIntensity * 2}px ${palette.accent}60,
        0 0 ${baseIntensity * 3}px ${palette.primary}40
      `;
    }

    return `
      0 0 ${baseIntensity}px ${palette.glow}60,
      0 0 ${baseIntensity * 2}px ${palette.glow}40,
      0 0 ${baseIntensity * 3}px ${palette.glow}20
    `;
  };

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: config.container, height: config.container }}
    >
      {/* Layer 1: Outer glow pulse */}
      {showTierEffects && effects.glowIntensity > 0 && (
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: -config.borderWidth,
            background: `radial-gradient(circle, ${palette.glow}${Math.floor(effects.glowIntensity * 60).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
            filter: 'blur(8px)',
          }}
          animate={effects.hasPulse ? {
            scale: [1, 1.15, 1],
            opacity: [0.6, 1, 0.6],
          } : {}}
          transition={effects.hasPulse ? {
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          } : {}}
        />
      )}

      {/* Layer 2: Secondary rotating gradient (multi-layer tiers only) */}
      {showTierEffects && effects.hasMultiLayer && (
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: -2,
            background: getGradient(180),
            opacity: 0.5,
            filter: 'blur(4px)',
          }}
          animate={{ rotate: -360 }}
          transition={{
            duration: effects.rotationSpeed * 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}

      {/* Layer 3: Main border - static or rotating */}
      {showTierEffects && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: effects.hasRotation ? getGradient(0) : palette.primary,
            boxShadow: getGlowShadow(effects.glowIntensity),
          }}
          animate={effects.hasRotation ? { rotate: 360 } : {}}
          transition={effects.hasRotation ? {
            duration: effects.rotationSpeed,
            repeat: Infinity,
            ease: 'linear',
          } : {}}
        />
      )}

      {/* Layer 4: Inner cutout (creates the ring effect) */}
      <div
        className="absolute rounded-full bg-background"
        style={{
          inset: config.borderWidth,
        }}
      />

      {/* Layer 5: Shimmer effect */}
      {showTierEffects && effects.hasShimmer && (
        <div
          className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                90deg,
                transparent 0%,
                transparent 35%,
                rgba(255,255,255,0.7) 50%,
                transparent 65%,
                transparent 100%
              )`,
            }}
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 2,
              ease: 'easeInOut',
            }}
          />
        </div>
      )}

      {/* Layer 6: Avatar image */}
      <div
        className="absolute rounded-full overflow-hidden z-10"
        style={{
          inset: config.borderWidth,
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${palette.primary}60, ${palette.secondary}90)`,
            }}
          >
            <span className={cn('font-bold text-white', config.fontSize)}>
              {getInitials(fullName)}
            </span>
          </div>
        )}
      </div>

      {/* Layer 7: Particle effects */}
      {showTierEffects && effects.hasParticles && size !== 'xs' && size !== 'sm' && (
        <ParticleRing
          containerSize={config.container}
          colors={[palette.primary, palette.secondary, palette.accent]}
          particleCount={tier === UserTier.VISIONARY ? 10 : 6}
          speed={tier === UserTier.VISIONARY ? 2.5 : 3}
        />
      )}
    </div>
  );
}

// Particle ring component
function ParticleRing({
  containerSize,
  colors,
  particleCount,
  speed,
}: {
  containerSize: number;
  colors: string[];
  particleCount: number;
  speed: number;
}) {
  const particles = React.useMemo(() =>
    Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      angle: (i / particleCount) * 360,
      delay: i * (speed / particleCount),
      size: 2 + Math.random() * 2,
      color: colors[i % colors.length],
    })),
    [particleCount, colors, speed]
  );

  const radius = containerSize * 0.55;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            background: particle.color,
            boxShadow: `0 0 ${particle.size * 3}px ${particle.color}`,
            left: '50%',
            top: '50%',
            marginLeft: -particle.size / 2,
            marginTop: -particle.size / 2,
          }}
          animate={{
            x: [
              Math.cos((particle.angle * Math.PI) / 180) * radius * 0.8,
              Math.cos((particle.angle * Math.PI) / 180) * radius,
              Math.cos((particle.angle * Math.PI) / 180) * radius * 0.8,
            ],
            y: [
              Math.sin((particle.angle * Math.PI) / 180) * radius * 0.8,
              Math.sin((particle.angle * Math.PI) / 180) * radius,
              Math.sin((particle.angle * Math.PI) / 180) * radius * 0.8,
            ],
            opacity: [0.4, 1, 0.4],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: speed,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export { TieredAvatar as default };
