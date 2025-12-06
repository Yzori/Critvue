/**
 * Onboarding API Client
 * Handles user onboarding flow and reviewer directory settings
 */

import apiClient from './client';

// ==================== Types ====================

export type PrimaryInterest = 'creator' | 'reviewer' | 'both';
export type ReviewerAvailability = 'available' | 'busy' | 'unavailable';

export interface OnboardingStatus {
  onboardingCompleted: boolean;
  primaryInterest: PrimaryInterest | null;
  isListedAsReviewer: boolean;
  reviewerAvailability: ReviewerAvailability;
  reviewerTagline: string | null;
}

export interface OnboardingCompleteRequest {
  primaryInterest: PrimaryInterest;
  listAsReviewer: boolean;
  reviewerTagline?: string;
}

export interface OnboardingCompleteResponse {
  success: boolean;
  message: string;
  onboardingCompleted: boolean;
  primaryInterest: PrimaryInterest;
  isListedAsReviewer: boolean;
}

export interface ReviewerSettings {
  isListedAsReviewer: boolean;
  reviewerAvailability: ReviewerAvailability;
  reviewerTagline: string | null;
}

export interface ReviewerSettingsUpdate {
  isListedAsReviewer?: boolean;
  reviewerAvailability?: ReviewerAvailability;
  reviewerTagline?: string;
}

// ==================== API Response Types (snake_case from backend) ====================

interface ApiOnboardingStatus {
  onboarding_completed: boolean;
  primary_interest: string | null;
  is_listed_as_reviewer: boolean;
  reviewer_availability: string;
  reviewer_tagline: string | null;
}

interface ApiOnboardingCompleteResponse {
  success: boolean;
  message: string;
  onboarding_completed: boolean;
  primary_interest: string;
  is_listed_as_reviewer: boolean;
}

interface ApiReviewerSettings {
  is_listed_as_reviewer: boolean;
  reviewer_availability: string;
  reviewer_tagline: string | null;
}

// ==================== Transform Functions ====================

function transformOnboardingStatus(api: ApiOnboardingStatus): OnboardingStatus {
  return {
    onboardingCompleted: api.onboarding_completed,
    primaryInterest: api.primary_interest as PrimaryInterest | null,
    isListedAsReviewer: api.is_listed_as_reviewer,
    reviewerAvailability: api.reviewer_availability as ReviewerAvailability,
    reviewerTagline: api.reviewer_tagline,
  };
}

function transformOnboardingCompleteResponse(api: ApiOnboardingCompleteResponse): OnboardingCompleteResponse {
  return {
    success: api.success,
    message: api.message,
    onboardingCompleted: api.onboarding_completed,
    primaryInterest: api.primary_interest as PrimaryInterest,
    isListedAsReviewer: api.is_listed_as_reviewer,
  };
}

function transformReviewerSettings(api: ApiReviewerSettings): ReviewerSettings {
  return {
    isListedAsReviewer: api.is_listed_as_reviewer,
    reviewerAvailability: api.reviewer_availability as ReviewerAvailability,
    reviewerTagline: api.reviewer_tagline,
  };
}

// ==================== API Functions ====================

/**
 * Get current user's onboarding status
 */
export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const response = await apiClient.get<ApiOnboardingStatus>('/profile/me/onboarding');
  return transformOnboardingStatus(response);
}

/**
 * Complete user onboarding
 */
export async function completeOnboarding(data: OnboardingCompleteRequest): Promise<OnboardingCompleteResponse> {
  const response = await apiClient.post<ApiOnboardingCompleteResponse>('/profile/me/onboarding', {
    primary_interest: data.primaryInterest,
    list_as_reviewer: data.listAsReviewer,
    reviewer_tagline: data.reviewerTagline,
  });
  return transformOnboardingCompleteResponse(response);
}

/**
 * Get current user's reviewer settings
 */
export async function getReviewerSettings(): Promise<ReviewerSettings> {
  const response = await apiClient.get<ApiReviewerSettings>('/profile/me/reviewer-settings');
  return transformReviewerSettings(response);
}

/**
 * Update current user's reviewer settings
 */
export async function updateReviewerSettings(data: ReviewerSettingsUpdate): Promise<ReviewerSettings> {
  const payload: Record<string, unknown> = {};

  if (data.isListedAsReviewer !== undefined) {
    payload.is_listed_as_reviewer = data.isListedAsReviewer;
  }
  if (data.reviewerAvailability !== undefined) {
    payload.reviewer_availability = data.reviewerAvailability;
  }
  if (data.reviewerTagline !== undefined) {
    payload.reviewer_tagline = data.reviewerTagline;
  }

  const response = await apiClient.put<ApiReviewerSettings>('/profile/me/reviewer-settings', payload);
  return transformReviewerSettings(response);
}
