/**
 * Subscriptions API
 * Functions for managing subscription and quota limits
 */

import apiClient from "./client";

export interface SubscriptionStatus {
  tier: string;
  status?: string;
  subscription_end_date?: string;
  monthly_reviews_used: number;
  monthly_reviews_limit: number;
  reviews_remaining: number;
  reviews_reset_at?: string;
  has_unlimited_reviews: boolean;
  expert_review_discount: number;
  has_priority_queue: boolean;
}

export interface CreateCheckoutSessionRequest {
  success_url: string;
  cancel_url: string;
}

export interface CreateCheckoutSessionResponse {
  checkout_url: string;
}

export interface CreatePortalSessionRequest {
  return_url: string;
}

export interface CreatePortalSessionResponse {
  portal_url: string;
}

/**
 * Get current subscription status and quota limits
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  return apiClient.get<SubscriptionStatus>("/subscriptions/status");
}

/**
 * Create Stripe checkout session for Pro subscription
 */
export async function createCheckoutSession(
  request: CreateCheckoutSessionRequest
): Promise<CreateCheckoutSessionResponse> {
  return apiClient.post<CreateCheckoutSessionResponse>("/subscriptions/checkout", request);
}

/**
 * Create Stripe customer portal session
 */
export async function createPortalSession(
  request: CreatePortalSessionRequest
): Promise<CreatePortalSessionResponse> {
  return apiClient.post<CreatePortalSessionResponse>("/subscriptions/portal", request);
}
