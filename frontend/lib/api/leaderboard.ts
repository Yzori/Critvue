/**
 * Leaderboard API Client
 *
 * Handles all leaderboard-related API calls including:
 * - Rankings by consolidated categories (Overall, Quality, Activity)
 * - Seasonal leaderboard data
 * - Social discovery features (Rising Stars, Skill Specialists, etc.)
 */

import apiClient from './client';
import { UserTier } from '@/lib/types/tier';
import {
  LeaderboardCategory,
  LeaderboardPeriod,
  RankChange,
  LeaderboardUser,
  LeaderboardData,
  Season,
  SeasonTheme,
  DiscoverySection,
  DiscoveryUser,
  UserProfilePreview,
  SEASON_THEMES,
  CATEGORY_CONFIG,
  getCurrentSeasonTheme,
} from '@/lib/types/leaderboard';
import type { Badge } from '@/lib/api/karma';

// Re-export types for convenience
export {
  LeaderboardCategory,
  LeaderboardPeriod,
  RankChange,
  type LeaderboardUser,
  type LeaderboardData,
  type Season,
  type DiscoverySection,
  type DiscoveryUser,
  type UserProfilePreview,
  SEASON_THEMES,
  CATEGORY_CONFIG,
  getCurrentSeasonTheme,
};

// ============================================
// LEGACY TYPES (for backward compatibility)
// ============================================

/** @deprecated Use LeaderboardCategory instead */
export enum LeaderboardStatType {
  KARMA = 'karma',
  ACCEPTANCE_RATE = 'acceptance_rate',
  STREAK = 'streak',
  REVIEWS = 'reviews',
  HELPFUL_RATING = 'helpful_rating',
}

/** @deprecated Use LeaderboardPeriod instead */
export enum LeaderboardTimePeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all_time',
}

/** @deprecated Use RankChange instead */
export enum RankChangeDirection {
  UP = 'up',
  DOWN = 'down',
  SAME = 'same',
  NEW = 'new',
}

// ============================================
// BACKEND RESPONSE TYPES
// ============================================

interface BackendLeaderboardEntry {
  user_id: number;
  username: string | null;  // SEO-friendly URL identifier
  full_name: string | null;
  avatar_url: string | null;
  user_tier: string;
  rank: number;
  rank_change: number | null;
  karma_points: number | null;
  acceptance_rate: number | null;
  current_streak: number | null;
  accepted_reviews_count: number | null;
  avg_rating: number | null;
  featured_badges?: Array<{
    badge_code: string;
    badge_name: string;
    rarity: string;
  }>;
  skills?: string[];
  dna_score?: number;
  joined_at?: string;
}

interface BackendLeaderboardResponse {
  entries: BackendLeaderboardEntry[];
  metadata: {
    total_entries: number;
    limit: number;
    offset: number;
    period: string;
    tier_filter: string | null;
  };
  current_user_position: {
    user_id: number;
    rank: number;
    total_users: number;
    percentile: number;
    stat_value: number;
  } | null;
}

interface BackendSeasonResponse {
  id: number;
  name: string;
  type: 'weekly' | 'monthly' | 'quarterly';
  start_date: string;
  end_date: string;
  is_active: boolean;
  theme_id: string;
  prizes?: Array<{
    rank: number | string;
    label: string;
    karma_reward: number;
    badge_code?: string;
    description?: string;
  }>;
}

interface BackendDiscoveryResponse {
  rising_stars: BackendLeaderboardEntry[];
  skill_specialists: Array<{
    skill: string;
    users: BackendLeaderboardEntry[];
  }>;
  quick_responders: BackendLeaderboardEntry[];
  newcomers: BackendLeaderboardEntry[];
}

interface BackendUserPreviewResponse {
  user_id: number;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  user_tier: string;
  bio: string | null;
  dna_scores: {
    speed: number;
    depth: number;
    quality: number;
    communication: number;
    expertise: number;
  };
  stats: {
    reviews: number;
    rating: number;
    response_time_hours: number;
    joined_at: string;
  };
  featured_badges: Array<{
    badge_code: string;
    badge_name: string;
    rarity: string;
  }>;
  top_skills: string[];
}

// ============================================
// QUERY PARAMS
// ============================================

export interface LeaderboardQueryParams {
  category?: LeaderboardCategory;
  period?: LeaderboardPeriod;
  tier?: UserTier;
  page?: number;
  pageSize?: number;
}

// ============================================
// TRANSFORMERS
// ============================================

/**
 * Map new category to legacy backend stat type
 */
function categoryToLegacyStatType(category: LeaderboardCategory): LeaderboardStatType {
  switch (category) {
    case LeaderboardCategory.OVERALL:
      return LeaderboardStatType.KARMA;
    case LeaderboardCategory.QUALITY:
      return LeaderboardStatType.ACCEPTANCE_RATE;
    case LeaderboardCategory.ACTIVITY:
      return LeaderboardStatType.REVIEWS;
    default:
      return LeaderboardStatType.KARMA;
  }
}

/**
 * Map legacy stat type to new category
 */
function legacyStatTypeToCategory(statType: LeaderboardStatType): LeaderboardCategory {
  switch (statType) {
    case LeaderboardStatType.KARMA:
      return LeaderboardCategory.OVERALL;
    case LeaderboardStatType.ACCEPTANCE_RATE:
    case LeaderboardStatType.HELPFUL_RATING:
      return LeaderboardCategory.QUALITY;
    case LeaderboardStatType.STREAK:
    case LeaderboardStatType.REVIEWS:
      return LeaderboardCategory.ACTIVITY;
    default:
      return LeaderboardCategory.OVERALL;
  }
}

/**
 * Map backend period to new enum
 */
function mapPeriod(period: string): LeaderboardPeriod {
  switch (period) {
    case 'weekly':
      return LeaderboardPeriod.WEEKLY;
    case 'monthly':
      return LeaderboardPeriod.MONTHLY;
    default:
      return LeaderboardPeriod.ALL_TIME;
  }
}

/**
 * Transform backend entry to new LeaderboardUser format
 */
function transformToLeaderboardUser(
  entry: BackendLeaderboardEntry,
  category: LeaderboardCategory
): LeaderboardUser {
  const rankDirection: RankChange =
    entry.rank_change === null ? RankChange.NEW :
    entry.rank_change > 0 ? RankChange.UP :
    entry.rank_change < 0 ? RankChange.DOWN :
    RankChange.SAME;

  // Calculate score based on category
  let score: number;
  let scoreLabel: string;

  switch (category) {
    case LeaderboardCategory.OVERALL:
      score = entry.karma_points || 0;
      scoreLabel = `${score.toLocaleString()} sparks`;
      break;
    case LeaderboardCategory.QUALITY:
      // Weighted average of acceptance rate and helpful rating
      const acceptance = entry.acceptance_rate || 0;
      const helpful = (entry.avg_rating || 0) * 20; // Convert 0-5 to 0-100
      score = Math.round((acceptance + helpful) / 2);
      scoreLabel = `${score}% quality`;
      break;
    case LeaderboardCategory.ACTIVITY:
      score = entry.accepted_reviews_count || 0;
      scoreLabel = `${score} reviews`;
      break;
    default:
      score = entry.karma_points || 0;
      scoreLabel = `${score.toLocaleString()} sparks`;
  }

  // Use actual username if set, otherwise fallback to generated slug or ID
  const username = entry.username || entry.user_id.toString();

  return {
    id: entry.user_id.toString(),
    username,
    displayName: entry.full_name || 'Anonymous',
    avatarUrl: entry.avatar_url || undefined,
    tier: entry.user_tier as UserTier,
    rank: entry.rank,
    previousRank: entry.rank_change !== null ? entry.rank - entry.rank_change : undefined,
    rankChange: Math.abs(entry.rank_change || 0),
    rankDirection,
    score,
    scoreLabel,
    stats: {
      karma: entry.karma_points || 0,
      reviews: entry.accepted_reviews_count || 0,
      acceptanceRate: entry.acceptance_rate || 0,
      helpfulRating: entry.avg_rating || 0,
      streak: entry.current_streak || 0,
    },
    featuredBadges: entry.featured_badges?.map(b => ({
      badge_code: b.badge_code,
      badge_name: b.badge_name,
      badge_description: '',
      category: 'achievement',
      rarity: b.rarity as Badge['rarity'],
    })),
    skills: entry.skills,
    dnaScore: entry.dna_score,
    joinedAt: entry.joined_at,
  };
}

/**
 * Transform backend entry to discovery user format
 */
function transformToDiscoveryUser(
  entry: BackendLeaderboardEntry,
  highlightType: 'rank_gain' | 'skill' | 'response_time' | 'new'
): DiscoveryUser {
  let highlight: DiscoveryUser['highlight'];

  switch (highlightType) {
    case 'rank_gain':
      highlight = {
        label: 'Rank Gain',
        value: `+${Math.abs(entry.rank_change || 0)}`,
        icon: 'TrendingUp',
      };
      break;
    case 'response_time':
      highlight = {
        label: 'Avg Response',
        value: '~2h', // Placeholder - backend would provide this
        icon: 'Clock',
      };
      break;
    case 'new':
      highlight = {
        label: 'New Member',
        value: 'This month',
        icon: 'Sparkles',
      };
      break;
    default:
      highlight = {
        label: 'Reviews',
        value: entry.accepted_reviews_count || 0,
        icon: 'Star',
      };
  }

  // Use actual username if set, otherwise fallback to ID
  const username = entry.username || entry.user_id.toString();

  return {
    id: entry.user_id.toString(),
    username,
    displayName: entry.full_name || 'Anonymous',
    avatarUrl: entry.avatar_url || undefined,
    tier: entry.user_tier as UserTier,
    highlight,
    reviews: entry.accepted_reviews_count || 0,
    rating: entry.avg_rating || 0,
    skills: entry.skills,
    featuredBadge: entry.featured_badges?.[0] ? {
      badge_code: entry.featured_badges[0].badge_code,
      badge_name: entry.featured_badges[0].badge_name,
      badge_description: '',
      category: 'achievement',
      rarity: entry.featured_badges[0].rarity as Badge['rarity'],
    } : undefined,
  };
}

// ============================================
// MAIN API FUNCTIONS
// ============================================

/**
 * Get leaderboard endpoint for category
 */
function getEndpointForCategory(category: LeaderboardCategory): string {
  switch (category) {
    case LeaderboardCategory.OVERALL:
      return '/leaderboard/karma';
    case LeaderboardCategory.QUALITY:
      return '/leaderboard/acceptance-rate';
    case LeaderboardCategory.ACTIVITY:
      return '/leaderboard/reviews';
    default:
      return '/leaderboard/karma';
  }
}

/**
 * Fetch leaderboard data with new consolidated categories
 */
export async function getLeaderboardData(
  params: LeaderboardQueryParams = {}
): Promise<LeaderboardData> {
  const {
    category = LeaderboardCategory.OVERALL,
    period = LeaderboardPeriod.ALL_TIME,
    tier,
    page = 1,
    pageSize = 50,
  } = params;

  const endpoint = getEndpointForCategory(category);
  const offset = (page - 1) * pageSize;

  const queryParams = new URLSearchParams({
    period: period,
    limit: pageSize.toString(),
    offset: offset.toString(),
  });

  if (tier && tier !== 'all') {
    queryParams.append('tier', tier);
  }

  const backendResponse = await apiClient.get<BackendLeaderboardResponse>(
    `${endpoint}?${queryParams.toString()}`
  );

  const entries = backendResponse.entries.map(entry =>
    transformToLeaderboardUser(entry, category)
  );

  // Find current user if in response
  let currentUser: LeaderboardUser | undefined;
  if (backendResponse.current_user_position) {
    const userEntry = entries.find(
      e => e.id === backendResponse.current_user_position?.user_id.toString()
    );
    if (userEntry) {
      currentUser = { ...userEntry, isCurrentUser: true };
    }
  }

  return {
    entries,
    currentUser,
    total: backendResponse.metadata.total_entries,
    page,
    pageSize,
    hasMore: entries.length === pageSize,
    category,
    period,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get current season information
 */
export async function getCurrentSeason(): Promise<Season> {
  try {
    const response = await apiClient.get<BackendSeasonResponse>('/leaderboard/season');

    return {
      id: response.id,
      name: response.name,
      type: response.type,
      startDate: response.start_date,
      endDate: response.end_date,
      isActive: response.is_active,
      theme: SEASON_THEMES[response.theme_id as keyof typeof SEASON_THEMES] || getCurrentSeasonTheme(),
      prizes: response.prizes?.map(p => ({
        rank: p.rank,
        label: p.label,
        karmaReward: p.karma_reward,
        badgeCode: p.badge_code,
        description: p.description,
      })),
    };
  } catch {
    // Fallback to generated season if endpoint doesn't exist yet
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    // Monthly seasons
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

    return {
      id: month + year * 12,
      name: `${getCurrentSeasonTheme().name}`,
      type: 'monthly',
      startDate: startOfMonth.toISOString(),
      endDate: endOfMonth.toISOString(),
      isActive: true,
      theme: getCurrentSeasonTheme(),
      prizes: [
        { rank: 1, label: '1st Place', karmaReward: 500, badgeCode: 'community_weekly_champion' },
        { rank: 2, label: '2nd Place', karmaReward: 300 },
        { rank: 3, label: '3rd Place', karmaReward: 200 },
        { rank: 'top10', label: 'Top 10', karmaReward: 100 },
      ],
    };
  }
}

/**
 * Get discovery sections for social features
 */
export async function getDiscoverySections(): Promise<DiscoverySection[]> {
  try {
    const response = await apiClient.get<BackendDiscoveryResponse>('/leaderboard/discover');

    const sections: DiscoverySection[] = [];

    if (response.rising_stars?.length) {
      sections.push({
        type: 'rising_stars',
        title: 'Rising Stars',
        subtitle: 'Biggest rank gains this week',
        users: response.rising_stars.map(u => transformToDiscoveryUser(u, 'rank_gain')),
      });
    }

    if (response.skill_specialists?.length) {
      for (const group of response.skill_specialists) {
        sections.push({
          type: 'skill_specialists',
          title: `${group.skill} Specialists`,
          subtitle: `Top reviewers for ${group.skill}`,
          skill: group.skill,
          users: group.users.map(u => transformToDiscoveryUser(u, 'skill')),
        });
      }
    }

    if (response.quick_responders?.length) {
      sections.push({
        type: 'quick_responders',
        title: 'Quick Responders',
        subtitle: 'Fastest average response time',
        users: response.quick_responders.map(u => transformToDiscoveryUser(u, 'response_time')),
      });
    }

    if (response.newcomers?.length) {
      sections.push({
        type: 'newcomers',
        title: 'Rising Newcomers',
        subtitle: 'New members making an impact',
        users: response.newcomers.map(u => transformToDiscoveryUser(u, 'new')),
      });
    }

    return sections;
  } catch {
    // Return empty sections if endpoint doesn't exist yet
    return [];
  }
}

/**
 * Get user profile preview for hover popover
 */
export async function getUserProfilePreview(userId: string): Promise<UserProfilePreview> {
  try {
    const response = await apiClient.get<BackendUserPreviewResponse>(
      `/users/${userId}/preview`
    );

    // Format response time
    const hours = response.stats.response_time_hours || 0;
    const responseTimeStr = hours < 1 ? '< 1 hour' :
      hours < 24 ? `~${Math.round(hours)} hours` :
      `~${Math.round(hours / 24)} days`;

    // Format member since
    const joinedDate = new Date(response.stats.joined_at);
    const memberSince = joinedDate.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });

    return {
      id: response.user_id.toString(),
      username: response.username,
      displayName: response.full_name || response.username,
      avatarUrl: response.avatar_url || undefined,
      tier: response.user_tier as UserTier,
      bio: response.bio || undefined,
      dna: response.dna_scores,
      stats: {
        reviews: response.stats.reviews,
        rating: response.stats.rating,
        responseTime: responseTimeStr,
        memberSince,
      },
      featuredBadges: response.featured_badges.map(b => ({
        badge_code: b.badge_code,
        badge_name: b.badge_name,
        badge_description: '',
        category: 'achievement',
        rarity: b.rarity as Badge['rarity'],
      })),
      topSkills: response.top_skills,
    };
  } catch {
    throw new Error('Failed to load user preview');
  }
}

// ============================================
// LEGACY API FUNCTIONS (for backward compatibility)
// ============================================

/** @deprecated Use LeaderboardUser type instead */
export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  tier: UserTier;
  rank: number;
  previousRank?: number;
  rankChange: number;
  rankChangeDirection: RankChangeDirection;
  primaryStat: number;
  karma: number;
  totalReviews: number;
  acceptanceRate: number;
  helpfulRating: number;
  currentStreak: number;
  isCurrentUser?: boolean;
  joinedAt: string;
}

/** @deprecated Use LeaderboardData type instead */
export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  currentUserEntry?: LeaderboardEntry;
  pagination: {
    page: number;
    pageSize: number;
    totalEntries: number;
    totalPages: number;
    hasMore: boolean;
  };
  filters: {
    statType: LeaderboardStatType;
    timePeriod: LeaderboardTimePeriod;
    tier?: UserTier;
  };
  lastUpdated: string;
}

/** @deprecated Use LeaderboardQueryParams instead */
export interface LegacyLeaderboardQueryParams {
  statType?: LeaderboardStatType;
  timePeriod?: LeaderboardTimePeriod;
  tier?: UserTier;
  page?: number;
  pageSize?: number;
}

/**
 * Transform new LeaderboardUser to legacy LeaderboardEntry
 */
function tolegacyEntry(user: LeaderboardUser, statType: LeaderboardStatType): LeaderboardEntry {
  let primaryStat: number;
  switch (statType) {
    case LeaderboardStatType.KARMA:
      primaryStat = user.stats.karma;
      break;
    case LeaderboardStatType.ACCEPTANCE_RATE:
      primaryStat = user.stats.acceptanceRate;
      break;
    case LeaderboardStatType.HELPFUL_RATING:
      primaryStat = user.stats.helpfulRating;
      break;
    case LeaderboardStatType.STREAK:
      primaryStat = user.stats.streak;
      break;
    case LeaderboardStatType.REVIEWS:
      primaryStat = user.stats.reviews;
      break;
    default:
      primaryStat = user.score;
  }

  return {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    tier: user.tier,
    rank: user.rank,
    previousRank: user.previousRank,
    rankChange: user.rankChange * (user.rankDirection === RankChange.DOWN ? -1 : 1),
    rankChangeDirection: user.rankDirection as unknown as RankChangeDirection,
    primaryStat,
    karma: user.stats.karma,
    totalReviews: user.stats.reviews,
    acceptanceRate: user.stats.acceptanceRate,
    helpfulRating: user.stats.helpfulRating,
    currentStreak: user.stats.streak,
    isCurrentUser: user.isCurrentUser,
    joinedAt: user.joinedAt || new Date().toISOString(),
  };
}

/**
 * @deprecated Use getLeaderboardData instead
 */
export async function getLeaderboard(
  params: LegacyLeaderboardQueryParams = {}
): Promise<LeaderboardResponse> {
  const {
    statType = LeaderboardStatType.KARMA,
    timePeriod = LeaderboardTimePeriod.ALL_TIME,
    tier,
    page = 1,
    pageSize = 50,
  } = params;

  const category = legacyStatTypeToCategory(statType);
  const period = mapPeriod(timePeriod);

  const data = await getLeaderboardData({
    category,
    period,
    tier,
    page,
    pageSize,
  });

  const entries = data.entries.map(u => tolegacyEntry(u, statType));
  const totalPages = Math.ceil(data.total / pageSize);

  return {
    entries,
    currentUserEntry: data.currentUser ? tolegacyEntry(data.currentUser, statType) : undefined,
    pagination: {
      page: data.page,
      pageSize: data.pageSize,
      totalEntries: data.total,
      totalPages,
      hasMore: data.hasMore,
    },
    filters: {
      statType,
      timePeriod,
      tier,
    },
    lastUpdated: data.lastUpdated,
  };
}

/**
 * @deprecated Use getLeaderboardData with page=1, pageSize=10
 */
export async function getTopPerformers(
  statType: LeaderboardStatType = LeaderboardStatType.KARMA,
  timePeriod: LeaderboardTimePeriod = LeaderboardTimePeriod.ALL_TIME
): Promise<LeaderboardEntry[]> {
  const response = await getLeaderboard({
    statType,
    timePeriod,
    pageSize: 10,
    page: 1,
  });
  return response.entries;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format stat value for display based on category
 */
export function formatCategoryStat(
  user: LeaderboardUser,
  category: LeaderboardCategory
): string {
  return CATEGORY_CONFIG[category].formatValue(user);
}

/**
 * @deprecated Use formatCategoryStat instead
 */
export function formatLeaderboardStat(
  value: number,
  statType: LeaderboardStatType
): string {
  switch (statType) {
    case LeaderboardStatType.KARMA:
      return value.toLocaleString();
    case LeaderboardStatType.ACCEPTANCE_RATE:
      return `${value.toFixed(1)}%`;
    case LeaderboardStatType.HELPFUL_RATING:
      return value.toFixed(2);
    case LeaderboardStatType.STREAK:
    case LeaderboardStatType.REVIEWS:
      return value.toLocaleString();
    default:
      return value.toString();
  }
}

/**
 * @deprecated Use CATEGORY_CONFIG[category].label instead
 */
export function getStatTypeLabel(statType: LeaderboardStatType): string {
  const labels: Record<LeaderboardStatType, string> = {
    [LeaderboardStatType.KARMA]: 'Sparks',
    [LeaderboardStatType.ACCEPTANCE_RATE]: 'Acceptance Rate',
    [LeaderboardStatType.STREAK]: 'Streak',
    [LeaderboardStatType.REVIEWS]: 'Reviews',
    [LeaderboardStatType.HELPFUL_RATING]: 'Helpful Rating',
  };
  return labels[statType];
}

/**
 * @deprecated Use LeaderboardPeriod enum directly
 */
export function getTimePeriodLabel(period: LeaderboardTimePeriod): string {
  const labels: Record<LeaderboardTimePeriod, string> = {
    [LeaderboardTimePeriod.WEEKLY]: 'Weekly',
    [LeaderboardTimePeriod.MONTHLY]: 'Monthly',
    [LeaderboardTimePeriod.ALL_TIME]: 'All Time',
  };
  return labels[period];
}

/** User percentile info */
export interface UserPercentile {
  userId: string;
  rank: number;
  totalUsers: number;
  percentile: number;
  tier: UserTier;
}

/**
 * Get current user's percentile
 */
export async function getUserPercentile(): Promise<UserPercentile> {
  const data = await getLeaderboardData({
    category: LeaderboardCategory.OVERALL,
    pageSize: 1,
  });

  if (data.currentUser) {
    return {
      userId: data.currentUser.id,
      rank: data.currentUser.rank,
      totalUsers: data.total,
      percentile: Math.round((1 - data.currentUser.rank / data.total) * 100),
      tier: data.currentUser.tier,
    };
  }

  throw new Error('User not found in leaderboard');
}
