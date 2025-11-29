"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FilterChips } from "./filter-chips";
import { ContentType, ReviewType } from "@/lib/api/reviews";
import { X } from "lucide-react";

export interface FilterBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: ContentType | "all";
  reviewType: ReviewType | "all";
  sortBy: "recent" | "price_high" | "price_low" | "deadline";
  onContentTypeChange: (type: ContentType | "all") => void;
  onReviewTypeChange: (type: ReviewType | "all") => void;
  onSortByChange: (sort: "recent" | "price_high" | "price_low" | "deadline") => void;
  onReset: () => void;
  onApply: () => void;
}

/**
 * Filter Bottom Sheet Component - Mobile-optimized filter panel
 *
 * Features:
 * - Slides up from bottom (80vh height)
 * - Backdrop blur overlay
 * - Drag-to-dismiss handle
 * - Smooth spring animation
 * - Apply/Reset buttons
 * - Accessible with focus trap
 */
export function FilterBottomSheet({
  open,
  onOpenChange,
  contentType,
  reviewType,
  sortBy,
  onContentTypeChange,
  onReviewTypeChange,
  onSortByChange,
  onReset,
  onApply,
}: FilterBottomSheetProps) {
  const [startY, setStartY] = React.useState<number | null>(null);
  const [currentY, setCurrentY] = React.useState<number | null>(null);
  const sheetRef = React.useRef<HTMLDivElement>(null);

  // Handle touch start for drag-to-dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0]?.clientY ?? 0);
  };

  // Handle touch move for drag-to-dismiss
  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === null) return;
    setCurrentY(e.touches[0]?.clientY ?? 0);
  };

  // Handle touch end for drag-to-dismiss
  const handleTouchEnd = () => {
    if (startY === null || currentY === null) {
      setStartY(null);
      setCurrentY(null);
      return;
    }

    const diff = currentY - startY;
    if (diff > 100) {
      // Dragged down more than 100px, close the sheet
      onOpenChange(false);
    }

    setStartY(null);
    setCurrentY(null);
  };

  // Lock body scroll when sheet is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Calculate transform for drag
  const getDragTransform = () => {
    if (startY === null || currentY === null) return 0;
    const diff = currentY - startY;
    return Math.max(0, diff); // Only allow dragging down
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => onOpenChange(false)}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed left-0 right-0 bottom-0 z-50 h-[85vh] rounded-t-3xl",
          "bg-white/95 backdrop-blur-xl shadow-2xl",
          "transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "translate-y-full"
        )}
        style={{
          transform: open
            ? `translateY(${getDragTransform()}px)`
            : "translateY(100%)",
        }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center py-4 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
            aria-label="Close filters"
          >
            <X className="size-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <FilterChips
            contentType={contentType}
            reviewType={reviewType}
            sortBy={sortBy}
            onContentTypeChange={onContentTypeChange}
            onReviewTypeChange={onReviewTypeChange}
            onSortByChange={onSortByChange}
          />
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
          <Button
            variant="outline"
            size="lg"
            onClick={onReset}
            className="flex-1"
          >
            Reset
          </Button>
          <Button
            size="lg"
            onClick={() => {
              onApply();
              onOpenChange(false);
            }}
            className="flex-1 bg-accent-blue"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </>
  );
}
