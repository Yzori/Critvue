/**
 * Payments API
 * Functions for expert review payments and Stripe Connect
 */

import apiClient from "../client";

// ===== Payment Intent Types =====

export interface CreatePaymentIntentRequest {
  review_request_id: number;
}

export interface CreatePaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
}

export interface PaymentStatusResponse {
  payment_status: string;
  payment_intent_id?: string;
  amount?: number;
  payment_captured_at?: string;
  is_paid: boolean;
}

// ===== Payment Calculation Types =====

export interface PaymentBreakdown {
  subtotal: number;
  discount_amount: number;
  total: number;
  per_review_amount: number;
  platform_fee: number;
  reviewer_earnings: number;
  reviews_requested: number;
  discount_percent: number;
}

export interface CalculatePaymentRequest {
  budget: number;
  reviews_requested: number;
  apply_pro_discount: boolean;
}

export interface CalculatePaymentResponse {
  breakdown: PaymentBreakdown;
}

// ===== Stripe Connect Types =====

export interface ConnectOnboardingRequest {
  return_url: string;
  refresh_url: string;
}

export interface ConnectOnboardingResponse {
  account_id: string;
  onboarding_url: string;
}

export interface ConnectStatusResponse {
  is_onboarded: boolean;
  payouts_enabled: boolean;
  account_id?: string;
  details_submitted: boolean;
}

export interface ConnectDashboardLinkResponse {
  dashboard_url: string;
}

export interface AvailableBalanceResponse {
  available_balance: number;
  pending_balance: number;
  currency: string;
}

// ===== Payout Types =====

export interface PayoutHistoryItem {
  payout_id: string;
  amount: number;
  status: string;
  created_at: string;
  arrival_date?: string;
}

export interface PayoutHistoryResponse {
  payouts: PayoutHistoryItem[];
  total_paid: number;
  has_more: boolean;
}

// ===== Payment Intent Functions =====

/**
 * Create a Stripe Payment Intent for an expert review request
 */
export async function createPaymentIntent(
  request: CreatePaymentIntentRequest
): Promise<CreatePaymentIntentResponse> {
  return apiClient.post<CreatePaymentIntentResponse>(
    "/payments/create-payment-intent",
    request
  );
}

/**
 * Get payment status for a review request
 */
export async function getPaymentStatus(
  reviewRequestId: number
): Promise<PaymentStatusResponse> {
  return apiClient.get<PaymentStatusResponse>(
    `/payments/status/${reviewRequestId}`
  );
}

/**
 * Calculate payment breakdown (for preview before checkout)
 */
export async function calculatePayment(
  request: CalculatePaymentRequest
): Promise<CalculatePaymentResponse> {
  return apiClient.post<CalculatePaymentResponse>("/payments/calculate", request);
}

// ===== Stripe Connect Functions =====

/**
 * Start Stripe Connect onboarding for a reviewer
 */
export async function startConnectOnboarding(
  request: ConnectOnboardingRequest
): Promise<ConnectOnboardingResponse> {
  return apiClient.post<ConnectOnboardingResponse>(
    "/payments/connect/onboard",
    request
  );
}

/**
 * Get Stripe Connect account status
 */
export async function getConnectStatus(): Promise<ConnectStatusResponse> {
  return apiClient.get<ConnectStatusResponse>("/payments/connect/status");
}

/**
 * Get link to Stripe Connect dashboard
 */
export async function getConnectDashboardLink(): Promise<ConnectDashboardLinkResponse> {
  return apiClient.post<ConnectDashboardLinkResponse>(
    "/payments/connect/dashboard-link",
    {}
  );
}

/**
 * Get available balance for withdrawal
 */
export async function getAvailableBalance(): Promise<AvailableBalanceResponse> {
  return apiClient.get<AvailableBalanceResponse>("/payments/connect/balance");
}

/**
 * Get payout history
 */
export async function getPayoutHistory(
  limit: number = 10
): Promise<PayoutHistoryResponse> {
  return apiClient.get<PayoutHistoryResponse>(
    `/payments/connect/payouts?limit=${limit}`
  );
}
