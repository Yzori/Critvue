"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * BottomNav Component - Mobile-First Navigation
 *
 * Modern 2025 Mobile Pattern
 * Features:
 * - Fixed bottom navigation for mobile devices
 * - 4-5 primary navigation items
 * - Active state indicators with smooth transitions
 * - Safe area padding for notched devices
 * - 56px height (exceeds 44px touch target minimum)
 * - Backdrop blur for modern glassmorphic effect
 * - Hidden on desktop (lg breakpoint and above)
 */

export interface BottomNavItem {
  /**
   * Unique identifier
   */
  id: string;
  /**
   * Display label
   */
  label: string;
  /**
   * Icon element
   */
  icon: React.ReactNode;
  /**
   * Active icon (optional, defaults to icon)
   */
  activeIcon?: React.ReactNode;
  /**
   * Click handler
   */
  onClick: () => void;
  /**
   * Badge count (optional)
   */
  badge?: number;
}

export interface BottomNavProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Navigation items
   */
  items: BottomNavItem[];
  /**
   * Currently active item ID
   */
  activeId: string;
}

const BottomNav = React.forwardRef<HTMLElement, BottomNavProps>(
  ({ items, activeId, className, ...props }, ref) => {
    if (!items || items.length === 0) {
      return null;
    }

    return (
      <nav
        ref={ref}
        className={cn(
          // Layout
          "fixed bottom-0 left-0 right-0 z-50",
          "lg:hidden", // Hide on desktop
          // Styling
          "bg-background/80 backdrop-blur-lg border-t border-border",
          "shadow-[0_-4px_12px_rgba(0,0,0,0.08)]",
          // Safe area padding for notched devices
          "pb-safe",
          className
        )}
        role="navigation"
        aria-label="Primary mobile navigation"
        {...props}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {items.map((item) => {
            const isActive = item.id === activeId;
            const displayIcon = isActive && item.activeIcon ? item.activeIcon : item.icon;

            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={cn(
                  // Layout - Ensure 44px minimum touch target
                  "flex flex-col items-center justify-center gap-1",
                  "min-w-[56px] min-h-[48px] px-3 py-1 rounded-xl",
                  // Transitions
                  "transition-all duration-200 ease-in-out",
                  // States
                  isActive
                    ? "text-accent-blue bg-accent-blue/10"
                    : "text-foreground-muted hover:text-foreground hover:bg-accent-blue/5",
                  "active:scale-95"
                )}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="relative">
                  <span
                    className={cn(
                      "inline-flex transition-transform duration-200",
                      isActive && "scale-110"
                    )}
                  >
                    {displayIcon}
                  </span>

                  {item.badge && item.badge > 0 && (
                    <span
                      className={cn(
                        "absolute -top-1 -right-1",
                        "min-w-[16px] h-4 px-1",
                        "flex items-center justify-center",
                        "text-[10px] font-bold text-white",
                        "bg-red-500 rounded-full",
                        "shadow-sm"
                      )}
                      aria-label={`${item.badge} notifications`}
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={cn(
                    "text-[11px] font-medium leading-none",
                    isActive && "font-semibold"
                  )}
                >
                  {item.label}
                </span>

                {/* Active indicator line */}
                {isActive && (
                  <span
                    className="absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent-blue rounded-full"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }
);

BottomNav.displayName = "BottomNav";

export { BottomNav };
