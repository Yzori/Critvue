"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationList } from "./NotificationList";
import { getUnreadCount } from "@/lib/api/notifications";
import { cn } from "@/lib/utils";

/**
 * NotificationBell Component
 *
 * Shows a bell icon with unread count badge.
 * Clicking opens a dropdown with recent notifications.
 *
 * Features:
 * - Real-time unread count via polling
 * - Dropdown with notification list
 * - Badge indicator for unread notifications
 * - Accessible ARIA labels
 */

export interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // Fetch unread count on mount and periodically
  const fetchUnreadCount = React.useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Failed to fetch unread count - silent fail
    }
  }, []);

  // Initial fetch and polling
  React.useEffect(() => {
    fetchUnreadCount();

    // Poll every 30 seconds for updates
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Refresh count when dropdown closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Refresh count after closing to reflect any read notifications
      setTimeout(fetchUnreadCount, 500);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative",
            "hidden lg:flex", // Desktop only
            "focus-visible:ring-2 focus-visible:ring-accent-blue",
            className
          )}
          aria-label={
            unreadCount > 0
              ? `Notifications (${unreadCount} unread)`
              : "Notifications"
          }
        >
          <Bell className="size-5" />
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute top-2 right-2",
                "flex items-center justify-center",
                "min-w-[18px] h-[18px] px-1",
                "text-[10px] font-bold text-white",
                "bg-accent-peach rounded-full",
                "transition-all duration-200",
                "animate-in fade-in zoom-in"
              )}
              aria-hidden="true"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className={cn(
          "w-[400px] max-w-[calc(100vw-2rem)]",
          "p-0",
          "max-h-[600px] overflow-hidden",
          "bg-background/95 backdrop-blur-lg",
          "border border-border shadow-lg"
        )}
        sideOffset={8}
      >
        <NotificationList onNotificationRead={fetchUnreadCount} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
