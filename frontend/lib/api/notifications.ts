/**
 * Notifications API Client
 * Functions for managing user notifications
 */

import apiClient from "./client";

// ==================== Types ====================

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  archived: boolean;
  action_url?: string;
  action_label?: string;
  priority: string;
  entity_type?: string;
  entity_id?: number;
  created_at: string;
  read_at?: string;
  expires_at?: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface NotificationStatsResponse {
  total: number;
  unread: number;
  archived: number;
  by_priority: Record<string, number>;
  by_type: Record<string, number>;
}

export interface NotificationPreferences {
  user_id: number;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  email_digest_frequency: string;
  email_digest_time: number;
  email_digest_day: number;
  quiet_hours_enabled: boolean;
  quiet_hours_start?: number;
  quiet_hours_end?: number;
  category_preferences?: Record<string, Record<string, boolean>>;
  updated_at: string;
}

export interface NotificationFilters {
  read?: boolean;
  archived?: boolean;
  notification_type?: string;
  priority?: string;
  entity_type?: string;
  page?: number;
  page_size?: number;
}

export interface UpdatePreferencesPayload {
  email_enabled?: boolean;
  push_enabled?: boolean;
  sms_enabled?: boolean;
  email_digest_frequency?: string;
  email_digest_time?: number;
  email_digest_day?: number;
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: number;
  quiet_hours_end?: number;
  category_preferences?: Record<string, Record<string, boolean>>;
}

// ==================== API Functions ====================

/**
 * Get paginated list of notifications
 */
export async function getNotifications(
  filters: NotificationFilters = {}
): Promise<NotificationListResponse> {
  const params = new URLSearchParams();

  if (filters.read !== undefined) params.append("read", String(filters.read));
  if (filters.archived !== undefined) params.append("archived", String(filters.archived));
  if (filters.notification_type) params.append("notification_type", filters.notification_type);
  if (filters.priority) params.append("priority", filters.priority);
  if (filters.entity_type) params.append("entity_type", filters.entity_type);
  if (filters.page) params.append("page", String(filters.page));
  if (filters.page_size) params.append("page_size", String(filters.page_size));

  const query = params.toString();
  return apiClient.get<NotificationListResponse>(
    `/notifications${query ? `?${query}` : ""}`
  );
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  const response = await apiClient.get<{ unread_count: number }>(
    "/notifications/unread-count"
  );
  return response.unread_count;
}

/**
 * Get notification statistics
 */
export async function getNotificationStats(): Promise<NotificationStatsResponse> {
  return apiClient.get<NotificationStatsResponse>("/notifications/stats");
}

/**
 * Get a specific notification by ID
 */
export async function getNotification(notificationId: number): Promise<Notification> {
  return apiClient.get<Notification>(`/notifications/${notificationId}`);
}

/**
 * Mark a notification as read or unread
 */
export async function markNotificationRead(
  notificationId: number,
  read: boolean = true
): Promise<Notification> {
  return apiClient.patch<Notification>(`/notifications/${notificationId}/read`, {
    read,
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<{ message: string; count: number }> {
  return apiClient.post<{ message: string; count: number }>(
    "/notifications/mark-all-read",
    {}
  );
}

/**
 * Archive or unarchive a notification
 */
export async function archiveNotification(
  notificationId: number,
  archived: boolean = true
): Promise<Notification> {
  return apiClient.patch<Notification>(`/notifications/${notificationId}/archive`, {
    archived,
  });
}

/**
 * Delete a notification permanently
 */
export async function deleteNotification(notificationId: number): Promise<void> {
  return apiClient.delete<void>(`/notifications/${notificationId}`);
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return apiClient.get<NotificationPreferences>("/notifications/preferences/me");
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  updates: UpdatePreferencesPayload
): Promise<NotificationPreferences> {
  return apiClient.patch<NotificationPreferences>(
    "/notifications/preferences/me",
    updates
  );
}

// ==================== Helper Functions ====================

/**
 * Get priority color class for styling
 */
export function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case "urgent":
      return "text-red-600 bg-red-50";
    case "high":
      return "text-orange-600 bg-orange-50";
    case "medium":
      return "text-blue-600 bg-blue-50";
    case "low":
      return "text-gray-600 bg-gray-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

/**
 * Format notification time relative to now
 */
export function formatNotificationTime(createdAt: string): string {
  const now = new Date();
  const created = new Date(createdAt);
  const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  } else {
    return created.toLocaleDateString();
  }
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: string): string {
  switch (type) {
    // Review Lifecycle
    case "review_slot_claimed":
      return "👤";
    case "review_slot_available":
      return "🔓";
    case "review_submitted":
      return "📝";
    case "review_accepted":
      return "✅";
    case "review_rejected":
      return "❌";
    case "review_auto_accepted":
      return "✅";
    case "review_abandoned":
    case "review_abandoned_timeout":
      return "🚫";
    case "all_slots_claimed":
      return "🎉";
    case "all_reviews_completed":
      return "🏆";

    // Elaboration Requests
    case "elaboration_requested":
      return "💬";
    case "elaboration_submitted":
      return "💬";
    case "elaboration_deadline_24h":
      return "⏰";

    // Deadlines & Reminders
    case "claim_deadline_24h":
    case "claim_deadline_6h":
    case "auto_accept_deadline_48h":
    case "auto_accept_deadline_24h":
    case "submission_deadline_approaching":
      return "⏰";

    // Disputes
    case "dispute_created":
      return "⚖️";
    case "dispute_resolved":
    case "dispute_resolved_reviewer_wins":
    case "dispute_resolved_creator_wins":
      return "⚖️";

    // Karma & Tier
    case "karma_earned":
      return "💎";
    case "karma_lost":
      return "💔";
    case "streak_milestone":
      return "🔥";
    case "tier_promoted":
      return "⭐";
    case "tier_progress":
      return "📈";
    case "acceptance_rate_warning":
      return "⚠️";

    // Expert Applications
    case "expert_application_submitted":
      return "📋";
    case "expert_application_under_review":
      return "🔍";
    case "expert_application_approved":
      return "🎉";
    case "expert_application_rejected":
      return "📋";

    // Subscriptions & Payments
    case "review_limit_approaching":
    case "review_limit_reached":
    case "review_limit_reset":
      return "📊";
    case "subscription_created":
      return "💳";
    case "subscription_canceled":
      return "💳";
    case "payment_succeeded":
      return "💰";
    case "payment_failed":
      return "❗";

    // Expert/Paid Reviews
    case "expert_review_claimed":
      return "💼";
    case "expert_payment_released":
      return "💰";
    case "expert_payment_refunded":
      return "↩️";
    case "weekly_paid_limit_reached":
      return "📊";

    // Account & Security
    case "password_changed":
      return "🔐";
    case "email_changed":
      return "📧";
    case "new_login_device":
      return "🔔";

    // System
    case "system_announcement":
      return "📢";
    case "feature_announcement":
      return "✨";

    default:
      return "🔔";
  }
}
