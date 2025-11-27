"use client";

/**
 * Desktop Left Navigation Panel
 *
 * Dimensions: 280px width (240px on smaller desktop)
 * Position: Sticky, full height
 *
 * Contains:
 * - Role switcher (Creator/Reviewer) with brand gradient
 * - Navigation menu with badges and active states
 * - Quick stats widget with mini metrics
 * - Tier progress widget with karma display
 *
 * Brand Compliance:
 * - Text colors: text-foreground (15.8:1), text-muted-foreground (4.6:1)
 * - Active states: text-blue-700 (6.68:1 contrast) - WCAG AA
 * - Touch targets: 48px minimum height
 * - Focus rings: ring-accent-blue with 2px width, 2px offset
 * - Smooth transitions with reduced motion support
 *
 * @module DesktopLeftPanel
 */

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Palette,
  Briefcase,
  Zap,
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  FolderOpen,
  Settings,
  Inbox,
  PenTool,
  DollarSign,
  Trophy,
  Award,
  Star,
  MessageSquare,
  Crown,
  TrendingDown,
} from "lucide-react";
import type { DashboardRole, DashboardTab } from "../desktop-dashboard-container";
import { getDashboardStats, type DashboardStats } from "@/lib/api/dashboard";
import useSWR from "swr";

export interface DesktopLeftPanelProps {
  /**
   * Current dashboard role
   */
  role: DashboardRole;

  /**
   * Callback when role changes
   */
  onRoleChange: (role: DashboardRole) => void;

  /**
   * Active tab identifier
   */
  activeTab: DashboardTab;

  /**
   * Callback when tab changes
   */
  onTabChange: (tab: DashboardTab) => void;
}

interface NavItem {
  id: DashboardTab | string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  href?: string;
}

/**
 * Desktop Left Navigation Panel Component
 */
export function DesktopLeftPanel({
  role,
  onRoleChange,
  activeTab,
  onTabChange,
}: DesktopLeftPanelProps) {
  const pathname = usePathname();

  // Fetch dashboard stats with SWR (30s refresh)
  const { data: stats } = useSWR<DashboardStats>(
    `/dashboard/stats?role=${role}&period=week`,
    () => getDashboardStats(role, "week"),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  // Navigation items based on role
  const creatorNavItems: NavItem[] = [
    { id: "actions", icon: <Zap className="size-5" />, label: "Actions Needed", badge: 3 },
    { id: "requests", icon: <FileText className="size-5" />, label: "My Requests", badge: 12 },
    { id: "history", icon: <Clock className="size-5" />, label: "History" },
    { id: "analytics", icon: <TrendingUp className="size-5" />, label: "Analytics", href: "/analytics" },
    { id: "projects", icon: <FolderOpen className="size-5" />, label: "Projects", href: "/projects" },
    { id: "settings", icon: <Settings className="size-5" />, label: "Settings", href: "/settings" },
  ];

  const reviewerNavItems: NavItem[] = [
    { id: "browse", icon: <Inbox className="size-5" />, label: "Browse Reviews", badge: 24, href: "/browse" },
    { id: "active", icon: <PenTool className="size-5" />, label: "My Reviews", badge: 2 },
    { id: "submitted", icon: <CheckCircle2 className="size-5" />, label: "Submitted" },
    { id: "earnings", icon: <DollarSign className="size-5" />, label: "Earnings", href: "/reviewer/earnings" },
    { id: "leaderboard", icon: <Trophy className="size-5" />, label: "Leaderboard", href: "/leaderboard" },
    { id: "tier", icon: <Award className="size-5" />, label: "Tier Progress", href: "/reviewer/tier" },
    { id: "portfolio", icon: <Star className="size-5" />, label: "Portfolio", href: "/reviewer/portfolio" },
    { id: "settings", icon: <Settings className="size-5" />, label: "Settings", href: "/settings" },
  ];

  const navItems = role === "creator" ? creatorNavItems : reviewerNavItems;

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Role Switcher */}
      <div className={cn(
        "relative p-2",
        "bg-muted/50 rounded-xl",
        "border border-border"
      )}>
        {/* Background slider for active role */}
        <motion.div
          className={cn(
            "absolute inset-y-2 bg-background rounded-lg shadow-sm"
          )}
          initial={false}
          animate={{
            left: role === "creator" ? 8 : "calc(50% + 4px)",
            right: role === "creator" ? "calc(50% + 4px)" : 8,
          }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        />

        {/* Role buttons */}
        <div className="relative flex gap-2">
          <button
            onClick={() => onRoleChange("creator")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2",
              "px-4 py-2.5 rounded-lg",
              "text-sm font-medium",
              "min-h-[44px]",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2",
              role === "creator"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Switch to Creator mode"
            aria-pressed={role === "creator"}
          >
            <Palette className="size-4" />
            <span>Creator</span>
          </button>

          <button
            onClick={() => onRoleChange("reviewer")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2",
              "px-4 py-2.5 rounded-lg",
              "text-sm font-medium",
              "min-h-[44px]",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2",
              role === "reviewer"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Switch to Reviewer mode"
            aria-pressed={role === "reviewer"}
          >
            <Briefcase className="size-4" />
            <span>Reviewer</span>
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = item.id === activeTab;
          const Component = item.href ? Link : "button";

          return (
            <Component
              key={item.id}
              {...(item.href ? { href: item.href } : { onClick: () => onTabChange(item.id as DashboardTab) })}
              className={cn(
                "group relative flex items-center gap-3 w-full",
                "px-3 py-3 rounded-xl",
                "min-h-[48px]",
                "text-left",
                "transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2",
                isActive
                  ? "bg-accent-blue/10 text-blue-700"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Icon */}
              <div className={cn(
                "flex-shrink-0",
                isActive ? "text-blue-700" : "text-muted-foreground group-hover:text-foreground"
              )}>
                {item.icon}
              </div>

              {/* Label */}
              <span className="flex-1 text-sm font-medium">
                {item.label}
              </span>

              {/* Badge */}
              {item.badge !== undefined && item.badge > 0 && (
                <Badge
                  variant={item.badge > 5 ? "error" : "secondary"}
                  size="sm"
                  className="min-w-[20px] h-5 px-1.5"
                >
                  {item.badge > 99 ? "99+" : item.badge}
                </Badge>
              )}
            </Component>
          );
        })}
      </nav>

      {/* Quick Stats Widget */}
      {stats && (
        <div className={cn(
          "p-4 rounded-xl",
          "bg-accent-blue/5 border border-accent-blue/10",
          "space-y-3"
        )}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            This Week
          </h3>

          <div className="space-y-2">
            {role === "creator" ? (
              <>
                <StatRow
                  icon={<MessageSquare className="size-4 text-accent-blue" />}
                  label="Reviews Received"
                  value={stats.stats.reviews_received || 0}
                  trend={stats.stats.reviews_received > 0 ? "+2" : undefined}
                  trendDirection="up"
                />
                <StatRow
                  icon={<CheckCircle2 className="size-4 text-green-600" />}
                  label="Accepted"
                  value={stats.stats.reviews_accepted || 0}
                  trend={stats.stats.reviews_accepted > 0 ? "+3" : undefined}
                  trendDirection="up"
                />
                <StatRow
                  icon={<Clock className="size-4 text-amber-600" />}
                  label="Pending"
                  value={(stats.stats.reviews_received || 0) - (stats.stats.reviews_accepted || 0)}
                />
              </>
            ) : (
              <>
                <StatRow
                  icon={<PenTool className="size-4 text-accent-peach" />}
                  label="Reviews Given"
                  value={stats.stats.reviews_given || 0}
                  trend={stats.stats.reviews_given > 0 ? "+4" : undefined}
                  trendDirection="up"
                />
                <StatRow
                  icon={<CheckCircle2 className="size-4 text-green-600" />}
                  label="Accepted"
                  value={stats.stats.reviews_accepted || 0}
                />
                <StatRow
                  icon={<DollarSign className="size-4 text-green-600" />}
                  label="Earned"
                  value={`$${(stats.stats.total_earned || 0).toFixed(0)}`}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Tier Progress Widget */}
      <div className={cn(
        "p-4 rounded-xl",
        "bg-gradient-to-br from-accent-peach/5 to-accent-blue/5",
        "border border-border",
        "space-y-3"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tier Progress
          </h3>
          <Crown className="size-4 text-accent-peach" />
        </div>

        {/* Current tier */}
        <div className="flex items-center gap-2">
          <Badge variant="primary" size="md" className="gap-1">
            <Star className="size-3" />
            Bronze Tier
          </Badge>
          <span className="text-xs text-muted-foreground">Level 3</span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">750 / 1000 Karma</span>
            <span className="text-foreground font-semibold">75%</span>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent-peach to-accent-blue rounded-full"
              initial={{ width: 0 }}
              animate={{ width: "75%" }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Next milestone */}
        <p className="text-xs text-muted-foreground">
          250 karma to <span className="text-foreground font-semibold">Silver Tier</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Stat Row Component
 */
interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  trend?: string;
  trendDirection?: "up" | "down";
}

function StatRow({ icon, label, value, trend, trendDirection }: StatRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {icon}
        <span className="text-sm text-muted-foreground truncate">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-foreground">{value}</span>
        {trend && (
          <span className={cn(
            "text-xs font-medium flex items-center gap-0.5",
            trendDirection === "up" ? "text-green-700" : "text-red-700"
          )}>
            {trendDirection === "up" ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
