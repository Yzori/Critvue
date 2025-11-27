'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  type UserTierStatus,
  getTierInfo,
  getNextTier,
  calculateTierProgress,
} from '@/lib/types/tier';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TierBadge } from './tier-badge';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * KarmaProgress Component
 *
 * Displays current karma points, progress to next tier, and expandable
 * requirements checklist showing what's needed to advance.
 */

export interface KarmaProgressProps {
  /**
   * User's current tier status
   */
  status: UserTierStatus;
  /**
   * Compact mode (smaller, inline display)
   */
  compact?: boolean;
  /**
   * Custom className
   */
  className?: string;
}

export const KarmaProgress: React.FC<KarmaProgressProps> = ({
  status,
  compact = false,
  className,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const currentTierInfo = getTierInfo(status.currentTier);
  const nextTier = getNextTier(status.currentTier);
  const progress = calculateTierProgress(status);

  if (!nextTier) {
    // At max tier
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Tier Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <TierBadge
              tier={status.currentTier}
              masterType={status.masterType}
              size="md"
            />
            <div className="text-right">
              <p className="text-2xl font-bold">{status.karma.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Karma Points</p>
            </div>
          </div>

          <div className="rounded-lg bg-gradient-to-r from-accent-blue/10 via-accent-peach/10 to-accent-blue/10 p-4 text-center">
            <p className="text-sm font-medium">
              You've reached the highest tier!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Keep earning karma to maintain your status
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const nextTierInfo = getTierInfo(nextTier);

  if (compact) {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {status.karma.toLocaleString()} karma
            </span>
            <span className="text-muted-foreground">
              {progress.karmaNeededForNext.toLocaleString()} more to{' '}
              {nextTierInfo.name}
            </span>
          </div>
          <Progress
            value={progress.currentProgress}
            variant="gradient"
            size="md"
          />
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Tier Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Karma & Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">
                {status.karma.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Karma Points</p>
            </div>
            <TierBadge
              tier={status.currentTier}
              masterType={status.masterType}
              size="md"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Progress to {nextTierInfo.name}
              </span>
              <span className="text-muted-foreground">
                {Math.round(progress.currentProgress)}%
              </span>
            </div>
            <Progress
              value={progress.currentProgress}
              variant="gradient"
              size="lg"
            />
            <p className="text-xs text-muted-foreground">
              {progress.karmaNeededForNext.toLocaleString()} more karma needed
            </p>
          </div>
        </div>

        {/* Expandable Requirements */}
        <div className="border-t pt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-between text-sm font-medium hover:text-accent-blue transition-colors"
          >
            <span>Requirements for {nextTierInfo.name}</span>
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {expanded && (
            <div className="mt-3 space-y-2 animate-in slide-in-from-top-4 fade-in duration-300">
              {/* Karma Requirement */}
              <RequirementItem
                met={progress.requirementsMet.karma}
                label="Karma Points"
                current={status.karma.toLocaleString()}
                required={nextTierInfo.requirements.minKarma.toLocaleString()}
              />

              {/* Reviews Requirement */}
              <RequirementItem
                met={progress.requirementsMet.reviews}
                label="Total Reviews"
                current={status.totalReviews.toString()}
                required={nextTierInfo.requirements.minReviews.toString()}
              />

              {/* Acceptance Rate Requirement */}
              <RequirementItem
                met={progress.requirementsMet.acceptanceRate}
                label="Acceptance Rate"
                current={`${status.acceptanceRate.toFixed(1)}%`}
                required={`${nextTierInfo.requirements.minAcceptanceRate}%`}
              />

              {/* Helpful Rating Requirement */}
              <RequirementItem
                met={progress.requirementsMet.helpfulRating}
                label="Helpful Rating"
                current={status.helpfulRating.toFixed(1)}
                required={nextTierInfo.requirements.minHelpfulRating.toFixed(1)}
              />

              {/* Streak Requirement (if applicable) */}
              {nextTierInfo.requirements.minStreak && (
                <RequirementItem
                  met={progress.requirementsMet.streak || false}
                  label="Review Streak"
                  current={`${status.currentStreak} days`}
                  required={`${nextTierInfo.requirements.minStreak} days`}
                />
              )}
            </div>
          )}
        </div>

        {/* Next Tier Preview */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{nextTierInfo.icon}</span>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">{nextTierInfo.name}</p>
              <p className="text-xs text-muted-foreground">
                {nextTierInfo.description}
              </p>
              {nextTierInfo.benefits.maxReviewPrice && (
                <p className="text-xs font-medium text-accent-blue">
                  Unlock reviews up to $
                  {nextTierInfo.benefits.maxReviewPrice}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface RequirementItemProps {
  met: boolean;
  label: string;
  current: string;
  required: string;
}

const RequirementItem: React.FC<RequirementItemProps> = ({
  met,
  label,
  current,
  required,
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md p-2 text-xs transition-colors',
        met
          ? 'bg-green-50 text-green-900'
          : 'bg-amber-50 text-amber-900'
      )}
    >
      {met ? (
        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
      )}
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground">
          {current} / {required} required
        </p>
      </div>
    </div>
  );
};
