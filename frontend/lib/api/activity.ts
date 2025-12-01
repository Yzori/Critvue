/**
 * Activity API Client
 *
 * Functions for fetching user activity data including:
 * - Activity heatmap data
 * - Activity timeline events
 */

import apiClient from './client';

// ==================== Types ====================

export interface DayActivity {
  date: string;  // YYYY-MM-DD
  reviewsGiven: number;
  reviewsReceived: number;
  karmaEvents: number;
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
  type: 'review_given' | 'review_received' | 'badge_earned' | 'milestone' | 'karma_change' | 'rating';
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
  karma_events: number;
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
      karmaEvents: day.karma_events,
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
