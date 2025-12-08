/**
 * Tier System Types
 *
 * Defines the reputation/tier system data structures for Critvue.
 * Users progress through 6 tiers by earning Sparks through quality reviews.
 */

export enum UserTier {
  NEWCOMER = 'newcomer',
  SUPPORTER = 'supporter',
  GUIDE = 'guide',
  MENTOR = 'mentor',
  CURATOR = 'curator',
  VISIONARY = 'visionary',
}

export enum VisionaryTierType {
  CERTIFIED = 'CERTIFIED', // Achieved via expert application approval
  COMMUNITY = 'COMMUNITY', // Achieved via platform progression
}

// Backward compatibility
export const MasterTierType = VisionaryTierType;

export interface TierRequirements {
  minSparks: number;
  maxSparks: number | null; // null for top tier (unlimited)
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
  sparksBonus: number; // percentage bonus on sparks earned
}

export interface TierInfo {
  tier: UserTier;
  name: string;
  icon: string; // emoji or icon identifier
  badgeImage: string; // path to badge image
  badgeImageCertified?: string; // alternate badge for Visionary Certified
  description: string;
  requirements: TierRequirements;
  benefits: TierBenefits;
  color: string; // hex color for visual representation
}

export interface UserTierStatus {
  currentTier: UserTier;
  masterType?: VisionaryTierType; // only set if tier is VISIONARY
  sparks: number;
  totalReviews: number;
  acceptanceRate: number; // percentage (0-100)
  helpfulRating: number; // average rating (0-5)
  currentStreak: number;
  longestStreak: number;
  nextTier?: UserTier; // undefined if already at max tier
  sparksToNextTier?: number; // undefined if already at max tier
}

export enum SparksAction {
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

// Backward compatibility
export const KarmaAction = SparksAction;

export interface SparksTransaction {
  id: string;
  userId: string;
  action: SparksAction;
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

// Backward compatibility
export type KarmaTransaction = SparksTransaction;

export interface TierProgressData {
  currentProgress: number; // 0-100 percentage
  sparksInCurrentTier: number; // sparks earned in current tier range
  sparksNeededForNext: number; // sparks still needed
  requirementsMet: {
    sparks: boolean;
    reviews: boolean;
    acceptanceRate: boolean;
    helpfulRating: boolean;
    streak?: boolean;
  };
}

// Tier configuration constants
export const TIER_CONFIG: Record<UserTier, TierInfo> = {
  [UserTier.NEWCOMER]: {
    tier: UserTier.NEWCOMER,
    name: 'Newcomer',
    icon: '🌱',
    badgeImage: '/badges/newcomer.png',
    description: 'Fresh eyes bringing new perspectives to the community',
    requirements: {
      minSparks: 0,
      maxSparks: 99,
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
      sparksBonus: 0,
    },
    color: '#4ADE80', // green
  },
  [UserTier.SUPPORTER]: {
    tier: UserTier.SUPPORTER,
    name: 'Supporter',
    icon: '💫',
    badgeImage: '/badges/supporter.png',
    description: 'Active community member building connections',
    requirements: {
      minSparks: 100,
      maxSparks: 499,
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
      sparksBonus: 5,
    },
    color: '#3B82F6', // blue
  },
  [UserTier.GUIDE]: {
    tier: UserTier.GUIDE,
    name: 'Guide',
    icon: '⭐',
    badgeImage: '/badges/guide.png',
    description: 'Trusted voice known for thoughtful feedback',
    requirements: {
      minSparks: 500,
      maxSparks: 1499,
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
      sparksBonus: 10,
    },
    color: '#F59E0B', // amber
  },
  [UserTier.MENTOR]: {
    tier: UserTier.MENTOR,
    name: 'Mentor',
    icon: '💎',
    badgeImage: '/badges/mentor.png',
    description: 'Experienced voice - unlock paid review opportunities',
    requirements: {
      minSparks: 1500,
      maxSparks: 4999,
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
      sparksBonus: 15,
    },
    color: '#8B5CF6', // purple
  },
  [UserTier.CURATOR]: {
    tier: UserTier.CURATOR,
    name: 'Curator',
    icon: '👑',
    badgeImage: '/badges/curator.png',
    description: 'Recognized tastemaker with proven expertise',
    requirements: {
      minSparks: 5000,
      maxSparks: 14999,
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
      sparksBonus: 20,
    },
    color: '#EC4899', // pink
  },
  [UserTier.VISIONARY]: {
    tier: UserTier.VISIONARY,
    name: 'Visionary',
    icon: '🏆',
    badgeImage: '/badges/visionary.png',
    badgeImageCertified: '/badges/visionary-certified.png',
    description: 'Creative community leader shaping the platform',
    requirements: {
      minSparks: 15000,
      maxSparks: null,
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
      sparksBonus: 25,
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
 * Get tier by sparks amount
 */
export function getTierBySparks(sparks: number): UserTier {
  if (sparks >= 15000) return UserTier.VISIONARY;
  if (sparks >= 5000) return UserTier.CURATOR;
  if (sparks >= 1500) return UserTier.MENTOR;
  if (sparks >= 500) return UserTier.GUIDE;
  if (sparks >= 100) return UserTier.SUPPORTER;
  return UserTier.NEWCOMER;
}

// Backward compatibility
export const getTierByKarma = getTierBySparks;

/**
 * Get next tier for a given tier
 */
export function getNextTier(tier: UserTier): UserTier | null {
  const tierOrder = [
    UserTier.NEWCOMER,
    UserTier.SUPPORTER,
    UserTier.GUIDE,
    UserTier.MENTOR,
    UserTier.CURATOR,
    UserTier.VISIONARY,
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
      sparksInCurrentTier: status.sparks - currentTierInfo.requirements.minSparks,
      sparksNeededForNext: 0,
      requirementsMet: {
        sparks: true,
        reviews: true,
        acceptanceRate: true,
        helpfulRating: true,
        streak: true,
      },
    };
  }

  const nextTierInfo = getTierInfo(nextTier);
  const sparksInCurrentTier = status.sparks - currentTierInfo.requirements.minSparks;
  const sparksRangeSize = nextTierInfo.requirements.minSparks - currentTierInfo.requirements.minSparks;
  const currentProgress = Math.min(100, (sparksInCurrentTier / sparksRangeSize) * 100);
  const sparksNeededForNext = Math.max(0, nextTierInfo.requirements.minSparks - status.sparks);

  const requirementsMet = {
    sparks: status.sparks >= nextTierInfo.requirements.minSparks,
    reviews: status.totalReviews >= nextTierInfo.requirements.minReviews,
    acceptanceRate: status.acceptanceRate >= nextTierInfo.requirements.minAcceptanceRate,
    helpfulRating: status.helpfulRating >= nextTierInfo.requirements.minHelpfulRating,
    streak: nextTierInfo.requirements.minStreak
      ? status.currentStreak >= nextTierInfo.requirements.minStreak
      : true,
  };

  return {
    currentProgress,
    sparksInCurrentTier,
    sparksNeededForNext,
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
