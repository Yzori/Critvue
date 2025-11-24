"use client";

/**
 * Command Center Dashboard
 *
 * Revolutionary dashboard design that breaks away from generic three-panel layouts.
 * Action-first, keyboard-driven, spatially intelligent interface.
 *
 * Architecture:
 * - Slim top bar (role toggle, Cmd+K, profile)
 * - Urgent actions floating card (when critical items exist)
 * - Kanban board (3 columns: Pending/In Progress/Completed)
 * - Quick action bar (keyboard shortcuts)
 * - Command palette (Cmd+K universal search)
 *
 * Features:
 * - NO three-panel left/center/right layout
 * - Keyboard-first navigation
 * - Inline actions throughout
 * - Smooth Framer Motion animations
 * - Role-specific workflows (Creator vs Reviewer)
 *
 * Brand Compliance:
 * - Critvue brand colors (#3B82F6, #F97316)
 * - WCAG AA accessible
 * - Smooth, purposeful animations
 * - Responsive (1280px+ for full experience)
 *
 * @module CommandCenterDashboard
 */

import * as React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Palette,
  Briefcase,
  Command as CommandIcon,
  User,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

// Command Center Components
import { CommandPalette } from "./CommandPalette";
import { UrgentActionsCard, UrgentAction } from "./UrgentActionsCard";
import { KanbanBoard, KanbanColumn, getDefaultColumns } from "./KanbanBoard";
import { QuickActionBar } from "./QuickActionBar";
import { ReviewActionCardProps } from "./ReviewActionCard";

// API imports
import {
  getActionsNeeded,
  getMyRequests,
  getActiveReviews,
  getSubmittedReviews,
  getDashboardStats,
  type PendingReviewItem,
  type MyRequestItem,
  type ActiveReviewItem,
  type SubmittedReviewItem,
} from "@/lib/api/dashboard";

export interface CommandCenterDashboardProps {
  /**
   * Current role (creator or reviewer)
   */
  role: "creator" | "reviewer";

  /**
   * Callback when role changes
   */
  onRoleChange: (role: "creator" | "reviewer") => void;

  /**
   * Optional className
   */
  className?: string;
}

/**
 * Command Center Dashboard Component
 *
 * Main container for the revolutionary dashboard experience.
 */
export function CommandCenterDashboard({
  role,
  onRoleChange,
  className,
}: CommandCenterDashboardProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [urgentActions, setUrgentActions] = React.useState<UrgentAction[]>([]);
  const [kanbanColumns, setKanbanColumns] = React.useState<KanbanColumn[]>([]);

  // Keyboard shortcut to open command palette (Cmd/Ctrl + K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }

      // Role toggle shortcut (Cmd/Ctrl + Shift + R)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "r") {
        e.preventDefault();
        onRoleChange(role === "creator" ? "reviewer" : "creator");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [role, onRoleChange]);

  // Load dashboard data based on role
  React.useEffect(() => {
    loadDashboardData();
  }, [role]);

  async function loadDashboardData() {
    setIsLoading(true);

    try {
      if (role === "creator") {
        await loadCreatorData();
      } else {
        await loadReviewerData();
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCreatorData() {
    try {
      // Load actions needed (pending reviews)
      const actionsResponse = await getActionsNeeded(1, 20);

      // Load all requests
      const requestsResponse = await getMyRequests(undefined, 1, 50);

      // Transform to urgent actions
      const urgent = actionsResponse.items
        .filter((item) =>
          item.urgency_level === "CRITICAL" || item.urgency_level === "HIGH"
        )
        .map(transformToUrgentAction);

      setUrgentActions(urgent);

      // Transform to kanban columns
      const columns = transformCreatorDataToKanban(
        actionsResponse.items,
        requestsResponse.items
      );

      setKanbanColumns(columns);
    } catch (error) {
      console.error("Error loading creator data:", error);
      // Set empty columns on error
      setKanbanColumns(getDefaultColumns("creator").map(col => ({ ...col, items: [] })));
    }
  }

  async function loadReviewerData() {
    try {
      // Load active reviews
      const activeResponse = await getActiveReviews(1, 20);

      // Load submitted reviews
      const submittedResponse = await getSubmittedReviews(1, 20);

      // Transform to urgent actions
      const urgent = activeResponse.items
        .filter((item) =>
          item.urgency_level === "CRITICAL" || item.urgency_level === "HIGH"
        )
        .map(transformActiveToUrgentAction);

      setUrgentActions(urgent);

      // Transform to kanban columns
      const columns = transformReviewerDataToKanban(
        activeResponse.items,
        submittedResponse.items
      );

      setKanbanColumns(columns);
    } catch (error) {
      console.error("Error loading reviewer data:", error);
      // Set empty columns on error
      setKanbanColumns(getDefaultColumns("reviewer").map(col => ({ ...col, items: [] })));
    }
  }

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Top Bar */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Left: Logo + Role Toggle */}
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-xl font-bold text-foreground hover:opacity-80 transition-opacity"
              >
                Critvue
              </Link>

              {/* Role Toggle */}
              <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border">
                <button
                  onClick={() => onRoleChange("creator")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg",
                    "text-sm font-medium transition-all duration-200",
                    role === "creator"
                      ? "bg-gradient-to-br from-accent-blue to-accent-blue/90 text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
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
                    "flex items-center gap-2 px-4 py-2 rounded-lg",
                    "text-sm font-medium transition-all duration-200",
                    role === "reviewer"
                      ? "bg-gradient-to-br from-accent-peach to-accent-peach/90 text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                  aria-label="Switch to Reviewer mode"
                  aria-pressed={role === "reviewer"}
                >
                  <Briefcase className="size-4" />
                  <span>Reviewer</span>
                </button>
              </div>
            </div>

            {/* Center: Navigation Links + Command Palette */}
            <div className="flex items-center gap-4 flex-1 justify-center">
              {/* Navigation Links */}
              <nav className="flex items-center gap-1">
                <Link
                  href="/browse"
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname?.startsWith("/browse")
                      ? "text-accent-blue bg-accent-blue/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  Browse
                </Link>
                <Link
                  href="/how-it-works"
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname?.startsWith("/how-it-works")
                      ? "text-accent-blue bg-accent-blue/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  How It Works
                </Link>
              </nav>

              {/* Command Palette Trigger */}
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className={cn(
                  "flex items-center gap-3",
                  "px-4 py-2",
                  "rounded-xl",
                  "border border-border",
                  "bg-muted/30",
                  "hover:bg-muted/50",
                  "transition-colors",
                  "text-muted-foreground",
                  "hover:text-foreground",
                  "min-w-[240px]"
                )}
              >
                <CommandIcon className="size-4" />
                <span className="text-sm">Search...</span>
                <kbd className="ml-auto px-2 py-1 rounded bg-background border border-border text-xs font-mono">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Right: User Menu */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="size-9 p-0 relative"
                aria-label="Notifications"
              >
                <Bell className="size-5" />
                <span className="absolute top-1 right-1 size-2 rounded-full bg-red-500" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="size-9 p-0"
                aria-label="Settings"
              >
                <Settings className="size-5" />
              </Button>

              <div className="w-px h-6 bg-border mx-2" aria-hidden="true" />

              <button
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                aria-label="User menu"
              >
                <div className="size-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-peach flex items-center justify-center text-white font-semibold text-sm">
                  {user?.full_name?.charAt(0) || "U"}
                </div>
                <span className="text-sm font-medium text-foreground hidden lg:inline">
                  {user?.full_name || "User"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back{user?.full_name && `, ${user.full_name}`}!
          </h2>
          <p className="text-muted-foreground">
            {role === "creator"
              ? "Here's what needs your attention today."
              : "Here are your active reviews and opportunities."}
          </p>
        </motion.div>

        {/* Urgent Actions Card */}
        {urgentActions.length > 0 && (
          <UrgentActionsCard
            actions={urgentActions}
            role={role}
            onDismiss={() => setUrgentActions([])}
          />
        )}

        {/* Kanban Board */}
        <KanbanBoard
          role={role}
          columns={kanbanColumns}
          isLoading={isLoading}
        />
      </main>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        role={role}
      />

      {/* Quick Action Bar */}
      <QuickActionBar role={role} />
    </div>
  );
}

// Transform functions to convert API data to UI components

function transformToUrgentAction(item: PendingReviewItem): UrgentAction {
  return {
    id: `review-${item.slot_id}`,
    type: "review_submitted",
    title: item.review_request_title,
    description: `Review from ${item.reviewer?.name || "Unknown"} awaiting your approval`,
    deadline: item.auto_accept_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    urgencyLevel: item.urgency_level as "CRITICAL" | "HIGH",
    actions: {
      primary: {
        label: "Accept",
        action: () => console.log("Accept review", item.slot_id),
      },
      secondary: {
        label: "Decline",
        action: () => console.log("Decline review", item.slot_id),
      },
      view: {
        label: "View",
        action: () => console.log("View review", item.slot_id),
      },
    },
  };
}

function transformActiveToUrgentAction(item: ActiveReviewItem): UrgentAction {
  return {
    id: `active-${item.slot_id}`,
    type: "claim_deadline",
    title: item.review_request?.title || "Untitled Review",
    description: `Complete before deadline: ${item.countdown_text}`,
    deadline: item.claim_deadline || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    urgencyLevel: item.urgency_level as "CRITICAL" | "HIGH",
    actions: {
      primary: {
        label: "Continue",
        action: () => console.log("Continue review", item.slot_id),
      },
      view: {
        label: "View",
        action: () => console.log("View review", item.slot_id),
      },
    },
  };
}

function transformCreatorDataToKanban(
  actionsNeeded: PendingReviewItem[],
  allRequests: MyRequestItem[]
): KanbanColumn[] {
  const baseColumns = getDefaultColumns("creator");

  // Pending column: Reviews awaiting approval
  const pendingItems: ReviewActionCardProps[] = actionsNeeded.map((item) => ({
    id: item.slot_id,
    title: item.review_request_title,
    description: `Review from ${item.reviewer?.name || "Unknown"}`,
    contentType: "design", // TODO: Get from API
    status: "pending",
    urgency: item.urgency_level as any,
    timeText: item.countdown_text,
    rating: item.rating,
    primaryAction: {
      label: "Accept",
      onClick: () => console.log("Accept", item.slot_id),
      variant: "success",
    },
    secondaryAction: {
      label: "Decline",
      onClick: () => console.log("Decline", item.slot_id),
    },
    onView: () => console.log("View", item.slot_id),
  }));

  // In Progress column: Reviews being worked on
  const inProgressRequests = allRequests.filter((r) =>
    r.status === "in_review" && r.progress.claimed > 0 && r.progress.submitted < r.progress.requested
  );

  const inProgressItems: ReviewActionCardProps[] = inProgressRequests.map((item) => ({
    id: item.id,
    title: item.title,
    contentType: item.content_type as any,
    status: "in_review",
    timeText: new Date(item.created_at).toLocaleDateString(),
    progress: {
      current: item.progress.submitted,
      total: item.progress.requested,
      percentage: Math.round((item.progress.submitted / item.progress.requested) * 100),
    },
    onView: () => console.log("View", item.id),
  }));

  // Completed column: Finished reviews
  const completedRequests = allRequests.filter((r) => r.status === "completed");

  const completedItems: ReviewActionCardProps[] = completedRequests.map((item) => ({
    id: item.id,
    title: item.title,
    contentType: item.content_type as any,
    status: "completed",
    timeText: new Date(item.created_at).toLocaleDateString(),
    progress: {
      current: item.progress.accepted,
      total: item.progress.requested,
      percentage: 100,
    },
    onView: () => console.log("View", item.id),
  }));

  return [
    { ...baseColumns[0], items: pendingItems },
    { ...baseColumns[1], items: inProgressItems },
    { ...baseColumns[2], items: completedItems },
  ];
}

function transformReviewerDataToKanban(
  activeReviews: ActiveReviewItem[],
  submittedReviews: SubmittedReviewItem[]
): KanbanColumn[] {
  const baseColumns = getDefaultColumns("reviewer");

  // Available column: Claimable reviews (TODO: Add marketplace API)
  const availableItems: ReviewActionCardProps[] = [];

  // Working On column: Claimed reviews
  const workingOnItems: ReviewActionCardProps[] = activeReviews.map((item) => ({
    id: item.slot_id,
    title: item.review_request?.title || "Untitled",
    description: item.review_request?.description_preview,
    contentType: item.review_request?.content_type as any || "design",
    status: "claimed",
    urgency: item.urgency_level as any,
    timeText: item.countdown_text,
    earnings: item.earnings_potential,
    primaryAction: {
      label: item.draft_progress.has_draft ? "Continue" : "Start",
      onClick: () => console.log("Continue review", item.slot_id),
    },
    onView: () => console.log("View", item.slot_id),
  }));

  // Submitted column: Awaiting acceptance
  const submittedItems: ReviewActionCardProps[] = submittedReviews.map((item) => ({
    id: item.slot_id,
    title: item.review_request?.title || "Untitled",
    contentType: item.review_request?.content_type as any || "design",
    status: "submitted",
    urgency: item.urgency_level as any,
    timeText: item.countdown_text,
    earnings: item.payment_amount,
    rating: item.rating,
    onView: () => console.log("View", item.slot_id),
  }));

  return [
    { ...baseColumns[0], items: availableItems },
    { ...baseColumns[1], items: workingOnItems },
    { ...baseColumns[2], items: submittedItems },
  ];
}
