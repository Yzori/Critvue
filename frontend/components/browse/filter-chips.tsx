"use client";

import { cn } from "@/lib/utils";
import { ContentType, ReviewType } from "@/lib/api/reviews/requests";
import { Check } from "lucide-react";

export interface FilterChipsProps {
  contentType: ContentType | "all";
  reviewType: ReviewType | "all";
  sortBy: "recent" | "price_high" | "price_low" | "deadline";
  onContentTypeChange: (type: ContentType | "all") => void;
  onReviewTypeChange: (type: ReviewType | "all") => void;
  onSortByChange: (sort: "recent" | "price_high" | "price_low" | "deadline") => void;
  className?: string;
}

/**
 * Filter Chips Component - Horizontal scrollable filter system
 *
 * Features:
 * - Glassmorphism aesthetic
 * - Multi-select with visual feedback
 * - Gradient backgrounds when selected
 * - Horizontal scroll on mobile
 * - Touch-friendly 48px minimum targets
 */
export function FilterChips({
  contentType,
  reviewType,
  sortBy,
  onContentTypeChange,
  onReviewTypeChange,
  onSortByChange,
  className,
}: FilterChipsProps) {
  const contentTypes: Array<{ value: ContentType | "all"; label: string }> = [
    { value: "all", label: "All" },
    { value: "design", label: "Design" },
    { value: "photography", label: "Photography" },
    { value: "video", label: "Video" },
    { value: "audio", label: "Audio" },
    { value: "writing", label: "Writing" },
    { value: "art", label: "Art" },
  ];

  const reviewTypes: Array<{ value: ReviewType | "all"; label: string }> = [
    { value: "all", label: "All Reviews" },
    { value: "free", label: "Free" },
    { value: "expert", label: "Expert" },
  ];

  const sortOptions: Array<{
    value: "recent" | "price_high" | "price_low" | "deadline";
    label: string;
  }> = [
    { value: "recent", label: "Most Recent" },
    { value: "price_high", label: "Highest Paid" },
    { value: "price_low", label: "Lowest Paid" },
    { value: "deadline", label: "Urgent" },
  ];

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Content Type Filters */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">Content Type</label>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {contentTypes.map((type) => (
            <FilterChip
              key={type.value}
              label={type.label}
              selected={contentType === type.value}
              onClick={() => onContentTypeChange(type.value)}
            />
          ))}
        </div>
      </div>

      {/* Review Type Filters */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">Review Type</label>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {reviewTypes.map((type) => (
            <FilterChip
              key={type.value}
              label={type.label}
              selected={reviewType === type.value}
              onClick={() => onReviewTypeChange(type.value)}
            />
          ))}
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">Sort By</label>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {sortOptions.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              selected={sortBy === option.value}
              onClick={() => onSortByChange(option.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface FilterChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function FilterChip({ label, selected, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
        "transition-all duration-200 whitespace-nowrap",
        "min-h-[44px] touch-manipulation",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50",
        "active:scale-[0.98]",
        selected
          ? "bg-accent-blue text-white shadow-lg shadow-accent-blue/30"
          : "bg-card/50 backdrop-blur-sm border border-border/50 text-foreground hover:bg-card/80 hover:shadow-md"
      )}
    >
      {selected && (
        <Check className="size-4 animate-in zoom-in duration-200" />
      )}
      {label}
    </button>
  );
}
