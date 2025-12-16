/**
 * Dashboard API Client
 *
 * Optimized mobile-first dashboard endpoints with:
 * - Minimal payloads for mobile performance
 * - Urgency-based sorting
 * - Batch operations
 * - ETag caching support
 * - Real-time data via polling/WebSocket
 */

import apiClient from "../client";

// ===== Request/Response Types =====

export interface ReviewerInfo {
  id: number;
  name: string;
  avatar_url?: string;
  tier: string;
  avg_rating?: number;
}

export interface PendingReviewItem {
  slot_id: number;
  review_request_id: number;
  review_request_title: string;
  reviewer: ReviewerInfo | null;
  submitted_at: string;
  auto_accept_at: string | null;
  urgency_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE" | "EXPIRED";
  urgency_seconds: number;
  countdown_text: string;
  rating?: number;
  review_preview?: string;
  can_batch_accept: boolean;
}

export interface ActionsNeededResponse {
  items: PendingReviewItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
  };
  summary: {
    critical_count: number;
    high_count: number;
    medium_count: number;
    total_pending: number;
  };
}

export interface MyRequestProgress {
  requested: number;
  claimed: number;
  submitted: number;
  accepted: number;
  percentage: number;
}

export interface MyRequestItem {
  id: number;
  title: string;
  status: string;
  content_type: string;
  created_at: string;
  progress: MyRequestProgress;
  slot_statuses: {
    available: number;
    claimed: number;
    submitted: number;
    accepted: number;
    rejected: number;
  };
  urgent_actions: number;
  has_critical: boolean;
}

export interface MyRequestsResponse {
  items: MyRequestItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
  };
}

export interface DraftProgress {
  has_draft: boolean;
  last_saved_at: string | null;
  sections_completed?: number;
  sections_total?: number;
  percentage?: number;
}

export interface ActiveReviewItem {
  slot_id: number;
  review_request: {
    id: number;
    title: string;
    content_type: string;
    description_preview: string;
  } | null;
  claimed_at: string | null;
  claim_deadline: string | null;
  urgency_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE" | "EXPIRED";
  urgency_seconds: number;
  countdown_text: string;
  draft_progress: DraftProgress;
  earnings_potential: number;
  payment_status?: string;
}

export interface ActiveReviewsResponse {
  items: ActiveReviewItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
  };
  summary: {
    active_count: number;
    potential_earnings: number;
    critical_count: number;
  };
}

export interface SubmittedReviewItem {
  slot_id: number;
  review_request: {
    id: number;
    title: string;
    content_type: string;
  } | null;
  submitted_at: string | null;
  auto_accept_at: string | null;
  urgency_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE" | "EXPIRED";
  urgency_seconds: number;
  countdown_text: string;
  rating?: number;
  potential_karma: number;
  potential_bonus: number;
  payment_amount: number;
  status: string;
}

export interface SubmittedReviewsResponse {
  items: SubmittedReviewItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
  };
  summary: {
    submitted_count: number;
    total_potential_earnings: number;
    avg_auto_accept_days: number;
  };
}

export interface CompletedReviewItem {
  slot_id: number;
  review_request: {
    id: number;
    title: string;
    content_type: string;
  } | null;
  submitted_at: string | null;
  accepted_at: string | null;
  rating?: number;
  payment_amount: number;
  status: string;
}

export interface CompletedReviewsResponse {
  items: CompletedReviewItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
  };
  summary: {
    completed_count: number;
    total_earned: number;
  };
}

export interface DashboardStats {
  period: "week" | "month" | "all_time";
  role: "creator" | "reviewer";
  stats: CreatorStats | ReviewerStats;
  period_start: string;
  period_end: string;
}

export interface CreatorStats {
  reviews_received: number;
  reviews_accepted: number;
  reviews_rejected: number;
  avg_rating?: number;
  avg_response_time_hours?: number;
  total_spent: number;
  karma_change: number;
}

export interface ReviewerStats {
  reviews_given: number;
  reviews_accepted: number;
  reviews_rejected: number;
  acceptance_rate: number;
  avg_rating?: number;
  total_earned: number;
  karma_change: number;
}

export interface BatchAcceptRequest {
  slot_ids: number[];
  helpful_rating?: number;
}

export interface BatchAcceptItem {
  slot_id: number;
  status: "accepted";
  reviewer_id: number;
  karma_awarded: number;
}

export interface BatchAcceptError {
  slot_id: number;
  error: string;
  code: string;
}

export interface BatchAcceptResponse {
  accepted: BatchAcceptItem[];
  failed: BatchAcceptError[];
  summary: {
    total_requested: number;
    successful: number;
    failed: number;
    total_karma_awarded: number;
  };
}

// ===== API Functions =====

/**
 * Get actions needed for creator (pending reviews requiring accept/reject)
 * Sorted by urgency (most urgent first)
 *
 * @param page Page number (default: 1)
 * @param limit Items per page (default: 10, max: 50)
 * @param options Optional request options (including ETag for caching)
 */
export async function getActionsNeeded(
  page: number = 1,
  limit: number = 10,
  options?: RequestInit
): Promise<ActionsNeededResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  return apiClient.get<ActionsNeededResponse>(
    `/dashboard/desktop/creator/actions-needed?${params}`,
    options
  );
}

/**
 * Get all creator's review requests with progress overview
 *
 * @param statusFilter Optional status filter
 * @param page Page number (default: 1)
 * @param limit Items per page (default: 10, max: 50)
 */
export async function getMyRequests(
  statusFilter?: string,
  page: number = 1,
  limit: number = 10
): Promise<MyRequestsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (statusFilter) {
    params.append("status_filter", statusFilter);
  }

  return apiClient.get<MyRequestsResponse>(
    `/dashboard/desktop/creator/my-requests?${params}`
  );
}

/**
 * Get active reviews (claimed, not yet submitted) for reviewer
 * Sorted by claim deadline urgency
 *
 * @param page Page number (default: 1)
 * @param limit Items per page (default: 10, max: 50)
 */
export async function getActiveReviews(
  page: number = 1,
  limit: number = 10
): Promise<ActiveReviewsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  return apiClient.get<ActiveReviewsResponse>(
    `/dashboard/desktop/reviewer/active?${params}`
  );
}

/**
 * Get submitted reviews awaiting acceptance for reviewer
 * Sorted by auto-accept deadline
 *
 * @param page Page number (default: 1)
 * @param limit Items per page (default: 10, max: 50)
 */
export async function getSubmittedReviews(
  page: number = 1,
  limit: number = 10
): Promise<SubmittedReviewsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  return apiClient.get<SubmittedReviewsResponse>(
    `/dashboard/desktop/reviewer/submitted?${params}`
  );
}

/**
 * Get completed reviews (accepted or paid) for reviewer
 * Sorted by accepted date (most recent first)
 *
 * @param page Page number (default: 1)
 * @param limit Items per page (default: 10, max: 50)
 */
export async function getCompletedReviews(
  page: number = 1,
  limit: number = 10
): Promise<CompletedReviewsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  return apiClient.get<CompletedReviewsResponse>(
    `/dashboard/desktop/reviewer/completed?${params}`
  );
}

/**
 * Get dashboard statistics for current user's active role
 *
 * @param role User role (creator or reviewer)
 * @param period Time period (week, month, all_time)
 */
export async function getDashboardStats(
  role: "creator" | "reviewer",
  period: "week" | "month" | "all_time" = "week"
): Promise<DashboardStats> {
  const params = new URLSearchParams({
    role,
    period,
  });

  return apiClient.get<DashboardStats>(`/dashboard/stats?${params}`);
}

/**
 * Batch accept multiple reviews at once
 * Maximum 50 reviews per request
 *
 * @param slotIds Array of slot IDs to accept (max 50)
 * @param helpfulRating Optional rating to apply to all reviews (1-5)
 */
export async function batchAcceptReviews(
  slotIds: number[],
  helpfulRating?: number
): Promise<BatchAcceptResponse> {
  if (slotIds.length > 50) {
    throw new Error("Maximum 50 reviews can be batch accepted at once");
  }

  if (slotIds.length === 0) {
    throw new Error("slot_ids cannot be empty");
  }

  const params = new URLSearchParams();
  slotIds.forEach(id => params.append("slot_ids", id.toString()));

  if (helpfulRating !== undefined) {
    params.append("helpful_rating", helpfulRating.toString());
  }

  return apiClient.post<BatchAcceptResponse>(
    `/dashboard/batch-accept?${params}`,
    {}
  );
}

// ===== Utility Functions =====

/**
 * Calculate urgency color based on level
 */
export function getUrgencyColor(level: string): string {
  switch (level) {
    case "CRITICAL":
      return "text-red-600 bg-red-50 dark:bg-red-950/50";
    case "HIGH":
      return "text-orange-600 bg-orange-50 dark:bg-orange-950/50";
    case "MEDIUM":
      return "text-amber-600 bg-amber-50 dark:bg-amber-950/50";
    case "LOW":
      return "text-green-600 bg-green-50 dark:bg-green-950/50";
    case "EXPIRED":
      return "text-gray-600 bg-gray-50 dark:bg-gray-950/50";
    default:
      return "text-muted-foreground bg-muted";
  }
}

/**
 * Get urgency badge variant based on level
 */
export function getUrgencyVariant(level: string): "error" | "warning" | "info" | "success" | "secondary" {
  switch (level) {
    case "CRITICAL":
      return "error";
    case "HIGH":
      return "warning";
    case "MEDIUM":
      return "info";
    case "LOW":
      return "success";
    default:
      return "secondary";
  }
}

/**
 * Format currency value
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate time remaining in human-readable format
 */
export function calculateTimeRemaining(deadline: string | null): {
  text: string;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE" | "EXPIRED";
  seconds: number;
} {
  if (!deadline) {
    return { text: "No deadline", urgency: "NONE", seconds: 0 };
  }

  const now = Date.now();
  const deadlineTime = new Date(deadline).getTime();
  const seconds = Math.floor((deadlineTime - now) / 1000);

  if (seconds < 0) {
    return { text: "Expired", urgency: "EXPIRED", seconds: 0 };
  }

  // Calculate urgency level
  let urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "LOW";
  if (seconds < 86400) {
    // < 24 hours
    urgency = "CRITICAL";
  } else if (seconds < 259200) {
    // < 3 days
    urgency = "HIGH";
  } else if (seconds < 604800) {
    // < 7 days
    urgency = "MEDIUM";
  }

  // Format countdown text
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  let text: string;
  if (days > 0) {
    text = `${days}d ${hours}h`;
  } else if (hours > 0) {
    text = `${hours}h ${minutes}m`;
  } else {
    text = `${minutes}m`;
  }

  return { text, urgency, seconds };
}
