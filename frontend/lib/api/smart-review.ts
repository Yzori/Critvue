/**
 * API client for Smart Adaptive Review Editor and Review Studio
 */

import apiClient from './client';
import {
  SmartReviewDraft,
  SmartReviewSubmit,
  ContentRubric,
} from '@/lib/types/smart-review';
import type { ReviewStudioState } from '@/lib/types/review-studio';

/**
 * Get rubric configuration for a content type and optional subcategory
 */
export async function getRubric(contentType: string, subcategory?: string | null): Promise<ContentRubric> {
  const params = subcategory ? `?subcategory=${subcategory}` : '';
  return apiClient.get<ContentRubric>(`/review-slots/rubrics/${contentType}${params}`);
}

/**
 * Save Smart Review draft (auto-save)
 */
export async function saveSmartReviewDraft(
  slotId: number,
  draft: SmartReviewDraft
): Promise<{ success: boolean; last_saved_at: string }> {
  return apiClient.post<{ success: boolean; last_saved_at: string }>(
    `/review-slots/${slotId}/smart-review/save-draft`,
    draft
  );
}

/**
 * Get Smart Review draft
 */
export async function getSmartReviewDraft(slotId: number): Promise<SmartReviewDraft> {
  return apiClient.get<SmartReviewDraft>(`/review-slots/${slotId}/smart-review/draft`);
}

/**
 * Submit Smart Review
 */
export async function submitSmartReview(
  slotId: number,
  reviewData: SmartReviewSubmit
): Promise<any> {
  return apiClient.post(`/review-slots/${slotId}/smart-review/submit`, reviewData);
}


// ===== Review Studio (Card-Based) API =====
// These endpoints work with ReviewStudioState directly, without conversion


/**
 * Save Review Studio draft directly (no conversion)
 */
export async function saveStudioDraft(
  slotId: number,
  state: Partial<ReviewStudioState>
): Promise<{ success: boolean; last_saved_at: string }> {
  return apiClient.post<{ success: boolean; last_saved_at: string }>(
    `/review-slots/${slotId}/studio/save-draft`,
    state
  );
}

/**
 * Get Review Studio draft directly (no conversion)
 * Works for both reviewers (own drafts) and creators (submitted reviews)
 */
export async function getStudioDraft(slotId: number): Promise<Partial<ReviewStudioState>> {
  return apiClient.get<Partial<ReviewStudioState>>(`/review-slots/${slotId}/studio/draft`);
}

/**
 * Submit Review Studio review
 */
export async function submitStudioReview(
  slotId: number,
  state: Partial<ReviewStudioState>
): Promise<any> {
  return apiClient.post(`/review-slots/${slotId}/studio/submit`, state);
}
