'use client';

/**
 * TierProgressRing Component
 *
 * Displays user's current tier with progress to next tier.
 * Clicking navigates to the karma page.
 *
 * Design: Lighter visual weight, more breathing room, clear micro-labels
 */

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  UserTier,
  MasterTierType,
  getTierByKarma,
  getTierInfo,
  getNextTier,
} from '@/lib/types/tier';

export interface TierProgressRingProps {
  /** Current karma points */
  karma: number;
  /** Actual user tier from database (takes precedence over karma calculation) */
  userTier?: UserTier | string;
  /** For Master tier, specify if Certified or Community */
  masterType?: MasterTierType;
  /** Size of the ring */
  size?: 'sm' | 'md' | 'lg';
  /** Optional className */
  className?: string;
}

// Reduced stroke widths by ~15% for lighter visual weight
const sizeMap = {
  sm: { outer: 88, stroke: 6, imageSize: 36 },
  md: { outer: 110, stroke: 7, imageSize: 44 },
  lg: { outer: 140, stroke: 8, imageSize: 56 },
};

export const TierProgressRing: React.FC<TierProgressRingProps> = ({
  karma,
  userTier,
  masterType,
  size = 'sm',
  className,
}) => {
  const dimensions = sizeMap[size];
  const radius = (dimensions.outer - dimensions.stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Use actual tier from database if provided, otherwise calculate from karma
  // This is important for users who were promoted via expert application
  // (they may have low karma but high tier)
  const currentTier = userTier
    ? (userTier as UserTier)
    : getTierByKarma(karma);
  const tierInfo = getTierInfo(currentTier);
  const nextTier = getNextTier(currentTier);

  // Get the appropriate badge image (use certified badge for Master Certified)
  const badgeImage = currentTier === UserTier.MASTER &&
    masterType === MasterTierType.CERTIFIED &&
    tierInfo.badgeImageCertified
      ? tierInfo.badgeImageCertified
      : tierInfo.badgeImage;

  // Calculate progress percentage
  let progressPercent = 100;
  let karmaToNext = 0;

  if (nextTier) {
    const nextTierInfo = getTierInfo(nextTier);
    const karmaInTier = karma - tierInfo.requirements.minKarma;
    const tierRange = nextTierInfo.requirements.minKarma - tierInfo.requirements.minKarma;
    progressPercent = Math.min(100, (karmaInTier / tierRange) * 100);
    karmaToNext = nextTierInfo.requirements.minKarma - karma;
  }

  const offset = circumference - (progressPercent / 100) * circumference;

  return (
    <Link
      href="/dashboard/karma"
      className={cn(
        'relative inline-flex flex-col items-center group cursor-pointer',
        'transition-transform hover:scale-[1.03]',
        className
      )}
    >
      {/* Ring container */}
      <div className="relative">
        {/* SVG Ring */}
        <svg
          width={dimensions.outer}
          height={dimensions.outer}
          className="transform -rotate-90"
        >
          {/* Background ring - very subtle */}
          <circle
            cx={dimensions.outer / 2}
            cy={dimensions.outer / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={dimensions.stroke}
            className="text-muted/15"
          />

          {/* Progress ring */}
          <motion.circle
            cx={dimensions.outer / 2}
            cy={dimensions.outer / 2}
            r={radius}
            fill="none"
            stroke={tierInfo.color}
            strokeWidth={dimensions.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 4px ${tierInfo.color}30)` }}
          />
        </svg>

        {/* Center content - with more breathing room */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="text-center flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {/* Tier Badge Image */}
            <Image
              src={badgeImage}
              alt={`${tierInfo.name} tier badge`}
              width={dimensions.imageSize}
              height={dimensions.imageSize}
              className="object-contain"
            />

            {/* Tier Name */}
            <p
              className="text-[11px] font-semibold mt-1 leading-none"
              style={{ color: tierInfo.color }}
            >
              {tierInfo.name}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Micro-label below ring */}
      <div className="mt-2 text-center">
        <p className="text-[10px] text-muted-foreground/70 leading-tight">
          {nextTier ? 'Progress to next tier' : 'Max tier reached'}
        </p>
        {nextTier && karmaToNext > 0 && (
          <p className="text-[10px] font-medium text-muted-foreground leading-tight">
            {karmaToNext} karma remaining
          </p>
        )}
      </div>

      {/* Hover indicator */}
      <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[9px] text-blue-500 font-medium">
          View details →
        </span>
      </div>
    </Link>
  );
};

export default TierProgressRing;
