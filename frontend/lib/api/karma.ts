/**
 * Karma API Client
 *
 * API functions for the modern karma system including:
 * - XP + Reputation management
 * - Badges and achievements
 * - Seasonal leaderboards
 * - Requester ratings (two-sided reputation)
 */

import apiClient from './client';

// ============= Types =============

export interface KarmaSummary {
  total_karma: number;
  total_xp: number;
  reputation_score: number;
  acceptance_rate: number | null;
  accepted_reviews_count: number;
  current_streak: number;
  longest_streak: number;
  streak_shields: number;
  weekly_reviews: number;
  weekly_goal: number;
  weekly_goal_streak: number;
  last_review_date: string | null;
  last_active_date: string | null;
}

export interface KarmaBreakdown {
  total_karma: number;
  total_xp: number;
  reputation_score: number;
  positive_karma_earned: number;
  negative_karma_incurred: number;
  net_karma: number;
  breakdown_by_action: Record<string, number>;
  percentile: number;
  acceptance_rate: number | null;
  current_streak: number;
  longest_streak: number;
  streak_shields: number;
  weekly_progress: {
    current: number;
    target: number;
    progress_percentage: number;
    streak: number;
  };
  warning_count: number;
  warnings_expire_at: string | null;
}

export interface KarmaTransaction {
  id: number;
  action: string;
  points: number;
  balance_after: number;
  reason: string | null;
  created_at: string;
}

export interface KarmaHistoryResponse {
  transactions: KarmaTransaction[];
  limit: number;
  offset: number;
}

// Badge types
export type BadgeCategory = 'skill' | 'milestone' | 'streak' | 'quality' | 'special' | 'seasonal';
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  badge_code: string;
  badge_name: string;
  badge_description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  icon_url: string | null;
  color: string | null;
  earned_at?: string | null;
  level?: number | null;
  is_featured?: boolean | null;
  karma_reward?: number | null;
  xp_reward?: number | null;
  progress?: {
    current: number;
    required: number;
    percentage: number;
  } | null;
}

// Leaderboard types
export type SeasonType = 'weekly' | 'monthly' | 'quarterly';
export type LeaderboardCategory = 'overall' | 'reviews' | 'quality' | 'helpful' | 'skill' | 'newcomer';

export interface Season {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  avatar_url: string | null;
  user_tier: string;
  score: number;
  reviews_count: number;
  karma_earned: number;
  xp_earned: number;
}

export interface LeaderboardResponse {
  season: Season | null;
  rankings: LeaderboardEntry[];
  message?: string;
}

export interface UserRanking {
  rank: number;
  total_participants: number;
  percentile: number;
  score: number;
  reviews_count: number;
  karma_earned: number;
  xp_earned: number;
}

export interface SeasonsResponse {
  seasons: Season[];
}

// Requester rating types
export interface RequesterRatingRequest {
  clarity_rating: number;
  responsiveness_rating: number;
  fairness_rating: number;
  feedback_text?: string;
  is_anonymous?: boolean;
}

export interface RequesterStats {
  avg_clarity: number | null;
  avg_responsiveness: number | null;
  avg_fairness: number | null;
  avg_overall: number | null;
  total_ratings: number;
  total_reviews_requested: number;
  is_responsive: boolean;
  is_fair: boolean;
  badges: string[];
}

export interface RequesterRating {
  id: number;
  clarity_rating: number;
  responsiveness_rating: number;
  fairness_rating: number;
  overall_rating: number;
  feedback_text?: string;
  reviewer_name?: string;
  created_at: string;
}

export interface CanRateResponse {
  can_rate: boolean;
  reason?: string;
  already_rated?: boolean;
}

// ============= API Functions =============

/**
 * Karma Summary & Breakdown
 */
export async function getKarmaSummary(): Promise<KarmaSummary> {
  return apiClient.get<KarmaSummary>('/karma/summary');
}

export async function getKarmaBreakdown(): Promise<KarmaBreakdown> {
  return apiClient.get<KarmaBreakdown>('/karma/breakdown');
}

export async function getKarmaHistory(
  limit: number = 50,
  offset: number = 0
): Promise<KarmaHistoryResponse> {
  return apiClient.get<KarmaHistoryResponse>(
    `/karma/history?limit=${limit}&offset=${offset}`
  );
}

export async function updateWeeklyGoal(target: number): Promise<{ message: string; weekly_goal_target: number }> {
  return apiClient.put('/karma/weekly-goal', { target });
}

/**
 * Badges
 */
export async function getMyBadges(includeHidden: boolean = false): Promise<Badge[]> {
  return apiClient.get<Badge[]>(`/karma/badges?include_hidden=${includeHidden}`);
}

export async function getAvailableBadges(): Promise<Badge[]> {
  return apiClient.get<Badge[]>('/karma/badges/available');
}

export async function toggleBadgeFeatured(badgeId: number): Promise<{ message: string }> {
  return apiClient.post(`/karma/badges/${badgeId}/toggle-featured`);
}

export async function getUserBadges(userId: number): Promise<Badge[]> {
  return apiClient.get<Badge[]>(`/karma/badges/user/${userId}`);
}

/**
 * Leaderboards
 */
export async function getLeaderboard(
  seasonType: SeasonType,
  category: LeaderboardCategory = 'overall',
  skill?: string,
  limit: number = 100
): Promise<LeaderboardResponse> {
  let url = `/karma/leaderboard/${seasonType}?category=${category}&limit=${limit}`;
  if (skill) {
    url += `&skill=${encodeURIComponent(skill)}`;
  }
  return apiClient.get<LeaderboardResponse>(url);
}

export async function getMyRanking(
  seasonType: SeasonType,
  category: LeaderboardCategory = 'overall',
  skill?: string
): Promise<UserRanking> {
  let url = `/karma/leaderboard/${seasonType}/my-rank?category=${category}`;
  if (skill) {
    url += `&skill=${encodeURIComponent(skill)}`;
  }
  return apiClient.get<UserRanking>(url);
}

export async function getSeasons(
  seasonType?: SeasonType,
  includeFinalized: boolean = true,
  limit: number = 10
): Promise<SeasonsResponse> {
  let url = `/karma/seasons?include_finalized=${includeFinalized}&limit=${limit}`;
  if (seasonType) {
    url += `&season_type=${seasonType}`;
  }
  return apiClient.get<SeasonsResponse>(url);
}

/**
 * Requester Ratings (Two-sided reputation)
 */
export async function submitRequesterRating(
  reviewSlotId: number,
  rating: RequesterRatingRequest
): Promise<{ message: string; rating_id: number; overall_rating: number }> {
  return apiClient.post(`/karma/requester-rating/${reviewSlotId}`, rating);
}

export async function canRateRequester(reviewSlotId: number): Promise<CanRateResponse> {
  return apiClient.get<CanRateResponse>(`/karma/requester-rating/can-rate/${reviewSlotId}`);
}

export async function getRequesterStats(userId: number): Promise<RequesterStats> {
  return apiClient.get<RequesterStats>(`/karma/requester-stats/${userId}`);
}

export async function getRequesterRatings(
  userId: number,
  limit: number = 10
): Promise<{ ratings: RequesterRating[] }> {
  return apiClient.get<{ ratings: RequesterRating[] }>(
    `/karma/requester-ratings/${userId}?limit=${limit}`
  );
}

// ============= Utility Functions =============

/**
 * Get badge rarity color
 */
export function getBadgeRarityColor(rarity: BadgeRarity): string {
  const colors: Record<BadgeRarity, string> = {
    common: '#9CA3AF',     // gray
    uncommon: '#22C55E',   // green
    rare: '#3B82F6',       // blue
    epic: '#A855F7',       // purple
    legendary: '#F59E0B',  // amber/gold
  };
  return colors[rarity];
}

/**
 * Get badge category icon
 */
export function getBadgeCategoryIcon(category: BadgeCategory): string {
  const icons: Record<BadgeCategory, string> = {
    skill: '🎯',
    milestone: '🏅',
    streak: '🔥',
    quality: '⭐',
    special: '✨',
    seasonal: '🌟',
  };
  return icons[category];
}

/**
 * Format XP number with suffix
 */
export function formatXP(xp: number): string {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`;
  }
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`;
  }
  return xp.toString();
}

/**
 * Get reputation level description
 */
export function getReputationLevel(score: number): { label: string; color: string } {
  if (score >= 150) return { label: 'Excellent', color: '#22C55E' };
  if (score >= 120) return { label: 'Great', color: '#3B82F6' };
  if (score >= 100) return { label: 'Good', color: '#6B7280' };
  if (score >= 80) return { label: 'Fair', color: '#F59E0B' };
  return { label: 'At Risk', color: '#EF4444' };
}

/**
 * Calculate weekly goal progress percentage
 */
export function getWeeklyGoalProgress(current: number, target: number): number {
  if (target <= 0) return 100;
  return Math.min(100, Math.round((current / target) * 100));
}
