/**
 * Portfolio API Service
 * Handles all portfolio-related API requests with cookie-based authentication
 */

import apiClient from "../client";

/**
 * Content type options for portfolio items
 */
export type PortfolioContentType = "design" | "photography" | "video" | "stream" | "audio" | "writing" | "art";

/**
 * Portfolio Item from Backend
 */
export interface PortfolioItem {
  id: number;
  user_id: number;
  review_request_id: number | null; // If set, this is a verified item
  title: string;
  description: string | null;
  content_type: PortfolioContentType;
  image_url: string | null;
  before_image_url: string | null; // Before image for comparison
  project_url: string | null;
  rating: number | null;
  views_count: number;
  is_featured: boolean;
  is_self_documented: boolean; // True if manually uploaded
  is_verified: boolean; // True if linked to a review
  created_at: string;
  updated_at: string;
}

/**
 * Portfolio Slots Response - tracks self-documented item limits
 */
export interface PortfolioSlotsResponse {
  used: number;
  max: number;
  remaining: number;
}

/**
 * Portfolio List Response with Pagination
 */
export interface PortfolioListResponse {
  items: PortfolioItem[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

/**
 * Create Portfolio Item Payload (self-documented)
 */
export interface CreatePortfolioData {
  title: string;
  description?: string;
  content_type: PortfolioContentType;
  image_url?: string; // Main/After image
  before_image_url?: string; // Before image for comparison
  project_url?: string;
  is_featured?: boolean;
}

/**
 * Update Portfolio Item Payload
 */
export interface UpdatePortfolioData {
  title?: string;
  description?: string;
  content_type?: PortfolioContentType;
  image_url?: string;
  before_image_url?: string;
  project_url?: string;
  is_featured?: boolean;
}

/**
 * Portfolio Query Parameters
 */
export interface PortfolioQueryParams {
  content_type?: PortfolioContentType;
  page?: number;
  page_size?: number;
}

/**
 * Create a new portfolio item
 */
export async function createPortfolioItem(data: CreatePortfolioData): Promise<PortfolioItem> {
  return await apiClient.post<PortfolioItem>("/portfolio", data);
}

/**
 * Get a single portfolio item by ID
 */
export async function getPortfolioItem(portfolioId: number): Promise<PortfolioItem> {
  return await apiClient.get<PortfolioItem>(`/portfolio/${portfolioId}`);
}

/**
 * Get all portfolio items for a specific user
 * Supports pagination and filtering by content type
 */
export async function getUserPortfolio(
  userId: number,
  params?: PortfolioQueryParams
): Promise<PortfolioListResponse> {
  const queryString = params
    ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
    : "";
  return await apiClient.get<PortfolioListResponse>(`/portfolio/user/${userId}${queryString}`);
}

/**
 * Get authenticated user's portfolio items
 */
export async function getMyPortfolio(params?: PortfolioQueryParams): Promise<PortfolioListResponse> {
  const queryString = params
    ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
    : "";
  return await apiClient.get<PortfolioListResponse>(`/portfolio/me/items${queryString}`);
}

/**
 * Update a portfolio item
 * Only the owner can update their portfolio items
 */
export async function updatePortfolioItem(
  portfolioId: number,
  data: UpdatePortfolioData
): Promise<PortfolioItem> {
  return await apiClient.put<PortfolioItem>(`/portfolio/${portfolioId}`, data);
}

/**
 * Delete a portfolio item
 * Only the owner can delete their portfolio items
 */
export async function deletePortfolioItem(portfolioId: number): Promise<void> {
  await apiClient.delete<void>(`/portfolio/${portfolioId}`);
}

/**
 * Get featured portfolio items across all users
 */
export async function getFeaturedPortfolio(limit: number = 10): Promise<PortfolioItem[]> {
  return await apiClient.get<PortfolioItem[]>(`/portfolio/featured/all?limit=${limit}`);
}

/**
 * Get self-documented portfolio slots information
 * Shows how many slots are used and remaining (max 3)
 */
export async function getPortfolioSlots(): Promise<PortfolioSlotsResponse> {
  return await apiClient.get<PortfolioSlotsResponse>("/portfolio/slots");
}

/**
 * Featured Slots Response - tracks featured item limits
 */
export interface FeaturedSlotsResponse {
  used: number;
  max: number;
  remaining: number;
}

/**
 * Get featured portfolio slots information
 * Shows how many slots are used and remaining (max 3)
 */
export async function getFeaturedSlots(): Promise<FeaturedSlotsResponse> {
  return await apiClient.get<FeaturedSlotsResponse>("/portfolio/featured/slots");
}

/**
 * Get featured portfolio items for a specific user (public)
 */
export async function getUserFeaturedPortfolio(userId: number): Promise<PortfolioItem[]> {
  return await apiClient.get<PortfolioItem[]>(`/portfolio/featured/user/${userId}`);
}

/**
 * Toggle the featured status of a portfolio item
 * Users can feature up to 3 items to display on their profile
 */
export async function togglePortfolioFeatured(
  portfolioId: number,
  featured: boolean
): Promise<PortfolioItem> {
  return await apiClient.post<PortfolioItem>(`/portfolio/${portfolioId}/feature`, { featured });
}


// ============= Verified Portfolio from Reviews =============

/**
 * File info from an eligible review
 */
export interface EligibleReviewFile {
  id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  file_url: string | null;
}

/**
 * A completed review that can be added to portfolio
 */
export interface EligibleReview {
  id: number;
  title: string;
  description: string;
  content_type: PortfolioContentType;
  created_at: string;
  completed_at: string | null;
  files: EligibleReviewFile[];
  has_portfolio_item: boolean;
}

/**
 * Data for creating a verified portfolio item from a review
 */
export interface CreateVerifiedPortfolioData {
  title?: string; // Override title (uses review title if not provided)
  description?: string; // Override description
  image_url: string; // Required - main image for the portfolio item
  before_image_url?: string; // Optional before image for comparison
  project_url?: string; // Optional external project URL
}

/**
 * Get user's completed reviews that can be added to portfolio
 */
export async function getEligibleReviews(): Promise<EligibleReview[]> {
  return await apiClient.get<EligibleReview[]>("/portfolio/eligible-reviews");
}

/**
 * Create a verified portfolio item from a completed review
 */
export async function createPortfolioFromReview(
  reviewRequestId: number,
  data: CreateVerifiedPortfolioData
): Promise<PortfolioItem> {
  return await apiClient.post<PortfolioItem>(`/portfolio/from-review/${reviewRequestId}`, data);
}
