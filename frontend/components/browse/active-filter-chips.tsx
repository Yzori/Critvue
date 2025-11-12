"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ContentType, ReviewType } from "@/lib/api/reviews";
import { X } from "lucide-react";

export interface ActiveFilterChipsProps {
  contentType: ContentType | "all";
  reviewType: ReviewType | "all";
  sortBy: "recent" | "price_high" | "price_low" | "deadline";
  onContentTypeChange: (type: ContentType | "all") => void;
  onReviewTypeChange: (type: ReviewType | "all") => void;
  onSortByChange: (sort: "recent" | "price_high" | "price_low" | "deadline") => void;
  onClearAll: () => void;
}

/**
 * Active Filter Chips Component - Shows currently active filters as removable chips
 *
 * Features:
 * - Only renders when filters are active
 * - Compact pill-shaped chips with remove buttons
 * - "Clear all" button for bulk removal
 * - Smooth entrance/exit animations
 * - Maximum 40px height
 * - Brand-aligned blue gradient styling
 */
export function ActiveFilterChips({
  contentType,
  reviewType,
  sortBy,
  onContentTypeChange,
  onReviewTypeChange,
  onSortByChange,
  onClearAll,
}: ActiveFilterChipsProps) {
  // Build list of active filters
  const activeFilters = React.useMemo(() => {
    const filters: Array<{
      id: string;
      label: string;
      onRemove: () => void;
    }> = [];

    // Content Type filter
    if (contentType !== "all") {
      filters.push({
        id: "content-type",
        label: getContentTypeLabel(contentType),
        onRemove: () => onContentTypeChange("all"),
      });
    }

    // Review Type filter
    if (reviewType !== "all") {
      filters.push({
        id: "review-type",
        label: getReviewTypeLabel(reviewType),
        onRemove: () => onReviewTypeChange("all"),
      });
    }

    // Sort filter (only show if not default)
    if (sortBy !== "recent") {
      filters.push({
        id: "sort",
        label: `Sort: ${getSortLabel(sortBy)}`,
        onRemove: () => onSortByChange("recent"),
      });
    }

    return filters;
  }, [contentType, reviewType, sortBy, onContentTypeChange, onReviewTypeChange, onSortByChange]);

  // Don't render if no active filters
  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "border-t border-gray-200/50",
        "bg-gradient-to-r from-blue-50/30 to-orange-50/30",
        "animate-in slide-in-from-top-4 fade-in duration-200"
      )}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Label */}
          <span className="text-xs font-medium text-gray-600 mr-1">
            Active:
          </span>

          {/* Filter chips */}
          {activeFilters.map((filter, index) => (
            <button
              key={filter.id}
              type="button"
              onClick={filter.onRemove}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5",
                "rounded-full",
                "bg-gradient-to-br from-blue-100/80 to-blue-50/80",
                "border border-accent-blue/20",
                "text-xs font-medium text-blue-700",
                "hover:bg-gradient-to-br hover:from-blue-200/80 hover:to-blue-100/80",
                "transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50",
                "active:scale-95",
                "animate-in zoom-in fade-in duration-200"
              )}
              style={{
                animationDelay: `${index * 50}ms`,
                animationFillMode: "backwards",
              }}
              aria-label={`Remove ${filter.label} filter`}
            >
              <span>{filter.label}</span>
              <X className="size-3" strokeWidth={2.5} aria-hidden="true" />
            </button>
          ))}

          {/* Clear all button */}
          {activeFilters.length > 1 && (
            <button
              type="button"
              onClick={onClearAll}
              className={cn(
                "text-xs font-medium text-blue-600 hover:text-blue-800",
                "underline underline-offset-2 decoration-blue-400/50",
                "hover:decoration-blue-600",
                "transition-colors duration-150",
                "px-2 py-1",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 rounded",
                "animate-in zoom-in fade-in duration-200"
              )}
              style={{
                animationDelay: `${activeFilters.length * 50}ms`,
                animationFillMode: "backwards",
              }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getContentTypeLabel(type: ContentType): string {
  const labels: Record<ContentType, string> = {
    design: "Design",
    code: "Code",
    video: "Video",
    audio: "Audio",
    writing: "Writing",
    art: "Art",
  };
  return labels[type];
}

function getReviewTypeLabel(type: ReviewType): string {
  const labels: Record<ReviewType, string> = {
    free: "Free Review",
    expert: "Expert Review",
  };
  return labels[type];
}

function getSortLabel(sort: "recent" | "price_high" | "price_low" | "deadline"): string {
  const labels = {
    recent: "Recent",
    price_high: "Highest Paid",
    price_low: "Lowest Paid",
    deadline: "Urgent",
  };
  return labels[sort];
}
