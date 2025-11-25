/**
 * Profile API Service
 * Handles all profile-related API requests with cookie-based authentication
 */

import apiClient from "./client";

/**
 * Backend Profile Response
 * This matches the exact structure returned from the backend
 */
export interface ProfileResponse {
  id: number;
  email: string;
  full_name: string | null;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: string;
  is_verified: boolean;
  specialty_tags: string[];
  badges: string[];
  total_reviews_given: number;
  total_reviews_received: number;
  avg_rating: number | null;
  avg_response_time_hours: number | null;
  user_tier: string;
  karma_points: number;
  tier_achieved_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Frontend Profile Data
 * This matches the interface used in the profile page component
 */
export interface ProfileData {
  id: string;
  username: string;
  full_name: string;
  title: string;
  bio: string;
  avatar_url?: string;
  rating: number;
  total_reviews_given: number;
  total_reviews_received: number;
  avg_response_time_hours: number;
  member_since: string;
  verified: boolean;
  badges: string[];
  specialty_tags: string[];
  user_tier: string;
  karma_points: number;
  tier_achieved_at?: string;
}

/**
 * Profile Update Payload
 */
export interface ProfileUpdateData {
  title?: string;
  bio?: string;
  specialty_tags?: string[];
}

/**
 * Profile Stats Response
 */
export interface ProfileStats {
  total_reviews_given: number;
  total_reviews_received: number;
  avg_rating: number | null;
  avg_response_time_hours: number | null;
  member_since: string;
}

/**
 * Badges Response
 */
export interface BadgesResponse {
  badges: string[];
  total: number;
}

/**
 * Avatar Upload Response
 */
export interface AvatarUploadResponse {
  avatar_url: string;
  message: string;
}

/**
 * Transform backend profile response to frontend format
 * Maps different field names and types
 */
export function transformProfileResponse(response: ProfileResponse): ProfileData {
  return {
    id: response.id.toString(),
    username: response.email.split("@")[0], // Extract username from email
    full_name: response.full_name || "Anonymous User",
    title: response.title || "New Member",
    bio: response.bio || "",
    avatar_url: response.avatar_url || undefined,
    rating: response.avg_rating ? Number(response.avg_rating) : 0,
    total_reviews_given: response.total_reviews_given,
    total_reviews_received: response.total_reviews_received,
    avg_response_time_hours: response.avg_response_time_hours || 0,
    member_since: response.created_at,
    verified: response.is_verified,
    badges: response.badges,
    specialty_tags: response.specialty_tags,
    user_tier: response.user_tier,
    karma_points: response.karma_points,
    tier_achieved_at: response.tier_achieved_at || undefined,
  };
}

/**
 * Get authenticated user's own profile
 */
export async function getMyProfile(): Promise<ProfileData> {
  const response = await apiClient.get<ProfileResponse>("/profile/me");
  return transformProfileResponse(response);
}

/**
 * Get any user's public profile by user ID
 */
export async function getUserProfile(userId: number): Promise<ProfileData> {
  const response = await apiClient.get<ProfileResponse>(`/profile/${userId}`);
  return transformProfileResponse(response);
}

/**
 * Update authenticated user's profile
 */
export async function updateProfile(data: ProfileUpdateData): Promise<ProfileData> {
  const response = await apiClient.put<ProfileResponse>("/profile/me", data);
  return transformProfileResponse(response);
}

/**
 * Upload avatar image
 * Note: Uses multipart/form-data for file upload
 */
export async function uploadAvatar(file: File): Promise<AvatarUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  // Override default JSON content-type for multipart/form-data
  const response = await apiClient<AvatarUploadResponse>("/profile/me/avatar", {
    method: "POST",
    body: formData,
    headers: {}, // Don't set Content-Type - browser will set it automatically with boundary
  });

  return response;
}

/**
 * Get detailed stats for a user
 */
export async function getProfileStats(userId: number): Promise<ProfileStats> {
  return await apiClient.get<ProfileStats>(`/profile/${userId}/stats`);
}

/**
 * Recalculate and refresh authenticated user's stats
 */
export async function refreshMyStats(): Promise<ProfileStats> {
  return await apiClient.post<ProfileStats>("/profile/me/stats/refresh");
}

/**
 * Get user's achievement badges
 */
export async function getProfileBadges(userId: number): Promise<BadgesResponse> {
  return await apiClient.get<BadgesResponse>(`/profile/${userId}/badges`);
}

/**
 * Reviewer DNA Response
 * Represents a reviewer's unique style fingerprint
 */
export interface ReviewerDNAResponse {
  user_id: number;
  overall_score: number;
  dimensions: {
    name: string;
    key: string;
    value: number;
  }[];
  strengths: string[];
  growth_areas: string[];
  reviews_analyzed: number;
  version: number;
  calculated_at: string | null;
  has_sufficient_data: boolean;
}

/**
 * DNA Comparison Response
 * Compares user's DNA to platform average
 */
export interface DNAComparisonResponse {
  comparison_available: boolean;
  speed?: { user: number; average: number; diff: number };
  depth?: { user: number; average: number; diff: number };
  specificity?: { user: number; average: number; diff: number };
  constructiveness?: { user: number; average: number; diff: number };
  technical?: { user: number; average: number; diff: number };
  encouragement?: { user: number; average: number; diff: number };
  overall?: { user: number; average: number; diff: number };
}

/**
 * Get authenticated user's Reviewer DNA profile
 */
export async function getMyDNA(): Promise<ReviewerDNAResponse> {
  return await apiClient.get<ReviewerDNAResponse>("/profile/me/dna");
}

/**
 * Get any user's Reviewer DNA profile by user ID
 */
export async function getUserDNA(userId: number): Promise<ReviewerDNAResponse> {
  return await apiClient.get<ReviewerDNAResponse>(`/profile/${userId}/dna`);
}

/**
 * Recalculate authenticated user's Reviewer DNA
 */
export async function recalculateMyDNA(): Promise<ReviewerDNAResponse> {
  return await apiClient.post<ReviewerDNAResponse>("/profile/me/dna/recalculate");
}

/**
 * Compare authenticated user's DNA to platform average
 */
export async function compareDNA(): Promise<DNAComparisonResponse> {
  return await apiClient.get<DNAComparisonResponse>("/profile/me/dna/compare");
}
