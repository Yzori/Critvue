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
