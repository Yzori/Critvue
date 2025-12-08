'use client';

import * as React from 'react';
import {
  TierBadge,
  KarmaProgress,
  TierStatsCards,
  CompactTierCard,
  TierProgressCard,
  showTierUnlockNotification,
  showBenefitUnlockNotification,
  showSparksMilestoneNotification,
  showStreakNotification,
} from '@/components/tier';
import {
  TierLockedBadge,
  TierLockedButton,
  TierLockedOverlay,
  TierUpgradeMessage,
} from '@/components/tier/tier-locked-review';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  UserTier,
  MasterTierType,
  type UserTierStatus,
} from '@/lib/types/tier';

/**
 * Tier System Demo Page
 *
 * Showcases all tier-related components with example data.
 * For development and testing purposes.
 */

// Mock user data for demo
const MOCK_USER_STATUS: UserTierStatus = {
  currentTier: UserTier.CONTRIBUTOR,
  karma: 250,
  totalReviews: 12,
  acceptanceRate: 85.5,
  helpfulRating: 4.2,
  currentStreak: 5,
  longestStreak: 12,
  nextTier: UserTier.SKILLED,
  karmaToNextTier: 250,
};

const MOCK_SKILLED_STATUS: UserTierStatus = {
  currentTier: UserTier.SKILLED,
  karma: 850,
  totalReviews: 28,
  acceptanceRate: 88.2,
  helpfulRating: 4.5,
  currentStreak: 14,
  longestStreak: 14,
  nextTier: UserTier.TRUSTED_ADVISOR,
  karmaToNextTier: 650,
};

const MOCK_MASTER_STATUS: UserTierStatus = {
  currentTier: UserTier.MASTER,
  masterType: MasterTierType.COMMUNITY,
  karma: 18500,
  totalReviews: 225,
  acceptanceRate: 94.5,
  helpfulRating: 4.8,
  currentStreak: 45,
  longestStreak: 60,
};

export default function TierDemoPage() {
  const [selectedStatus, setSelectedStatus] = React.useState<UserTierStatus>(
    MOCK_USER_STATUS
  );

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Tier System Component Demo
        </h1>
        <p className="text-muted-foreground">
          Showcasing all tier-related UI components
        </p>
      </div>

      {/* User Status Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Demo User Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedStatus(MOCK_USER_STATUS)}
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
          >
            Contributor (250 sparks)
          </button>
          <button
            onClick={() => setSelectedStatus(MOCK_SKILLED_STATUS)}
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
          >
            Skilled (850 sparks)
          </button>
          <button
            onClick={() => setSelectedStatus(MOCK_MASTER_STATUS)}
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
          >
            Master (18,500 sparks)
          </button>
        </CardContent>
      </Card>

      {/* Tier Badges */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Tier Badges</h2>
          <p className="text-sm text-muted-foreground">
            Display user tiers with various sizes and configurations
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">All Tiers - Medium Size</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <TierBadge tier={UserTier.NOVICE} size="md" />
              <TierBadge tier={UserTier.CONTRIBUTOR} size="md" />
              <TierBadge tier={UserTier.SKILLED} size="md" />
              <TierBadge tier={UserTier.TRUSTED_ADVISOR} size="md" />
              <TierBadge tier={UserTier.EXPERT} size="md" />
              <TierBadge
                tier={UserTier.MASTER}
                masterType={MasterTierType.CERTIFIED}
                size="md"
              />
              <TierBadge
                tier={UserTier.MASTER}
                masterType={MasterTierType.COMMUNITY}
                size="md"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Size Variants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge variant="neutral" size="sm" className="mb-2">
                  Small
                </Badge>
                <TierBadge tier={selectedStatus.currentTier} size="sm" />
              </div>
              <div>
                <Badge variant="neutral" size="sm" className="mb-2">
                  Medium
                </Badge>
                <TierBadge tier={selectedStatus.currentTier} size="md" />
              </div>
              <div>
                <Badge variant="neutral" size="sm" className="mb-2">
                  Large
                </Badge>
                <TierBadge tier={selectedStatus.currentTier} size="lg" />
              </div>
              <div>
                <Badge variant="neutral" size="sm" className="mb-2">
                  Extra Large
                </Badge>
                <TierBadge tier={selectedStatus.currentTier} size="xl" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Dashboard Stats Cards */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Dashboard Stats Cards</h2>
          <p className="text-sm text-muted-foreground">
            Three-column cards for dashboard overview
          </p>
        </div>
        <TierStatsCards status={selectedStatus} weeklyKarma={45} />
      </section>

      {/* Sparks Progress Widget */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Sparks Progress Widget</h2>
          <p className="text-sm text-muted-foreground">
            Detailed progress with expandable requirements
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <KarmaProgress status={selectedStatus} />
          <div className="space-y-4">
            <CompactTierCard status={selectedStatus} />
            <TierProgressCard status={selectedStatus} />
          </div>
        </div>
      </section>

      {/* Tier Locked Components */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Tier Locked Components</h2>
          <p className="text-sm text-muted-foreground">
            UI elements for reviews requiring higher tiers
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Locked Badges & Buttons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Locked Badge
                </p>
                <TierLockedBadge
                  requiredTier={UserTier.EXPERT}
                  currentTier={selectedStatus.currentTier}
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Locked Button - Small
                </p>
                <TierLockedButton
                  requiredTier={UserTier.EXPERT}
                  currentTier={selectedStatus.currentTier}
                  size="sm"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Locked Button - Medium
                </p>
                <TierLockedButton
                  requiredTier={UserTier.EXPERT}
                  currentTier={selectedStatus.currentTier}
                  size="md"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Locked Button - Large
                </p>
                <TierLockedButton
                  requiredTier={UserTier.EXPERT}
                  currentTier={selectedStatus.currentTier}
                  size="lg"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Locked Review Card</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-64 rounded-lg border bg-muted/30">
                <TierLockedOverlay
                  requiredTier={UserTier.TRUSTED_ADVISOR}
                  reviewPrice={500}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <TierUpgradeMessage
          requiredTier={UserTier.EXPERT}
          currentTier={selectedStatus.currentTier}
        />
      </section>

      {/* Notifications Demo */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">
            Notification Components (Click to Trigger)
          </h2>
          <p className="text-sm text-muted-foreground">
            Toast notifications for tier unlocks and achievements
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() =>
              showTierUnlockNotification({
                oldTier: UserTier.CONTRIBUTOR,
                newTier: UserTier.SKILLED,
                karma: 500,
                unlockedBenefits: [
                  'Accept reviews up to $250',
                  'Verified reviewer badge',
                  'Custom profile customization',
                  '+10% sparks bonus on all reviews',
                ],
              })
            }
            className="px-6 py-3 bg-accent-blue text-white font-medium rounded-lg hover:bg-accent-blue/90 transition-colors"
          >
            Show Tier Unlock (Skilled)
          </button>

          <button
            onClick={() =>
              showBenefitUnlockNotification(
                'New unlock: You can now accept paid reviews up to $500'
              )
            }
            className="px-6 py-3 bg-accent-peach text-white font-medium rounded-lg hover:bg-accent-peach/90 transition-colors"
          >
            Show Benefit Unlock
          </button>

          <button
            onClick={() => showSparksMilestoneNotification(1000, 50)}
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Show Sparks Milestone
          </button>

          <button
            onClick={() => showStreakNotification(7, 25)}
            className="px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
          >
            Show Streak Notification
          </button>
        </div>
      </section>
    </div>
  );
}
