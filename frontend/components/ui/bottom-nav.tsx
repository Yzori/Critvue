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
          // Layout - Floating pill style
          "fixed bottom-4 left-4 right-4 z-50",
          "lg:hidden", // Hide on desktop
          // Floating pill styling
          "bg-background/90 backdrop-blur-xl",
          "border border-border/50",
          "rounded-2xl",
          "shadow-[0_4px_24px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.05)]",
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
                  "relative flex flex-col items-center justify-center gap-1",
                  "min-w-[56px] min-h-[48px] px-3 py-1.5 rounded-xl",
                  // Transitions with spring easing
                  "transition-all duration-300",
                  "[transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
                  // States
                  isActive
                    ? "text-accent-blue"
                    : "text-foreground-muted hover:text-foreground",
                  "active:scale-95"
                )}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                {/* Background pill for active state */}
                {isActive && (
                  <span
                    className={cn(
                      "absolute inset-1 -z-10",
                      "bg-accent-blue/10 rounded-lg",
                      "animate-in fade-in zoom-in-95 duration-200"
                    )}
                    aria-hidden="true"
                  />
                )}

                <div className="relative">
                  <span
                    className={cn(
                      "inline-flex transition-all duration-300",
                      "[transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
                      isActive && "scale-110 -translate-y-0.5"
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
                        "bg-accent-blue rounded-full",
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
                    "transition-all duration-200",
                    isActive ? "font-semibold text-accent-blue" : "opacity-80"
                  )}
                >
                  {item.label}
                </span>

                {/* Active indicator dot */}
                {isActive && (
                  <span
                    className={cn(
                      "absolute -bottom-0.5 left-1/2 -translate-x-1/2",
                      "w-1 h-1 bg-accent-blue rounded-full",
                      "animate-in fade-in zoom-in-50 duration-300"
                    )}
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
