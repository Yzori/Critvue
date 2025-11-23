'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  UserTier,
  TIER_CONFIG,
  type TierInfo,
} from '@/lib/types/tier';
import { TierBadge } from '@/components/tier/tier-badge';
import {
  CheckCircle2,
  ArrowRight,
  Zap,
  Award,
  TrendingUp,
  Users,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Tier Information Marketing Page
 *
 * Comprehensive overview of the tier system explaining:
 * - How tiers work
 * - Requirements for each tier
 * - Benefits unlocked at each level
 * - Expert Application vs Organic Progression comparison
 */

const tierOrder: UserTier[] = [
  UserTier.NOVICE,
  UserTier.CONTRIBUTOR,
  UserTier.SKILLED,
  UserTier.TRUSTED_ADVISOR,
  UserTier.EXPERT,
  UserTier.MASTER,
];

export default function TiersPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-accent-blue/10 via-background to-accent-peach/10 py-20 px-4">
        <div className="container max-w-6xl mx-auto text-center">
          <Badge variant="primary" size="lg" className="mb-4">
            Tier System
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Progress Through Six Tiers of Excellence
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Build your reputation, unlock benefits, and earn rewards as you
            grow from Novice to Master
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent-blue text-white font-medium rounded-full hover:bg-accent-blue/90 transition-colors shadow-lg shadow-accent-blue/25"
            >
              Start Your Journey
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-foreground font-medium rounded-full hover:bg-gray-50 transition-colors border shadow-sm"
            >
              Browse Reviews
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Earn karma through quality reviews and progress through six tiers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8 text-accent-blue" />}
              title="Earn Karma"
              description="Submit quality reviews and earn karma points based on acceptance rates and helpful ratings"
            />
            <FeatureCard
              icon={<Award className="h-8 w-8 text-accent-peach" />}
              title="Unlock Tiers"
              description="Meet requirements to advance through six tiers, each with increasing benefits"
            />
            <FeatureCard
              icon={<Crown className="h-8 w-8 text-amber-500" />}
              title="Earn Rewards"
              description="Access higher-paying reviews, priority support, and exclusive opportunities"
            />
          </div>
        </div>
      </section>

      {/* Tier Ladder */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">The Tier Ladder</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore each tier and see what you can unlock
            </p>
          </div>

          <div className="space-y-6">
            {tierOrder.map((tier, index) => {
              const tierInfo = TIER_CONFIG[tier];
              return (
                <TierCard
                  key={tier}
                  tierInfo={tierInfo}
                  isFirst={index === 0}
                  isLast={index === tierOrder.length - 1}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison: Expert Application vs Organic */}
      <section className="py-16 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Two Paths to Master</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the path that works best for you
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Expert Application */}
            <Card className="border-2 border-accent-blue/20">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-full bg-accent-blue/10">
                    <Zap className="h-6 w-6 text-accent-blue" />
                  </div>
                  <CardTitle>Expert Application</CardTitle>
                </div>
                <Badge variant="primary" size="sm">
                  Fast Track
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Get verified as a certified expert and jump directly to Master
                  tier
                </p>

                <div className="space-y-2">
                  <BenefitItem text="Skip intermediate tiers" />
                  <BenefitItem text="Certified Master badge" />
                  <BenefitItem text="Immediate access to all benefits" />
                  <BenefitItem text="Requires portfolio verification" />
                </div>

                <Link
                  href="/apply"
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 bg-accent-blue text-white font-medium rounded-lg hover:bg-accent-blue/90 transition-colors"
                >
                  Apply Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>

            {/* Organic Progression */}
            <Card className="border-2 border-accent-peach/20">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-full bg-accent-peach/10">
                    <Users className="h-6 w-6 text-accent-peach" />
                  </div>
                  <CardTitle>Organic Progression</CardTitle>
                </div>
                <Badge
                  variant="secondary"
                  size="sm"
                >
                  Community Path
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Build your reputation organically through consistent quality
                  reviews
                </p>

                <div className="space-y-2">
                  <BenefitItem text="Earn karma through reviews" />
                  <BenefitItem text="Community Master badge" />
                  <BenefitItem text="Gradual benefit unlocks" />
                  <BenefitItem text="Build proven track record" />
                </div>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 bg-accent-peach text-white font-medium rounded-lg hover:bg-accent-peach/90 transition-colors"
                >
                  View Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Table */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Benefits at a Glance</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See what unlocks as you progress
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-semibold">Benefit</th>
                  {tierOrder.slice(0, 4).map((tier) => (
                    <th key={tier} className="p-4 text-center">
                      <TierBadge
                        tier={tier}
                        size="sm"
                        showTooltip={false}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <BenefitRow
                  label="Max Review Price"
                  values={tierOrder.slice(0, 4).map((tier) => {
                    const price = TIER_CONFIG[tier].benefits.maxReviewPrice;
                    return price ? `$${price}` : 'Unlimited';
                  })}
                />
                <BenefitRow
                  label="Karma Bonus"
                  values={tierOrder.slice(0, 4).map(
                    (tier) => `+${TIER_CONFIG[tier].benefits.karmaBonus}%`
                  )}
                />
                <BenefitRow
                  label="Verified Badge"
                  values={tierOrder.slice(0, 4).map((tier) =>
                    TIER_CONFIG[tier].benefits.verifiedBadge ? 'Yes' : 'No'
                  )}
                />
                <BenefitRow
                  label="Priority Support"
                  values={tierOrder.slice(0, 4).map((tier) =>
                    TIER_CONFIG[tier].benefits.prioritySupport ? 'Yes' : 'No'
                  )}
                />
                <BenefitRow
                  label="Exclusive Reviews"
                  values={tierOrder.slice(0, 4).map((tier) =>
                    TIER_CONFIG[tier].benefits.exclusiveReviews ? 'Yes' : 'No'
                  )}
                />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of reviewers building their reputation on Critvue
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent-blue text-white font-medium rounded-full hover:bg-accent-blue/90 transition-colors shadow-lg shadow-accent-blue/25 text-lg"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
}) => {
  return (
    <Card className="text-center">
      <CardContent className="pt-6">
        <div className="flex justify-center mb-4">{icon}</div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

interface TierCardProps {
  tierInfo: TierInfo;
  isFirst: boolean;
  isLast: boolean;
}

const TierCard: React.FC<TierCardProps> = ({ tierInfo, isFirst, isLast }) => {
  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-200 hover:shadow-lg',
        isLast && 'border-2 border-amber-200'
      )}
    >
      <div
        className="h-2"
        style={{ backgroundColor: tierInfo.color }}
      />
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Tier Badge & Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <TierBadge
                tier={tierInfo.tier}
                size="lg"
                showTooltip={false}
              />
              {isFirst && (
                <Badge variant="success" size="sm">
                  Starting Tier
                </Badge>
              )}
              {isLast && (
                <Badge
                  variant="warning"
                  size="sm"
                  icon={<Crown className="h-3 w-3" />}
                >
                  Elite
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {tierInfo.description}
            </p>

            {/* Requirements */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Requirements:
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-muted rounded">
                  {tierInfo.requirements.minKarma.toLocaleString()}
                  {tierInfo.requirements.maxKarma &&
                    `-${tierInfo.requirements.maxKarma.toLocaleString()}`}{' '}
                  karma
                </span>
                <span className="px-2 py-1 bg-muted rounded">
                  {tierInfo.requirements.minReviews}+ reviews
                </span>
                <span className="px-2 py-1 bg-muted rounded">
                  {tierInfo.requirements.minAcceptanceRate}% acceptance
                </span>
                <span className="px-2 py-1 bg-muted rounded">
                  {tierInfo.requirements.minHelpfulRating.toFixed(1)}+ rating
                </span>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="md:w-64 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Benefits:
            </p>
            {tierInfo.benefits.maxReviewPrice && (
              <div className="text-sm">
                Reviews up to{' '}
                <span className="font-bold text-accent-blue">
                  ${tierInfo.benefits.maxReviewPrice}
                </span>
              </div>
            )}
            {!tierInfo.benefits.maxReviewPrice && (
              <div className="text-sm font-bold text-accent-blue">
                Unlimited pricing
              </div>
            )}
            {tierInfo.benefits.karmaBonus > 0 && (
              <div className="text-sm">
                +{tierInfo.benefits.karmaBonus}% karma bonus
              </div>
            )}
            {tierInfo.benefits.exclusiveReviews && (
              <div className="text-sm">Exclusive review access</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface BenefitItemProps {
  text: string;
}

const BenefitItem: React.FC<BenefitItemProps> = ({ text }) => {
  return (
    <div className="flex items-center gap-2 text-sm">
      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
      <span>{text}</span>
    </div>
  );
};

interface BenefitRowProps {
  label: string;
  values: string[];
}

const BenefitRow: React.FC<BenefitRowProps> = ({ label, values }) => {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      <td className="p-4 font-medium">{label}</td>
      {values.map((value, index) => (
        <td key={index} className="p-4 text-center text-sm">
          {value}
        </td>
      ))}
    </tr>
  );
};
