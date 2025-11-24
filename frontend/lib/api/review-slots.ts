/**
 * Review Slots API Client
 * Handles all review slot-related API requests for the complete review lifecycle
 */

import apiClient from "./client";

// ===== Enums matching backend =====

export type ReviewSlotStatus =
  | "available"
  | "claimed"
  | "submitted"
  | "accepted"
  | "rejected"
  | "abandoned"
  | "disputed";

export type AcceptanceType = "manual" | "auto";

export type RejectionReason =
  | "low_quality"
  | "off_topic"
  | "spam"
  | "abusive"
  | "other";

export type PaymentStatus = "pending" | "escrowed" | "released" | "refunded";

export type DisputeResolution = "admin_accepted" | "admin_rejected";

// ===== Request Interfaces =====

export interface SubmitReviewRequest {
  review_text: string; // Min 50 chars
  rating: number; // 1-5 stars
  attachments?: Array<{
    filename: string;
    url: string;
    type: string;
  }>;
}

export interface AcceptReviewRequest {
  helpful_rating?: number; // Optional 1-5 rating
}

export interface RejectReviewRequest {
  rejection_reason: RejectionReason;
  rejection_notes?: string; // Required if reason is "other"
}

export interface DisputeReviewRequest {
  dispute_reason: string; // Min 20 chars
}

// ===== Response Interfaces =====

export interface ReviewerInfo {
  id: number;
  full_name?: string;
  avatar_url?: string;
}

export interface ReviewSlotResponse {
  id: number;
  review_request_id: number;
  reviewer_id?: number;
  status: ReviewSlotStatus;

  // Lifecycle timestamps
  claimed_at?: string; // ISO datetime
  submitted_at?: string;
  reviewed_at?: string;
  claim_deadline?: string;
  auto_accept_at?: string;

  // Review content (only visible after submission)
  review_text?: string;
  rating?: number;
  review_attachments?: any[];

  // Acceptance/Rejection metadata
  acceptance_type?: AcceptanceType;
  rejection_reason?: RejectionReason;
  rejection_notes?: string;

  // Dispute info
  is_disputed: boolean;
  dispute_reason?: string;
  dispute_resolved_at?: string;
  dispute_resolution?: DisputeResolution;

  // Payment info
  payment_amount?: number;
  payment_status?: PaymentStatus;
  payment_released_at?: string;

  // Quality metrics
  requester_helpful_rating?: number;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Optional reviewer info
  reviewer?: ReviewerInfo;
}

export interface ReviewSlotWithRequest extends ReviewSlotResponse {
  review_request: {
    id: number;
    title: string;
    content_type: string;
    review_type: "free" | "expert";
    created_at: string;
  };
}

export interface ReviewSlotListResponse {
  items: ReviewSlotResponse[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

export interface ReviewSlotStats {
  total_slots: number;
  available: number;
  claimed: number;
  submitted: number;
  accepted: number;
  rejected: number;
  abandoned: number;
  disputed: number;
}

// ===== API Functions =====

/**
 * Claim a review slot (reviewer action)
 */
export async function claimReviewSlot(slotId: number): Promise<ReviewSlotResponse> {
  return apiClient.post<ReviewSlotResponse>(`/review-slots/${slotId}/claim`, {});
}

/**
 * Submit a review for a claimed slot (reviewer action)
 */
export async function submitReview(
  slotId: number,
  data: SubmitReviewRequest
): Promise<ReviewSlotResponse> {
  return apiClient.post<ReviewSlotResponse>(`/review-slots/${slotId}/submit`, data);
}

/**
 * Accept a submitted review (requester action)
 */
export async function acceptReview(
  slotId: number,
  data?: AcceptReviewRequest
): Promise<ReviewSlotResponse> {
  return apiClient.post<ReviewSlotResponse>(`/review-slots/${slotId}/accept`, data || {});
}

/**
 * Reject a submitted review (requester action)
 */
export async function rejectReview(
  slotId: number,
  data: RejectReviewRequest
): Promise<ReviewSlotResponse> {
  return apiClient.post<ReviewSlotResponse>(`/review-slots/${slotId}/reject`, data);
}

/**
 * Abandon a claimed review slot (reviewer action)
 */
export async function abandonReviewSlot(slotId: number): Promise<ReviewSlotResponse> {
  return apiClient.post<ReviewSlotResponse>(`/review-slots/${slotId}/abandon`, {});
}

/**
 * Dispute a rejection (reviewer action)
 */
export async function disputeRejection(
  slotId: number,
  data: DisputeReviewRequest
): Promise<ReviewSlotResponse> {
  return apiClient.post<ReviewSlotResponse>(`/review-slots/${slotId}/dispute`, data);
}

/**
 * Get all review slots for a specific review request (requester view)
 */
export async function getRequestSlots(
  requestId: number
): Promise<ReviewSlotResponse[]> {
  return apiClient.get<ReviewSlotResponse[]>(`/review-requests/${requestId}/slots`);
}

/**
 * Get all review slots claimed/submitted by the current user (reviewer dashboard)
 */
export async function getMyReviewSlots(
  status?: ReviewSlotStatus
): Promise<ReviewSlotWithRequest[]> {
  const params = status ? { status } : {};
  return apiClient.get<ReviewSlotWithRequest[]>("/review-slots/my-slots", params);
}

/**
 * Get a single review slot by ID
 */
export async function getReviewSlot(slotId: number): Promise<ReviewSlotResponse> {
  return apiClient.get<ReviewSlotResponse>(`/review-slots/${slotId}`);
}

/**
 * Get statistics for review slots (admin/analytics)
 */
export async function getReviewSlotStats(): Promise<ReviewSlotStats> {
  return apiClient.get<ReviewSlotStats>("/review-slots/stats");
}

/**
 * Get pending reviews that need action from requester
 * Returns all submitted review slots for the current user's review requests,
 * ordered by urgency (most urgent first)
 */
export async function getPendingReviewsForRequester(): Promise<ReviewSlotWithRequest[]> {
  return apiClient.get<ReviewSlotWithRequest[]>("/review-slots/pending-for-me");
}

/**
 * Get count of urgent pending reviews (< 24h to auto-accept)
 * Returns slots that need immediate attention from the requester
 */
export async function getUrgentPendingCount(): Promise<{ count: number; slots: ReviewSlotWithRequest[] }> {
  return apiClient.get<{ count: number; slots: ReviewSlotWithRequest[] }>(
    "/review-slots/urgent-pending"
  );
}

/**
 * Accept a submitted review
 * Requester accepts the review and optionally provides a rating and testimonial
 */
export async function acceptReviewSlot(
  slotId: number,
  data: {
    rating?: number;
    aspects: {
      thorough: boolean;
      addressed_questions: boolean;
      actionable: boolean;
      professional: boolean;
    };
    testimonial?: string;
  }
): Promise<ReviewSlotResponse> {
  return apiClient.post<ReviewSlotResponse>(`/review-slots/${slotId}/accept`, {
    helpful_rating: data.rating,
    // Note: aspects and testimonial are not used by backend yet, but included for future expansion
  });
}

/**
 * Reject a submitted review
 * Requester rejects the review with a required reason
 */
export async function rejectReviewSlot(
  slotId: number,
  data: {
    rejection_reason: string;
    rejection_notes?: string;
  }
): Promise<ReviewSlotResponse> {
  return apiClient.post<ReviewSlotResponse>(`/review-slots/${slotId}/reject`, data);
}
