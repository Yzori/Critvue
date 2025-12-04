"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ContentType, ReviewType } from "@/lib/api/reviews";
import { Filter } from "lucide-react";
import { FilterButton } from "./filter-button";
import {
  ContentTypePopover,
  ReviewTypePopover,
  SortPopover,
  SortOption,
} from "./filter-popovers";
import { ActiveFilterChips } from "./active-filter-chips";

export interface CompactFilterBarProps {
  contentType: ContentType | "all";
  reviewType: ReviewType | "all";
  sortBy: SortOption;
  onContentTypeChange: (value: ContentType | "all") => void;
  onReviewTypeChange: (value: ReviewType | "all") => void;
  onSortByChange: (value: SortOption) => void;
  onShowMobileFilters?: () => void;
  className?: string;
}

/**
 * Compact Filter Bar Component - Space-efficient sticky filter system
 *
 * Features:
 * - 48px height (vs ~200px+ in old implementation)
 * - Sticky positioning below header
 * - Individual popover dropdowns for each filter
 * - Active filter chips row (40px when visible)
 * - Maximum 88px total height when filters are active
 * - Mobile: Single "Filters" button opens bottom sheet
 * - Desktop: Individual filter buttons with popovers
 * - Glassmorphism aesthetic with backdrop blur
 * - Brand-aligned blue gradient accents
 * - ~75% space savings vs previous implementation
 */
export function CompactFilterBar({
  contentType,
  reviewType,
  sortBy,
  onContentTypeChange,
  onReviewTypeChange,
  onSortByChange,
  onShowMobileFilters,
  className,
}: CompactFilterBarProps) {
  // Calculate active filter counts
  const contentTypeActive = contentType !== "all" ? 1 : 0;
  const reviewTypeActive = reviewType !== "all" ? 1 : 0;
  const sortActive = sortBy !== "recent" ? 1 : 0;
  const totalActiveFilters = contentTypeActive + reviewTypeActive + sortActive;

  // Handle clear all filters
  const handleClearAll = React.useCallback(() => {
    onContentTypeChange("all");
    onReviewTypeChange("all");
    onSortByChange("recent");
  }, [onContentTypeChange, onReviewTypeChange, onSortByChange]);

  // Get sort label for button
  const getSortLabel = (sort: SortOption): string => {
    const labels = {
      recent: "Recent",
      price_high: "Highest Paying",
      price_low: "Lowest Paid",
      deadline: "Expiring Soon",
      popular: "Popular Reviewer",
    };
    return labels[sort];
  };

  return (
    <div
      className={cn(
        "sticky top-[72px] z-20",
        "bg-card/80 backdrop-blur-xl",
        "border-b border-border/50",
        className
      )}
    >
      {/* Main Filter Bar - 48px */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-1.5">
        <div className="flex items-center gap-3">
          {/* Desktop: Individual Filter Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Content Type Filter */}
            <FilterButton
              label="Content Type"
              activeCount={contentTypeActive}
            >
              <ContentTypePopover
                selected={contentType}
                onChange={onContentTypeChange}
              />
            </FilterButton>

            {/* Review Type Filter */}
            <FilterButton
              label="Review Type"
              activeCount={reviewTypeActive}
            >
              <ReviewTypePopover
                selected={reviewType}
                onChange={onReviewTypeChange}
              />
            </FilterButton>

            {/* Sort Dropdown */}
            <FilterButton
              label={`Sort: ${getSortLabel(sortBy)}`}
              activeCount={sortActive}
            >
              <SortPopover
                selected={sortBy}
                onChange={onSortByChange}
              />
            </FilterButton>
          </div>

          {/* Mobile: Consolidated Filters Button */}
          <button
            type="button"
            onClick={onShowMobileFilters}
            className={cn(
              "md:hidden",
              "inline-flex items-center gap-2",
              "h-[40px] px-4 rounded-full",
              "bg-card/70 backdrop-blur-[12px]",
              "border border-border/50",
              "text-sm font-medium text-foreground",
              "hover:bg-card/90 hover:shadow-lg",
              "transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50",
              "active:scale-95",
              totalActiveFilters > 0 && [
                "bg-gradient-to-br from-blue-500/10 to-orange-500/10",
                "border-accent-blue/30",
                "text-blue-600 dark:text-blue-400",
              ]
            )}
            aria-label={`Open filters${totalActiveFilters > 0 ? ` (${totalActiveFilters} active)` : ""}`}
          >
            <Filter className="size-5" aria-hidden="true" />
            <span>Filters</span>
            {totalActiveFilters > 0 && (
              <span
                className={cn(
                  "inline-flex items-center justify-center",
                  "min-w-[20px] h-[20px] px-1.5 rounded-full",
                  "bg-accent-blue text-white text-xs font-semibold"
                )}
              >
                {totalActiveFilters}
              </span>
            )}
          </button>

          {/* Spacer for mobile */}
          <div className="flex-1 md:hidden" />

          {/* Results count or additional info (optional) */}
          <div className="hidden lg:flex items-center ml-auto text-sm text-muted-foreground">
            {/* Placeholder for future enhancements like result count */}
          </div>
        </div>
      </div>

      {/* Active Filter Chips Row - 40px (only when filters active) */}
      <ActiveFilterChips
        contentType={contentType}
        reviewType={reviewType}
        sortBy={sortBy}
        onContentTypeChange={onContentTypeChange}
        onReviewTypeChange={onReviewTypeChange}
        onSortByChange={onSortByChange}
        onClearAll={handleClearAll}
      />
    </div>
  );
}
