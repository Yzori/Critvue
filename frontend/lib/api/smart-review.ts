/**
 * API client for Smart Adaptive Review Editor and Review Studio
 */

import apiClient from './client';
import {
  SmartReviewDraft,
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
