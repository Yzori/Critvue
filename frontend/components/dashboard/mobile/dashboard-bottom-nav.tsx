"use client";

/**
 * Dashboard Bottom Tab Navigation
 *
 * Mobile-first navigation specifically for the dashboard with role-aware tabs
 *
 * Features:
 * - Role-specific tabs (Creator vs Reviewer)
 * - Notification badges
 * - Smooth tab transitions
 * - 48px touch targets
 * - Active state indicators
 * - Persistent across dashboard views
 */

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { BottomNav, type BottomNavItem } from "@/components/ui/bottom-nav";
import {
  Home,
  Bell,
  Plus,
  BarChart3,
  User,
  Search,
  FileText,
} from "lucide-react";

type DashboardRole = "creator" | "reviewer";

interface DashboardBottomNavProps {
  role: DashboardRole;
  notificationCount?: number;
  pendingActionsCount?: number;
  onRoleChange?: (role: DashboardRole) => void;
}

export function DashboardBottomNav({
  role,
  notificationCount = 0,
  pendingActionsCount = 0,
}: DashboardBottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = React.useState("home");

  // Update active tab based on pathname
  React.useEffect(() => {
    if (pathname.includes("/notifications")) {
      setActiveTab("notifications");
    } else if (pathname.includes("/stats") || pathname.includes("/karma")) {
      setActiveTab("stats");
    } else if (pathname.includes("/profile") || pathname.includes("/settings")) {
      setActiveTab("profile");
    } else if (pathname.includes("/browse")) {
      setActiveTab("browse");
    } else if (pathname.includes("/review/new")) {
      setActiveTab("new");
    } else {
      setActiveTab("home");
    }
  }, [pathname]);

  // Creator Mode Navigation Items
  const creatorItems: BottomNavItem[] = [
    {
      id: "home",
      label: "Home",
      icon: <Home className="size-5" />,
      activeIcon: <Home className="size-5 fill-current" />,
      onClick: () => {
        setActiveTab("home");
        router.push("/dashboard?role=creator");
      },
      badge: pendingActionsCount,
    },
    {
      id: "notifications",
      label: "Alerts",
      icon: <Bell className="size-5" />,
      activeIcon: <Bell className="size-5 fill-current" />,
      onClick: () => {
        setActiveTab("notifications");
        router.push("/notifications");
      },
      badge: notificationCount,
    },
    {
      id: "new",
      label: "New",
      icon: <Plus className="size-6" />,
      onClick: () => {
        setActiveTab("new");
        router.push("/review/new");
      },
    },
    {
      id: "stats",
      label: "Stats",
      icon: <BarChart3 className="size-5" />,
      activeIcon: <BarChart3 className="size-5 fill-current" />,
      onClick: () => {
        setActiveTab("stats");
        router.push("/dashboard/karma");
      },
    },
    {
      id: "profile",
      label: "Profile",
      icon: <User className="size-5" />,
      activeIcon: <User className="size-5 fill-current" />,
      onClick: () => {
        setActiveTab("profile");
        router.push("/profile");
      },
    },
  ];

  // Reviewer Mode Navigation Items
  const reviewerItems: BottomNavItem[] = [
    {
      id: "home",
      label: "Home",
      icon: <Home className="size-5" />,
      activeIcon: <Home className="size-5 fill-current" />,
      onClick: () => {
        setActiveTab("home");
        router.push("/dashboard?role=reviewer");
      },
    },
    {
      id: "browse",
      label: "Browse",
      icon: <Search className="size-5" />,
      onClick: () => {
        setActiveTab("browse");
        router.push("/browse");
      },
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: <FileText className="size-5" />,
      activeIcon: <FileText className="size-5 fill-current" />,
      onClick: () => {
        setActiveTab("reviews");
        router.push("/dashboard?role=reviewer");
      },
      badge: pendingActionsCount,
    },
    {
      id: "stats",
      label: "Earnings",
      icon: <BarChart3 className="size-5" />,
      activeIcon: <BarChart3 className="size-5 fill-current" />,
      onClick: () => {
        setActiveTab("stats");
        router.push("/dashboard/karma");
      },
    },
    {
      id: "profile",
      label: "Profile",
      icon: <User className="size-5" />,
      activeIcon: <User className="size-5 fill-current" />,
      onClick: () => {
        setActiveTab("profile");
        router.push("/profile");
      },
    },
  ];

  const items = role === "creator" ? creatorItems : reviewerItems;

  return <BottomNav items={items} activeId={activeTab} />;
}
