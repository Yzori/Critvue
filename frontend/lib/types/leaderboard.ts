/**
 * Leaderboard Types
 *
 * Type definitions for the modern leaderboard redesign.
 * Consolidates 5 stat categories into 3, adds seasonal theming,
 * and social discovery features.
 */

import type { UserTier } from './tier';
import type { Badge } from '@/lib/api/gamification/karma';

// ============================================
// STAT CATEGORIES (Simplified from 5 to 3)
// ============================================

/**
 * Consolidated stat categories
 * - OVERALL: Primary ranking (karma-based)
 * - QUALITY: Acceptance rate + helpful rating weighted average
 * - ACTIVITY: Streak + review count combined score
 */
export enum LeaderboardCategory {
  OVERALL = 'overall',
  QUALITY = 'quality',
  ACTIVITY = 'activity',
}

/**
 * Time period filters
 */
export enum LeaderboardPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all_time',
}

/**
 * Rank change direction
 */
export enum RankChange {
  UP = 'up',
  DOWN = 'down',
  SAME = 'same',
  NEW = 'new',
}

// ============================================
// LEADERBOARD ENTRIES
// ============================================

/**
 * Enhanced leaderboard entry with badges and discovery features
 */
export interface LeaderboardUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  tier: UserTier;

  // Ranking
  rank: number;
  previousRank?: number;
  rankChange: number;
  rankDirection: RankChange;

  // Primary score for current category
  score: number;
  scoreLabel: string; // e.g., "2,450 karma", "94%", "45 streak"

  // Stats breakdown
  stats: {
    karma: number;
    reviews: number;
    acceptanceRate: number; // 0-100
    helpfulRating: number; // 0-5
    streak: number;
    avgResponseTime?: number; // hours
  };

  // Social/Profile
  featuredBadges?: Badge[];
  skills?: string[];
  dnaScore?: number; // Overall reviewer quality score 0-100

  // Metadata
  isCurrentUser?: boolean;
  joinedAt?: string;
}

/**
 * Leaderboard response
 */
export interface LeaderboardData {
  entries: LeaderboardUser[];
  currentUser?: LeaderboardUser;
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  category: LeaderboardCategory;
  period: LeaderboardPeriod;
  lastUpdated: string;
}

// ============================================
// SEASON & THEMING
// ============================================

/**
 * Season types
 */
export type SeasonType = 'weekly' | 'monthly' | 'quarterly';

/**
 * Theme identifiers
 */
export type SeasonThemeId = 'spring' | 'summer' | 'fall' | 'winter' | 'special';

/**
 * Season theme configuration
 */
export interface SeasonTheme {
  id: SeasonThemeId;
  name: string;
  tagline: string;
  primaryGradient: string; // Tailwind gradient classes
  accentColor: string; // Hex color
  bgPattern?: string; // Optional CSS pattern
  particleEffect?: 'confetti' | 'snow' | 'leaves' | 'sparkles' | 'none';
  iconName?: string; // Lucide icon name
}

/**
 * Season information
 */
export interface Season {
  id: number;
  name: string;
  type: SeasonType;
  startDate: string;
  endDate: string;
  isActive: boolean;
  theme: SeasonTheme;
  prizes?: SeasonPrize[];
}

/**
 * Season prize tiers
 */
export interface SeasonPrize {
  rank: number | string; // 1, 2, 3 or "top10", "top10%"
  label: string;
  karmaReward: number;
  badgeCode?: string;
  description?: string;
}

// ============================================
// DISCOVERY
// ============================================

/**
 * Discovery section types
 */
export type DiscoverySectionType =
  | 'rising_stars'
  | 'skill_specialists'
  | 'quick_responders'
  | 'recommended'
  | 'newcomers';

/**
 * Discovery section
 */
export interface DiscoverySection {
  type: DiscoverySectionType;
  title: string;
  subtitle?: string;
  users: DiscoveryUser[];
  skill?: string; // For skill_specialists
}

/**
 * Compact user for discovery cards
 */
export interface DiscoveryUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  tier: UserTier;

  // Context-specific highlight
  highlight: {
    label: string;
    value: string | number;
    icon?: string; // Lucide icon name
  };

  // Quick stats
  reviews: number;
  rating: number;
  skills?: string[];
  featuredBadge?: Badge;
}

// ============================================
// USER PROFILE PREVIEW
// ============================================

/**
 * Mini profile for hover preview
 */
export interface UserProfilePreview {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  tier: UserTier;
  bio?: string;

  // DNA scores (radar chart data)
  dna: {
    speed: number; // 0-100
    depth: number; // 0-100
    quality: number; // 0-100
    communication: number; // 0-100
    expertise: number; // 0-100
  };

  // Stats
  stats: {
    reviews: number;
    rating: number;
    responseTime: string; // "~2 hours"
    memberSince: string; // "Jan 2024"
  };

  // Badges & Skills
  featuredBadges: Badge[];
  topSkills: string[];
}

// ============================================
// THEME PRESETS
// ============================================

export const SEASON_THEMES: Record<SeasonThemeId, SeasonTheme> = {
  winter: {
    id: 'winter',
    name: 'Winter Championship',
    tagline: 'The season of persistence',
    primaryGradient: 'from-blue-600 via-indigo-600 to-purple-700',
    accentColor: '#818CF8',
    particleEffect: 'snow',
    iconName: 'Snowflake',
  },
  spring: {
    id: 'spring',
    name: 'Spring Renewal',
    tagline: 'Fresh starts, new heights',
    primaryGradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    accentColor: '#14B8A6',
    particleEffect: 'leaves',
    iconName: 'Flower2',
  },
  summer: {
    id: 'summer',
    name: 'Summer Surge',
    tagline: 'Heat up the competition',
    primaryGradient: 'from-orange-500 via-amber-500 to-yellow-500',
    accentColor: '#F59E0B',
    particleEffect: 'sparkles',
    iconName: 'Sun',
  },
  fall: {
    id: 'fall',
    name: 'Fall Harvest',
    tagline: 'Reap what you review',
    primaryGradient: 'from-orange-600 via-red-600 to-rose-700',
    accentColor: '#EA580C',
    particleEffect: 'leaves',
    iconName: 'Leaf',
  },
  special: {
    id: 'special',
    name: 'Special Event',
    tagline: 'Limited time competition',
    primaryGradient: 'from-violet-600 via-purple-600 to-fuchsia-600',
    accentColor: '#A855F7',
    particleEffect: 'confetti',
    iconName: 'Sparkles',
  },
};

// ============================================
// CATEGORY CONFIGURATION
// ============================================

export interface CategoryConfig {
  id: LeaderboardCategory;
  label: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color
  formatValue: (user: LeaderboardUser) => string;
}

export const CATEGORY_CONFIG: Record<LeaderboardCategory, CategoryConfig> = {
  [LeaderboardCategory.OVERALL]: {
    id: LeaderboardCategory.OVERALL,
    label: 'Overall',
    description: 'Combined score based on sparks and reputation',
    icon: 'Trophy',
    color: 'amber',
    formatValue: (u) => `${u.stats.karma.toLocaleString()} sparks`,
  },
  [LeaderboardCategory.QUALITY]: {
    id: LeaderboardCategory.QUALITY,
    label: 'Quality',
    description: 'Based on acceptance rate and helpful ratings',
    icon: 'Star',
    color: 'blue',
    formatValue: (u) => {
      const quality = Math.round((u.stats.acceptanceRate + u.stats.helpfulRating * 20) / 2);
      return `${quality}% quality`;
    },
  },
  [LeaderboardCategory.ACTIVITY]: {
    id: LeaderboardCategory.ACTIVITY,
    label: 'Activity',
    description: 'Based on review count and streaks',
    icon: 'Flame',
    color: 'orange',
    formatValue: (u) => `${u.stats.reviews} reviews`,
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get current season theme based on date
 */
export function getCurrentSeasonTheme(): SeasonTheme {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return SEASON_THEMES.spring;
  if (month >= 5 && month <= 7) return SEASON_THEMES.summer;
  if (month >= 8 && month <= 10) return SEASON_THEMES.fall;
  return SEASON_THEMES.winter;
}

/**
 * Format rank with suffix (1st, 2nd, 3rd, etc.)
 */
export function formatRank(rank: number): string {
  const j = rank % 10;
  const k = rank % 100;
  if (j === 1 && k !== 11) return `${rank}st`;
  if (j === 2 && k !== 12) return `${rank}nd`;
  if (j === 3 && k !== 13) return `${rank}rd`;
  return `${rank}th`;
}

/**
 * Calculate time remaining in season
 */
export function getTimeRemaining(endDate: string): {
  days: number;
  hours: number;
  minutes: number;
  label: string;
} {
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const diff = Math.max(0, end - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let label = '';
  if (days > 0) label = `${days}d ${hours}h left`;
  else if (hours > 0) label = `${hours}h ${minutes}m left`;
  else label = `${minutes}m left`;

  return { days, hours, minutes, label };
}
