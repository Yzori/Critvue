'use client';

import * as React from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import {
  UserTier,
  getTierInfo,
  type TierInfo,
} from '@/lib/types/tier';
import { TierBadge } from './tier-badge';
import { Sparkles, Trophy, ArrowRight } from 'lucide-react';

/**
 * Tier Unlock Notification Components
 *
 * Provides toast notifications and celebration effects when users:
 * - Unlock a new tier
 * - Gain new benefits
 * - Complete tier-related milestones
 */

export interface TierUnlockData {
  oldTier: UserTier;
  newTier: UserTier;
  karma: number;
  unlockedBenefits: string[];
}

/**
 * Show a celebratory notification when user unlocks a new tier
 */
export function showTierUnlockNotification(data: TierUnlockData) {
  const newTierInfo: TierInfo = getTierInfo(data.newTier);

  // Trigger confetti animation
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 10000,
  };

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);

  // Show toast notification
  toast.custom(
    (t) => (
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 p-6 max-w-md w-full animate-in zoom-in duration-500">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-full bg-gradient-to-br from-accent-blue/20 to-accent-peach/20">
            <Trophy className="h-6 w-6 text-accent-blue" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg flex items-center gap-2">
              Tier Unlocked!
              <Sparkles className="h-4 w-4 text-amber-500" />
            </h3>
            <p className="text-sm text-muted-foreground">
              Congratulations on reaching {newTierInfo.name}!
            </p>
          </div>
        </div>

        {/* Tier Badge */}
        <div className="flex items-center justify-center py-4">
          <TierBadge
            tier={data.newTier}
            size="xl"
            showTooltip={false}
          />
        </div>

        {/* New Benefits */}
        {data.unlockedBenefits.length > 0 && (
          <div className="border-t pt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              New Benefits Unlocked:
            </p>
            <ul className="space-y-1.5">
              {data.unlockedBenefits.map((benefit, index) => (
                <li
                  key={index}
                  className="text-sm flex items-center gap-2"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-accent-blue flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4 pt-4 border-t">
          <button
            onClick={() => {
              toast.dismiss(t);
              window.location.href = '/dashboard';
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-blue text-white font-medium rounded-lg hover:bg-accent-blue/90 transition-colors"
          >
            View Dashboard
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    ),
    {
      duration: 10000,
      position: 'top-center',
    }
  );
}

/**
 * Show notification for new benefit unlock
 */
export function showBenefitUnlockNotification(benefitText: string) {
  toast.success(benefitText, {
    icon: <Sparkles className="h-5 w-5 text-amber-500" />,
    duration: 5000,
    className: 'font-medium',
  });
}

/**
 * Show notification for sparks milestone
 */
export function showSparksMilestoneNotification(
  milestone: number,
  bonusSparks?: number
) {
  toast.custom(
    (t) => (
      <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-4 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-gradient-to-br from-accent-peach/20 to-accent-blue/20">
            <Trophy className="h-5 w-5 text-accent-peach" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Milestone Reached!</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              You've earned {milestone.toLocaleString()} sparks
            </p>
            {bonusSparks && (
              <p className="text-xs font-medium text-accent-blue mt-1">
                +{bonusSparks} bonus sparks awarded!
              </p>
            )}
          </div>
        </div>
      </div>
    ),
    {
      duration: 5000,
      position: 'bottom-right',
    }
  );
}

/**
 * Show notification for streak milestone
 */
export function showStreakNotification(
  streakDays: number,
  bonusSparks: number
) {
  toast.custom(
    (t) => (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow-lg border border-amber-200 p-4 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300">
        <div className="flex items-start gap-3">
          <div className="text-3xl">🔥</div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-amber-900">
              {streakDays} Day Streak!
            </h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Keep it up! You've earned +{bonusSparks} bonus sparks
            </p>
          </div>
        </div>
      </div>
    ),
    {
      duration: 5000,
      position: 'bottom-right',
    }
  );
}

/**
 * Hook to check for tier unlock on mount (e.g., after login)
 *
 * Usage:
 * useTierUnlockCheck(userStatus);
 */
export function useTierUnlockCheck(
  currentTier: UserTier,
  previousTier?: UserTier
) {
  const hasChecked = React.useRef(false);

  React.useEffect(() => {
    if (hasChecked.current || !previousTier) return;

    // Check if tier has changed
    if (previousTier !== currentTier) {
      hasChecked.current = true;

      const oldTierInfo = getTierInfo(previousTier);
      const newTierInfo = getTierInfo(currentTier);

      // Determine unlocked benefits
      const unlockedBenefits: string[] = [];

      if (
        newTierInfo.benefits.maxReviewPrice &&
        (!oldTierInfo.benefits.maxReviewPrice ||
          newTierInfo.benefits.maxReviewPrice >
            oldTierInfo.benefits.maxReviewPrice)
      ) {
        unlockedBenefits.push(
          `Accept reviews up to $${newTierInfo.benefits.maxReviewPrice}`
        );
      }

      if (
        newTierInfo.benefits.karmaBonus > oldTierInfo.benefits.karmaBonus
      ) {
        unlockedBenefits.push(
          `${newTierInfo.benefits.karmaBonus}% sparks bonus on all reviews`
        );
      }

      if (
        newTierInfo.benefits.prioritySupport &&
        !oldTierInfo.benefits.prioritySupport
      ) {
        unlockedBenefits.push('Priority customer support');
      }

      if (
        newTierInfo.benefits.exclusiveReviews &&
        !oldTierInfo.benefits.exclusiveReviews
      ) {
        unlockedBenefits.push('Access to exclusive review opportunities');
      }

      if (
        newTierInfo.benefits.customProfile &&
        !oldTierInfo.benefits.customProfile
      ) {
        unlockedBenefits.push('Custom profile customization');
      }

      if (
        newTierInfo.benefits.verifiedBadge &&
        !oldTierInfo.benefits.verifiedBadge
      ) {
        unlockedBenefits.push('Verified reviewer badge');
      }

      // Show notification
      showTierUnlockNotification({
        oldTier: previousTier,
        newTier: currentTier,
        karma: 0, // Would come from actual user data
        unlockedBenefits,
      });
    }
  }, [currentTier, previousTier]);
}
