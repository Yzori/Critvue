"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCheck, Trash2, Archive, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  type Notification,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getNotificationIcon,
  formatNotificationTime,
  getPriorityColor,
} from "@/lib/api/notifications";
import { cn } from "@/lib/utils";

/**
 * NotificationList Component
 *
 * Displays a list of notifications in a dropdown or page.
 * Shows recent unread notifications first.
 *
 * Features:
 * - Mark as read/unread
 * - Delete notifications
 * - Click to navigate
 * - Mark all as read
 * - Empty state
 */

export interface NotificationListProps {
  onNotificationRead?: () => void; // Callback when notification is marked as read
  showAll?: boolean; // Show all notifications or just recent ones
}

export function NotificationList({
  onNotificationRead,
  showAll = false,
}: NotificationListProps) {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getNotifications({
        read: false, // Only unread
        page: 1,
        page_size: showAll ? 50 : 10, // Show 10 in dropdown, 50 on page
      });

      setNotifications(response.notifications);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, [showAll]);

  // Initial fetch
  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      if (!notification.read) {
        await markNotificationRead(notification.id, true);
        onNotificationRead?.();
      }

      // Navigate to action URL if available
      if (notification.action_url) {
        router.push(notification.action_url);
      }

      // Refresh list
      fetchNotifications();
    } catch (err) {
      console.error("Failed to handle notification click:", err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      onNotificationRead?.();
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // Delete notification
  const handleDelete = async (
    notificationId: number,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent notification click

    try {
      await deleteNotification(notificationId);
      onNotificationRead?.();
      fetchNotifications();
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue mx-auto" />
        <p className="text-sm text-muted-foreground mt-4">
          Loading notifications...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchNotifications}
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state
  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-4xl mb-2">🔔</div>
        <h3 className="font-semibold text-lg mb-1">All caught up!</h3>
        <p className="text-sm text-muted-foreground">
          No new notifications right now
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-lg">Notifications</h3>
        {notifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            className="text-xs h-8"
          >
            <CheckCheck className="size-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notification List */}
      <ScrollArea className="max-h-[500px]">
        <div className="divide-y divide-border">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={() => handleNotificationClick(notification)}
              onDelete={(e) => handleDelete(notification.id, e)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      {!showAll && notifications.length >= 10 && (
        <>
          <Separator />
          <div className="p-3 text-center">
            <Link href="/notifications">
              <Button variant="ghost" size="sm" className="w-full">
                View All Notifications
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

// ==================== NotificationItem Component ====================

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onDelete: (event: React.MouseEvent) => void;
}

function NotificationItem({
  notification,
  onClick,
  onDelete,
}: NotificationItemProps) {
  const icon = getNotificationIcon(notification.type);
  const priorityClass = getPriorityColor(notification.priority);
  const timeAgo = formatNotificationTime(notification.created_at);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "relative p-4 cursor-pointer",
        "hover:bg-accent/50 active:bg-accent/70",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-inset",
        !notification.read && "bg-accent-blue/5"
      )}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full",
            "flex items-center justify-center text-xl",
            priorityClass
          )}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4
            className={cn(
              "text-sm font-semibold mb-1",
              !notification.read && "text-foreground",
              notification.read && "text-muted-foreground"
            )}
          >
            {notification.title}
          </h4>

          {/* Message */}
          <p
            className={cn(
              "text-sm mb-2 line-clamp-2",
              notification.read ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {notification.message}
          </p>

          {/* Time & Actions */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{timeAgo}</span>

            <div className="flex items-center gap-1">
              {notification.action_label && (
                <span className="text-xs text-accent-blue font-medium flex items-center gap-1">
                  {notification.action_label}
                  <ExternalLink className="size-3" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Delete button */}
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 size-8 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity"
          onClick={onDelete}
          aria-label="Delete notification"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* Unread indicator */}
      {!notification.read && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent-blue rounded-r-full"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
