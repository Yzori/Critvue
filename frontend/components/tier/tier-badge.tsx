'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  UserTier,
  MasterTierType,
  getTierInfo,
  type TierInfo,
} from '@/lib/types/tier';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * TierBadge Component
 *
 * Displays a user's tier with badge image, name, and optional sub-badge for Master tiers.
 * Includes tooltips explaining tier benefits and requirements.
 */

export interface TierBadgeProps {
  /**
   * User's current tier
   */
  tier: UserTier;
  /**
   * For Master tier, specify if Certified or Community
   */
  masterType?: MasterTierType;
  /**
   * Visual size variant
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Show tier name text alongside icon
   */
  showName?: boolean;
  /**
   * Show tooltip with tier details
   */
  showTooltip?: boolean;
  /**
   * Custom className
   */
  className?: string;
}

const TierBadge = React.forwardRef<HTMLDivElement, TierBadgeProps>(
  (
    {
      tier,
      masterType,
      size = 'md',
      showName = true,
      showTooltip = true,
      className,
    },
    ref
  ) => {
    const tierInfo: TierInfo = getTierInfo(tier);

    // Get the appropriate badge image (use certified badge for Master Certified)
    const badgeImage = tier === UserTier.MASTER &&
      masterType === MasterTierType.CERTIFIED &&
      tierInfo.badgeImageCertified
        ? tierInfo.badgeImageCertified
        : tierInfo.badgeImage;

    const sizeClasses = {
      sm: {
        container: 'gap-1 px-2 py-1',
        imageSize: 16,
        text: 'text-xs',
        subBadge: 'text-[9px] px-1 py-0.5',
      },
      md: {
        container: 'gap-1.5 px-2.5 py-1.5',
        imageSize: 20,
        text: 'text-sm',
        subBadge: 'text-[10px] px-1.5 py-0.5',
      },
      lg: {
        container: 'gap-2 px-3 py-2',
        imageSize: 24,
        text: 'text-base',
        subBadge: 'text-xs px-2 py-1',
      },
      xl: {
        container: 'gap-2.5 px-4 py-3',
        imageSize: 32,
        text: 'text-lg',
        subBadge: 'text-xs px-2 py-1',
      },
    };

    const classes = sizeClasses[size];

    const badgeContent = (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium transition-all duration-200',
          'border shadow-sm',
          classes.container,
          className
        )}
        style={{
          backgroundColor: `${tierInfo.color}15`,
          borderColor: `${tierInfo.color}40`,
          color: tierInfo.color,
        }}
      >
        <Image
          src={badgeImage}
          alt={`${tierInfo.name} tier badge`}
          width={classes.imageSize}
          height={classes.imageSize}
          className="object-contain"
        />

        {showName && (
          <span className={cn('font-semibold', classes.text)}>
            {tierInfo.name}
          </span>
        )}

        {tier === UserTier.MASTER && masterType && (
          <span
            className={cn(
              'ml-1 rounded-full font-bold uppercase tracking-wide',
              classes.subBadge
            )}
            style={{
              backgroundColor: tierInfo.color,
              color: 'white',
            }}
          >
            {masterType === MasterTierType.CERTIFIED ? 'Certified' : 'Community'}
          </span>
        )}
      </div>
    );

    if (!showTooltip) {
      return badgeContent;
    }

    return (
      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
          <TooltipContent
            className="max-w-xs space-y-2 p-4"
            side="bottom"
            align="center"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Image
                  src={badgeImage}
                  alt={`${tierInfo.name} tier badge`}
                  width={28}
                  height={28}
                  className="object-contain"
                />
                <h4 className="font-semibold text-sm">{tierInfo.name}</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                {tierInfo.description}
              </p>
            </div>

            <div className="space-y-1.5 border-t pt-2">
              <p className="text-xs font-medium">Key Benefits:</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {tierInfo.benefits.maxReviewPrice !== null && (
                  <li>
                    Maximum review price: ${tierInfo.benefits.maxReviewPrice}
                  </li>
                )}
                {tierInfo.benefits.maxReviewPrice === null && (
                  <li>Unlimited review pricing</li>
                )}
                {tierInfo.benefits.karmaBonus > 0 && (
                  <li>+{tierInfo.benefits.karmaBonus}% karma bonus</li>
                )}
                {tierInfo.benefits.prioritySupport && (
                  <li>Priority support</li>
                )}
                {tierInfo.benefits.exclusiveReviews && (
                  <li>Access to exclusive reviews</li>
                )}
              </ul>
            </div>

            {tier === UserTier.MASTER && masterType && (
              <div className="border-t pt-2">
                <p className="text-xs text-muted-foreground">
                  {masterType === MasterTierType.CERTIFIED
                    ? 'Achieved via expert application approval'
                    : 'Achieved via platform progression'}
                </p>
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

TierBadge.displayName = 'TierBadge';

export { TierBadge };
