/**
 * API client for Smart Adaptive Review Editor
 */

import apiClient from './client';
import {
  SmartReviewDraft,
  SmartReviewSubmit,
  ContentRubric,
} from '@/lib/types/smart-review';

/**
 * Get rubric configuration for a content type
 */
export async function getRubric(contentType: string): Promise<ContentRubric> {
  return apiClient.get<ContentRubric>(`/review-slots/rubrics/${contentType}`);
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
