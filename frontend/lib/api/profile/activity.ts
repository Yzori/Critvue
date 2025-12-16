/**
 * Activity API Client
 *
 * Functions for fetching user activity data including:
 * - Activity heatmap data
 * - Activity timeline events
 */

import apiClient from '../client';

// ==================== Types ====================

export interface DayActivity {
  date: string;  // YYYY-MM-DD
  reviewsGiven: number;
  reviewsReceived: number;
  sparksEvents: number;
  challengeEntries: number;
  challengeVotes: number;
  reviewRequestsCreated: number;
  total: number;
}

export interface ActivityHeatmapResponse {
  data: DayActivity[];
  currentStreak: number;
  longestStreak: number;
  totalContributions: number;
}

export interface TimelineEvent {
  id: string;
  type: 'review_given' | 'review_received' | 'badge_earned' | 'milestone' | 'sparks_change' | 'rating' | 'challenge_entry' | 'challenge_vote' | 'review_request_created';
  title: string;
  description?: string;
  timestamp: string;
  metadata?: {
    slot_id?: number;
    request_id?: number;
    project_name?: string;
    rating?: number;
    status?: string;
    reviewer_name?: string;
    points?: number;
    action?: string;
    balance_after?: number;
    badgeName?: string;
    milestoneValue?: number;
    quote?: string;
    entry_id?: number;
    challenge_id?: number;
    challenge_title?: string;
    entry_title?: string;
    vote_id?: number;
    title?: string;
    content_type?: string;
  };
}

export interface ActivityTimelineResponse {
  events: TimelineEvent[];
  total: number;
  hasMore: boolean;
}

// ==================== API Response Types (snake_case from backend) ====================

interface ApiDayActivity {
  date: string;
  reviews_given: number;
  reviews_received: number;
  sparks_events: number;
  challenge_entries: number;
  challenge_votes: number;
  review_requests_created: number;
  total: number;
}

interface ApiActivityHeatmapResponse {
  data: ApiDayActivity[];
  current_streak: number;
  longest_streak: number;
  total_contributions: number;
}

interface ApiTimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface ApiActivityTimelineResponse {
  events: ApiTimelineEvent[];
  total: number;
  has_more: boolean;
}

// ==================== API Functions ====================

/**
 * Get activity heatmap data
 */
export async function getActivityHeatmap(days: number = 365): Promise<ActivityHeatmapResponse> {
  const response = await apiClient.get<ApiActivityHeatmapResponse>(
    `/activity/heatmap?days=${days}`
  );

  // Transform snake_case to camelCase
  return {
    data: response.data.map((day) => ({
      date: day.date,
      reviewsGiven: day.reviews_given,
      reviewsReceived: day.reviews_received,
      sparksEvents: day.sparks_events,
      challengeEntries: day.challenge_entries,
      challengeVotes: day.challenge_votes,
      reviewRequestsCreated: day.review_requests_created,
      total: day.total,
    })),
    currentStreak: response.current_streak,
    longestStreak: response.longest_streak,
    totalContributions: response.total_contributions,
  };
}

/**
 * Get activity timeline
 */
export async function getActivityTimeline(
  limit: number = 20,
  offset: number = 0
): Promise<ActivityTimelineResponse> {
  const response = await apiClient.get<ApiActivityTimelineResponse>(
    `/activity/timeline?limit=${limit}&offset=${offset}`
  );

  // Transform response
  return {
    events: response.events.map((event) => ({
      id: event.id,
      type: event.type as TimelineEvent['type'],
      title: event.title,
      description: event.description,
      timestamp: event.timestamp,
      metadata: event.metadata as TimelineEvent['metadata'],
    })),
    total: response.total,
    hasMore: response.has_more,
  };
}

// ==================== Enhanced Stats Types ====================

export interface TrendInfo {
  value: number;
  direction: 'up' | 'down' | 'neutral';
  label?: string;
}

export interface StatWithContext {
  value: number;
  trend?: TrendInfo;
  percentile?: number;
  comparison?: string;
  sparklineData?: number[];
}

export interface EnhancedStatsResponse {
  reviewsGiven: StatWithContext;
  sparksPoints: StatWithContext;
  avgRating: StatWithContext;
  avgResponseTime: StatWithContext;
}

// API response types (snake_case from backend)
interface ApiTrendInfo {
  value: number;
  direction: string;
  label?: string;
}

interface ApiStatWithContext {
  value: number;
  trend?: ApiTrendInfo;
  percentile?: number;
  comparison?: string;
  sparkline_data?: number[];
}

interface ApiEnhancedStatsResponse {
  reviews_given: ApiStatWithContext;
  sparks_points: ApiStatWithContext;
  avg_rating: ApiStatWithContext;
  avg_response_time: ApiStatWithContext;
}

/**
 * Transform API stat to frontend format
 */
function transformStat(stat: ApiStatWithContext): StatWithContext {
  return {
    value: stat.value,
    trend: stat.trend ? {
      value: stat.trend.value,
      direction: stat.trend.direction as 'up' | 'down' | 'neutral',
      label: stat.trend.label,
    } : undefined,
    percentile: stat.percentile,
    comparison: stat.comparison,
    sparklineData: stat.sparkline_data,
  };
}

/**
 * Get enhanced profile stats with trends and percentiles
 */
export async function getEnhancedStats(): Promise<EnhancedStatsResponse> {
  const response = await apiClient.get<ApiEnhancedStatsResponse>('/activity/stats/enhanced');

  return {
    reviewsGiven: transformStat(response.reviews_given),
    sparksPoints: transformStat(response.sparks_points),
    avgRating: transformStat(response.avg_rating),
    avgResponseTime: transformStat(response.avg_response_time),
  };
}
