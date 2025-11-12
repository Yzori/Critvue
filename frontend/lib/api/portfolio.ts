/**
 * Portfolio API Service
 * Handles all portfolio-related API requests with cookie-based authentication
 */

import apiClient from "./client";

/**
 * Content type options for portfolio items
 */
export type PortfolioContentType = "design" | "code" | "video" | "audio" | "writing" | "art";

/**
 * Portfolio Item from Backend
 */
export interface PortfolioItem {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  content_type: PortfolioContentType;
  image_url: string | null;
  project_url: string | null;
  rating: number | null;
  views_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
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
 * Create Portfolio Item Payload
 */
export interface CreatePortfolioData {
  title: string;
  description?: string;
  content_type: PortfolioContentType;
  image_url?: string;
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
