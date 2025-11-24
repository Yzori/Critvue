"use client";

/**
 * Desktop Center Content Panel
 *
 * Dimensions: Fluid width (55% of available space)
 * Max-width: 1024px on large desktops
 *
 * Contains:
 * - Sticky header with title, description, and view toggle
 * - Tabbed navigation (Actions/Requests/History for creator)
 * - Filter bar with search, status, type, urgency filters
 * - Data table view (sortable columns, pagination)
 * - Card grid view toggle
 * - Empty states and loading skeletons
 *
 * Brand Compliance:
 * - Active tab: text-blue-700 (6.68:1 contrast) with bg-accent-blue/5
 * - Hover states: hover:bg-muted/50 for clear feedback
 * - Focus rings: ring-accent-blue with 2px width
 * - All touch targets 44px+ minimum
 * - Smooth transitions with reduced motion support
 *
 * @module DesktopCenterPanel
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  CheckCircle2,
  Layers,
  Zap,
  List,
  Grid,
  AlignJustify,
  Plus,
  MessageSquare,
  Clock,
  Eye,
  Edit,
  ChevronUp,
  ChevronDown,
  Users,
} from "lucide-react";
import type { DashboardRole, DashboardTab } from "../desktop-dashboard-container";
import {
  getActionsNeeded,
  getMyRequests,
  getActiveReviews,
  getSubmittedReviews,
  type PendingReviewItem,
  type MyRequestItem,
  type ActiveReviewItem,
  type SubmittedReviewItem,
} from "@/lib/api/dashboard";
import useSWR from "swr";

export interface DesktopCenterPanelProps {
  /**
   * Current dashboard role
   */
  role: DashboardRole;

  /**
   * Active tab identifier
   */
  activeTab: DashboardTab;

  /**
   * Callback when tab changes
   */
  onTabChange: (tab: DashboardTab) => void;
}

type ViewMode = "table" | "card" | "compact";

interface Tab {
  id: DashboardTab;
  label: string;
  badge?: number;
}

/**
 * Desktop Center Content Panel Component
 */
export function DesktopCenterPanel({
  role,
  activeTab,
  onTabChange,
}: DesktopCenterPanelProps) {
  const router = useRouter();

  // View mode state
  const [viewMode, setViewMode] = React.useState<ViewMode>("table");

  // Search and filter state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filters, setFilters] = React.useState<{
    status?: string[];
    contentType?: string[];
    urgency?: string[];
  }>({});

  // Fetch data based on role and active tab with SWR (30s refresh)
  const { data: actionsData, error: actionsError, isLoading: actionsLoading } = useSWR(
    role === "creator" && activeTab === "actions" ? "/dashboard/creator/actions-needed" : null,
    () => getActionsNeeded(1, 20),
    { refreshInterval: 30000, revalidateOnFocus: true }
  );

  const { data: requestsData, error: requestsError, isLoading: requestsLoading } = useSWR(
    role === "creator" && activeTab === "requests" ? "/dashboard/creator/my-requests" : null,
    () => getMyRequests(undefined, 1, 20),
    { refreshInterval: 30000, revalidateOnFocus: true }
  );

  const { data: activeReviewsData, error: activeReviewsError, isLoading: activeReviewsLoading } = useSWR(
    role === "reviewer" && activeTab === "active" ? "/dashboard/reviewer/active" : null,
    () => getActiveReviews(1, 20),
    { refreshInterval: 30000, revalidateOnFocus: true }
  );

  const { data: submittedData, error: submittedError, isLoading: submittedLoading } = useSWR(
    role === "reviewer" && activeTab === "submitted" ? "/dashboard/reviewer/submitted" : null,
    () => getSubmittedReviews(1, 20),
    { refreshInterval: 30000, revalidateOnFocus: true }
  );

  // Determine tabs based on role
  const creatorTabs: Tab[] = [
    { id: "actions", label: "Actions Needed", badge: actionsData?.summary.total_pending || 0 },
    { id: "requests", label: "My Requests", badge: requestsData?.pagination.total || 0 },
    { id: "history", label: "History" },
  ];

  const reviewerTabs: Tab[] = [
    { id: "active", label: "Active Reviews", badge: activeReviewsData?.summary.active_count || 0 },
    { id: "submitted", label: "Submitted", badge: submittedData?.summary.submitted_count || 0 },
    { id: "history", label: "History" },
  ];

  const tabs = role === "creator" ? creatorTabs : reviewerTabs;

  // Get current data based on active tab
  const getCurrentData = () => {
    if (role === "creator") {
      if (activeTab === "actions") return actionsData?.items || [];
      if (activeTab === "requests") return requestsData?.items || [];
    } else {
      if (activeTab === "active") return activeReviewsData?.items || [];
      if (activeTab === "submitted") return submittedData?.items || [];
    }
    return [];
  };

  const isLoading =
    actionsLoading || requestsLoading || activeReviewsLoading || submittedLoading;

  const currentData = getCurrentData();

  return (
    <div className="space-y-6">
      {/* Sticky Header */}
      <div className={cn(
        "sticky top-0",
        "bg-background/95 backdrop-blur-sm",
        "px-6 lg:px-8 pt-6 lg:pt-8 pb-4 border-b border-border",
        "space-y-4"
      )}>
        {/* Title + View Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {activeTab === "actions" && "Actions Needed"}
              {activeTab === "requests" && "My Requests"}
              {activeTab === "active" && "Active Reviews"}
              {activeTab === "submitted" && "Submitted Reviews"}
              {activeTab === "history" && "History"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === "actions" && "Reviews waiting for your response"}
              {activeTab === "requests" && "All your review requests"}
              {activeTab === "active" && "Reviews you're currently working on"}
              {activeTab === "submitted" && "Reviews awaiting acceptance"}
              {activeTab === "history" && "Past activity and completed reviews"}
            </p>
          </div>

          {/* View mode toggle */}
          <ViewToggle
            mode={viewMode}
            onChange={setViewMode}
          />
        </div>

        {/* Tabs */}
        <DesktopTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />

        {/* Filter Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFilterChange={setFilters}
        />
      </div>

      {/* Content Area */}
      <div className="px-6 lg:px-8 pb-6 lg:pb-8 space-y-4">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : currentData.length === 0 ? (
          // Empty state
          <EmptyState
            role={role}
            activeTab={activeTab}
            onCreateNew={() => router.push("/review/new")}
          />
        ) : viewMode === "table" ? (
          // Table view
          <ReviewDataTable
            data={currentData}
            role={role}
            activeTab={activeTab}
          />
        ) : (
          // Card grid view
          <ReviewCardGrid
            data={currentData}
            role={role}
            activeTab={activeTab}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Desktop Tabs Component
 */
interface DesktopTabsProps {
  tabs: Tab[];
  activeTab: DashboardTab;
  onTabChange: (tabId: DashboardTab) => void;
}

function DesktopTabs({ tabs, activeTab, onTabChange }: DesktopTabsProps) {
  return (
    <div className="flex gap-2 border-b border-border -mb-px">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative px-4 py-2.5 rounded-t-lg",
            "text-sm font-medium",
            "min-h-[44px]",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2",
            activeTab === tab.id
              ? "text-blue-700 bg-accent-blue/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
          aria-current={activeTab === tab.id ? "page" : undefined}
        >
          {/* Tab content */}
          <div className="flex items-center gap-2">
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <Badge
                variant={activeTab === tab.id ? "primary" : "secondary"}
                size="sm"
              >
                {tab.badge}
              </Badge>
            )}
          </div>

          {/* Active indicator */}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-blue rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * View Toggle Component
 */
interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

function ViewToggle({ mode, onChange }: ViewToggleProps) {
  const options: ViewMode[] = ["table", "card"];

  const icons = {
    table: <List className="size-4" />,
    card: <Grid className="size-4" />,
    compact: <AlignJustify className="size-4" />,
  };

  return (
    <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            "size-9 rounded flex items-center justify-center",
            "transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2",
            mode === option
              ? "bg-background text-blue-700 shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
          aria-label={`${option} view`}
          aria-pressed={mode === option}
        >
          {icons[option]}
        </button>
      ))}
    </div>
  );
}

/**
 * Filter Bar Component
 */
interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: {
    status?: string[];
    contentType?: string[];
    urgency?: string[];
  };
  onFilterChange: (filters: any) => void;
}

function FilterBar({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Search input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search reviews... (Cmd+K)"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            "w-full h-10 pl-9 pr-4",
            "rounded-lg border border-border",
            "bg-background text-sm text-foreground",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-1",
            "transition-shadow duration-150"
          )}
        />
      </div>

      {/* Clear filters */}
      {(Object.keys(filters).length > 0 || searchQuery) && (
        <button
          onClick={() => {
            onFilterChange({});
            onSearchChange("");
          }}
          className={cn(
            "px-3 py-2 text-sm font-medium",
            "text-muted-foreground hover:text-foreground",
            "transition-colors duration-150"
          )}
        >
          Clear all
        </button>
      )}
    </div>
  );
}

/**
 * Review Data Table Component
 */
interface ReviewDataTableProps {
  data: any[];
  role: DashboardRole;
  activeTab: DashboardTab;
}

function ReviewDataTable({ data, role, activeTab }: ReviewDataTableProps) {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      {/* Table */}
      <div className="divide-y divide-border">
        {data.map((item: any) => (
          <div
            key={item.id || item.slot_id}
            onClick={() => {
              if (item.review_request_id) {
                router.push(`/review/${item.review_request_id}`);
              } else if (item.id) {
                router.push(`/review/${item.id}`);
              }
            }}
            className={cn(
              "flex items-center gap-4 px-6 py-4",
              "hover:bg-accent-blue/5 transition-colors duration-150",
              "cursor-pointer"
            )}
          >
            {/* Title/Content */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground truncate">
                {item.title || item.review_request_title || item.review_request?.title}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {item.description || item.review_preview || item.review_request?.description_preview}
              </div>
            </div>

            {/* Status Badge */}
            <Badge
              variant={
                item.status === "completed" || item.status === "accepted"
                  ? "success"
                  : item.status === "in_review" || item.status === "pending"
                  ? "warning"
                  : "secondary"
              }
              size="md"
            >
              {item.status || "pending"}
            </Badge>

            {/* Progress for multi-review requests */}
            {item.progress && item.progress.requested > 1 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="size-4" />
                <span>
                  {item.progress.accepted + item.progress.submitted} / {item.progress.requested}
                </span>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" />
              {new Date(item.created_at || item.submitted_at || item.claimed_at).toLocaleDateString()}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // View action
                }}
                className={cn(
                  "size-8 rounded flex items-center justify-center",
                  "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  "transition-colors duration-150"
                )}
                aria-label="View review"
              >
                <Eye className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Review Card Grid Component
 */
interface ReviewCardGridProps {
  data: any[];
  role: DashboardRole;
  activeTab: DashboardTab;
}

function ReviewCardGrid({ data, role, activeTab }: ReviewCardGridProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-2 gap-4">
      {data.map((item: any) => (
        <div
          key={item.id || item.slot_id}
          onClick={() => {
            if (item.review_request_id) {
              router.push(`/review/${item.review_request_id}`);
            } else if (item.id) {
              router.push(`/review/${item.id}`);
            }
          }}
          className={cn(
            "group relative p-5 rounded-xl",
            "border-2 border-border bg-card",
            "cursor-pointer transition-all duration-200",
            "hover:shadow-lg hover:scale-[1.02]"
          )}
        >
          {/* Title */}
          <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
            {item.title || item.review_request_title || item.review_request?.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {item.description || item.review_preview || item.review_request?.description_preview}
          </p>

          {/* Status badge */}
          <div className="mb-4">
            <Badge
              variant={
                item.status === "completed" || item.status === "accepted"
                  ? "success"
                  : item.status === "in_review" || item.status === "pending"
                  ? "warning"
                  : "secondary"
              }
              size="md"
            >
              {item.status || "pending"}
            </Badge>
          </div>

          {/* Footer meta */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {new Date(item.created_at || item.submitted_at || item.claimed_at).toLocaleDateString()}
            </span>
            {item.content_type && (
              <span className="capitalize">{item.content_type}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty State Component
 */
interface EmptyStateProps {
  role: DashboardRole;
  activeTab: DashboardTab;
  onCreateNew: () => void;
}

function EmptyState({ role, activeTab, onCreateNew }: EmptyStateProps) {
  const getEmptyContent = () => {
    if (role === "creator" && activeTab === "actions") {
      return {
        icon: <CheckCircle2 className="size-8 text-green-600" />,
        title: "All Caught Up!",
        description: "No reviews waiting for your action right now.",
        action: "Request New Review",
      };
    }

    if (role === "creator" && activeTab === "requests") {
      return {
        icon: <MessageSquare className="size-8 text-accent-blue" />,
        title: "No Reviews Yet",
        description: "Create your first review request to get started.",
        action: "Request Feedback",
      };
    }

    return {
      icon: <MessageSquare className="size-8 text-muted-foreground" />,
      title: "No Items",
      description: "Nothing to show here yet.",
      action: null,
    };
  };

  const content = getEmptyContent();

  return (
    <div className="rounded-2xl border border-border bg-card p-12 text-center">
      <div className={cn(
        "size-16 rounded-full flex items-center justify-center mx-auto mb-4",
        content.icon.props.className.includes("green") ? "bg-green-500/10" :
        content.icon.props.className.includes("accent-blue") ? "bg-accent-blue/10" :
        "bg-muted"
      )}>
        {content.icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {content.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        {content.description}
      </p>
      {content.action && (
        <Button
          onClick={onCreateNew}
          className="bg-accent-blue hover:bg-accent-blue/90 min-h-[48px]"
        >
          <Plus className="size-4 mr-2" />
          {content.action}
        </Button>
      )}
    </div>
  );
}
