"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Search, Sparkles } from "lucide-react";

export interface EmptyStateProps {
  onClearFilters: () => void;
  className?: string;
}

/**
 * Empty State Component - No results found
 *
 * Features:
 * - Simple, friendly design
 * - Clear call-to-action
 * - Glassmorphism aesthetic
 * - Icon illustration
 */
export function EmptyState({ onClearFilters, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "col-span-full flex flex-col items-center justify-center py-16 px-6",
        "rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200/50",
        "min-h-[400px]",
        className
      )}
    >
      {/* Icon */}
      <div className="relative mb-6">
        <div className="relative p-6 rounded-3xl bg-gradient-to-br from-accent-blue/10 to-accent-peach/10 border border-accent-blue/20">
          <Search className="size-12 text-accent-blue" />
          <Sparkles className="absolute -top-2 -right-2 size-6 text-accent-peach animate-pulse" />
        </div>
      </div>

      {/* Text */}
      <h3 className="text-2xl font-semibold text-gray-900 mb-2">
        No reviews found
      </h3>
      <p className="text-gray-600 text-center max-w-md mb-8">
        We couldn't find any review requests matching your filters. Try adjusting your search criteria to see more results.
      </p>

      {/* Action */}
      <Button
        onClick={onClearFilters}
        size="lg"
        className="bg-accent-blue"
      >
        Clear All Filters
      </Button>

      {/* Helpful tips */}
      <div className="mt-12 p-6 rounded-xl bg-accent-blue/5 border border-accent-blue/10 max-w-md">
        <p className="text-sm text-gray-700 text-center">
          <span className="font-semibold">Tip:</span> New review requests are posted daily. Check back soon or broaden your filters to discover more opportunities.
        </p>
      </div>
    </div>
  );
}
