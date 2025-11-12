/**
 * Reviews API Client
 * Handles all review-related API requests
 */

import apiClient from "./client";

// Content type options for reviews
export type ContentType = "design" | "code" | "video" | "audio" | "writing" | "art";

// Review type options
export type ReviewType = "free" | "expert";

// Request payload for creating a review
export interface CreateReviewRequest {
  title: string;
  description: string;
  content_type: ContentType;
  review_type: ReviewType;
  reviews_requested?: number; // Number of reviews requested (1-10)
  budget?: number; // Budget for expert reviews
  deadline?: string; // ISO 8601 datetime string
  feedback_areas?: string; // Feedback areas
}

// Response from creating a review
export interface CreateReviewResponse {
  id: number;
  title: string;
  description: string;
  content_type: ContentType;
  review_type: ReviewType;
  status: string;
  created_at: string;
  updated_at: string;
  reviews_requested?: number; // Number of reviews requested (1-10)
  reviews_claimed?: number; // Number of reviews claimed by reviewers
  available_slots?: number; // Computed: reviews_requested - reviews_claimed
  budget?: number; // Budget for expert reviews
  deadline?: string; // ISO 8601 datetime string
}

/**
 * Create a new review request
 */
export async function createReview(data: CreateReviewRequest): Promise<CreateReviewResponse> {
  return apiClient.post<CreateReviewResponse>("/reviews", data);
}

/**
 * Get all reviews for the current user
 */
export async function getReviews(): Promise<CreateReviewResponse[]> {
  return apiClient.get<CreateReviewResponse[]>("/reviews");
}

/**
 * Get a single review by ID
 */
export async function getReview(id: number): Promise<CreateReviewResponse> {
  return apiClient.get<CreateReviewResponse>(`/reviews/${id}`);
}

// ===== Review Detail Types =====

// Review slot statuses
export type ReviewSlotStatus =
  | "available"
  | "claimed"
  | "submitted"
  | "accepted"
  | "rejected"
  | "abandoned"
  | "disputed";

// Review file information
export interface ReviewFile {
  id: number;
  review_request_id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  file_url?: string;
  file_path?: string;
  content_hash?: string;
  uploaded_at: string;
}

// Review slot information
export interface ReviewSlot {
  id: number;
  review_request_id: number;
  reviewer_id?: number;
  reviewer_username?: string;
  reviewer_avatar?: string;
  status: ReviewSlotStatus;
  claimed_at?: string;
  submitted_at?: string;
  reviewed_at?: string;
  claim_deadline?: string;
  auto_accept_at?: string;
  review_text?: string;
  rating?: number;
  review_attachments?: string;
  acceptance_type?: "manual" | "auto";
  rejection_reason?: string;
  rejection_notes?: string;
  payment_amount?: number;
  payment_status?: "pending" | "escrowed" | "released" | "refunded";
  created_at: string;
  updated_at: string;
}

// Detailed review request with all relationships
export interface ReviewRequestDetail extends CreateReviewResponse {
  user_id: number;
  requester_username?: string;
  requester_avatar?: string;
  feedback_areas?: string;
  files: ReviewFile[];
  slots: ReviewSlot[];
  reviews_completed?: number;
}

/**
 * Get detailed review request by ID (includes files and slots)
 */
export async function getReviewDetail(id: number): Promise<ReviewRequestDetail> {
  return apiClient.get<ReviewRequestDetail>(`/reviews/${id}`);
}

// Update review request payload
export interface UpdateReviewRequest {
  title?: string;
  description?: string;
  content_type?: ContentType;
  review_type?: ReviewType;
  status?: string;
  reviews_requested?: number;
  budget?: number;
  deadline?: string;
  feedback_areas?: string;
}

/**
 * Update an existing review request
 */
export async function updateReview(id: number, data: UpdateReviewRequest): Promise<CreateReviewResponse> {
  return apiClient.patch<CreateReviewResponse>(`/reviews/${id}`, data);
}
