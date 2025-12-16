"use client";

/**
 * Mobile-First Unified Dashboard Page
 *
 * Complete redesign with modern 2024-2025 mobile UX patterns:
 * - Bottom tab navigation (thumb-friendly)
 * - Swipeable cards with quick actions
 * - Pull-to-refresh functionality
 * - Role switcher (sticky or floating)
 * - Urgency-based sorting and color coding
 * - Progressive disclosure
 * - 48px minimum touch targets
 * - Smooth animations and transitions
 *
 * Mobile Compliance:
 * - Follows mobile_guide.md principles
 * - Touch-optimized interactions
 * - Bottom sheets for modals
 * - Swipe gestures for navigation
 * - Optimized for one-handed use
 */

import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Briefcase, Palette, Settings, Bell, ChevronDown } from "lucide-react";
import MobileCreatorDashboard from "@/components/dashboard/mobile/mobile-creator-dashboard";
import MobileReviewerDashboard from "@/components/dashboard/mobile/mobile-reviewer-dashboard";
import { DashboardBottomNav } from "@/components/dashboard/mobile/dashboard-bottom-nav";
import { getUrgentPendingCount } from "@/lib/api/reviews/slots";
import { cn } from "@/lib/utils";

type DashboardRole = "creator" | "reviewer";

export default function MobileDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [activeRole, setActiveRole] = React.useState<DashboardRole>("creator");
  const [mounted, setMounted] = React.useState(false);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = React.useState(false);
  const [urgentCount, setUrgentCount] = React.useState(0);
  const [notificationCount] = React.useState(0); // Will be populated from notifications API

  // Hydrate state from URL params and localStorage after mount
  React.useEffect(() => {
    const urlRole = searchParams?.get("role");

    if (urlRole === "creator" || urlRole === "reviewer") {
      setActiveRole(urlRole);
    } else {
      const savedRole = localStorage.getItem("dashboardRole");
      if (savedRole === "creator" || savedRole === "reviewer") {
        setActiveRole(savedRole as DashboardRole);
      }
    }

    setMounted(true);
  }, [searchParams]);

  // Persist role selection to localStorage
  React.useEffect(() => {
    if (mounted) {
      localStorage.setItem("dashboardRole", activeRole);
    }
  }, [activeRole, mounted]);

  // Fetch urgent pending count for creator
  React.useEffect(() => {
    if (activeRole === "creator") {
      getUrgentPendingCount()
        .then(data => setUrgentCount(data.count))
        .catch(() => { /* Failed to fetch urgent count - non-critical */ });
    }
  }, [activeRole]);

  // Handle role change
  const handleRoleChange = (role: DashboardRole) => {
    setActiveRole(role);
    setIsRoleSwitcherOpen(false);

    // Update URL without navigation
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("role", role);
      window.history.pushState({}, "", url);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Welcome Message & Status */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground tracking-tight truncate">
                {user?.full_name ? `Hi, ${user.full_name.split(' ')[0]}!` : 'Welcome!'}
              </h1>
              <Badge variant="success" showDot pulse size="sm">
                Active
              </Badge>
            </div>

            {/* Notifications Badge */}
            <button
              onClick={() => router.push("/notifications")}
              className="relative p-2 rounded-lg hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Notifications"
            >
              <Bell className="size-5 text-muted-foreground" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </button>

            {/* Settings */}
            <button
              onClick={() => router.push("/settings")}
              className="p-2 rounded-lg hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Settings"
            >
              <Settings className="size-5 text-muted-foreground" />
            </button>
          </div>

          {/* Role Switcher - Tap to open bottom sheet */}
          <button
            onClick={() => setIsRoleSwitcherOpen(true)}
            className={cn(
              "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl",
              "border-2 transition-all min-h-[56px]",
              "active:scale-[0.98]",
              activeRole === "creator"
                ? "bg-gradient-to-r from-accent-blue/10 to-accent-blue/5 border-accent-blue/30"
                : "bg-gradient-to-r from-accent-peach/10 to-accent-peach/5 border-accent-peach/30"
            )}
          >
            <div className="flex items-center gap-3">
              {activeRole === "creator" ? (
                <div className="size-10 rounded-lg bg-accent-blue/20 flex items-center justify-center">
                  <Palette className="size-5 text-accent-blue" />
                </div>
              ) : (
                <div className="size-10 rounded-lg bg-accent-peach/20 flex items-center justify-center">
                  <Briefcase className="size-5 text-accent-peach" />
                </div>
              )}
              <div className="text-left">
                <div className="text-sm font-semibold text-foreground">
                  {activeRole === "creator" ? "Creator Mode" : "Reviewer Mode"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {activeRole === "creator"
                    ? "Manage your review requests"
                    : "Review and earn"}
                </div>
              </div>
            </div>
            <ChevronDown className="size-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {activeRole === "creator" ? (
            <motion.div
              key="creator"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <MobileCreatorDashboard />
            </motion.div>
          ) : (
            <motion.div
              key="reviewer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <MobileReviewerDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Tab Navigation */}
      <DashboardBottomNav
        role={activeRole}
        notificationCount={notificationCount}
        pendingActionsCount={urgentCount}
      />

      {/* Role Switcher Bottom Sheet */}
      <BottomSheet
        isOpen={isRoleSwitcherOpen}
        onClose={() => setIsRoleSwitcherOpen(false)}
        title="Switch Mode"
        description="Choose how you want to use Critvue"
      >
        <div className="space-y-3">
          {/* Creator Option */}
          <button
            onClick={() => handleRoleChange("creator")}
            className={cn(
              "w-full rounded-2xl border-2 p-6 text-left transition-all min-h-[120px]",
              "active:scale-[0.98]",
              activeRole === "creator"
                ? "bg-gradient-to-br from-accent-blue/10 to-accent-blue/5 border-accent-blue"
                : "border-border hover:border-accent-blue/30"
            )}
          >
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-xl bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
                <Palette className="size-6 text-accent-blue" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-foreground">Creator Mode</h3>
                  {activeRole === "creator" && (
                    <Badge variant="info" size="sm">Active</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Request reviews on your work, manage feedback, and track progress
                </p>
                {urgentCount > 0 && (
                  <Badge variant="error" size="sm" showDot pulse className="mt-2">
                    {urgentCount} urgent action{urgentCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          </button>

          {/* Reviewer Option */}
          <button
            onClick={() => handleRoleChange("reviewer")}
            className={cn(
              "w-full rounded-2xl border-2 p-6 text-left transition-all min-h-[120px]",
              "active:scale-[0.98]",
              activeRole === "reviewer"
                ? "bg-gradient-to-br from-accent-peach/10 to-accent-peach/5 border-accent-peach"
                : "border-border hover:border-accent-peach/30"
            )}
          >
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-xl bg-accent-peach/20 flex items-center justify-center flex-shrink-0">
                <Briefcase className="size-6 text-accent-peach" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-foreground">Reviewer Mode</h3>
                  {activeRole === "reviewer" && (
                    <Badge variant="info" size="sm">Active</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Claim reviews, provide feedback, earn money and build your reputation
                </p>
              </div>
            </div>
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
