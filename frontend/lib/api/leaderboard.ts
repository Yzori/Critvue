/**
 * Leaderboard API Client
 *
 * Handles all leaderboard-related API calls including rankings by various metrics,
 * time periods, and tier filters.
 */

import apiClient from './client';
import { UserTier } from '@/lib/types/tier';

/**
 * Leaderboard stat types
 */
export enum LeaderboardStatType {
  KARMA = 'karma',
  ACCEPTANCE_RATE = 'acceptance_rate',
  STREAK = 'streak',
  REVIEWS = 'reviews',
  HELPFUL_RATING = 'helpful_rating',
}

/**
 * Time period filters
 */
export enum LeaderboardTimePeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all_time',
}

/**
 * Rank change direction
 */
export enum RankChangeDirection {
  UP = 'up',
  DOWN = 'down',
  SAME = 'same',
  NEW = 'new',
}

/**
 * Backend leaderboard entry structure
 */
interface BackendLeaderboardEntry {
  user_id: number;
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
}

/**
 * Backend leaderboard response structure
 */
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

/**
 * Backend user position response
 */
interface BackendUserPositionResponse {
  user_id: number;
  user_tier: string;
  tier_rank_in_tier: number;
  tier_total_in_tier: number;
  positions: {
    category: string;
    rank: number;
    total_users: number;
    percentile: number;
    stat_value: number;
  }[];
}

/**
 * Leaderboard entry representing a user's position
 */
export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  tier: UserTier;
  rank: number;
  previousRank?: number;
  rankChange: number; // Positive = moved up, Negative = moved down, 0 = no change
  rankChangeDirection: RankChangeDirection;

  // Primary stat (varies by stat type)
  primaryStat: number;

  // Secondary stats (always shown)
  karma: number;
  totalReviews: number;
  acceptanceRate: number; // 0-100
  helpfulRating: number; // 0-5
  currentStreak: number;

  // Metadata
  isCurrentUser?: boolean;
  joinedAt: string; // ISO date string
}

/**
 * Leaderboard response with pagination
 */
export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  currentUserEntry?: LeaderboardEntry; // Always included even if not in current page
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
  lastUpdated: string; // ISO date string
}

/**
 * Leaderboard query parameters
 */
export interface LeaderboardQueryParams {
  statType?: LeaderboardStatType;
  timePeriod?: LeaderboardTimePeriod;
  tier?: UserTier;
  page?: number;
  pageSize?: number;
}

/**
 * User's percentile position
 */
export interface UserPercentile {
  userId: string;
  rank: number;
  totalUsers: number;
  percentile: number; // 0-100, where 100 is top 1%
  tier: UserTier;
}

/**
 * Transform backend entry to frontend format
 */
function transformLeaderboardEntry(
  entry: BackendLeaderboardEntry,
  statType: LeaderboardStatType
): LeaderboardEntry {
  const primaryStat =
    statType === LeaderboardStatType.KARMA ? entry.karma_points :
    statType === LeaderboardStatType.ACCEPTANCE_RATE ? entry.acceptance_rate :
    statType === LeaderboardStatType.STREAK ? entry.current_streak :
    statType === LeaderboardStatType.REVIEWS ? entry.accepted_reviews_count :
    statType === LeaderboardStatType.HELPFUL_RATING ? entry.avg_rating :
    0;

  return {
    userId: entry.user_id.toString(),
    username: entry.full_name || 'Anonymous',
    displayName: entry.full_name || 'Anonymous User',
    avatarUrl: entry.avatar_url || undefined,
    tier: entry.user_tier as UserTier,
    rank: entry.rank,
    previousRank: entry.rank_change !== null ? entry.rank - entry.rank_change : undefined,
    rankChange: entry.rank_change || 0,
    rankChangeDirection:
      entry.rank_change === null ? RankChangeDirection.NEW :
      entry.rank_change > 0 ? RankChangeDirection.UP :
      entry.rank_change < 0 ? RankChangeDirection.DOWN :
      RankChangeDirection.SAME,
    primaryStat: primaryStat || 0,
    karma: entry.karma_points || 0,
    totalReviews: entry.accepted_reviews_count || 0,
    acceptanceRate: entry.acceptance_rate || 0,
    helpfulRating: entry.avg_rating || 0,
    currentStreak: entry.current_streak || 0,
    isCurrentUser: false,
    joinedAt: new Date().toISOString(), // Default value
  };
}

/**
 * Map stat type to backend endpoint
 */
function getEndpointForStatType(statType: LeaderboardStatType): string {
  switch (statType) {
    case LeaderboardStatType.KARMA:
      return '/leaderboard/karma';
    case LeaderboardStatType.ACCEPTANCE_RATE:
      return '/leaderboard/acceptance-rate';
    case LeaderboardStatType.STREAK:
      return '/leaderboard/streak';
    case LeaderboardStatType.REVIEWS:
      return '/leaderboard/reviews';
    case LeaderboardStatType.HELPFUL_RATING:
      return '/leaderboard/helpful';
    default:
      return '/leaderboard/karma';
  }
}

/**
 * Fetch leaderboard rankings
 */
export async function getLeaderboard(
  params: LeaderboardQueryParams = {}
): Promise<LeaderboardResponse> {
  const {
    statType = LeaderboardStatType.KARMA,
    timePeriod = LeaderboardTimePeriod.ALL_TIME,
    tier,
    page = 1,
    pageSize = 50,
  } = params;

  const endpoint = getEndpointForStatType(statType);
  const offset = (page - 1) * pageSize;

  const queryParams = new URLSearchParams({
    period: timePeriod,
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
    transformLeaderboardEntry(entry, statType)
  );

  const totalPages = Math.ceil(backendResponse.metadata.total_entries / pageSize);

  return {
    entries,
    currentUserEntry: undefined, // Will be fetched separately
    pagination: {
      page,
      pageSize,
      totalEntries: backendResponse.metadata.total_entries,
      totalPages,
      hasMore: page < totalPages,
    },
    filters: {
      statType,
      timePeriod,
      tier: tier as UserTier | undefined,
    },
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get current user's position in leaderboard
 */
export async function getCurrentUserPosition(
  statType: LeaderboardStatType = LeaderboardStatType.KARMA,
  timePeriod: LeaderboardTimePeriod = LeaderboardTimePeriod.ALL_TIME
): Promise<LeaderboardEntry> {
  const backendResponse = await apiClient.get<BackendUserPositionResponse>(
    '/leaderboard/me/position'
  );

  // Find the position for the requested stat type
  const categoryMap: Record<LeaderboardStatType, string> = {
    [LeaderboardStatType.KARMA]: 'karma',
    [LeaderboardStatType.ACCEPTANCE_RATE]: 'acceptance_rate',
    [LeaderboardStatType.STREAK]: 'streak',
    [LeaderboardStatType.REVIEWS]: 'reviews',
    [LeaderboardStatType.HELPFUL_RATING]: 'helpful',
  };

  const category = categoryMap[statType];
  const position = backendResponse.positions.find(p => p.category === category);

  if (!position) {
    throw new Error('User position not found for this category');
  }

  return {
    userId: backendResponse.user_id.toString(),
    username: 'You',
    displayName: 'You',
    tier: backendResponse.user_tier as UserTier,
    rank: position.rank,
    rankChange: 0,
    rankChangeDirection: RankChangeDirection.SAME,
    primaryStat: position.stat_value,
    karma: backendResponse.positions.find(p => p.category === 'karma')?.stat_value || 0,
    totalReviews: backendResponse.positions.find(p => p.category === 'reviews')?.stat_value || 0,
    acceptanceRate: backendResponse.positions.find(p => p.category === 'acceptance_rate')?.stat_value || 0,
    helpfulRating: backendResponse.positions.find(p => p.category === 'helpful')?.stat_value || 0,
    currentStreak: backendResponse.positions.find(p => p.category === 'streak')?.stat_value || 0,
    isCurrentUser: true,
    joinedAt: new Date().toISOString(),
  };
}

/**
 * Get user's percentile ranking
 */
export async function getUserPercentile(
  userId?: string
): Promise<UserPercentile> {
  const backendResponse = await apiClient.get<BackendUserPositionResponse>(
    '/leaderboard/me/position'
  );

  // Use karma position for overall percentile
  const karmaPosition = backendResponse.positions.find(p => p.category === 'karma');

  return {
    userId: backendResponse.user_id.toString(),
    rank: karmaPosition?.rank || 0,
    totalUsers: karmaPosition?.total_users || 0,
    percentile: karmaPosition?.percentile || 0,
    tier: backendResponse.user_tier as UserTier,
  };
}

/**
 * Get top performers (top 10)
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

/**
 * Helper to format stat value for display
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
 * Get display label for stat type
 */
export function getStatTypeLabel(statType: LeaderboardStatType): string {
  const labels: Record<LeaderboardStatType, string> = {
    [LeaderboardStatType.KARMA]: 'Karma',
    [LeaderboardStatType.ACCEPTANCE_RATE]: 'Acceptance Rate',
    [LeaderboardStatType.STREAK]: 'Streak',
    [LeaderboardStatType.REVIEWS]: 'Reviews',
    [LeaderboardStatType.HELPFUL_RATING]: 'Helpful Rating',
  };
  return labels[statType];
}

/**
 * Get display label for time period
 */
export function getTimePeriodLabel(period: LeaderboardTimePeriod): string {
  const labels: Record<LeaderboardTimePeriod, string> = {
    [LeaderboardTimePeriod.WEEKLY]: 'Weekly',
    [LeaderboardTimePeriod.MONTHLY]: 'Monthly',
    [LeaderboardTimePeriod.ALL_TIME]: 'All Time',
  };
  return labels[period];
}
