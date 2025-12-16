"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ReviewType } from "@/lib/api/reviews/requests";
import { Flame, DollarSign, Heart, Clock } from "lucide-react";

export interface QuickFilterChipsProps {
  reviewType: ReviewType | "all";
  sortBy: "recent" | "price_high" | "price_low" | "deadline";
  onReviewTypeChange: (value: ReviewType | "all") => void;
  onSortByChange: (value: "recent" | "price_high" | "price_low" | "deadline") => void;
  className?: string;
}

/**
 * Quick Filter Chips - Floating bottom filter bar for mobile
 *
 * Features:
 * - Fixed at bottom above the navigation
 * - Quick toggles: Free, Paid, Urgent
 * - Horizontal scrollable if needed
 * - Thumb-friendly positioning
 * - Pill-shaped toggles with icons
 */
export function QuickFilterChips({
  reviewType,
  sortBy,
  onReviewTypeChange,
  onSortByChange,
  className,
}: QuickFilterChipsProps) {
  const chips = [
    {
      id: "free",
      label: "Free",
      icon: Heart,
      isActive: reviewType === "community",
      onClick: () => onReviewTypeChange(reviewType === "community" ? "all" : "community"),
      activeColor: "bg-emerald-500 text-white border-emerald-600",
    },
    {
      id: "paid",
      label: "Paid",
      icon: DollarSign,
      isActive: reviewType === "expert",
      onClick: () => onReviewTypeChange(reviewType === "expert" ? "all" : "expert"),
      activeColor: "bg-green-500 text-white border-green-600",
    },
    {
      id: "urgent",
      label: "Urgent",
      icon: Clock,
      isActive: sortBy === "deadline",
      onClick: () => onSortByChange(sortBy === "deadline" ? "recent" : "deadline"),
      activeColor: "bg-red-500 text-white border-red-600",
    },
    {
      id: "hot",
      label: "Hot",
      icon: Flame,
      isActive: sortBy === "price_high",
      onClick: () => onSortByChange(sortBy === "price_high" ? "recent" : "price_high"),
      activeColor: "bg-orange-500 text-white border-orange-600",
    },
  ];

  return (
    <div
      className={cn(
        "md:hidden", // Only on mobile
        "fixed bottom-20 left-0 right-0 z-30", // Above bottom nav
        "px-4 pb-2",
        "pointer-events-none", // Allow clicks through padding
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center gap-2",
          "pointer-events-auto" // Re-enable clicks on chips
        )}
      >
        {chips.map((chip) => {
          const Icon = chip.icon;
          return (
            <button
              key={chip.id}
              onClick={chip.onClick}
              className={cn(
                "inline-flex items-center gap-1.5",
                "h-9 px-3.5 rounded-full",
                "text-sm font-medium",
                "border shadow-lg",
                "transition-all duration-200",
                "active:scale-95",
                chip.isActive
                  ? chip.activeColor
                  : "bg-card/95 backdrop-blur-md text-foreground border-border/80"
              )}
            >
              <Icon className="size-4" />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
