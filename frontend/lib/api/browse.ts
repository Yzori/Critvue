/**
 * Browse API Client
 * Handles all browse marketplace API requests
 */

import apiClient from "./client";
import { ContentType, ReviewType } from "./reviews";

// Browse review item with extended metadata
export interface BrowseReviewItem {
  id: number;
  title: string;
  description: string;
  content_type: ContentType;
  review_type: ReviewType;
  status: string;
  created_at: string;
  updated_at: string;
  deadline?: string;
  price?: number;
  currency?: string;
  skills?: string[];
  preview_image_url?: string;
  creator_username?: string;
  creator_rating?: number;
  is_featured?: boolean;
  urgency?: "low" | "medium" | "high";
  reviews_requested?: number; // Number of reviews requested (1-10)
  reviews_claimed?: number; // Number of reviews claimed by reviewers
  available_slots?: number; // Computed: reviews_requested - reviews_claimed
}

// Browse response with pagination
export interface BrowseResponse {
  items: BrowseReviewItem[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// Browse request parameters
export interface BrowseParams {
  content_type?: ContentType | "all";
  review_type?: ReviewType | "all";
  sort_by?: "recent" | "price_high" | "price_low" | "deadline";
  deadline?: "urgent" | "week" | "month";
  limit?: number;
  offset?: number;
  search?: string;
}

/**
 * Get browse reviews from the marketplace
 * Public endpoint - no authentication required
 */
export async function getBrowseReviews(params?: BrowseParams): Promise<BrowseResponse> {
  // Build query string from params
  const queryParams = new URLSearchParams();

  if (params?.content_type && params.content_type !== "all") {
    queryParams.append("content_type", params.content_type);
  }

  if (params?.review_type && params.review_type !== "all") {
    queryParams.append("review_type", params.review_type);
  }

  if (params?.sort_by) {
    queryParams.append("sort_by", params.sort_by);
  }

  if (params?.deadline) {
    queryParams.append("deadline", params.deadline);
  }

  if (params?.search) {
    queryParams.append("search", params.search);
  }

  if (params?.limit) {
    queryParams.append("limit", params.limit.toString());
  }

  if (params?.offset) {
    queryParams.append("offset", params.offset.toString());
  }

  const queryString = queryParams.toString();
  const endpoint = `/reviews/browse${queryString ? `?${queryString}` : ""}`;

  // Backend returns { reviews, total, limit, offset }
  // Map to { items, total, limit, offset, has_more }
  const response = await apiClient.get<{ reviews: BrowseReviewItem[]; total: number; limit: number; offset: number }>(endpoint);

  return {
    items: response.reviews || [],
    total: response.total || 0,
    limit: response.limit || 50,
    offset: response.offset || 0,
    has_more: (response.offset || 0) + (response.reviews?.length || 0) < (response.total || 0),
  };
}

/**
 * Get a single review from browse (for detail view)
 */
export async function getBrowseReview(id: number): Promise<BrowseReviewItem> {
  return apiClient.get<BrowseReviewItem>(`/reviews/browse/${id}`);
}

/**
 * Claim a review slot (requires authentication)
 * For reviews with multiple slots, claims one available slot
 */
export async function claimReviewSlot(id: number): Promise<{ success: boolean; message: string }> {
  return apiClient.post<{ success: boolean; message: string }>(`/reviews/${id}/claim`);
}
