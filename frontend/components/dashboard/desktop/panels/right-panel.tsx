"use client";

/**
 * Desktop Right Insights Panel
 *
 * Dimensions: 320px width (300-360px range)
 * Position: Sticky, full height
 *
 * Contains:
 * - Quick actions card with primary/secondary CTAs
 * - Weekly summary stats with comparison
 * - Notifications feed (last 5 notifications)
 * - Recent activity timeline
 *
 * Brand Compliance:
 * - Primary button: bg-accent-blue with text-white (acceptable for large buttons)
 * - Text colors: text-foreground (15.8:1), text-muted-foreground (4.6:1)
 * - Trend colors: text-green-700 (7.24:1), text-red-700 (6.47:1) - WCAG AA
 * - All interactive elements 44px+ touch targets
 * - Focus rings with ring-accent-blue
 *
 * @module DesktopRightPanel
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Inbox,
  TrendingUp,
  TrendingDown,
  Clock,
  Star,
  ArrowRight,
  MessageSquare,
  CheckCircle2,
  ThumbsUp,
  XCircle,
  Send,
  Bell,
} from "lucide-react";
import type { DashboardRole } from "../desktop-dashboard-container";
import { getDashboardStats, type DashboardStats } from "@/lib/api/dashboard";
import useSWR from "swr";

export interface DesktopRightPanelProps {
  /**
   * Current dashboard role
   */
  role: DashboardRole;
}

/**
 * Desktop Right Insights Panel Component
 */
export function DesktopRightPanel({ role }: DesktopRightPanelProps) {
  const router = useRouter();

  // Fetch dashboard stats with SWR (30s refresh)
  const { data: stats } = useSWR<DashboardStats>(
    `/dashboard/stats?role=${role}&period=week`,
    () => getDashboardStats(role, "week"),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Quick Actions Card */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Quick Actions
        </h3>

        <div className="space-y-2">
          {role === "creator" ? (
            <>
              <ActionButton
                icon={<Plus className="size-5" />}
                label="New Review Request"
                onClick={() => router.push("/review/new")}
                variant="primary"
                shortcut="Cmd+N"
              />
              <ActionButton
                icon={<TrendingUp className="size-5" />}
                label="View Analytics"
                onClick={() => router.push("/analytics")}
                variant="secondary"
              />
            </>
          ) : (
            <>
              <ActionButton
                icon={<Inbox className="size-5" />}
                label="Browse Reviews"
                onClick={() => router.push("/browse")}
                variant="primary"
                count={24}
              />
              <ActionButton
                icon={<TrendingUp className="size-5" />}
                label="View Earnings"
                onClick={() => router.push("/reviewer/earnings")}
                variant="secondary"
              />
            </>
          )}
        </div>
      </div>

      {/* Weekly Summary Stats */}
      {stats && (
        <div className={cn(
          "p-4 rounded-xl",
          "border border-border bg-card",
          "space-y-3"
        )}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            This Week
          </h3>

          <div className="space-y-3">
            {role === "creator" ? (
              <>
                <StatItem
                  icon={<TrendingUp className="size-4 text-green-600" />}
                  label="Reviews Completed"
                  value={stats.stats.reviews_accepted || 0}
                  change="+3 from last week"
                  trend="up"
                />
                <StatItem
                  icon={<Clock className="size-4 text-amber-600" />}
                  label="Avg. Response Time"
                  value={`${(stats.stats.avg_response_time_hours || 0).toFixed(1)} hrs`}
                  change="-1.3 hrs improvement"
                  trend="up"
                />
                <StatItem
                  icon={<Star className="size-4 text-accent-peach" />}
                  label="Satisfaction Score"
                  value={(stats.stats.avg_rating || 0).toFixed(1)}
                  change="Excellent"
                  trend="neutral"
                />
              </>
            ) : (
              <>
                <StatItem
                  icon={<TrendingUp className="size-4 text-green-600" />}
                  label="Reviews Given"
                  value={stats.stats.reviews_given || 0}
                  change="+4 from last week"
                  trend="up"
                />
                <StatItem
                  icon={<Star className="size-4 text-accent-peach" />}
                  label="Acceptance Rate"
                  value={`${((stats.stats.acceptance_rate || 0) * 100).toFixed(0)}%`}
                  change="+5% improvement"
                  trend="up"
                />
                <StatItem
                  icon={<Clock className="size-4 text-accent-blue" />}
                  label="Total Earned"
                  value={`$${(stats.stats.total_earned || 0).toFixed(0)}`}
                  change="+$125 this week"
                  trend="up"
                />
              </>
            )}
          </div>

          {/* View details link */}
          <Link
            href="/analytics"
            className={cn(
              "flex items-center justify-between",
              "px-3 py-2 rounded-lg",
              "text-sm font-medium text-muted-foreground",
              "hover:text-foreground hover:bg-muted/50",
              "transition-all duration-150"
            )}
          >
            <span>View full analytics</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      )}

      {/* Notifications Feed */}
      <div className={cn(
        "p-4 rounded-xl",
        "border border-border bg-card",
        "space-y-3"
      )}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Notifications
          </h3>
          <Link
            href="/notifications"
            className="text-xs font-medium text-blue-700 hover:text-blue-600 transition-colors"
          >
            View all
          </Link>
        </div>

        <div className="space-y-2">
          {/* Mock notifications - Replace with real data */}
          <NotificationItem
            type="review_submitted"
            title="Review submitted"
            message="Sarah completed your design review"
            timestamp={new Date(Date.now() - 3600000)}
            read={false}
          />
          <NotificationItem
            type="review_accepted"
            title="Review accepted"
            message="Your code review was accepted"
            timestamp={new Date(Date.now() - 7200000)}
            read={true}
          />
          <NotificationItem
            type="new_message"
            title="New comment"
            message="John left a comment on your review"
            timestamp={new Date(Date.now() - 10800000)}
            read={true}
          />
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className={cn(
        "p-4 rounded-xl",
        "border border-border bg-card",
        "space-y-3"
      )}>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Recent Activity
        </h3>

        <div className="space-y-4 relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />

          {/* Mock activity items - Replace with real data */}
          <TimelineItem
            type="review_submitted"
            title="Review submitted"
            description="Completed design review for Sarah"
            timestamp={new Date(Date.now() - 3600000)}
          />
          <TimelineItem
            type="review_accepted"
            title="Review accepted"
            description="Your code review was accepted"
            timestamp={new Date(Date.now() - 7200000)}
          />
          <TimelineItem
            type="comment_added"
            title="Comment added"
            description="John replied to your feedback"
            timestamp={new Date(Date.now() - 10800000)}
          />
        </div>

        <Link
          href="/activity"
          className={cn(
            "flex items-center justify-between",
            "px-3 py-2 rounded-lg",
            "text-sm font-medium text-muted-foreground",
            "hover:text-foreground hover:bg-muted/50",
            "transition-all duration-150"
          )}
        >
          <span>View all activity</span>
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

/**
 * Action Button Component
 */
interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant: "primary" | "secondary";
  shortcut?: string;
  count?: number;
}

function ActionButton({
  icon,
  label,
  onClick,
  variant,
  shortcut,
  count,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full h-14 px-4",
        "flex items-center gap-3",
        "rounded-xl text-left",
        "transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2",
        variant === "primary"
          ? "bg-accent-blue text-white hover:bg-accent-blue/90 shadow-sm"
          : "bg-muted/30 text-foreground hover:bg-muted/50 border border-border"
      )}
    >
      {/* Icon */}
      <div className={cn(
        "size-8 rounded-lg flex items-center justify-center flex-shrink-0",
        variant === "primary" ? "bg-white/10" : "bg-background"
      )}>
        {icon}
      </div>

      {/* Label */}
      <span className="flex-1 font-medium text-sm">{label}</span>

      {/* Count or Shortcut */}
      {count !== undefined && count > 0 ? (
        <Badge variant="secondary" size="sm">
          {count}
        </Badge>
      ) : shortcut ? (
        <kbd className={cn(
          "px-2 py-1 rounded text-xs font-mono",
          variant === "primary"
            ? "bg-white/20 text-white/80"
            : "bg-background/50 text-muted-foreground"
        )}>
          {shortcut}
        </kbd>
      ) : null}
    </button>
  );
}

/**
 * Stat Item Component
 */
interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change: string;
  trend: "up" | "down" | "neutral";
}

function StatItem({ icon, label, value, change, trend }: StatItemProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        <span className={cn(
          "text-xs font-medium flex items-center gap-1",
          trend === "up" ? "text-green-700" :
          trend === "down" ? "text-red-700" :
          "text-muted-foreground"
        )}>
          {trend === "up" && <TrendingUp className="size-3" />}
          {trend === "down" && <TrendingDown className="size-3" />}
          {change}
        </span>
      </div>
    </div>
  );
}

/**
 * Notification Item Component
 */
interface NotificationItemProps {
  type: "review_submitted" | "review_accepted" | "review_rejected" | "new_message";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

function NotificationItem({
  type,
  title,
  message,
  timestamp,
  read,
}: NotificationItemProps) {
  const icons = {
    review_submitted: <CheckCircle2 className="size-4 text-green-600" />,
    review_accepted: <ThumbsUp className="size-4 text-blue-600" />,
    review_rejected: <XCircle className="size-4 text-red-600" />,
    new_message: <MessageSquare className="size-4 text-accent-blue" />,
  };

  return (
    <div
      className={cn(
        "relative p-3 rounded-lg cursor-pointer",
        "transition-all duration-150 hover:bg-accent-blue/5",
        !read && "bg-accent-blue/5"
      )}
    >
      {/* Unread indicator */}
      {!read && (
        <div className="absolute top-3 right-3 size-2 rounded-full bg-accent-blue" />
      )}

      {/* Icon */}
      <div className="flex items-start gap-3">
        <div className="size-8 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0">
          {icons[type]}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="text-sm font-medium text-foreground mb-0.5">
            {title}
          </div>

          {/* Message */}
          <div className="text-xs text-muted-foreground line-clamp-2 mb-1">
            {message}
          </div>

          {/* Timestamp */}
          <div className="text-xs text-muted-foreground">
            {formatRelativeTime(timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Timeline Item Component
 */
interface TimelineItemProps {
  type: "review_created" | "review_submitted" | "review_accepted" | "comment_added";
  title: string;
  description: string;
  timestamp: Date;
}

function TimelineItem({ type, title, description, timestamp }: TimelineItemProps) {
  const icons = {
    review_created: <Plus className="size-3" />,
    review_submitted: <Send className="size-3" />,
    review_accepted: <CheckCircle2 className="size-3" />,
    comment_added: <MessageSquare className="size-3" />,
  };

  const colors = {
    review_created: "bg-accent-blue text-white",
    review_submitted: "bg-green-600 text-white",
    review_accepted: "bg-green-600 text-white",
    comment_added: "bg-accent-peach text-white",
  };

  return (
    <div className="relative pl-12">
      {/* Timeline dot */}
      <div className={cn(
        "absolute left-0 top-0",
        "size-8 rounded-full",
        "flex items-center justify-center",
        colors[type]
      )}>
        {icons[type]}
      </div>

      {/* Content */}
      <div className="space-y-1">
        <div className="text-sm font-medium text-foreground">
          {title}
        </div>
        <div className="text-xs text-muted-foreground">
          {description}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatRelativeTime(timestamp)}
        </div>
      </div>
    </div>
  );
}

/**
 * Format relative time helper
 */
function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const timestamp = date.getTime();
  const seconds = Math.floor((now - timestamp) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString();
}
