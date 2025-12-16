'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Award,
  Star,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Share2,
} from 'lucide-react';
import {
  type Badge,
  type BadgeRarity,
  getBadgeRarityColor,
} from '@/lib/api/gamification/karma';
import { BadgeIcon } from './badge-icon';

/**
 * BadgesDisplay Component
 *
 * Shows earned badges and available badges with progress tracking.
 * Allows users to feature badges on their profile.
 */

export interface BadgesDisplayProps {
  earnedBadges?: Badge[];
  availableBadges?: Badge[];
  isLoading?: boolean;
  onToggleFeatured?: (badgeId: number) => Promise<void>;
  className?: string;
}

export const BadgesDisplay: React.FC<BadgesDisplayProps> = ({
  earnedBadges = [],
  availableBadges = [],
  isLoading = false,
  onToggleFeatured,
  className,
}) => {
  const [activeTab, setActiveTab] = React.useState<'earned' | 'available'>('earned');

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg border p-4">
                <div className="h-12 w-12 rounded-full bg-muted mx-auto mb-3" />
                <div className="h-4 w-20 bg-muted rounded mx-auto mb-2" />
                <div className="h-3 w-28 bg-muted rounded mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-accent-peach" />
              Badges & Achievements
            </CardTitle>
            <CardDescription>
              {earnedBadges.length} earned, {availableBadges.length} available
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="earned" className="gap-2">
              <Star className="h-4 w-4" />
              Earned ({earnedBadges.length})
            </TabsTrigger>
            <TabsTrigger value="available" className="gap-2">
              <Lock className="h-4 w-4" />
              Available ({availableBadges.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earned">
            {earnedBadges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No badges earned yet</p>
                <p className="text-sm">Complete reviews to earn your first badge!</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {earnedBadges.map((badge) => (
                  <BadgeCard
                    key={badge.badge_code}
                    badge={badge}
                    earned
                    onToggleFeatured={onToggleFeatured}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="available">
            {availableBadges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>You've earned all available badges!</p>
                <p className="text-sm">Check back for new badges</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {availableBadges.map((badge) => (
                  <BadgeCard
                    key={badge.badge_code}
                    badge={badge}
                    earned={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

interface BadgeCardProps {
  badge: Badge;
  earned: boolean;
  onToggleFeatured?: (badgeId: number) => Promise<void>;
}

const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  earned,
  onToggleFeatured,
}) => {
  const [isToggling, setIsToggling] = React.useState(false);
  const rarityColor = getBadgeRarityColor(badge.rarity);

  const handleToggleFeatured = async () => {
    if (!onToggleFeatured || !badge.id) return;
    setIsToggling(true);
    try {
      await onToggleFeatured(badge.id);
    } finally {
      setIsToggling(false);
    }
  };

  const handleShare = async () => {
    const shareText = `I just earned the "${badge.badge_name}" badge on Critvue!`;
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${badge.badge_name} Badge`,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    }
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          'relative rounded-xl border p-4 transition-all duration-300',
          'hover:shadow-lg hover:-translate-y-0.5',
          earned
            ? 'bg-white border-gray-200'
            : 'bg-muted/30 border-gray-200/50'
        )}
      >
        {/* Rarity indicator stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
          style={{ backgroundColor: rarityColor }}
        />

        {/* Featured indicator */}
        {earned && badge.is_featured && (
          <div className="absolute top-2 right-2">
            <BadgeUI variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
              Featured
            </BadgeUI>
          </div>
        )}

        {/* Badge content */}
        <div className="text-center pt-1">
          {/* New BadgeIcon component */}
          <div className="mx-auto mb-3">
            <BadgeIcon
              badgeCode={badge.badge_code}
              rarity={badge.rarity}
              earned={earned}
              size="md"
              showGlow={earned}
            />
          </div>

          {/* Name */}
          <h4 className="font-semibold text-sm text-gray-900">{badge.badge_name}</h4>

          {/* Category & Rarity */}
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <span className="text-xs text-muted-foreground capitalize">
              {badge.category}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <BadgeUI
                  variant="secondary"
                  className="text-[10px] capitalize cursor-help px-1.5 py-0 border"
                  style={{ borderColor: rarityColor, color: rarityColor }}
                >
                  {badge.rarity}
                </BadgeUI>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getRarityDescription(badge.rarity)}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {badge.badge_description}
          </p>

          {/* Earned state */}
          {earned ? (
            <div className="mt-3 space-y-2">
              {badge.earned_at && (
                <p className="text-xs text-muted-foreground">
                  Earned {new Date(badge.earned_at).toLocaleDateString()}
                </p>
              )}
              {badge.level && badge.level > 1 && (
                <BadgeUI variant="secondary" className="text-xs">
                  Level {badge.level}
                </BadgeUI>
              )}
              {/* Rewards earned */}
              {(badge.karma_reward || badge.xp_reward) ? (
                <p className="text-xs text-green-600 font-medium">
                  +{badge.karma_reward || 0} karma, +{badge.xp_reward || 0} XP
                </p>
              ) : null}

              {/* Action buttons */}
              <div className="flex gap-1.5 pt-1">
                {onToggleFeatured && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={handleToggleFeatured}
                    disabled={isToggling}
                  >
                    {badge.is_featured ? (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Unfeature
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Feature
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleShare}
                  title="Share badge"
                >
                  <Share2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            /* Progress for unearned badges */
            badge.progress && (
              <div className="mt-3 space-y-2">
                <Progress
                  value={badge.progress.percentage}
                  className="h-1.5"
                />
                <p className="text-xs text-muted-foreground">
                  {badge.progress.current} / {badge.progress.required}
                </p>
                {/* Potential rewards */}
                {(badge.karma_reward || badge.xp_reward) ? (
                  <p className="text-xs text-muted-foreground">
                    Reward: +{badge.karma_reward || 0} karma, +{badge.xp_reward || 0} XP
                  </p>
                ) : null}
              </div>
            )
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

function getRarityDescription(rarity: BadgeRarity): string {
  const descriptions: Record<BadgeRarity, string> = {
    common: 'Easy to earn - a great starting point',
    uncommon: 'Requires moderate effort to unlock',
    rare: 'A significant achievement',
    epic: 'Exceptional accomplishment',
    legendary: 'Extremely rare - only for top performers',
  };
  return descriptions[rarity];
}

export default BadgesDisplay;
