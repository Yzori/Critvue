'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { UserTier, getTierInfo } from '@/lib/types/tier';
import { TierBadge } from './tier-badge';
import { Lock, ArrowRight } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Tier Locked Review Components
 *
 * UI components to display when a review is locked due to tier requirements.
 * Used in review cards, claim buttons, and detail pages.
 */

export interface TierLockedBadgeProps {
  requiredTier: UserTier;
  currentTier?: UserTier;
  className?: string;
}

/**
 * Badge showing a review is locked with required tier
 */
export const TierLockedBadge: React.FC<TierLockedBadgeProps> = ({
  requiredTier,
  currentTier,
  className,
}) => {
  const tierInfo = getTierInfo(requiredTier);
  const isLocked = currentTier
    ? tierOrder.indexOf(currentTier) < tierOrder.indexOf(requiredTier)
    : true;

  if (!isLocked) return null;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium',
              'bg-gray-100 text-gray-700 border border-gray-200',
              className
            )}
          >
            <Lock className="h-3 w-3" />
            <span>{tierInfo.name} Required</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-xs">
            This review requires <strong>{tierInfo.name}</strong> tier or
            higher to claim.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export interface TierLockedOverlayProps {
  requiredTier: UserTier;
  reviewPrice?: number;
  className?: string;
}

/**
 * Overlay for locked review cards
 */
export const TierLockedOverlay: React.FC<TierLockedOverlayProps> = ({
  requiredTier,
  reviewPrice,
  className,
}) => {
  const tierInfo = getTierInfo(requiredTier);

  return (
    <div
      className={cn(
        'absolute inset-0 bg-white/95 backdrop-blur-sm rounded-xl',
        'flex items-center justify-center',
        'border-2 border-gray-200',
        className
      )}
    >
      <div className="text-center p-6 max-w-xs">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
          <Lock className="h-6 w-6 text-gray-600" />
        </div>

        <h3 className="font-semibold text-sm mb-2">Tier Required</h3>

        <div className="flex justify-center mb-3">
          <TierBadge tier={requiredTier} size="md" showTooltip={false} />
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          {reviewPrice
            ? `Reviews up to $${reviewPrice} require ${tierInfo.name} tier`
            : `This review requires ${tierInfo.name} tier to claim`}
        </p>

        <Link
          href="/tiers"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent-blue text-white text-xs font-medium rounded-lg hover:bg-accent-blue/90 transition-colors"
        >
          Learn About Tiers
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

export interface TierLockedButtonProps {
  requiredTier: UserTier;
  currentTier?: UserTier;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Button state for locked reviews
 */
export const TierLockedButton: React.FC<TierLockedButtonProps> = ({
  requiredTier,
  currentTier,
  className,
  size = 'md',
}) => {
  const tierInfo = getTierInfo(requiredTier);
  const isLocked = currentTier
    ? tierOrder.indexOf(currentTier) < tierOrder.indexOf(requiredTier)
    : true;

  if (!isLocked) return null;

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            disabled
            className={cn(
              'inline-flex items-center justify-center gap-2 font-medium rounded-lg',
              'bg-gray-100 text-gray-500 cursor-not-allowed',
              'border border-gray-200',
              sizeClasses[size],
              className
            )}
          >
            <Lock className="h-4 w-4" />
            <span>Requires {tierInfo.name}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <p className="text-xs font-medium">
              {tierInfo.name} Tier Required
            </p>
            <p className="text-xs text-muted-foreground">
              Advance to {tierInfo.name} to unlock this review
            </p>
            <Link
              href="/tiers"
              className="inline-flex items-center gap-1 text-xs text-accent-blue hover:underline"
            >
              View tier requirements
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export interface TierUpgradeMessageProps {
  requiredTier: UserTier;
  currentTier: UserTier;
  className?: string;
}

/**
 * Inline message encouraging tier upgrade
 */
export const TierUpgradeMessage: React.FC<TierUpgradeMessageProps> = ({
  requiredTier,
  currentTier,
  className,
}) => {
  const requiredTierInfo = getTierInfo(requiredTier);
  const currentTierInfo = getTierInfo(currentTier);

  return (
    <div
      className={cn(
        'rounded-lg border border-accent-blue/20 bg-accent-blue/5 p-4',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-accent-blue/10 flex-shrink-0">
          <Lock className="h-4 w-4 text-accent-blue" />
        </div>
        <div className="flex-1 space-y-2">
          <h4 className="text-sm font-semibold">Unlock Higher-Paying Reviews</h4>
          <p className="text-xs text-muted-foreground">
            You're currently at <strong>{currentTierInfo.name}</strong> tier.
            Advance to <strong>{requiredTierInfo.name}</strong> to access
            reviews up to ${requiredTierInfo.benefits.maxReviewPrice}.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/karma"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent-blue hover:underline"
            >
              View Progress
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/tiers"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent-blue hover:underline"
            >
              Learn More
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper: Tier order for comparison
const tierOrder: UserTier[] = [
  UserTier.NOVICE,
  UserTier.CONTRIBUTOR,
  UserTier.SKILLED,
  UserTier.TRUSTED_ADVISOR,
  UserTier.EXPERT,
  UserTier.MASTER,
];
