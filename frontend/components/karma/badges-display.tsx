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
} from 'lucide-react';
import {
  type Badge,
  type BadgeRarity,
  getBadgeRarityColor,
  getBadgeCategoryIcon,
} from '@/lib/api/karma';

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
  const categoryIcon = getBadgeCategoryIcon(badge.category);

  const handleToggleFeatured = async () => {
    if (!onToggleFeatured) return;
    setIsToggling(true);
    try {
      // Need to extract badge ID from badge_code or have it passed
      // For now, we'll assume the API can handle it
      await onToggleFeatured(parseInt(badge.badge_code.split('_').pop() || '0'));
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          'relative rounded-lg border p-4 transition-all hover:shadow-md',
          earned
            ? 'bg-white'
            : 'bg-muted/30 opacity-75'
        )}
      >
        {/* Rarity indicator */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
          style={{ backgroundColor: rarityColor }}
        />

        {/* Featured indicator */}
        {earned && badge.is_featured && (
          <div className="absolute top-2 right-2">
            <BadgeUI variant="secondary" className="text-xs">
              Featured
            </BadgeUI>
          </div>
        )}

        {/* Badge content */}
        <div className="text-center">
          {/* Icon/Image */}
          <div
            className={cn(
              'mx-auto mb-3 h-14 w-14 rounded-full flex items-center justify-center text-2xl',
              earned ? 'bg-gradient-to-br from-white to-gray-100 shadow-sm' : 'bg-muted'
            )}
            style={{
              borderWidth: 2,
              borderStyle: 'solid',
              borderColor: earned ? rarityColor : 'transparent',
            }}
          >
            {badge.icon_url ? (
              <img src={badge.icon_url} alt={badge.badge_name} className="h-8 w-8" />
            ) : (
              <span>{categoryIcon}</span>
            )}
          </div>

          {/* Name */}
          <h4 className="font-semibold text-sm">{badge.badge_name}</h4>

          {/* Category & Rarity */}
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground capitalize">
              {badge.category}
            </span>
            <Tooltip>
              <TooltipTrigger>
                <BadgeUI
                  variant="secondary"
                  className="text-xs capitalize"
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

          {/* Earned date or progress */}
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
              {/* Rewards */}
              {(badge.karma_reward || badge.xp_reward) && (
                <p className="text-xs text-green-600">
                  +{badge.karma_reward || 0} karma, +{badge.xp_reward || 0} XP
                </p>
              )}
              {/* Toggle featured */}
              {onToggleFeatured && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
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
                      Feature on Profile
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            badge.progress && (
              <div className="mt-3 space-y-2">
                <Progress
                  value={badge.progress.percentage}
                  size="sm"
                  className="h-1.5"
                />
                <p className="text-xs text-muted-foreground">
                  {badge.progress.current} / {badge.progress.required}
                </p>
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
