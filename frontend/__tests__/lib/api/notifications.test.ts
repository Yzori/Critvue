/**
 * Unit Tests for Notifications API Client
 *
 * Tests the notification API functions and helper utilities
 */

import {
  getNotifications,
  getUnreadCount,
  getNotificationStats,
  getNotification,
  markNotificationRead,
  markAllNotificationsRead,
  archiveNotification,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  getPriorityColor,
  formatNotificationTime,
  getNotificationIcon,
  Notification,
  NotificationListResponse,
  NotificationStatsResponse,
  NotificationPreferences,
} from '@/lib/api/notifications';

// Mock the apiClient
jest.mock('@/lib/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import apiClient from '@/lib/api/client';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('Notifications API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    const mockNotificationList: NotificationListResponse = {
      notifications: [
        {
          id: 1,
          type: 'review_submitted',
          title: 'New Review',
          message: 'Someone submitted a review',
          read: false,
          archived: false,
          priority: 'high',
          created_at: new Date().toISOString(),
        },
      ],
      total: 1,
      unread_count: 1,
      page: 1,
      page_size: 50,
      total_pages: 1,
    };

    it('should fetch notifications without filters', async () => {
      mockApiClient.get.mockResolvedValueOnce(mockNotificationList);

      const result = await getNotifications();

      expect(mockApiClient.get).toHaveBeenCalledWith('/notifications');
      expect(result).toEqual(mockNotificationList);
    });

    it('should fetch notifications with read filter', async () => {
      mockApiClient.get.mockResolvedValueOnce(mockNotificationList);

      await getNotifications({ read: false });

      expect(mockApiClient.get).toHaveBeenCalledWith('/notifications?read=false');
    });

    it('should fetch notifications with archived filter', async () => {
      mockApiClient.get.mockResolvedValueOnce(mockNotificationList);

      await getNotifications({ archived: true });

      expect(mockApiClient.get).toHaveBeenCalledWith('/notifications?archived=true');
    });

    it('should fetch notifications with pagination', async () => {
      mockApiClient.get.mockResolvedValueOnce(mockNotificationList);

      await getNotifications({ page: 2, page_size: 25 });

      expect(mockApiClient.get).toHaveBeenCalledWith('/notifications?page=2&page_size=25');
    });

    it('should fetch notifications with multiple filters', async () => {
      mockApiClient.get.mockResolvedValueOnce(mockNotificationList);

      await getNotifications({
        read: false,
        priority: 'high',
        notification_type: 'review_submitted',
      });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/notifications?read=false&notification_type=review_submitted&priority=high'
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockApiClient.get.mockResolvedValueOnce({ unread_count: 5 });

      const result = await getUnreadCount();

      expect(mockApiClient.get).toHaveBeenCalledWith('/notifications/unread-count');
      expect(result).toBe(5);
    });

    it('should return 0 when no unread notifications', async () => {
      mockApiClient.get.mockResolvedValueOnce({ unread_count: 0 });

      const result = await getUnreadCount();

      expect(result).toBe(0);
    });
  });

  describe('getNotificationStats', () => {
    const mockStats: NotificationStatsResponse = {
      total: 100,
      unread: 10,
      archived: 25,
      by_priority: { high: 20, medium: 50, low: 30 },
      by_type: { review_submitted: 40, review_accepted: 30, karma_earned: 30 },
    };

    it('should fetch notification statistics', async () => {
      mockApiClient.get.mockResolvedValueOnce(mockStats);

      const result = await getNotificationStats();

      expect(mockApiClient.get).toHaveBeenCalledWith('/notifications/stats');
      expect(result).toEqual(mockStats);
    });
  });

  describe('getNotification', () => {
    const mockNotification: Notification = {
      id: 1,
      type: 'review_accepted',
      title: 'Review Accepted',
      message: 'Your review was accepted!',
      read: false,
      archived: false,
      priority: 'high',
      created_at: new Date().toISOString(),
    };

    it('should fetch a single notification by ID', async () => {
      mockApiClient.get.mockResolvedValueOnce(mockNotification);

      const result = await getNotification(1);

      expect(mockApiClient.get).toHaveBeenCalledWith('/notifications/1');
      expect(result).toEqual(mockNotification);
    });
  });

  describe('markNotificationRead', () => {
    const mockNotification: Notification = {
      id: 1,
      type: 'review_submitted',
      title: 'Test',
      message: 'Test message',
      read: true,
      archived: false,
      priority: 'medium',
      created_at: new Date().toISOString(),
      read_at: new Date().toISOString(),
    };

    it('should mark notification as read', async () => {
      mockApiClient.patch.mockResolvedValueOnce(mockNotification);

      const result = await markNotificationRead(1, true);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/notifications/1/read', { read: true });
      expect(result.read).toBe(true);
    });

    it('should mark notification as unread', async () => {
      const unreadNotification = { ...mockNotification, read: false, read_at: undefined };
      mockApiClient.patch.mockResolvedValueOnce(unreadNotification);

      const result = await markNotificationRead(1, false);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/notifications/1/read', { read: false });
      expect(result.read).toBe(false);
    });

    it('should default to marking as read', async () => {
      mockApiClient.patch.mockResolvedValueOnce(mockNotification);

      await markNotificationRead(1);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/notifications/1/read', { read: true });
    });
  });

  describe('markAllNotificationsRead', () => {
    it('should mark all notifications as read', async () => {
      const mockResponse = { message: 'Marked 5 notifications as read', count: 5 };
      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await markAllNotificationsRead();

      expect(mockApiClient.post).toHaveBeenCalledWith('/notifications/mark-all-read', {});
      expect(result.count).toBe(5);
    });
  });

  describe('archiveNotification', () => {
    const mockNotification: Notification = {
      id: 1,
      type: 'review_submitted',
      title: 'Test',
      message: 'Test message',
      read: true,
      archived: true,
      priority: 'medium',
      created_at: new Date().toISOString(),
    };

    it('should archive a notification', async () => {
      mockApiClient.patch.mockResolvedValueOnce(mockNotification);

      const result = await archiveNotification(1, true);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/notifications/1/archive', { archived: true });
      expect(result.archived).toBe(true);
    });

    it('should unarchive a notification', async () => {
      const unarchivedNotification = { ...mockNotification, archived: false };
      mockApiClient.patch.mockResolvedValueOnce(unarchivedNotification);

      const result = await archiveNotification(1, false);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/notifications/1/archive', { archived: false });
      expect(result.archived).toBe(false);
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      mockApiClient.delete.mockResolvedValueOnce(undefined);

      await deleteNotification(1);

      expect(mockApiClient.delete).toHaveBeenCalledWith('/notifications/1');
    });
  });

  describe('getNotificationPreferences', () => {
    const mockPreferences: NotificationPreferences = {
      user_id: 1,
      email_enabled: true,
      push_enabled: true,
      sms_enabled: false,
      email_digest_frequency: 'daily',
      email_digest_time: 9,
      email_digest_day: 1,
      quiet_hours_enabled: true,
      quiet_hours_start: 22,
      quiet_hours_end: 8,
      updated_at: new Date().toISOString(),
    };

    it('should fetch notification preferences', async () => {
      mockApiClient.get.mockResolvedValueOnce(mockPreferences);

      const result = await getNotificationPreferences();

      expect(mockApiClient.get).toHaveBeenCalledWith('/notifications/preferences/me');
      expect(result).toEqual(mockPreferences);
    });
  });

  describe('updateNotificationPreferences', () => {
    const mockPreferences: NotificationPreferences = {
      user_id: 1,
      email_enabled: false,
      push_enabled: true,
      sms_enabled: false,
      email_digest_frequency: 'weekly',
      email_digest_time: 9,
      email_digest_day: 1,
      quiet_hours_enabled: true,
      quiet_hours_start: 22,
      quiet_hours_end: 8,
      updated_at: new Date().toISOString(),
    };

    it('should update notification preferences', async () => {
      mockApiClient.patch.mockResolvedValueOnce(mockPreferences);

      const result = await updateNotificationPreferences({
        email_enabled: false,
        email_digest_frequency: 'weekly',
      });

      expect(mockApiClient.patch).toHaveBeenCalledWith('/notifications/preferences/me', {
        email_enabled: false,
        email_digest_frequency: 'weekly',
      });
      expect(result.email_enabled).toBe(false);
      expect(result.email_digest_frequency).toBe('weekly');
    });
  });
});

describe('Notification Helper Functions', () => {
  describe('getPriorityColor', () => {
    it('should return correct color for urgent priority', () => {
      expect(getPriorityColor('urgent')).toBe('text-red-600 bg-red-50');
      expect(getPriorityColor('URGENT')).toBe('text-red-600 bg-red-50');
    });

    it('should return correct color for high priority', () => {
      expect(getPriorityColor('high')).toBe('text-orange-600 bg-orange-50');
    });

    it('should return correct color for medium priority', () => {
      expect(getPriorityColor('medium')).toBe('text-blue-600 bg-blue-50');
    });

    it('should return correct color for low priority', () => {
      expect(getPriorityColor('low')).toBe('text-gray-600 bg-gray-50');
    });

    it('should return default color for unknown priority', () => {
      expect(getPriorityColor('unknown')).toBe('text-gray-600 bg-gray-50');
    });
  });

  describe('formatNotificationTime', () => {
    it('should format time as "Just now" for recent notifications', () => {
      const now = new Date().toISOString();
      expect(formatNotificationTime(now)).toBe('Just now');
    });

    it('should format time in minutes', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatNotificationTime(fiveMinutesAgo)).toBe('5 minutes ago');
    });

    it('should format time in singular minute', () => {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
      expect(formatNotificationTime(oneMinuteAgo)).toBe('1 minute ago');
    });

    it('should format time in hours', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      expect(formatNotificationTime(threeHoursAgo)).toBe('3 hours ago');
    });

    it('should format time in singular hour', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      expect(formatNotificationTime(oneHourAgo)).toBe('1 hour ago');
    });

    it('should format time in days', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatNotificationTime(twoDaysAgo)).toBe('2 days ago');
    });

    it('should format time in singular day', () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      expect(formatNotificationTime(oneDayAgo)).toBe('1 day ago');
    });

    it('should return date string for old notifications', () => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const result = formatNotificationTime(twoWeeksAgo.toISOString());
      expect(result).toBe(twoWeeksAgo.toLocaleDateString());
    });
  });

  describe('getNotificationIcon', () => {
    it('should return correct icon for review_slot_claimed', () => {
      expect(getNotificationIcon('review_slot_claimed')).toBe('👤');
    });

    it('should return correct icon for review_submitted', () => {
      expect(getNotificationIcon('review_submitted')).toBe('📝');
    });

    it('should return correct icon for review_accepted', () => {
      expect(getNotificationIcon('review_accepted')).toBe('✅');
    });

    it('should return correct icon for review_rejected', () => {
      expect(getNotificationIcon('review_rejected')).toBe('❌');
    });

    it('should return correct icon for tier_promoted', () => {
      expect(getNotificationIcon('tier_promoted')).toBe('⭐');
    });

    it('should return correct icon for karma_earned', () => {
      expect(getNotificationIcon('karma_earned')).toBe('💎');
    });

    it('should return correct icon for dispute events', () => {
      expect(getNotificationIcon('dispute_created')).toBe('⚖️');
      expect(getNotificationIcon('dispute_resolved')).toBe('⚖️');
    });

    it('should return correct icon for deadline_warning', () => {
      expect(getNotificationIcon('deadline_warning')).toBe('⏰');
    });

    it('should return correct icon for subscription events', () => {
      expect(getNotificationIcon('subscription_created')).toBe('💳');
      expect(getNotificationIcon('subscription_canceled')).toBe('💳');
    });

    it('should return default icon for unknown type', () => {
      expect(getNotificationIcon('unknown_type')).toBe('🔔');
    });
  });
});
