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
  username: string | null;  // SEO-friendly URL identifier
  full_name: string | null;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  specialty_tags: string[];
  badges: string[];
  total_reviews_given: number;
  total_reviews_received: number;
  avg_rating: number | null;
  avg_response_time_hours: number | null;
  user_tier: string;
  sparks_points: number;
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
  sparks_points: number;
  tier_achieved_at?: string;
  role?: "creator" | "reviewer" | "admin";
}

/**
 * Profile Update Payload
 */
export interface ProfileUpdateData {
  full_name?: string;
  username?: string;
  title?: string;
  bio?: string;
  specialty_tags?: string[];
}

/**
 * Username availability check response
 */
export interface UsernameCheckResponse {
  available: boolean;
  username: string;
  reason: string | null;
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
    // Use actual username if set, otherwise fallback to email prefix
    username: response.username || response.email.split("@")[0] || "user",
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
    sparks_points: response.sparks_points,
    tier_achieved_at: response.tier_achieved_at || undefined,
    role: response.role as "creator" | "reviewer" | "admin",
  };
}

/**
 * Helper function to get the profile URL identifier (username or ID)
 * Prefers username for SEO, falls back to ID if username not set
 */
export function getProfileIdentifier(profile: ProfileData): string {
  // If username looks like a real username (not just email prefix), use it
  // Real usernames must be set by the user and won't contain @
  return profile.username.includes('@') ? profile.id : profile.username;
}

/**
 * Get authenticated user's own profile
 */
export async function getMyProfile(): Promise<ProfileData> {
  const response = await apiClient.get<ProfileResponse>("/profile/me");
  return transformProfileResponse(response);
}

/**
 * Get any user's public profile by user ID or username
 * @param identifier - User ID (numeric) or username (alphanumeric)
 */
export async function getUserProfile(identifier: string | number): Promise<ProfileData> {
  const response = await apiClient.get<ProfileResponse>(`/profile/${identifier}`);
  return transformProfileResponse(response);
}

/**
 * Check if a username is available
 * @param username - The username to check
 */
export async function checkUsernameAvailability(username: string): Promise<UsernameCheckResponse> {
  return await apiClient.get<UsernameCheckResponse>(`/profile/check-username/${username}`);
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
 * @param identifier - User ID (numeric) or username (alphanumeric)
 */
export async function getProfileStats(identifier: string | number): Promise<ProfileStats> {
  return await apiClient.get<ProfileStats>(`/profile/${identifier}/stats`);
}

/**
 * Recalculate and refresh authenticated user's stats
 */
export async function refreshMyStats(): Promise<ProfileStats> {
  return await apiClient.post<ProfileStats>("/profile/me/stats/refresh");
}

/**
 * Get user's achievement badges
 * @param identifier - User ID (numeric) or username (alphanumeric)
 */
export async function getProfileBadges(identifier: string | number): Promise<BadgesResponse> {
  return await apiClient.get<BadgesResponse>(`/profile/${identifier}/badges`);
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
 * Get any user's Reviewer DNA profile by user ID or username
 * @param identifier - User ID (numeric) or username (alphanumeric)
 */
export async function getUserDNA(identifier: string | number): Promise<ReviewerDNAResponse> {
  return await apiClient.get<ReviewerDNAResponse>(`/profile/${identifier}/dna`);
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
