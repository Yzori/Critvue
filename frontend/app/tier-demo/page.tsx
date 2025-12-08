'use client';

import * as React from 'react';
import { TieredAvatar, TieredAvatarSize } from '@/components/tier/tiered-avatar';
import { TierBadge } from '@/components/tier/tier-badge';
import { UserTier, TIER_CONFIG } from '@/lib/types/tier';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const tiers: UserTier[] = [
  UserTier.NEWCOMER,
  UserTier.SUPPORTER,
  UserTier.GUIDE,
  UserTier.MENTOR,
  UserTier.CURATOR,
  UserTier.VISIONARY,
];

const sizes: TieredAvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

const sampleUsers = [
  { name: 'Alex Chen', avatar: null },
  { name: 'Sarah Miller', avatar: null },
  { name: 'James Wilson', avatar: null },
  { name: 'Emily Davis', avatar: null },
  { name: 'Michael Brown', avatar: null },
  { name: 'Jessica Taylor', avatar: null },
];

export default function TierDemoPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Tier Avatar System</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Visual progression system showcasing user achievements through animated avatar borders.
            Each tier features unique effects that increase in complexity and visual impact.
          </p>
        </div>

        {/* All Tiers Overview */}
        <Card>
          <CardHeader>
            <CardTitle>All Tiers Overview</CardTitle>
            <CardDescription>
              Compare all 6 tiers side by side with their unique visual effects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
              {tiers.map((tier, index) => {
                const config = TIER_CONFIG[tier];
                return (
                  <div key={tier} className="flex flex-col items-center space-y-4">
                    <TieredAvatar
                      tier={tier}
                      fullName={sampleUsers[index].name}
                      avatarUrl={sampleUsers[index].avatar}
                      size="xl"
                    />
                    <div className="text-center space-y-1">
                      <TierBadge tier={tier} size="sm" />
                      <p className="text-xs text-muted-foreground">
                        {config.requirements.minSparks.toLocaleString()}+ Sparks
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tier Details */}
        <div className="grid gap-6">
          {tiers.map((tier, index) => {
            const config = TIER_CONFIG[tier];
            const effects = getEffectDescription(tier);

            return (
              <Card key={tier} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Avatar Preview */}
                  <div
                    className="flex items-center justify-center p-8 md:w-64"
                    style={{
                      background: `linear-gradient(135deg, ${config.color}10, ${config.color}05)`
                    }}
                  >
                    <TieredAvatar
                      tier={tier}
                      fullName={sampleUsers[index].name}
                      avatarUrl={sampleUsers[index].avatar}
                      size="2xl"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <TierBadge tier={tier} size="lg" />
                      <div>
                        <h3 className="text-xl font-semibold">{config.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {config.requirements.minSparks.toLocaleString()} - {getMaxSparks(tier)} Sparks
                        </p>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-4">{config.description}</p>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Visual Effects:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {effects.map((effect, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: config.color }}
                            />
                            {effect}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Size Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Size Variants</CardTitle>
            <CardDescription>
              Available sizes from extra-small (xs) to double extra-large (2xl)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[UserTier.NEWCOMER, UserTier.MENTOR, UserTier.VISIONARY].map((tier) => (
                <div key={tier} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TierBadge tier={tier} size="sm" />
                    <span className="text-sm text-muted-foreground">
                      {TIER_CONFIG[tier].name}
                    </span>
                  </div>
                  <div className="flex items-end gap-6 flex-wrap">
                    {sizes.map((size) => (
                      <div key={size} className="flex flex-col items-center gap-2">
                        <TieredAvatar
                          tier={tier}
                          fullName="Demo User"
                          size={size}
                        />
                        <span className="text-xs text-muted-foreground">{size}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* With and Without Effects */}
        <Card>
          <CardHeader>
            <CardTitle>Effects Toggle</CardTitle>
            <CardDescription>
              Compare avatars with tier effects enabled vs disabled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
              {tiers.map((tier, index) => (
                <div key={tier} className="space-y-6">
                  <div className="flex flex-col items-center gap-2">
                    <TieredAvatar
                      tier={tier}
                      fullName={sampleUsers[index].name}
                      size="lg"
                      showTierEffects={true}
                    />
                    <span className="text-xs text-muted-foreground">With Effects</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <TieredAvatar
                      tier={tier}
                      fullName={sampleUsers[index].name}
                      size="lg"
                      showTierEffects={false}
                    />
                    <span className="text-xs text-muted-foreground">No Effects</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dark Background Preview */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Dark Background Preview</CardTitle>
            <CardDescription className="text-slate-400">
              See how the glow effects stand out on dark backgrounds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
              {tiers.map((tier, index) => (
                <div key={tier} className="flex flex-col items-center space-y-3">
                  <TieredAvatar
                    tier={tier}
                    fullName={sampleUsers[index].name}
                    size="xl"
                  />
                  <span className="text-xs text-slate-400">
                    {TIER_CONFIG[tier].name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getEffectDescription(tier: UserTier): string[] {
  switch (tier) {
    case UserTier.NEWCOMER:
      return [
        'Clean, subtle border',
        'No glow effects',
        'Minimalist design for new users',
      ];
    case UserTier.SUPPORTER:
      return [
        'Solid blue ring',
        'Soft ambient glow (8px radius)',
        'Layered shadow for depth',
      ];
    case UserTier.GUIDE:
      return [
        'Emerald green ring',
        'Gentle pulsing glow animation',
        'Medium glow intensity (12px)',
      ];
    case UserTier.MENTOR:
      return [
        'Animated purple-gold rotating gradient',
        'Dual-color glow (amber + gold)',
        'Thicker ring (1.2x multiplier)',
        'Breathing scale animation',
        '6-second rotation cycle',
      ];
    case UserTier.CURATOR:
      return [
        'Multi-color conic gradient (pink-purple-blue)',
        'Outer evolving ring with blur effect',
        'Counter-rotating outer layer',
        'Inner highlight ring pulse',
        'Intense shimmer overlay',
        'Dual-layer glow (purple + pink)',
        'Thicker ring (1.3x multiplier)',
        'Breathing animation',
        '4-second rotation cycle',
      ];
    case UserTier.VISIONARY:
      return [
        'Full rainbow 9-color rotating border',
        'Triple-layer evolving border system',
        'Counter-rotating outer blur ring',
        'Secondary golden accent ring',
        'Inner highlight pulse',
        '12 radiating particles with trails',
        'Floating golden stars',
        'Maximum glow intensity (36px)',
        'Thickest ring (1.4x multiplier)',
        '3-second rotation cycle',
      ];
    default:
      return [];
  }
}

function getMaxSparks(tier: UserTier): string {
  const tierOrder = [
    UserTier.NEWCOMER,
    UserTier.SUPPORTER,
    UserTier.GUIDE,
    UserTier.MENTOR,
    UserTier.CURATOR,
    UserTier.VISIONARY,
  ];

  const currentIndex = tierOrder.indexOf(tier);
  if (currentIndex === tierOrder.length - 1) {
    return 'Unlimited';
  }

  const nextTier = tierOrder[currentIndex + 1];
  return (TIER_CONFIG[nextTier].requirements.minSparks - 1).toLocaleString();
}
