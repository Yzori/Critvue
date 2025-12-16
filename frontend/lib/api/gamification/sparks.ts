/**
 * Sparks API Client
 *
 * API functions for the modern sparks system including:
 * - XP + Reputation management
 * - Badges and achievements
 * - Seasonal leaderboards
 * - Requester ratings (two-sided reputation)
 */

import apiClient from '../client';

// ============= Types =============

export interface SparksSummary {
  total_sparks: number;
  total_xp: number;
  reputation_score: number;
  user_tier: string;  // Actual tier from database (not calculated from sparks)
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

export interface SparksBreakdown {
  total_sparks: number;
  total_xp: number;
  reputation_score: number;
  positive_sparks_earned: number;
  negative_sparks_incurred: number;
  net_sparks: number;
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

export interface SparksTransaction {
  id: number;
  action: string;
  points: number;
  balance_after: number;
  reason: string | null;
  created_at: string;
}

export interface SparksHistoryResponse {
  transactions: SparksTransaction[];
  limit: number;
  offset: number;
}

// Badge types
export type BadgeCategory = 'skill' | 'milestone' | 'streak' | 'quality' | 'special' | 'seasonal';
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  id?: number; // UserBadge ID (only for earned badges)
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
  is_hidden?: boolean | null;
  sparks_reward?: number | null;
  xp_reward?: number | null;
  progress?: {
    type: string;
    current: number;
    required: number;
    percentage: number;
    description?: string;
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
  sparks_earned: number;
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
  sparks_earned: number;
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

// Reviewer rating types (Requesters rate reviewers)
export interface ReviewerRatingRequest {
  quality_rating: number;        // 1-5 rating for review quality/thoroughness
  professionalism_rating: number; // 1-5 rating for professional tone
  helpfulness_rating: number;     // 1-5 rating for responsiveness to questions
  feedback_text?: string;
  is_anonymous?: boolean;
}

export interface ReviewerStats {
  avg_quality: number | null;
  avg_professionalism: number | null;
  avg_helpfulness: number | null;
  avg_overall: number | null;
  total_ratings: number;
  total_reviews_completed: number;
  reviews_accepted: number;
  reviews_rejected: number;
  is_high_quality: boolean;
  is_professional: boolean;
  badges: string[];
}

export interface ReviewerRating {
  id: number;
  quality_rating: number;
  professionalism_rating: number;
  helpfulness_rating: number;
  overall_rating: number;
  feedback_text?: string;
  requester_name?: string;
  requester_avatar?: string;
  created_at: string;
}

// ============= API Functions =============

/**
 * Sparks Summary & Breakdown
 */
export async function getSparksSummary(): Promise<SparksSummary> {
  return apiClient.get<SparksSummary>('/sparks/summary');
}

export async function getSparksBreakdown(): Promise<SparksBreakdown> {
  return apiClient.get<SparksBreakdown>('/sparks/breakdown');
}

export async function getSparksHistory(
  limit: number = 50,
  offset: number = 0
): Promise<SparksHistoryResponse> {
  return apiClient.get<SparksHistoryResponse>(
    `/sparks/history?limit=${limit}&offset=${offset}`
  );
}

export async function updateWeeklyGoal(target: number): Promise<{ message: string; weekly_goal_target: number }> {
  return apiClient.put('/sparks/weekly-goal', { target });
}

/**
 * Badges
 */
export async function getMyBadges(includeHidden: boolean = false): Promise<Badge[]> {
  return apiClient.get<Badge[]>(`/sparks/badges?include_hidden=${includeHidden}`);
}

export async function getAvailableBadges(): Promise<Badge[]> {
  return apiClient.get<Badge[]>('/sparks/badges/available');
}

export async function toggleBadgeFeatured(badgeId: number): Promise<{ message: string }> {
  return apiClient.post(`/sparks/badges/${badgeId}/toggle-featured`);
}

export async function getUserBadges(userId: number): Promise<Badge[]> {
  return apiClient.get<Badge[]>(`/sparks/badges/user/${userId}`);
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
  let url = `/sparks/leaderboard/${seasonType}?category=${category}&limit=${limit}`;
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
  let url = `/sparks/leaderboard/${seasonType}/my-rank?category=${category}`;
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
  let url = `/sparks/seasons?include_finalized=${includeFinalized}&limit=${limit}`;
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
  return apiClient.post(`/sparks/requester-rating/${reviewSlotId}`, rating);
}

export async function canRateRequester(reviewSlotId: number): Promise<CanRateResponse> {
  return apiClient.get<CanRateResponse>(`/sparks/requester-rating/can-rate/${reviewSlotId}`);
}

export async function getRequesterStats(userId: number): Promise<RequesterStats> {
  return apiClient.get<RequesterStats>(`/sparks/requester-stats/${userId}`);
}

export async function getRequesterRatings(
  userId: number,
  limit: number = 10
): Promise<{ ratings: RequesterRating[] }> {
  return apiClient.get<{ ratings: RequesterRating[] }>(
    `/sparks/requester-ratings/${userId}?limit=${limit}`
  );
}

/**
 * Reviewer Ratings (Two-sided reputation - Requesters rate reviewers)
 */
export async function submitReviewerRating(
  reviewSlotId: number,
  rating: ReviewerRatingRequest
): Promise<{ message: string; rating_id: number; overall_rating: number }> {
  return apiClient.post(`/sparks/reviewer-rating/${reviewSlotId}`, rating);
}

export async function canRateReviewer(reviewSlotId: number): Promise<CanRateResponse> {
  return apiClient.get<CanRateResponse>(`/sparks/reviewer-rating/can-rate/${reviewSlotId}`);
}

export async function getReviewerStats(userId: number): Promise<ReviewerStats> {
  return apiClient.get<ReviewerStats>(`/sparks/reviewer-stats/${userId}`);
}

export async function getReviewerRatings(
  userId: number,
  limit: number = 10
): Promise<{ ratings: ReviewerRating[] }> {
  return apiClient.get<{ ratings: ReviewerRating[] }>(
    `/sparks/reviewer-ratings/${userId}?limit=${limit}`
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
 * Get weekly goal progress percentage
 */
export function getWeeklyGoalProgress(current: number, target: number): number {
  if (target <= 0) return 100;
  return Math.min(100, Math.round((current / target) * 100));
}

// ============= Backward Compatibility Aliases =============

// Type aliases
export type KarmaSummary = SparksSummary;
export type KarmaBreakdown = SparksBreakdown;
export type KarmaTransaction = SparksTransaction;
export type KarmaHistoryResponse = SparksHistoryResponse;

// Function aliases
export const getKarmaSummary = getSparksSummary;
export const getKarmaBreakdown = getSparksBreakdown;
export const getKarmaHistory = getSparksHistory;
