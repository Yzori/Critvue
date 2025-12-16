/**
 * Platform API Client
 *
 * API functions for the elevated dashboard platform-wide data:
 * - Activity feed (real-time platform activity)
 * - Platform stats (online users, completion rates)
 * - User story stats (narrative-driven statistics)
 */

import apiClient from "../client";

// ===== Types =====

export interface ActivityEvent {
  id: string;
  type: "claim" | "submit" | "accept" | "review" | "join" | "milestone";
  message: string;
  timestamp: string;
  actor_name?: string;
  actor_avatar?: string;
  highlight: boolean;
}

export interface PlatformActivityResponse {
  events: ActivityEvent[];
  has_more: boolean;
}

export interface PlatformStats {
  reviewers_online: number;
  creators_online: number;
  total_online: number;
  active_reviews: number;
  completed_today: number;
  completed_this_week: number;
  total_reviews_all_time: number;
  total_earned_this_week: number;
  avg_rating: number;
}

export interface UserStoryStats {
  // Core numbers
  total_reviews_received: number;
  total_reviews_given: number;
  completed_reviews: number;
  in_progress_reviews: number;
  average_rating: number | null;

  // Streaks
  current_streak: number;
  longest_streak: number;

  // Time-based
  member_since: string;
  this_week_activity: number;
  last_month_activity: number;

  // Community context
  percentile_rank: number | null;
  community_avg_reviews: number;

  // Reviewer specific
  total_earnings: number | null;
  acceptance_rate: number | null;

  // Creator specific
  improvement_score: number | null;
}

// ===== API Functions =====

/**
 * Get platform-wide activity feed
 */
export async function getPlatformActivity(
  limit: number = 10,
  sinceMinutes: number = 60
): Promise<PlatformActivityResponse> {
  return apiClient.get<PlatformActivityResponse>(
    `/platform/activity?limit=${limit}&since_minutes=${sinceMinutes}`
  );
}

/**
 * Get platform-wide statistics
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  return apiClient.get<PlatformStats>("/platform/stats");
}

/**
 * Get user's story stats for narrative display
 */
export async function getUserStoryStats(
  role: "creator" | "reviewer" = "creator"
): Promise<UserStoryStats> {
  return apiClient.get<UserStoryStats>(
    `/platform/user-story-stats?role=${role}`
  );
}

// ===== Hooks for Real-Time Updates =====

/**
 * Poll for platform activity at regular intervals
 * Returns cleanup function to stop polling
 */
export function pollPlatformActivity(
  callback: (data: PlatformActivityResponse) => void,
  intervalMs: number = 30000
): () => void {
  let isActive = true;

  const poll = async () => {
    if (!isActive) return;

    try {
      const data = await getPlatformActivity(10, 60);
      if (isActive) {
        callback(data);
      }
    } catch {
      // Error polling platform activity - silent fail
    }
  };

  // Initial fetch
  poll();

  // Set up interval
  const intervalId = setInterval(poll, intervalMs);

  // Return cleanup function
  return () => {
    isActive = false;
    clearInterval(intervalId);
  };
}

/**
 * Poll for platform stats at regular intervals
 * Returns cleanup function to stop polling
 */
export function pollPlatformStats(
  callback: (data: PlatformStats) => void,
  intervalMs: number = 60000
): () => void {
  let isActive = true;

  const poll = async () => {
    if (!isActive) return;

    try {
      const data = await getPlatformStats();
      if (isActive) {
        callback(data);
      }
    } catch {
      // Error polling platform stats - silent fail
    }
  };

  // Initial fetch
  poll();

  // Set up interval
  const intervalId = setInterval(poll, intervalMs);

  // Return cleanup function
  return () => {
    isActive = false;
    clearInterval(intervalId);
  };
}
