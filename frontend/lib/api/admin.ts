/**
 * Admin API Client - Expert Application Review
 */

import apiClient from './client';

// Types
export interface ApplicationQueueItem {
  id: number;
  application_number: string;
  email: string;
  full_name: string;
  status: string;
  submitted_at: string;
  created_at: string;
  days_in_queue: number;
  is_escalated: boolean;
  claim_count: number;
}

export interface ApplicationQueueResponse {
  applications: ApplicationQueueItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface RejectionReason {
  id: number;
  code: string;
  label: string;
  description: string | null;
  applicant_message: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ApplicationReview {
  id: number;
  application_id: number;
  reviewer_id: number;
  status: 'claimed' | 'voted' | 'released';
  vote: 'approve' | 'reject' | 'request_changes' | null;
  rejection_reason_id: number | null;
  additional_feedback: string | null;
  internal_notes: string | null;
  claimed_at: string;
  voted_at: string | null;
  released_at: string | null;
  rejection_reason_label?: string | null;
}

export interface ApplicationDetail {
  id: number;
  application_number: string;
  email: string;
  full_name: string;
  status: string;
  application_data: Record<string, unknown>;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  user_joined_at: string | null;
  rejection_count: number;
  last_rejection_at: string | null;
  reviews: ApplicationReview[];
}

export interface CommitteeStats {
  pending_applications: number;
  under_review: number;
  approved_this_month: number;
  rejected_this_month: number;
  avg_review_time_days: number;
  my_claimed_count: number;
  my_votes_this_month: number;
}

export interface VoteRequest {
  vote: 'approve' | 'reject' | 'request_changes';
  rejection_reason_id?: number;
  additional_feedback?: string;
  internal_notes?: string;
}

export interface DecisionResult {
  decision: string;
  application_id: number;
  application_number: string;
  assigned_tier?: string;
  rejection_summary?: string;
}

export interface VoteResponse {
  review: ApplicationReview;
  decision: DecisionResult | null;
}

// API Functions
export const adminApi = {
  // Get application queue
  getQueue: async (page = 1, pageSize = 20, escalatedOnly = false): Promise<ApplicationQueueResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      escalated_only: escalatedOnly.toString(),
    });
    return apiClient.get(`/admin/applications/queue?${params}`);
  },

  // Get committee stats
  getStats: async (): Promise<CommitteeStats> => {
    return apiClient.get('/admin/applications/stats');
  },

  // Get application details
  getApplication: async (id: number): Promise<ApplicationDetail> => {
    return apiClient.get(`/admin/applications/${id}`);
  },

  // Claim application for review
  claimApplication: async (id: number): Promise<ApplicationReview> => {
    return apiClient.post(`/admin/applications/${id}/claim`);
  },

  // Release application back to queue
  releaseApplication: async (id: number, reason?: string): Promise<{ message: string }> => {
    return apiClient.post(`/admin/applications/${id}/release`, reason ? { reason } : undefined);
  },

  // Submit vote
  submitVote: async (id: number, vote: VoteRequest): Promise<VoteResponse> => {
    return apiClient.post(`/admin/applications/${id}/vote`, vote);
  },

  // Get rejection reasons
  getRejectionReasons: async (): Promise<RejectionReason[]> => {
    return apiClient.get('/admin/applications/rejection-reasons');
  },

  // Get my reviews (claimed + recently voted)
  getMyReviews: async (): Promise<{
    claimed: ApplicationDetail[];
    voted: ApplicationReview[];
    total_voted: number;
  }> => {
    return apiClient.get('/admin/applications/my/reviews');
  },
};

export default adminApi;
