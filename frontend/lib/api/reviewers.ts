/**
 * Reviewers Directory API Client
 */

import apiClient from './client';

// ==================== Types ====================

export interface ReviewerEntry {
  userId: number;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  title: string | null;
  bio: string | null;
  reviewerTagline: string | null;
  userTier: string;
  specialtyTags: string[];
  availability: 'available' | 'busy' | 'unavailable';
  totalReviewsGiven: number;
  acceptedReviewsCount: number;
  acceptanceRate: number | null;
  avgRating: number | null;
  avgResponseTimeHours: number | null;
  karmaPoints: number;
  currentStreak: number;
}

export interface ReviewerDirectoryMetadata {
  totalEntries: number;
  limit: number;
  offset: number;
  tierFilter: string | null;
  specialtyFilter: string | null;
  sortBy: string;
}

export interface ReviewerDirectoryResponse {
  reviewers: ReviewerEntry[];
  metadata: ReviewerDirectoryMetadata;
}

export interface SpecialtyCount {
  tag: string;
  count: number;
}

export interface ReviewerFiltersResponse {
  tiers: string[];
  specialties: SpecialtyCount[];
  totalReviewers: number;
}

export type ReviewerSortBy = 'karma' | 'rating' | 'reviews' | 'response_time' | 'acceptance_rate';
export type SortOrder = 'asc' | 'desc';

export interface GetReviewersParams {
  search?: string;
  tier?: string;
  specialty?: string;
  minReviews?: number;
  minRating?: number;
  sortBy?: ReviewerSortBy;
  sortOrder?: SortOrder;
  limit?: number;
  offset?: number;
}

// ==================== API Response Types (snake_case from backend) ====================

interface ApiReviewerEntry {
  user_id: number;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  title: string | null;
  bio: string | null;
  reviewer_tagline: string | null;
  user_tier: string;
  specialty_tags: string[];
  availability: string;
  total_reviews_given: number;
  accepted_reviews_count: number;
  acceptance_rate: number | null;
  avg_rating: number | null;
  avg_response_time_hours: number | null;
  karma_points: number;
  current_streak: number;
}

interface ApiReviewerDirectoryMetadata {
  total_entries: number;
  limit: number;
  offset: number;
  tier_filter: string | null;
  specialty_filter: string | null;
  sort_by: string;
}

interface ApiReviewerDirectoryResponse {
  reviewers: ApiReviewerEntry[];
  metadata: ApiReviewerDirectoryMetadata;
}

interface ApiReviewerFiltersResponse {
  tiers: string[];
  specialties: { tag: string; count: number }[];
  total_reviewers: number;
}

// ==================== Transform Functions ====================

function transformReviewer(api: ApiReviewerEntry): ReviewerEntry {
  return {
    userId: api.user_id,
    username: api.username,
    fullName: api.full_name,
    avatarUrl: api.avatar_url,
    title: api.title,
    bio: api.bio,
    reviewerTagline: api.reviewer_tagline,
    userTier: api.user_tier,
    specialtyTags: api.specialty_tags,
    availability: api.availability as ReviewerEntry['availability'],
    totalReviewsGiven: api.total_reviews_given,
    acceptedReviewsCount: api.accepted_reviews_count,
    acceptanceRate: api.acceptance_rate,
    avgRating: api.avg_rating,
    avgResponseTimeHours: api.avg_response_time_hours,
    karmaPoints: api.karma_points,
    currentStreak: api.current_streak,
  };
}

// ==================== API Functions ====================

/**
 * Get reviewer directory with filters
 */
export async function getReviewers(params: GetReviewersParams = {}): Promise<ReviewerDirectoryResponse> {
  const queryParams = new URLSearchParams();

  if (params.search) queryParams.set('search', params.search);
  if (params.tier) queryParams.set('tier', params.tier);
  if (params.specialty) queryParams.set('specialty', params.specialty);
  if (params.minReviews !== undefined) queryParams.set('min_reviews', params.minReviews.toString());
  if (params.minRating !== undefined) queryParams.set('min_rating', params.minRating.toString());
  if (params.sortBy) queryParams.set('sort_by', params.sortBy);
  if (params.sortOrder) queryParams.set('sort_order', params.sortOrder);
  if (params.limit !== undefined) queryParams.set('limit', params.limit.toString());
  if (params.offset !== undefined) queryParams.set('offset', params.offset.toString());

  const url = `/reviewers?${queryParams.toString()}`;
  const response = await apiClient.get<ApiReviewerDirectoryResponse>(url);

  return {
    reviewers: response.reviewers.map(transformReviewer),
    metadata: {
      totalEntries: response.metadata.total_entries,
      limit: response.metadata.limit,
      offset: response.metadata.offset,
      tierFilter: response.metadata.tier_filter,
      specialtyFilter: response.metadata.specialty_filter,
      sortBy: response.metadata.sort_by,
    },
  };
}

/**
 * Get available filters for reviewer directory
 */
export async function getReviewerFilters(): Promise<ReviewerFiltersResponse> {
  const response = await apiClient.get<ApiReviewerFiltersResponse>('/reviewers/filters');

  return {
    tiers: response.tiers,
    specialties: response.specialties,
    totalReviewers: response.total_reviewers,
  };
}
