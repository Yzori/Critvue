"use client";

/**
 * Kanban Board Component
 *
 * Visual workflow board displaying reviews across different states.
 * Core layout component for Command Center dashboard.
 *
 * Columns:
 * - Creator Mode: Pending Action | In Progress | Completed
 * - Reviewer Mode: Available | Working On | Submitted
 *
 * Features:
 * - Three equal-width columns
 * - Smooth card animations
 * - Empty states with illustrations
 * - Horizontal scroll if needed
 * - State transition animations
 *
 * Brand Compliance:
 * - Critvue brand colors
 * - Framer Motion layout animations
 * - WCAG AA accessible
 * - Keyboard navigation support
 *
 * @module KanbanBoard
 */

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Loader2,
  CheckCircle2,
  Briefcase,
  FileText,
  Send,
  Inbox,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ReviewActionCard, ReviewActionCardProps } from "./ReviewActionCard";

export interface KanbanColumn {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  items: ReviewActionCardProps[];
  emptyState: {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: {
      label: string;
      href?: string;
      onClick?: () => void;
    };
  };
}

export interface KanbanBoardProps {
  /**
   * Current role (creator or reviewer)
   */
  role: "creator" | "reviewer";

  /**
   * Columns configuration
   */
  columns: KanbanColumn[];

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Optional className
   */
  className?: string;
}

/**
 * Kanban Board Component
 *
 * Displays reviews in a three-column workflow layout.
 */
export function KanbanBoard({
  role,
  columns,
  isLoading = false,
  className,
}: KanbanBoardProps) {
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <KanbanSkeleton />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Board Grid */}
      <div
        className={cn(
          "grid gap-4",
          "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          "auto-rows-[minmax(400px,1fr)]"
        )}
      >
        {columns.map((column, index) => (
          <KanbanColumn
            key={column.id}
            column={column}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual Kanban Column
 */
function KanbanColumn({
  column,
  index,
}: {
  column: KanbanColumn;
  index: number;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const hasItems = column.items.length > 0;
  const MAX_PREVIEW_ITEMS = 3;
  const hasMoreItems = column.items.length > MAX_PREVIEW_ITEMS;
  const displayItems = isExpanded ? column.items : column.items.slice(0, MAX_PREVIEW_ITEMS);
  const hiddenCount = column.items.length - MAX_PREVIEW_ITEMS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.1,
      }}
      className={cn(
        "flex flex-col",
        "rounded-2xl",
        "border border-border",
        "bg-muted/30",
        "overflow-hidden",
        "min-h-[400px]"
      )}
    >
      {/* Column Header */}
      <div className={cn(
        "flex items-center justify-between",
        "px-4 py-4",
        "border-b border-border",
        "bg-background/50 backdrop-blur-sm"
      )}>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "size-9 rounded-lg flex items-center justify-center",
              column.color
            )}
          >
            {column.icon}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {column.title}
            </h3>
            {column.subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {column.subtitle}
              </p>
            )}
          </div>
        </div>
        <div
          className={cn(
            "size-7 rounded-full flex items-center justify-center",
            "bg-accent-blue/10 text-accent-blue",
            "text-sm font-semibold"
          )}
        >
          {column.items.length}
        </div>
      </div>

      {/* Column Content */}
      <div className={cn(
        "flex-1 p-4",
        isExpanded && "overflow-y-auto max-h-[600px]"
      )}>
        {hasItems ? (
          <>
            <motion.div
              className="space-y-3"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence mode="popLayout">
                {displayItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                      layout: { type: "spring", damping: 25, stiffness: 300 },
                      opacity: { duration: 0.2 },
                    }}
                  >
                    <ReviewActionCard {...item} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Show More / Show Less Button */}
            {hasMoreItems && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                  "w-full mt-3 py-2.5 px-4",
                  "rounded-xl",
                  "border border-border",
                  "bg-background/50 hover:bg-background/80",
                  "text-sm font-medium text-muted-foreground hover:text-foreground",
                  "transition-all duration-200",
                  "flex items-center justify-center gap-2"
                )}
              >
                {isExpanded ? (
                  <>
                    <span>Show less</span>
                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </>
                ) : (
                  <>
                    <span>View {hiddenCount} more</span>
                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </motion.button>
            )}
          </>
        ) : (
          <EmptyState
            icon={column.emptyState.icon}
            title={column.emptyState.title}
            description={column.emptyState.description}
            action={column.emptyState.action}
          />
        )}
      </div>
    </motion.div>
  );
}

/**
 * Empty State Component
 */
function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center text-center py-12 px-4"
    >
      <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">
        {icon}
      </div>
      <h4 className="font-semibold text-foreground mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>

      {action && (
        action.href ? (
          <Link href={action.href}>
            <Button className="flex items-center gap-2">
              {action.label}
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        ) : (
          <Button onClick={action.onClick} className="flex items-center gap-2">
            {action.label}
            <ArrowRight className="size-4" />
          </Button>
        )
      )}
    </motion.div>
  );
}

/**
 * Loading Skeleton
 */
function KanbanSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-muted/30 overflow-hidden min-h-[400px]"
        >
          {/* Header Skeleton */}
          <div className="px-4 py-4 border-b border-border bg-background/50">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-24" />
                <div className="h-3 bg-muted rounded animate-pulse w-32" />
              </div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((j) => (
              <div
                key={j}
                className="h-32 rounded-xl bg-muted animate-pulse"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Helper: Get default columns for role
 */
export function getDefaultColumns(role: "creator" | "reviewer"): Omit<
  KanbanColumn,
  "items"
>[] {
  if (role === "creator") {
    return [
      {
        id: "pending",
        title: "Pending Action",
        subtitle: "Awaiting your approval",
        icon: <Clock className="size-5" />,
        color: "bg-amber-500/10 text-amber-600",
        emptyState: {
          icon: <Inbox className="size-8" />,
          title: "All caught up!",
          description: "No reviews awaiting your action right now.",
        },
      },
      {
        id: "in_progress",
        title: "In Progress",
        subtitle: "Being reviewed",
        icon: <Loader2 className="size-5" />,
        color: "bg-blue-500/10 text-accent-blue",
        emptyState: {
          icon: <Loader2 className="size-8" />,
          title: "No active reviews",
          description: "Reviews you've accepted will appear here.",
        },
      },
      {
        id: "completed",
        title: "Completed",
        subtitle: "Finished reviews",
        icon: <CheckCircle2 className="size-5" />,
        color: "bg-green-500/10 text-green-600",
        emptyState: {
          icon: <CheckCircle2 className="size-8" />,
          title: "No completed reviews yet",
          description: "Completed reviews will show up here.",
        },
      },
    ];
  }

  // Reviewer columns
  return [
    {
      id: "available",
      title: "Available",
      subtitle: "Ready to claim",
      icon: <Briefcase className="size-5" />,
      color: "bg-purple-500/10 text-purple-600",
      emptyState: {
        icon: <Briefcase className="size-8" />,
        title: "No available reviews",
        description: "Browse the marketplace to find reviews you can claim.",
        action: {
          label: "Browse Reviews",
          href: "/browse",
        },
      },
    },
    {
      id: "working_on",
      title: "Working On",
      subtitle: "Your active claims",
      icon: <FileText className="size-5" />,
      color: "bg-blue-500/10 text-accent-blue",
      emptyState: {
        icon: <FileText className="size-8" />,
        title: "No active reviews",
        description: "Claim a review to get started.",
      },
    },
    {
      id: "submitted",
      title: "Submitted",
      subtitle: "Awaiting acceptance",
      icon: <Send className="size-5" />,
      color: "bg-amber-500/10 text-amber-600",
      emptyState: {
        icon: <Send className="size-8" />,
        title: "No submitted reviews",
        description: "Submit your reviews to track them here.",
      },
    },
    {
      id: "completed",
      title: "Completed",
      subtitle: "Accepted reviews",
      icon: <CheckCircle2 className="size-5" />,
      color: "bg-green-500/10 text-green-600",
      emptyState: {
        icon: <CheckCircle2 className="size-8" />,
        title: "No completed reviews yet",
        description: "Completed reviews will show up here.",
      },
    },
  ];
}
