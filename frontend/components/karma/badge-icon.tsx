'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { getBadgeIconConfig } from '@/lib/constants/badge-icons';
import type { BadgeRarity } from '@/lib/api/karma';

/**
 * BadgeIcon Component
 *
 * Renders a styled badge with rarity-based effects.
 * Uses Lucide icons wrapped in a decorative container.
 *
 * Features:
 * - Rarity-based border colors and effects
 * - Glow effects for rare+ badges
 * - Shimmer animation for legendary badges
 * - Locked state for unearned badges
 */

export interface BadgeIconProps {
  badgeCode: string;
  rarity: BadgeRarity;
  earned?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showGlow?: boolean;
  className?: string;
}

// Rarity styling configurations
const RARITY_STYLES: Record<
  BadgeRarity,
  {
    borderColor: string;
    glowColor: string;
    bgGradient: string;
    textColor: string;
  }
> = {
  common: {
    borderColor: 'border-gray-300',
    glowColor: '',
    bgGradient: 'from-gray-50 to-gray-100',
    textColor: 'text-gray-600',
  },
  uncommon: {
    borderColor: 'border-green-400',
    glowColor: '',
    bgGradient: 'from-green-50 to-emerald-100',
    textColor: 'text-green-600',
  },
  rare: {
    borderColor: 'border-blue-400',
    glowColor: 'shadow-blue-200/50',
    bgGradient: 'from-blue-50 to-indigo-100',
    textColor: 'text-blue-600',
  },
  epic: {
    borderColor: 'border-purple-400',
    glowColor: 'shadow-purple-300/50',
    bgGradient: 'from-purple-50 to-violet-100',
    textColor: 'text-purple-600',
  },
  legendary: {
    borderColor: 'border-amber-400',
    glowColor: 'shadow-amber-300/60',
    bgGradient: 'from-amber-50 via-yellow-50 to-orange-100',
    textColor: 'text-amber-600',
  },
};

// Size configurations
const SIZE_STYLES: Record<
  'sm' | 'md' | 'lg' | 'xl',
  {
    container: string;
    icon: string;
    border: string;
  }
> = {
  sm: {
    container: 'h-10 w-10',
    icon: 'h-5 w-5',
    border: 'border-2',
  },
  md: {
    container: 'h-14 w-14',
    icon: 'h-7 w-7',
    border: 'border-2',
  },
  lg: {
    container: 'h-20 w-20',
    icon: 'h-10 w-10',
    border: 'border-[3px]',
  },
  xl: {
    container: 'h-28 w-28',
    icon: 'h-14 w-14',
    border: 'border-4',
  },
};

export const BadgeIcon: React.FC<BadgeIconProps> = ({
  badgeCode,
  rarity,
  earned = true,
  size = 'md',
  showGlow = true,
  className,
}) => {
  const iconConfig = getBadgeIconConfig(badgeCode);
  const rarityStyle = RARITY_STYLES[rarity];
  const sizeStyle = SIZE_STYLES[size];
  const Icon = iconConfig.icon;

  const isRareOrAbove = ['rare', 'epic', 'legendary'].includes(rarity);
  const isLegendary = rarity === 'legendary';

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        className
      )}
    >
      {/* Outer glow ring for rare+ badges */}
      {earned && showGlow && isRareOrAbove && (
        <div
          className={cn(
            'absolute inset-0 rounded-full blur-md opacity-60',
            isLegendary && 'animate-pulse'
          )}
          style={{
            background: `radial-gradient(circle, ${iconConfig.color}40 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Badge container */}
      <div
        className={cn(
          'relative rounded-full flex items-center justify-center',
          'bg-gradient-to-br',
          sizeStyle.container,
          sizeStyle.border,
          earned ? rarityStyle.bgGradient : 'from-gray-100 to-gray-200',
          earned ? rarityStyle.borderColor : 'border-gray-300',
          earned && showGlow && isRareOrAbove && 'shadow-lg',
          earned && showGlow && rarityStyle.glowColor,
          !earned && 'opacity-50 grayscale',
          'transition-all duration-300'
        )}
      >
        {/* Inner decorative ring */}
        <div
          className={cn(
            'absolute inset-1 rounded-full border',
            earned ? 'border-white/60' : 'border-gray-300/30'
          )}
        />

        {/* Shimmer effect for legendary */}
        {earned && isLegendary && (
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              background:
                'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s infinite',
            }}
          />
        )}

        {/* Icon */}
        <Icon
          className={cn(sizeStyle.icon, 'relative z-10')}
          style={{
            color: earned ? iconConfig.color : '#9CA3AF',
          }}
        />

        {/* Locked overlay for unearned */}
        {!earned && (
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-gray-900/10">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Rarity indicator dot */}
      {earned && isRareOrAbove && (
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 rounded-full',
            size === 'sm' && 'h-2 w-2',
            size === 'md' && 'h-2.5 w-2.5',
            size === 'lg' && 'h-3 w-3',
            size === 'xl' && 'h-4 w-4',
            rarity === 'rare' && 'bg-blue-500',
            rarity === 'epic' && 'bg-purple-500',
            rarity === 'legendary' && 'bg-gradient-to-r from-amber-400 to-orange-500',
            'border-2 border-white shadow-sm'
          )}
        />
      )}
    </div>
  );
};

// Add shimmer animation to global styles or use inline
const shimmerKeyframes = `
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;

// Inject keyframes
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = shimmerKeyframes;
  if (!document.head.querySelector('style[data-badge-shimmer]')) {
    style.setAttribute('data-badge-shimmer', 'true');
    document.head.appendChild(style);
  }
}

export default BadgeIcon;
