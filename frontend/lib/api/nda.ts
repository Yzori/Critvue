/**
 * NDA API Client
 * Handles all NDA-related API requests
 */

import apiClient from "./client";

// NDA sign request
export interface NDASignRequest {
  full_legal_name: string;
}

// NDA sign response
export interface NDASignResponse {
  success: boolean;
  message: string;
  signature_id: number;
  signed_at: string;
  nda_version: string;
  review_request_id: number;
}

// NDA status response
export interface NDAStatusResponse {
  review_request_id: number;
  requires_nda: boolean;
  nda_version?: string;
  creator_signed: boolean;
  creator_signed_at?: string;
  current_user_signed: boolean;
  current_user_signed_at?: string;
  can_view_content: boolean;
}

// NDA content response
export interface NDAContentResponse {
  version: string;
  title: string;
  subtitle: string;
  content: string;
  effective_date?: string;
}

// NDA signature details
export interface NDASignature {
  id: number;
  review_request_id: number;
  user_id: number;
  role: "creator" | "reviewer";
  full_legal_name: string;
  nda_version: string;
  signed_at: string;
  user_username?: string;
  user_avatar?: string;
}

/**
 * Get NDA document content (public endpoint)
 */
export async function getNDAContent(): Promise<NDAContentResponse> {
  return apiClient.get<NDAContentResponse>("/nda/content");
}

/**
 * Check NDA status for a review request
 */
export async function getNDAStatus(reviewId: number): Promise<NDAStatusResponse> {
  return apiClient.get<NDAStatusResponse>(`/nda/status/${reviewId}`);
}

/**
 * Sign NDA for a review request
 */
export async function signNDA(
  reviewId: number,
  data: NDASignRequest
): Promise<NDASignResponse> {
  return apiClient.post<NDASignResponse>(`/nda/sign/${reviewId}`, data);
}

/**
 * Get all NDA signatures for a review request
 * (Owner sees all, others see only their own)
 */
export async function getNDASignatures(reviewId: number): Promise<NDASignature[]> {
  return apiClient.get<NDASignature[]>(`/nda/signatures/${reviewId}`);
}
