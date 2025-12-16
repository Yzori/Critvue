"use client";

import { cn } from "@/lib/utils";
import { ContentType, ReviewType } from "@/lib/api/reviews/requests";
import { Check } from "lucide-react";

/**
 * Filter Popover Components - Individual popover content for each filter type
 *
 * Features:
 * - Checkbox groups for multi-select filters
 * - Radio groups for single-select filters
 * - Hover states with subtle background
 * - Check icon for selected items
 * - Result counts (placeholder for future enhancement)
 * - Touch-friendly targets (44px minimum)
 */

// ============================================================================
// Content Type Popover (Checkbox Group)
// ============================================================================

export interface ContentTypePopoverProps {
  selected: ContentType | "all";
  onChange: (type: ContentType | "all") => void;
  onClose?: () => void;
}

export function ContentTypePopover({
  selected,
  onChange,
  onClose,
}: ContentTypePopoverProps) {
  const options: Array<{ value: ContentType | "all"; label: string; count?: number }> = [
    { value: "all", label: "All Content" },
    { value: "design", label: "Design", count: 12 },
    { value: "photography", label: "Photography", count: 8 },
    { value: "video", label: "Video", count: 15 },
    { value: "stream", label: "Stream", count: 11 },
    { value: "audio", label: "Audio", count: 5 },
    { value: "writing", label: "Writing", count: 10 },
    { value: "art", label: "Art", count: 6 },
  ];

  const handleSelect = (value: ContentType | "all") => {
    onChange(value);
    // Auto-close after selection (optional - can be removed for multi-select behavior)
    onClose?.();
  };

  return (
    <div className="space-y-1" role="menu">
      <div className="px-2 py-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Content Type
        </p>
      </div>

      {options.map((option) => {
        const isSelected = selected === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="menuitemradio"
            aria-checked={isSelected}
            onClick={() => handleSelect(option.value)}
            className={cn(
              "flex items-center justify-between w-full gap-3 px-3 py-2.5",
              "rounded-lg text-left transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50",
              "min-h-[44px]",
              isSelected
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                : "text-foreground hover:bg-muted/50"
            )}
          >
            <span className="flex items-center gap-3">
              {/* Check icon for selected */}
              <span
                className={cn(
                  "flex items-center justify-center size-5 rounded-md border-2 transition-all duration-150",
                  isSelected
                    ? "bg-accent-blue border-accent-blue"
                    : "border-border"
                )}
              >
                {isSelected && <Check className="size-3 text-white" strokeWidth={3} />}
              </span>
              <span>{option.label}</span>
            </span>

            {/* Result count */}
            {option.count !== undefined && (
              <span className="text-xs text-muted-foreground font-medium">
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Review Type Popover (Radio Group)
// ============================================================================

export interface ReviewTypePopoverProps {
  selected: ReviewType | "all";
  onChange: (type: ReviewType | "all") => void;
  onClose?: () => void;
}

export function ReviewTypePopover({
  selected,
  onChange,
  onClose,
}: ReviewTypePopoverProps) {
  const options: Array<{ value: ReviewType | "all"; label: string; description?: string }> = [
    { value: "all", label: "All Reviews", description: "Both free and expert" },
    { value: "free", label: "Free Reviews", description: "Community feedback" },
    { value: "expert", label: "Expert Reviews", description: "Professional critique" },
  ];

  const handleSelect = (value: ReviewType | "all") => {
    onChange(value);
    onClose?.();
  };

  return (
    <div className="space-y-1" role="menu">
      <div className="px-2 py-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Review Type
        </p>
      </div>

      {options.map((option) => {
        const isSelected = selected === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="menuitemradio"
            aria-checked={isSelected}
            onClick={() => handleSelect(option.value)}
            className={cn(
              "flex items-start w-full gap-3 px-3 py-2.5",
              "rounded-lg text-left transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50",
              "min-h-[44px]",
              isSelected
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : "text-foreground hover:bg-muted/50"
            )}
          >
            {/* Radio indicator */}
            <span
              className={cn(
                "flex items-center justify-center size-5 rounded-full border-2 transition-all duration-150 mt-0.5",
                isSelected
                  ? "border-accent-blue"
                  : "border-border"
              )}
            >
              {isSelected && (
                <span className="size-2.5 rounded-full bg-accent-blue animate-in zoom-in duration-150" />
              )}
            </span>

            <div className="flex-1">
              <p className={cn("text-sm", isSelected && "font-medium")}>
                {option.label}
              </p>
              {option.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Sort Popover (Radio Group)
// ============================================================================

export type SortOption = "recent" | "price_high" | "price_low" | "deadline" | "popular";

export interface SortPopoverProps {
  selected: SortOption;
  onChange: (sort: SortOption) => void;
  onClose?: () => void;
}

export function SortPopover({ selected, onChange, onClose }: SortPopoverProps) {
  const options: Array<{ value: SortOption; label: string; icon?: string }> = [
    { value: "recent", label: "Most Recent", icon: "🕐" },
    { value: "deadline", label: "Expiring Soon", icon: "⚡" },
    { value: "price_high", label: "Highest Paying", icon: "💰" },
    { value: "popular", label: "Most Popular Reviewer", icon: "⭐" },
  ];

  const handleSelect = (value: SortOption) => {
    onChange(value);
    onClose?.();
  };

  return (
    <div className="space-y-1" role="menu">
      <div className="px-2 py-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Sort By
        </p>
      </div>

      {options.map((option) => {
        const isSelected = selected === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="menuitemradio"
            aria-checked={isSelected}
            onClick={() => handleSelect(option.value)}
            className={cn(
              "flex items-center w-full gap-3 px-3 py-2.5",
              "rounded-lg text-left transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50",
              "min-h-[44px]",
              isSelected
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                : "text-foreground hover:bg-muted/50"
            )}
          >
            {/* Radio indicator */}
            <span
              className={cn(
                "flex items-center justify-center size-5 rounded-full border-2 transition-all duration-150",
                isSelected
                  ? "border-accent-blue"
                  : "border-border"
              )}
            >
              {isSelected && (
                <span className="size-2.5 rounded-full bg-accent-blue animate-in zoom-in duration-150" />
              )}
            </span>

            <span className="flex items-center gap-2 flex-1">
              {option.icon && <span className="text-base">{option.icon}</span>}
              <span className="text-sm">{option.label}</span>
            </span>

            {/* Checkmark for extra emphasis */}
            {isSelected && (
              <Check className="size-4 text-accent-blue" strokeWidth={2.5} />
            )}
          </button>
        );
      })}
    </div>
  );
}
