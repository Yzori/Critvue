/**
 * Admin Users API Client
 * Handles user management operations for admins
 */

import apiClient from './client';

// ============ Types ============

export type UserRole = 'creator' | 'reviewer' | 'admin';
export type UserTier = 'novice' | 'contributor' | 'skilled' | 'trusted_advisor' | 'expert' | 'master';
export type SubscriptionTier = 'free' | 'pro';

export interface UserListItem {
  id: number;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  user_tier: UserTier;
  subscription_tier: SubscriptionTier;
  karma_points: number;
  is_active: boolean;
  is_verified: boolean;
  is_banned: boolean;
  is_suspended: boolean;
  suspended_until: string | null;
  total_reviews_given: number;
  total_reviews_received: number;
  created_at: string;
  last_login: string | null;
}

export interface UserListResponse {
  users: UserListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface UserDetail extends UserListItem {
  bio: string | null;
  title: string | null;
  subscription_status: string | null;
  xp_points: number;
  reputation_score: number;
  avg_rating: number | null;
  acceptance_rate: number | null;
  current_streak: number;
  longest_streak: number;
  challenges_won: number;
  challenges_lost: number;
  challenges_drawn: number;
  banned_at: string | null;
  ban_reason: string | null;
  suspended_at: string | null;
  suspension_reason: string | null;
  updated_at: string;
}

export interface AdminStats {
  total_users: number;
  new_users_this_week: number;
  active_users_today: number;
  total_reviewers: number;
  total_admins: number;
  banned_users: number;
  suspended_users: number;
  pending_applications: number;
  approved_this_month: number;
  rejected_this_month: number;
  active_challenges: number;
  total_reviews: number;
  avg_review_time_days: number;
}

export interface AuditLogEntry {
  id: number;
  admin_id: number;
  admin_email: string | null;
  admin_name: string | null;
  action: string;
  target_user_id: number | null;
  target_user_email: string | null;
  target_entity_type: string | null;
  target_entity_id: number | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogResponse {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  page_size: number;
}

export interface ModerationActionResponse {
  success: boolean;
  message: string;
  user_id: number;
  action: string;
}

export interface UserSearchParams {
  query?: string;
  role?: UserRole;
  tier?: UserTier;
  is_banned?: boolean;
  is_suspended?: boolean;
  is_verified?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

// ============ API Functions ============

export const adminUsersApi = {
  /**
   * List users with filtering and pagination
   */
  listUsers: async (params: UserSearchParams = {}): Promise<UserListResponse> => {
    const searchParams = new URLSearchParams();

    if (params.query) searchParams.set('query', params.query);
    if (params.role) searchParams.set('role', params.role);
    if (params.tier) searchParams.set('tier', params.tier);
    if (params.is_banned !== undefined) searchParams.set('is_banned', String(params.is_banned));
    if (params.is_suspended !== undefined) searchParams.set('is_suspended', String(params.is_suspended));
    if (params.is_verified !== undefined) searchParams.set('is_verified', String(params.is_verified));
    if (params.sort_by) searchParams.set('sort_by', params.sort_by);
    if (params.sort_order) searchParams.set('sort_order', params.sort_order);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.page_size) searchParams.set('page_size', String(params.page_size));

    return apiClient.get(`/admin/users?${searchParams.toString()}`);
  },

  /**
   * Get admin dashboard statistics
   */
  getStats: async (): Promise<AdminStats> => {
    return apiClient.get('/admin/users/stats');
  },

  /**
   * Get user detail
   */
  getUser: async (userId: number): Promise<UserDetail> => {
    return apiClient.get(`/admin/users/${userId}`);
  },

  /**
   * Change user role
   */
  changeRole: async (userId: number, role: UserRole, reason?: string): Promise<ModerationActionResponse> => {
    return apiClient.post(`/admin/users/${userId}/role`, { role, reason });
  },

  /**
   * Ban a user
   */
  banUser: async (userId: number, reason: string): Promise<ModerationActionResponse> => {
    return apiClient.post(`/admin/users/${userId}/ban`, { reason });
  },

  /**
   * Unban a user
   */
  unbanUser: async (userId: number): Promise<ModerationActionResponse> => {
    return apiClient.post(`/admin/users/${userId}/unban`);
  },

  /**
   * Suspend a user temporarily
   */
  suspendUser: async (userId: number, reason: string, durationHours: number): Promise<ModerationActionResponse> => {
    return apiClient.post(`/admin/users/${userId}/suspend`, {
      reason,
      duration_hours: durationHours,
    });
  },

  /**
   * Remove suspension from a user
   */
  unsuspendUser: async (userId: number): Promise<ModerationActionResponse> => {
    return apiClient.post(`/admin/users/${userId}/unsuspend`);
  },

  /**
   * Verify a user's email
   */
  verifyUser: async (userId: number): Promise<ModerationActionResponse> => {
    return apiClient.post(`/admin/users/${userId}/verify`);
  },

  /**
   * Adjust user's karma
   */
  adjustKarma: async (userId: number, amount: number, reason: string): Promise<ModerationActionResponse> => {
    return apiClient.post(`/admin/users/${userId}/karma`, { amount, reason });
  },

  /**
   * Override user's tier
   */
  overrideTier: async (userId: number, tier: UserTier, reason?: string): Promise<ModerationActionResponse> => {
    return apiClient.post(`/admin/users/${userId}/tier`, { tier, reason });
  },

  /**
   * Get banned users list
   */
  getBannedUsers: async (): Promise<{ users: UserListItem[]; total: number }> => {
    return apiClient.get('/admin/users/moderation/banned');
  },

  /**
   * Get suspended users list
   */
  getSuspendedUsers: async (): Promise<{ users: UserListItem[]; total: number }> => {
    return apiClient.get('/admin/users/moderation/suspended');
  },

  /**
   * Get audit log
   */
  getAuditLog: async (params: {
    admin_id?: number;
    target_user_id?: number;
    page?: number;
    page_size?: number;
  } = {}): Promise<AuditLogResponse> => {
    const searchParams = new URLSearchParams();
    if (params.admin_id) searchParams.set('admin_id', String(params.admin_id));
    if (params.target_user_id) searchParams.set('target_user_id', String(params.target_user_id));
    if (params.page) searchParams.set('page', String(params.page));
    if (params.page_size) searchParams.set('page_size', String(params.page_size));

    return apiClient.get(`/admin/users/moderation/audit?${searchParams.toString()}`);
  },
};

export default adminUsersApi;
