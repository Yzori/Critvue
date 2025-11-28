"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, X, SlidersHorizontal } from "lucide-react";

export interface MobileBrowseHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onShowFilters: () => void;
  activeFilterCount: number;
  className?: string;
}

/**
 * Mobile Browse Header - Compact single-row header
 *
 * Features:
 * - Single row: "Browse" title + search icon + filter button
 * - Search expands inline when tapped
 * - Saves ~80px vertical space vs desktop header
 * - Sticky with scroll-aware behavior
 * - 56px total height (vs ~150px before)
 */
export function MobileBrowseHeader({
  searchQuery,
  onSearchChange,
  onShowFilters,
  activeFilterCount,
  className,
}: MobileBrowseHeaderProps) {
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Scroll-aware visibility (hide on scroll down, show on scroll up)
  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show near top
      if (currentScrollY < 100) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 150) {
        // Scrolling down - hide (only after scrolling 150px)
        setIsVisible(false);
        // Close search when hiding
        if (isSearchExpanded) {
          setIsSearchExpanded(false);
        }
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isSearchExpanded]);

  // Focus search input when expanded
  React.useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  const handleSearchToggle = () => {
    if (isSearchExpanded && searchQuery) {
      // Clear search when closing with content
      onSearchChange("");
    }
    setIsSearchExpanded(!isSearchExpanded);
  };

  return (
    <header
      className={cn(
        "md:hidden", // Only show on mobile
        "fixed top-0 left-0 right-0 z-40",
        "bg-white/95 backdrop-blur-xl",
        "border-b border-gray-200/50",
        "transition-transform duration-300 ease-out",
        !isVisible && "-translate-y-full",
        className
      )}
    >
      <div className="flex items-center h-14 px-4 gap-3">
        {/* Search Expanded State */}
        {isSearchExpanded ? (
          <>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className={cn(
                  "w-full h-10 pl-10 pr-4 rounded-full",
                  "bg-gray-100 border-0",
                  "text-sm placeholder:text-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
                )}
              />
            </div>
            <button
              onClick={handleSearchToggle}
              className={cn(
                "size-10 rounded-full flex items-center justify-center",
                "bg-gray-100 text-gray-600",
                "active:scale-95 transition-transform"
              )}
              aria-label="Close search"
            >
              <X className="size-5" />
            </button>
          </>
        ) : (
          <>
            {/* Title */}
            <h1 className="text-lg font-bold text-gray-900 flex-1">
              Browse
            </h1>

            {/* Search Button */}
            <button
              onClick={handleSearchToggle}
              className={cn(
                "size-10 rounded-full flex items-center justify-center",
                "bg-gray-100 text-gray-600",
                "hover:bg-gray-200 active:scale-95 transition-all",
                searchQuery && "bg-accent-blue/10 text-accent-blue"
              )}
              aria-label="Search reviews"
            >
              <Search className="size-5" />
            </button>

            {/* Filter Button */}
            <button
              onClick={onShowFilters}
              className={cn(
                "h-10 px-4 rounded-full flex items-center gap-2",
                "bg-gray-100 text-gray-700 text-sm font-medium",
                "hover:bg-gray-200 active:scale-95 transition-all",
                activeFilterCount > 0 && [
                  "bg-accent-blue/10 text-accent-blue",
                  "border border-accent-blue/20"
                ]
              )}
              aria-label={`Filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ""}`}
            >
              <SlidersHorizontal className="size-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="size-5 rounded-full bg-accent-blue text-white text-xs font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </>
        )}
      </div>
    </header>
  );
}
