'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { UserTier, TIER_CONFIG } from '@/lib/types/tier';

/**
 * TieredAvatar Component
 *
 * Displays a user's avatar with tier-specific decorations:
 * - NEWCOMER: Simple clean border
 * - SUPPORTER: Subtle glow + thicker border
 * - GUIDE: Gradient border ring
 * - MENTOR: Animated glow + gradient border
 * - CURATOR: Laurel wreath decoration
 * - VISIONARY: Golden laurels + crown + animated effects
 */

export type TieredAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const sizeConfig: Record<TieredAvatarSize, {
  container: string;
  avatar: string;
  ring: string;
  laurelSize: number;
  crownSize: number;
  text: string;
}> = {
  xs: { container: 'size-8', avatar: 'size-6', ring: '1px', laurelSize: 32, crownSize: 10, text: 'text-[8px]' },
  sm: { container: 'size-10', avatar: 'size-8', ring: '2px', laurelSize: 40, crownSize: 12, text: 'text-[10px]' },
  md: { container: 'size-12', avatar: 'size-10', ring: '2px', laurelSize: 48, crownSize: 14, text: 'text-xs' },
  lg: { container: 'size-16', avatar: 'size-14', ring: '3px', laurelSize: 64, crownSize: 18, text: 'text-sm' },
  xl: { container: 'size-20', avatar: 'size-[72px]', ring: '3px', laurelSize: 80, crownSize: 22, text: 'text-base' },
  '2xl': { container: 'size-36', avatar: 'size-32', ring: '4px', laurelSize: 144, crownSize: 32, text: 'text-2xl' },
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
  const tierInfo = TIER_CONFIG[tier];
  const config = sizeConfig[size];

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Tier-specific styles
  const tierStyles = getTierStyles(tier, tierInfo.color, showTierEffects);

  return (
    <div className={cn('relative inline-flex items-center justify-center', config.container, className)}>
      {/* Background glow for higher tiers */}
      {showTierEffects && tierStyles.hasGlow && (
        <div
          className={cn(
            'absolute inset-0 rounded-full blur-md opacity-50',
            tierStyles.glowAnimation
          )}
          style={{ backgroundColor: tierInfo.color }}
        />
      )}

      {/* Laurel wreath for Curator and Visionary */}
      {showTierEffects && tierStyles.hasLaurels && (
        <LaurelWreath
          size={config.laurelSize}
          color={tierInfo.color}
          isVisionary={tier === UserTier.VISIONARY}
        />
      )}

      {/* Crown for Visionary */}
      {showTierEffects && tier === UserTier.VISIONARY && (
        <Crown size={config.crownSize} className="absolute -top-2 z-20" />
      )}

      {/* Ring/border layer */}
      <div
        className={cn(
          'absolute inset-0 rounded-full',
          tierStyles.ringAnimation
        )}
        style={{
          background: tierStyles.ringGradient,
        }}
      />

      {/* Avatar image */}
      <div
        className={cn(
          config.avatar,
          'relative rounded-full overflow-hidden z-10'
        )}
        style={{
          boxShadow: `0 0 0 ${config.ring} var(--background)`,
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
              background: `linear-gradient(135deg, ${tierInfo.color}40, ${tierInfo.color}80)`,
            }}
          >
            <span className={cn('font-bold text-white', config.text)}>
              {getInitials(fullName)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to get tier-specific styles
function getTierStyles(tier: UserTier, color: string, showEffects: boolean) {
  const baseRing = `linear-gradient(135deg, ${color}, ${color})`;

  switch (tier) {
    case UserTier.NEWCOMER:
      return {
        ringGradient: `${color}60`,
        hasGlow: false,
        hasLaurels: false,
        glowAnimation: '',
        ringAnimation: '',
      };

    case UserTier.SUPPORTER:
      return {
        ringGradient: `linear-gradient(135deg, ${color}80, ${color})`,
        hasGlow: showEffects,
        hasLaurels: false,
        glowAnimation: '',
        ringAnimation: '',
      };

    case UserTier.GUIDE:
      return {
        ringGradient: `linear-gradient(135deg, ${color}, ${color}CC, ${color})`,
        hasGlow: showEffects,
        hasLaurels: false,
        glowAnimation: '',
        ringAnimation: '',
      };

    case UserTier.MENTOR:
      return {
        ringGradient: `linear-gradient(135deg, ${color}, #ffffff40, ${color})`,
        hasGlow: showEffects,
        hasLaurels: false,
        glowAnimation: 'animate-pulse',
        ringAnimation: '',
      };

    case UserTier.CURATOR:
      return {
        ringGradient: `linear-gradient(135deg, ${color}, #FFD700, ${color})`,
        hasGlow: showEffects,
        hasLaurels: showEffects,
        glowAnimation: 'animate-pulse',
        ringAnimation: '',
      };

    case UserTier.VISIONARY:
      return {
        ringGradient: `linear-gradient(135deg, #FFD700, ${color}, #FFD700)`,
        hasGlow: showEffects,
        hasLaurels: showEffects,
        glowAnimation: 'animate-pulse',
        ringAnimation: 'animate-[spin_8s_linear_infinite]',
      };

    default:
      return {
        ringGradient: baseRing,
        hasGlow: false,
        hasLaurels: false,
        glowAnimation: '',
        ringAnimation: '',
      };
  }
}

// Laurel wreath SVG component
function LaurelWreath({
  size,
  color,
  isVisionary,
}: {
  size: number;
  color: string;
  isVisionary: boolean;
}) {
  const laurelColor = isVisionary ? '#FFD700' : color;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="absolute inset-0 z-0"
      style={{ transform: 'scale(1.15)' }}
    >
      {/* Left laurel branch */}
      <g transform="translate(10, 50)">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ellipse
            key={`left-${i}`}
            cx={8 + i * 2}
            cy={-5 - i * 7}
            rx={4}
            ry={8}
            fill={laurelColor}
            opacity={0.8 + i * 0.03}
            transform={`rotate(${-20 - i * 8}, ${8 + i * 2}, ${-5 - i * 7})`}
          />
        ))}
        {/* Stem */}
        <path
          d="M 5 0 Q 15 -25 20 -45"
          stroke={laurelColor}
          strokeWidth="2"
          fill="none"
          opacity={0.6}
        />
      </g>

      {/* Right laurel branch (mirrored) */}
      <g transform="translate(90, 50) scale(-1, 1)">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ellipse
            key={`right-${i}`}
            cx={8 + i * 2}
            cy={-5 - i * 7}
            rx={4}
            ry={8}
            fill={laurelColor}
            opacity={0.8 + i * 0.03}
            transform={`rotate(${-20 - i * 8}, ${8 + i * 2}, ${-5 - i * 7})`}
          />
        ))}
        {/* Stem */}
        <path
          d="M 5 0 Q 15 -25 20 -45"
          stroke={laurelColor}
          strokeWidth="2"
          fill="none"
          opacity={0.6}
        />
      </g>

      {/* Sparkle effects for Visionary */}
      {isVisionary && (
        <>
          <circle cx="50" cy="5" r="2" fill="#FFD700" className="animate-pulse" />
          <circle cx="20" cy="25" r="1.5" fill="#FFD700" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
          <circle cx="80" cy="25" r="1.5" fill="#FFD700" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
        </>
      )}
    </svg>
  );
}

// Crown SVG component for Visionary tier
function Crown({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size * 0.7}
      viewBox="0 0 24 17"
      className={cn('drop-shadow-lg', className)}
    >
      {/* Crown shape */}
      <path
        d="M2 14 L4 6 L8 10 L12 4 L16 10 L20 6 L22 14 Z"
        fill="url(#crownGradient)"
        stroke="#B8860B"
        strokeWidth="0.5"
      />
      {/* Crown base */}
      <rect x="2" y="14" width="20" height="3" rx="1" fill="url(#crownGradient)" stroke="#B8860B" strokeWidth="0.5" />
      {/* Jewels */}
      <circle cx="12" cy="9" r="1.5" fill="#DC2626" />
      <circle cx="6" cy="11" r="1" fill="#3B82F6" />
      <circle cx="18" cy="11" r="1" fill="#3B82F6" />

      <defs>
        <linearGradient id="crownGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FFD700" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export { TieredAvatar as default };
