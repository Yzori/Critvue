/**
 * Tier System Types
 *
 * Defines the reputation/tier system data structures for Critvue.
 * Users progress through 6 tiers by earning karma through quality reviews.
 */

export enum UserTier {
  NOVICE = 'novice',
  CONTRIBUTOR = 'contributor',
  SKILLED = 'skilled',
  TRUSTED_ADVISOR = 'trusted_advisor',
  EXPERT = 'expert',
  MASTER = 'master',
}

export enum MasterTierType {
  CERTIFIED = 'CERTIFIED', // Achieved via expert application approval
  COMMUNITY = 'COMMUNITY', // Achieved via platform progression
}

export interface TierRequirements {
  minKarma: number;
  maxKarma: number | null; // null for top tier (unlimited)
  minReviews: number;
  minAcceptanceRate: number; // percentage (0-100)
  minHelpfulRating: number; // average rating (0-5)
  minStreak?: number; // optional streak requirement for higher tiers
}

export interface TierBenefits {
  maxReviewPrice: number | null; // null for unlimited
  prioritySupport: boolean;
  verifiedBadge: boolean;
  customProfile: boolean;
  earlyAccess: boolean;
  exclusiveReviews: boolean;
  karmaBonus: number; // percentage bonus on karma earned
}

export interface TierInfo {
  tier: UserTier;
  name: string;
  icon: string; // emoji or icon identifier
  description: string;
  requirements: TierRequirements;
  benefits: TierBenefits;
  color: string; // hex color for visual representation
}

export interface UserTierStatus {
  currentTier: UserTier;
  masterType?: MasterTierType; // only set if tier is MASTER
  karma: number;
  totalReviews: number;
  acceptanceRate: number; // percentage (0-100)
  helpfulRating: number; // average rating (0-5)
  currentStreak: number;
  longestStreak: number;
  nextTier?: UserTier; // undefined if already at max tier
  karmaToNextTier?: number; // undefined if already at max tier
}

export enum KarmaAction {
  // Positive actions
  REVIEW_SUBMITTED = 'REVIEW_SUBMITTED',
  REVIEW_ACCEPTED = 'REVIEW_ACCEPTED',
  REVIEW_HELPFUL = 'REVIEW_HELPFUL',
  REVIEW_VERY_HELPFUL = 'REVIEW_VERY_HELPFUL',
  STREAK_BONUS = 'STREAK_BONUS',
  MILESTONE_BONUS = 'MILESTONE_BONUS',
  REFERRAL_BONUS = 'REFERRAL_BONUS',

  // Negative actions
  REVIEW_REJECTED = 'REVIEW_REJECTED',
  REVIEW_REPORTED = 'REVIEW_REPORTED',
  STREAK_BROKEN = 'STREAK_BROKEN',
  VIOLATION = 'VIOLATION',

  // Neutral/System
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
  TIER_PROMOTION = 'TIER_PROMOTION',
}

export interface KarmaTransaction {
  id: string;
  userId: string;
  action: KarmaAction;
  points: number; // positive or negative
  reason: string; // human-readable explanation
  metadata?: {
    reviewId?: string;
    reportId?: string;
    streakDays?: number;
    oldTier?: UserTier;
    newTier?: UserTier;
    [key: string]: unknown;
  };
  createdAt: string; // ISO date string
}

export interface TierProgressData {
  currentProgress: number; // 0-100 percentage
  karmaInCurrentTier: number; // karma earned in current tier range
  karmaNeededForNext: number; // karma still needed
  requirementsMet: {
    karma: boolean;
    reviews: boolean;
    acceptanceRate: boolean;
    helpfulRating: boolean;
    streak?: boolean;
  };
}

// Tier configuration constants
export const TIER_CONFIG: Record<UserTier, TierInfo> = {
  [UserTier.NOVICE]: {
    tier: UserTier.NOVICE,
    name: 'Novice',
    icon: '🌱',
    description: 'Just getting started on your review journey',
    requirements: {
      minKarma: 0,
      maxKarma: 99,
      minReviews: 0,
      minAcceptanceRate: 0,
      minHelpfulRating: 0,
    },
    benefits: {
      maxReviewPrice: 50,
      prioritySupport: false,
      verifiedBadge: false,
      customProfile: false,
      earlyAccess: false,
      exclusiveReviews: false,
      karmaBonus: 0,
    },
    color: '#4ADE80', // green
  },
  [UserTier.CONTRIBUTOR]: {
    tier: UserTier.CONTRIBUTOR,
    name: 'Contributor',
    icon: '🔷',
    description: 'Building your reputation in the community',
    requirements: {
      minKarma: 100,
      maxKarma: 499,
      minReviews: 5,
      minAcceptanceRate: 70,
      minHelpfulRating: 3.5,
    },
    benefits: {
      maxReviewPrice: 100,
      prioritySupport: false,
      verifiedBadge: false,
      customProfile: false,
      earlyAccess: false,
      exclusiveReviews: false,
      karmaBonus: 5,
    },
    color: '#3B82F6', // blue
  },
  [UserTier.SKILLED]: {
    tier: UserTier.SKILLED,
    name: 'Skilled',
    icon: '⭐',
    description: 'Recognized for consistent quality reviews',
    requirements: {
      minKarma: 500,
      maxKarma: 1499,
      minReviews: 20,
      minAcceptanceRate: 75,
      minHelpfulRating: 4.0,
    },
    benefits: {
      maxReviewPrice: 250,
      prioritySupport: false,
      verifiedBadge: true,
      customProfile: true,
      earlyAccess: false,
      exclusiveReviews: false,
      karmaBonus: 10,
    },
    color: '#F59E0B', // amber
  },
  [UserTier.TRUSTED_ADVISOR]: {
    tier: UserTier.TRUSTED_ADVISOR,
    name: 'Trusted Advisor',
    icon: '💎',
    description: 'First earning tier - unlock paid review opportunities',
    requirements: {
      minKarma: 1500,
      maxKarma: 4999,
      minReviews: 50,
      minAcceptanceRate: 80,
      minHelpfulRating: 4.2,
      minStreak: 7,
    },
    benefits: {
      maxReviewPrice: 500,
      prioritySupport: true,
      verifiedBadge: true,
      customProfile: true,
      earlyAccess: true,
      exclusiveReviews: true,
      karmaBonus: 15,
    },
    color: '#8B5CF6', // purple
  },
  [UserTier.EXPERT]: {
    tier: UserTier.EXPERT,
    name: 'Expert',
    icon: '👑',
    description: 'Elite reviewer with proven expertise',
    requirements: {
      minKarma: 5000,
      maxKarma: 14999,
      minReviews: 100,
      minAcceptanceRate: 85,
      minHelpfulRating: 4.5,
      minStreak: 14,
    },
    benefits: {
      maxReviewPrice: 1000,
      prioritySupport: true,
      verifiedBadge: true,
      customProfile: true,
      earlyAccess: true,
      exclusiveReviews: true,
      karmaBonus: 20,
    },
    color: '#EC4899', // pink
  },
  [UserTier.MASTER]: {
    tier: UserTier.MASTER,
    name: 'Master',
    icon: '🏆',
    description: 'The pinnacle of reviewing excellence',
    requirements: {
      minKarma: 15000,
      maxKarma: null,
      minReviews: 200,
      minAcceptanceRate: 90,
      minHelpfulRating: 4.7,
      minStreak: 30,
    },
    benefits: {
      maxReviewPrice: null, // unlimited
      prioritySupport: true,
      verifiedBadge: true,
      customProfile: true,
      earlyAccess: true,
      exclusiveReviews: true,
      karmaBonus: 25,
    },
    color: '#DC2626', // red
  },
};

/**
 * Get tier information by tier enum
 */
export function getTierInfo(tier: UserTier): TierInfo {
  return TIER_CONFIG[tier];
}

/**
 * Get tier by karma amount
 */
export function getTierByKarma(karma: number): UserTier {
  if (karma >= 15000) return UserTier.MASTER;
  if (karma >= 5000) return UserTier.EXPERT;
  if (karma >= 1500) return UserTier.TRUSTED_ADVISOR;
  if (karma >= 500) return UserTier.SKILLED;
  if (karma >= 100) return UserTier.CONTRIBUTOR;
  return UserTier.NOVICE;
}

/**
 * Get next tier for a given tier
 */
export function getNextTier(tier: UserTier): UserTier | null {
  const tierOrder = [
    UserTier.NOVICE,
    UserTier.CONTRIBUTOR,
    UserTier.SKILLED,
    UserTier.TRUSTED_ADVISOR,
    UserTier.EXPERT,
    UserTier.MASTER,
  ];

  const currentIndex = tierOrder.indexOf(tier);
  if (currentIndex === -1 || currentIndex === tierOrder.length - 1) {
    return null;
  }

  return tierOrder[currentIndex + 1];
}

/**
 * Calculate progress to next tier
 */
export function calculateTierProgress(status: UserTierStatus): TierProgressData {
  const currentTierInfo = getTierInfo(status.currentTier);
  const nextTier = getNextTier(status.currentTier);

  if (!nextTier) {
    // Already at max tier
    return {
      currentProgress: 100,
      karmaInCurrentTier: status.karma - currentTierInfo.requirements.minKarma,
      karmaNeededForNext: 0,
      requirementsMet: {
        karma: true,
        reviews: true,
        acceptanceRate: true,
        helpfulRating: true,
        streak: true,
      },
    };
  }

  const nextTierInfo = getTierInfo(nextTier);
  const karmaInCurrentTier = status.karma - currentTierInfo.requirements.minKarma;
  const karmaRangeSize = nextTierInfo.requirements.minKarma - currentTierInfo.requirements.minKarma;
  const currentProgress = Math.min(100, (karmaInCurrentTier / karmaRangeSize) * 100);
  const karmaNeededForNext = Math.max(0, nextTierInfo.requirements.minKarma - status.karma);

  const requirementsMet = {
    karma: status.karma >= nextTierInfo.requirements.minKarma,
    reviews: status.totalReviews >= nextTierInfo.requirements.minReviews,
    acceptanceRate: status.acceptanceRate >= nextTierInfo.requirements.minAcceptanceRate,
    helpfulRating: status.helpfulRating >= nextTierInfo.requirements.minHelpfulRating,
    streak: nextTierInfo.requirements.minStreak
      ? status.currentStreak >= nextTierInfo.requirements.minStreak
      : true,
  };

  return {
    currentProgress,
    karmaInCurrentTier,
    karmaNeededForNext,
    requirementsMet,
  };
}

/**
 * Check if user can be promoted to next tier
 */
export function canPromoteToNextTier(status: UserTierStatus): boolean {
  const progress = calculateTierProgress(status);
  return Object.values(progress.requirementsMet).every(met => met);
}
