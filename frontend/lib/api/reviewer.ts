/**
 * Reviewer API Client
 *
 * Handles all API calls related to the reviewer workflow:
 * - Claiming review slots
 * - Submitting reviews
 * - Managing drafts
 * - Fetching reviewer dashboard data
 * - Earnings and statistics
 */

import apiClient from "./client";

/**
 * Type Definitions
 */

export interface ReviewSlot {
  id: number;
  review_request_id: number;
  reviewer_id: number | null;
  status:
    | "available"
    | "claimed"
    | "submitted"
    | "accepted"
    | "rejected"
    | "abandoned"
    | "disputed";

  // Review content
  review_text: string | null;
  rating: number | null;
  review_attachments: Array<{
    file_url: string;
    file_name: string;
    file_type: string;
    file_size: number;
  }> | null;

  // Lifecycle timestamps
  claimed_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  claim_deadline: string | null;
  auto_accept_at: string | null;

  // Payment info
  payment_amount: number | null;
  payment_status: "pending" | "escrowed" | "released" | "refunded" | null;
  payment_released_at: string | null;
  transaction_id: string | null;

  // Acceptance/Rejection
  acceptance_type: "manual" | "auto" | null;
  rejection_reason: string | null;
  rejection_notes: string | null;

  // Quality metrics
  requester_helpful_rating: number | null;

  // Dispute
  is_disputed: boolean;
  dispute_reason: string | null;
  dispute_resolution: string | null;
  dispute_notes: string | null;
  dispute_resolved_at: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Nested review request data
  review_request?: {
    id: number;
    title: string;
    description: string;
    content_type: string;
    review_type: string;
    budget: number | null;
    deadline: string | null;
    status: string;
    user_id: number;
  };
}

export interface ReviewerDashboard {
  active_claims: Array<{
    slot_id: number;
    review_request: {
      id: number;
      title: string;
      description: string;
      content_type: string;
      review_type: string;
      payment_amount: number | null;
    };
    claimed_at: string;
    claim_deadline: string;
    hours_remaining: number;
    has_draft: boolean;
  }>;
  submitted_reviews: Array<{
    slot_id: number;
    review_request: {
      id: number;
      title: string;
      description: string;
      content_type: string;
      review_type: string;
      payment_amount: number | null;
    };
    submitted_at: string;
    auto_accept_at: string;
    days_until_auto_accept: number;
  }>;
  stats: {
    total_reviews: number;
    acceptance_rate: number;
    average_rating: number;
    total_earned: number;
    pending_payment: number;
  };
}

export interface ReviewerEarnings {
  total_earned: number;
  pending_payment: number;
  available_for_withdrawal: number;
  reviews_completed: number;
  average_rating: number | null;
  acceptance_rate: number;
}

export interface ReviewDraft {
  draft_text: string;
  draft_rating: number | null;
  draft_attachments: Array<{
    file_url: string;
    file_name: string;
    file_type: string;
  }>;
}

export interface ReviewSubmission {
  review_text: string;
  rating: number;
  attachments?: Array<{
    file_url: string;
    file_name: string;
    file_type: string;
    file_size: number;
  }>;
}

/**
 * Claim a review slot
 * POST /api/v1/review-slots/{slot_id}/claim
 */
export async function claimReviewSlot(slotId: number): Promise<ReviewSlot> {
  return apiClient.post<ReviewSlot>(`/review-slots/${slotId}/claim`);
}

/**
 * Abandon a claimed review slot
 * POST /api/v1/review-slots/{slot_id}/abandon
 */
export async function abandonReviewSlot(slotId: number): Promise<ReviewSlot> {
  return apiClient.post<ReviewSlot>(`/review-slots/${slotId}/abandon`);
}

/**
 * Get reviewer dashboard data
 * GET /api/v1/reviewer/dashboard
 */
export async function getReviewerDashboard(): Promise<ReviewerDashboard> {
  return apiClient.get<ReviewerDashboard>("/reviewer/dashboard");
}

/**
 * Get all review slots for current reviewer
 * GET /api/v1/review-slots/my-slots
 */
export async function getMyReviews(
  status?: ReviewSlot["status"]
): Promise<ReviewSlot[]> {
  const params = new URLSearchParams();
  if (status) {
    params.append("status", status);
  }

  const endpoint = `/review-slots/my-slots${params.toString() ? `?${params.toString()}` : ""}`;
  return apiClient.get<ReviewSlot[]>(endpoint);
}

/**
 * Get reviewer earnings and statistics
 * GET /api/v1/reviewer/earnings
 */
export async function getEarnings(): Promise<ReviewerEarnings> {
  return apiClient.get<ReviewerEarnings>("/reviewer/earnings");
}

/**
 * Get a specific review slot
 * GET /api/v1/review-slots/{slot_id}
 */
export async function getReviewSlot(slotId: number): Promise<ReviewSlot> {
  return apiClient.get<ReviewSlot>(`/review-slots/${slotId}`);
}

/**
 * Save review draft (auto-save)
 * POST /api/v1/review-slots/{slot_id}/save-draft
 */
export async function saveDraft(
  slotId: number,
  draftData: ReviewDraft
): Promise<{ success: boolean; last_saved_at: string }> {
  return apiClient.post<{ success: boolean; last_saved_at: string }>(
    `/review-slots/${slotId}/save-draft`,
    draftData
  );
}

/**
 * Load saved draft
 * GET /api/v1/review-slots/{slot_id}/draft
 */
export async function loadDraft(slotId: number): Promise<ReviewDraft | null> {
  try {
    return await apiClient.get<ReviewDraft>(`/review-slots/${slotId}/draft`);
  } catch (error) {
    // Return null if no draft exists (404)
    return null;
  }
}

/**
 * Submit review
 * POST /api/v1/review-slots/{slot_id}/submit
 */
export async function submitReview(
  slotId: number,
  reviewData: ReviewSubmission
): Promise<ReviewSlot> {
  return apiClient.post<ReviewSlot>(
    `/review-slots/${slotId}/submit`,
    reviewData
  );
}

/**
 * Utility Functions
 */

/**
 * Calculate hours remaining until deadline
 */
export function calculateHoursRemaining(deadline: string): number {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
}

/**
 * Calculate days remaining until auto-accept
 */
export function calculateDaysRemaining(autoAcceptDate: string): number {
  const now = new Date();
  const autoAccept = new Date(autoAcceptDate);
  const diff = autoAccept.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Format deadline urgency
 */
export function getDeadlineUrgency(
  hoursRemaining: number
): "safe" | "warning" | "danger" {
  if (hoursRemaining < 6) return "danger";
  if (hoursRemaining < 24) return "warning";
  return "safe";
}

/**
 * Format payment amount
 */
export function formatPayment(amount: number | null): string {
  if (amount === null || amount === 0) return "Free";
  return `$${amount.toFixed(2)}`;
}
