'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TierBadge } from './tier-badge';
import {
  type UserTierStatus,
  calculateTierProgress,
  getTierInfo,
  getNextTier,
} from '@/lib/types/tier';
import {
  TrendingUp,
  Flame,
  Target,
  Award,
  Calendar,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Tier Stats Cards
 *
 * Dashboard cards displaying tier progress, weekly karma, and streaks.
 * Designed to be used in dashboard layouts with responsive grid.
 */

export interface TierStatsCardsProps {
  status: UserTierStatus;
  weeklyKarma?: number;
  className?: string;
}

export const TierStatsCards: React.FC<TierStatsCardsProps> = ({
  status,
  weeklyKarma = 0,
  className,
}) => {
  const progress = calculateTierProgress(status);
  const nextTier = getNextTier(status.currentTier);
  const nextTierInfo = nextTier ? getTierInfo(nextTier) : null;

  return (
    <div className={cn('grid gap-4 md:grid-cols-3', className)}>
      {/* Your Tier Card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Award className="h-4 w-4" />
            Your Tier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <TierBadge
              tier={status.currentTier}
              masterType={status.masterType}
              size="md"
              showTooltip={true}
            />
            <div className="text-right">
              <div className="text-2xl font-bold">
                {status.karma.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Karma</div>
            </div>
          </div>

          {nextTierInfo && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Next: {nextTierInfo.name}
                </span>
                <span className="font-medium">
                  {Math.round(progress.currentProgress)}%
                </span>
              </div>
              <Progress
                value={progress.currentProgress}
                variant="gradient"
                size="sm"
              />
              <p className="text-xs text-muted-foreground">
                {progress.karmaNeededForNext.toLocaleString()} karma to go
              </p>
            </div>
          )}

          {!nextTierInfo && (
            <div className="rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 p-3 text-center border border-amber-200">
              <p className="text-xs font-medium text-amber-900">
                Maximum tier reached!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* This Week Card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-accent-blue">
                +{weeklyKarma.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">karma</div>
            </div>

            <div className="flex items-center gap-1.5 text-sm">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">
                Keep up the great work!
              </span>
            </div>

            {/* Weekly Progress Indicator */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Weekly Goal</span>
                <span>{Math.min(100, (weeklyKarma / 100) * 100).toFixed(0)}%</span>
              </div>
              <Progress
                value={Math.min(100, (weeklyKarma / 100) * 100)}
                variant="success"
                size="sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {weeklyKarma >= 100
                  ? 'Goal achieved!'
                  : `${100 - weeklyKarma} karma to weekly goal`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streak Card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Flame className="h-4 w-4" />
            Review Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-orange-600">
                  {status.currentStreak}
                </div>
                <div className="text-sm text-muted-foreground">days</div>
              </div>
              <div className="text-4xl">🔥</div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Personal Best</span>
                <span className="font-medium">
                  {status.longestStreak} days
                </span>
              </div>

              {status.currentStreak < status.longestStreak && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Target className="h-3 w-3" />
                  <span>
                    {status.longestStreak - status.currentStreak} more days to beat
                    your record
                  </span>
                </div>
              )}

              {status.currentStreak === status.longestStreak &&
                status.currentStreak > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                    <Zap className="h-3 w-3" />
                    <span>New personal record!</span>
                  </div>
                )}
            </div>

            {/* Streak Milestone Progress */}
            {nextTierInfo?.requirements.minStreak && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1">
                  Next tier requires {nextTierInfo.requirements.minStreak} days
                </p>
                <Progress
                  value={Math.min(
                    100,
                    (status.currentStreak /
                      nextTierInfo.requirements.minStreak) *
                      100
                  )}
                  variant="warning"
                  size="sm"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Compact Tier Overview Card
 *
 * Single card showing tier and key stats - useful for sidebars or compact layouts
 */
export interface CompactTierCardProps {
  status: UserTierStatus;
  className?: string;
}

export const CompactTierCard: React.FC<CompactTierCardProps> = ({
  status,
  className,
}) => {
  const progress = calculateTierProgress(status);
  const nextTier = getNextTier(status.currentTier);

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="pt-6 space-y-4">
        {/* Tier Badge & Karma */}
        <div className="flex items-center justify-between">
          <TierBadge
            tier={status.currentTier}
            masterType={status.masterType}
            size="md"
          />
          <div className="text-right">
            <div className="text-xl font-bold">
              {status.karma.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Karma</div>
          </div>
        </div>

        {/* Progress to Next Tier */}
        {nextTier && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Next: {getTierInfo(nextTier).name}
              </span>
              <span className="font-medium">
                {Math.round(progress.currentProgress)}%
              </span>
            </div>
            <Progress
              value={progress.currentProgress}
              variant="gradient"
              size="sm"
            />
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t text-center">
          <div>
            <div className="text-sm font-semibold">
              {status.acceptanceRate.toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">Acceptance</div>
          </div>
          <div>
            <div className="text-sm font-semibold flex items-center justify-center gap-1">
              {status.currentStreak}
              <Flame className="h-3 w-3 text-orange-600" />
            </div>
            <div className="text-xs text-muted-foreground">Streak</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Tier Progress Card
 *
 * Focused card showing only tier progression - ideal for prominent dashboard placement
 */
export interface TierProgressCardProps {
  status: UserTierStatus;
  className?: string;
}

export const TierProgressCard: React.FC<TierProgressCardProps> = ({
  status,
  className,
}) => {
  const progress = calculateTierProgress(status);
  const nextTier = getNextTier(status.currentTier);
  const nextTierInfo = nextTier ? getTierInfo(nextTier) : null;

  if (!nextTierInfo) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-5 w-5" />
            Tier Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <TierBadge
              tier={status.currentTier}
              masterType={status.masterType}
              size="lg"
            />
            <div className="flex-1">
              <p className="font-medium">Maximum Tier Achieved!</p>
              <p className="text-sm text-muted-foreground">
                {status.karma.toLocaleString()} total karma
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Award className="h-5 w-5" />
          Tier Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current & Next Tier */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current</p>
            <TierBadge
              tier={status.currentTier}
              masterType={status.masterType}
              size="md"
            />
          </div>
          <div className="flex-1 px-4">
            <Progress
              value={progress.currentProgress}
              variant="gradient"
              size="md"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Next</p>
            <TierBadge
              tier={nextTier}
              size="md"
              showTooltip={false}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current Karma</span>
            <span className="font-semibold">
              {status.karma.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Karma Needed</span>
            <span className="font-semibold text-accent-blue">
              +{progress.karmaNeededForNext.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">
              {Math.round(progress.currentProgress)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
