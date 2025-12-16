/**
 * Slot Applications API Client
 * Handles all slot application API requests for paid/expert reviews
 */

import apiClient from "../client";

// Application status enum
export type SlotApplicationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "expired";

// Applicant info included in responses
export interface ApplicantInfo {
  id: number;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  user_tier: string | null;
  sparks_points: number;
  total_reviews_given: number;
  avg_rating: number | null;
  acceptance_rate: number | null;
}

// Base slot application response
export interface SlotApplicationResponse {
  id: number;
  review_request_id: number;
  applicant_id: number;
  assigned_slot_id: number | null;
  status: SlotApplicationStatus;
  pitch_message: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  decided_at: string | null;
  applicant?: ApplicantInfo;
}

// Response with applicant info (for creator view)
export interface SlotApplicationWithApplicant extends SlotApplicationResponse {
  applicant: ApplicantInfo;
}

// Response for getting applications for a request (creator view)
export interface RequestApplicationsResponse {
  review_request_id: number;
  total_applications: number;
  pending_count: number;
  accepted_count: number;
  rejected_count: number;
  available_slots: number;
  applications: SlotApplicationWithApplicant[];
}

// Response for getting user's own applications
export interface MyApplicationsResponse {
  items: SlotApplicationResponse[];
  total: number;
  pending_count: number;
  accepted_count: number;
  rejected_count: number;
}

// Can apply check response
export interface CanApplyResponse {
  can_apply: boolean;
  reason: string | null;
  existing_application: {
    id: number;
    status: SlotApplicationStatus;
    created_at: string;
    assigned_slot_id: number | null;
  } | null;
  available_slots?: number;
}

// Application required error detail structure
export interface ApplicationRequiredError {
  code: "APPLICATION_REQUIRED";
  message: string;
  action: "apply";
  review_id?: number;
}

/**
 * Check if an error indicates application is required
 */
export function isApplicationRequiredError(error: any): error is { data: { detail: ApplicationRequiredError } } {
  return (
    error?.data?.detail?.code === "APPLICATION_REQUIRED" ||
    (typeof error?.data?.detail === "object" && error?.data?.detail?.action === "apply")
  );
}

// ==================== API Functions ====================

/**
 * Apply for a slot on a paid/expert review request
 */
export async function applyForSlot(
  reviewRequestId: number,
  pitchMessage: string
): Promise<SlotApplicationResponse> {
  return apiClient.post<SlotApplicationResponse>("/slot-applications/apply", {
    review_request_id: reviewRequestId,
    pitch_message: pitchMessage,
  });
}

/**
 * Check if user can apply to a review request
 */
export async function canApplyToRequest(
  reviewRequestId: number
): Promise<CanApplyResponse> {
  return apiClient.get<CanApplyResponse>(
    `/slot-applications/can-apply/${reviewRequestId}`
  );
}

/**
 * Get all applications for a review request (creator view)
 */
export async function getRequestApplications(
  reviewRequestId: number,
  statusFilter?: SlotApplicationStatus
): Promise<RequestApplicationsResponse> {
  const params = new URLSearchParams();
  if (statusFilter) {
    params.append("status_filter", statusFilter);
  }
  const queryString = params.toString();
  const endpoint = `/slot-applications/request/${reviewRequestId}${queryString ? `?${queryString}` : ""}`;
  return apiClient.get<RequestApplicationsResponse>(endpoint);
}

/**
 * Get current user's applications (applicant view)
 */
export async function getMyApplications(
  statusFilter?: SlotApplicationStatus,
  skip?: number,
  limit?: number
): Promise<MyApplicationsResponse> {
  const params = new URLSearchParams();
  if (statusFilter) {
    params.append("status_filter", statusFilter);
  }
  if (skip !== undefined) {
    params.append("skip", skip.toString());
  }
  if (limit !== undefined) {
    params.append("limit", limit.toString());
  }
  const queryString = params.toString();
  const endpoint = `/slot-applications/my-applications${queryString ? `?${queryString}` : ""}`;
  return apiClient.get<MyApplicationsResponse>(endpoint);
}

/**
 * Get a single application by ID
 */
export async function getApplication(
  applicationId: number
): Promise<SlotApplicationResponse> {
  return apiClient.get<SlotApplicationResponse>(
    `/slot-applications/${applicationId}`
  );
}

/**
 * Accept an application (creator action)
 * This assigns a slot to the applicant
 */
export async function acceptApplication(
  applicationId: number
): Promise<SlotApplicationResponse> {
  return apiClient.post<SlotApplicationResponse>(
    `/slot-applications/${applicationId}/accept`
  );
}

/**
 * Reject an application (creator action)
 */
export async function rejectApplication(
  applicationId: number,
  rejectionReason?: string
): Promise<SlotApplicationResponse> {
  return apiClient.post<SlotApplicationResponse>(
    `/slot-applications/${applicationId}/reject`,
    { rejection_reason: rejectionReason || null }
  );
}

/**
 * Withdraw your own application (applicant action)
 */
export async function withdrawApplication(
  applicationId: number
): Promise<SlotApplicationResponse> {
  return apiClient.post<SlotApplicationResponse>(
    `/slot-applications/${applicationId}/withdraw`
  );
}
