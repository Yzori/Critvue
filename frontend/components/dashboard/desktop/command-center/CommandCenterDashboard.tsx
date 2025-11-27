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
import { usePathname } from "next/navigation";
import {
  Palette,
  Briefcase,
  Command as CommandIcon,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  getCompletedReviews,
  type PendingReviewItem,
  type MyRequestItem,
  type ActiveReviewItem,
  type SubmittedReviewItem,
  type CompletedReviewItem,
} from "@/lib/api/dashboard";
import { getErrorMessage, isRetryableError } from "@/lib/api/client";

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
  const [error, setError] = React.useState<{ message: string; isRetryable: boolean } | null>(null);

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
    setError(null);

    try {
      if (role === "creator") {
        await loadCreatorData();
      } else {
        await loadReviewerData();
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError({
        message: getErrorMessage(err),
        isRetryable: isRetryableError(err),
      });
      // Set empty columns on error
      setKanbanColumns(getDefaultColumns(role).map(col => ({ ...col, items: [] })));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCreatorData() {
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
  }

  async function loadReviewerData() {
    // Load active reviews
    const activeResponse = await getActiveReviews(1, 20);

    // Load submitted reviews
    const submittedResponse = await getSubmittedReviews(1, 20);

    // Load completed reviews
    const completedResponse = await getCompletedReviews(1, 20);

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
      submittedResponse.items,
      completedResponse.items
    );

    setKanbanColumns(columns);
  }

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-8 mt-6">
        {/* Welcome Section with Role Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Welcome back{user?.full_name && `, ${user.full_name}`}!
              </h2>
              <p className="text-muted-foreground">
                {role === "creator"
                  ? "Here's what needs your attention today."
                  : "Here are your active reviews and opportunities."}
              </p>
            </div>

            {/* Role Toggle */}
            <div className="relative z-10 flex items-center gap-2 p-1.5 rounded-2xl bg-muted/50 border border-border">
              <button
                onClick={() => onRoleChange("creator")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl",
                  "font-medium text-sm transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50",
                  role === "creator"
                    ? "bg-accent-blue text-white shadow-lg shadow-accent-blue/25"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-pressed={role === "creator"}
              >
                <Palette className="size-4" />
                <span>Creator</span>
              </button>
              <button
                onClick={() => onRoleChange("reviewer")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl",
                  "font-medium text-sm transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50",
                  role === "reviewer"
                    ? "bg-accent-blue text-white shadow-lg shadow-accent-blue/25"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-pressed={role === "reviewer"}
              >
                <Briefcase className="size-4" />
                <span>Reviewer</span>
              </button>
            </div>
          </div>

          {/* Keyboard Hint */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CommandIcon className="size-3.5" />
            <span>
              Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">⌘K</kbd> to open command palette
              {" • "}
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">⌘⇧R</kbd> to toggle role
            </span>
          </div>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Failed to load dashboard data
                </p>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {error.message}
                </p>
              </div>
              {error.isRetryable && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadDashboardData()}
                  disabled={isLoading}
                  className="flex-shrink-0 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/50"
                >
                  <RefreshCw className={cn("size-4 mr-2", isLoading && "animate-spin")} />
                  Retry
                </Button>
              )}
            </div>
          </motion.div>
        )}

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
      </div>

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
    onView: () => window.location.href = `/review/${item.review_request_id}`,
  }));

  // In Progress column: Reviews being worked on OR newly created
  const inProgressRequests = allRequests.filter((r) =>
    // Show requests that are:
    // 1. Being actively reviewed (in_review with claimed reviewers)
    // 2. Newly created and awaiting reviewers (draft or pending status)
    (r.status === "in_review" && r.progress.claimed > 0 && r.progress.submitted < r.progress.requested) ||
    r.status === "draft" ||
    r.status === "pending"
  );

  const inProgressItems: ReviewActionCardProps[] = inProgressRequests.map((item) => ({
    id: item.id,
    title: item.title,
    contentType: item.content_type as any,
    status: item.status === "draft" || item.status === "pending" ? "available" : "in_review",
    timeText: new Date(item.created_at).toLocaleDateString(),
    progress: {
      current: item.progress.submitted,
      total: item.progress.requested,
      percentage: item.progress.requested > 0
        ? Math.round((item.progress.submitted / item.progress.requested) * 100)
        : 0,
    },
    onView: () => window.location.href = `/review/${item.id}`,
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
    onView: () => window.location.href = `/review/${item.id}`,
  }));

  return [
    { ...baseColumns[0], items: pendingItems } as KanbanColumn,
    { ...baseColumns[1], items: inProgressItems } as KanbanColumn,
    { ...baseColumns[2], items: completedItems } as KanbanColumn,
  ];
}

function transformReviewerDataToKanban(
  activeReviews: ActiveReviewItem[],
  submittedReviews: SubmittedReviewItem[],
  completedReviews: CompletedReviewItem[]
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
      onClick: () => window.location.href = `/reviewer/review/${item.slot_id}`,
    },
    onView: () => window.location.href = `/reviewer/review/${item.slot_id}`,
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
    onView: () => window.location.href = `/reviewer/review/${item.slot_id}`,
  }));

  // Completed column: Accepted reviews
  const completedItems: ReviewActionCardProps[] = completedReviews.map((item) => ({
    id: item.slot_id,
    title: item.review_request?.title || "Untitled",
    contentType: item.review_request?.content_type as any || "design",
    status: "completed",
    timeText: item.accepted_at ? new Date(item.accepted_at).toLocaleDateString() : "",
    earnings: item.payment_amount,
    rating: item.rating,
    onView: () => window.location.href = `/reviewer/review/${item.slot_id}`,
  }));

  return [
    { ...baseColumns[0], items: availableItems } as KanbanColumn,
    { ...baseColumns[1], items: workingOnItems } as KanbanColumn,
    { ...baseColumns[2], items: submittedItems } as KanbanColumn,
    { ...baseColumns[3], items: completedItems } as KanbanColumn,
  ];
}
