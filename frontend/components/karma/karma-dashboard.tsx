'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Zap,
  Shield,
  Target,
  TrendingUp,
  Flame,
  Award,
  AlertTriangle,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  type KarmaSummary,
  type KarmaBreakdown,
  formatXP,
  getReputationLevel,
  getWeeklyGoalProgress,
} from '@/lib/api/karma';

/**
 * KarmaDashboard Component
 *
 * Comprehensive dashboard showing the modern karma system metrics:
 * - XP (permanent) and Reputation (variable) split
 * - Weekly goals progress
 * - Streak shields
 * - Warnings (if any)
 */

export interface KarmaDashboardProps {
  summary?: KarmaSummary;
  breakdown?: KarmaBreakdown;
  isLoading?: boolean;
  onViewDetails?: () => void;
  onViewBadges?: () => void;
  onViewLeaderboard?: () => void;
  className?: string;
}

export const KarmaDashboard: React.FC<KarmaDashboardProps> = ({
  summary,
  breakdown,
  isLoading = false,
  onViewDetails,
  onViewBadges,
  onViewLeaderboard,
  className,
}) => {
  if (isLoading) {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded mb-2" />
              <div className="h-2 w-full bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const reputationLevel = getReputationLevel(summary.reputation_score);
  const weeklyProgress = getWeeklyGoalProgress(summary.weekly_reviews, summary.weekly_goal);

  return (
    <TooltipProvider>
      <div className={cn('space-y-4', className)}>
        {/* Main Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* XP Card */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Zap className="h-4 w-4 text-blue-500" />
                Experience Points
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      XP is permanent and never decreases. Earn XP by completing reviews and achievements.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatXP(summary.total_xp)}</div>
              <p className="text-xs text-muted-foreground">
                Total XP (never decreases)
              </p>
            </CardContent>
          </Card>

          {/* Reputation Card */}
          <Card className="relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                background: `linear-gradient(to br, ${reputationLevel.color}, transparent)`,
              }}
            />
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4" style={{ color: reputationLevel.color }} />
                Reputation
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Reputation reflects your recent activity. Stay active to maintain it!
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{summary.reputation_score}</span>
                <Badge
                  variant="secondary"
                  className="text-xs"
                  style={{ borderColor: reputationLevel.color, color: reputationLevel.color }}
                >
                  {reputationLevel.label}
                </Badge>
              </div>
              {breakdown?.percentile !== undefined && (
                <p className="text-xs text-muted-foreground">
                  Top {100 - breakdown.percentile}% of reviewers
                </p>
              )}
            </CardContent>
          </Card>

          {/* Sparks Card */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Award className="h-4 w-4 text-purple-500" />
                Total Sparks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.total_karma.toLocaleString()}
              </div>
              {breakdown && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-green-600">
                    +{breakdown.positive_karma_earned}
                  </span>
                  <span className="text-red-500">
                    -{Math.abs(breakdown.negative_karma_incurred)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Streak Card */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent" />
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Flame className="h-4 w-4 text-orange-500" />
                Current Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{summary.current_streak}</span>
                <span className="text-sm text-muted-foreground">days</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Best: {summary.longest_streak} days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Second Row: Weekly Goals & Streak Shields */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Weekly Goals */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Target className="h-4 w-4 text-accent-blue" />
                  Weekly Goal
                </CardTitle>
                {summary.weekly_goal_streak > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {summary.weekly_goal_streak} week streak
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                Complete {summary.weekly_goal} reviews this week
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {summary.weekly_reviews} / {summary.weekly_goal} reviews
                </span>
                <span className="font-medium">{weeklyProgress}%</span>
              </div>
              <Progress
                value={weeklyProgress}
                variant={weeklyProgress >= 100 ? 'success' : 'default'}
                size="lg"
              />
              {weeklyProgress >= 100 ? (
                <p className="text-xs text-green-600 font-medium">
                  Goal completed! Keep going for bonus XP.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {summary.weekly_goal - summary.weekly_reviews} more to reach your goal
                </p>
              )}
            </CardContent>
          </Card>

          {/* Streak Shields */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4 text-cyan-500" />
                Streak Protection
              </CardTitle>
              <CardDescription className="text-xs">
                Shields protect your streak on missed days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center transition-all',
                        i < summary.streak_shields
                          ? 'bg-cyan-100 text-cyan-600'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      <Shield className="h-4 w-4" />
                    </div>
                  ))}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {summary.streak_shields} shield{summary.streak_shields !== 1 ? 's' : ''} available
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Earn shields by maintaining 7-day streaks
                  </p>
                </div>
              </div>
              <div className="mt-3 p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                <strong>Weekend Grace:</strong> Your streak won't break from Friday to Monday
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warnings Banner (if any) */}
        {breakdown && breakdown.warning_count > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">
                    You have {breakdown.warning_count} warning{breakdown.warning_count !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-amber-700">
                    Further violations will result in sparks penalties.
                    {breakdown.warnings_expire_at && (
                      <> Warnings expire after 30 days of good standing.</>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              View Sparks History
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
          {onViewBadges && (
            <Button variant="outline" size="sm" onClick={onViewBadges}>
              View Badges
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
          {onViewLeaderboard && (
            <Button variant="outline" size="sm" onClick={onViewLeaderboard}>
              View Leaderboard
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default KarmaDashboard;
