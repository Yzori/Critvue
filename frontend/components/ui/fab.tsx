"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";

/**
 * FAB (Floating Action Button) Component
 *
 * Modern 2025 Mobile Pattern
 * Features:
 * - Prominent primary action button
 * - 56px × 56px (desktop), 64px × 64px (mobile) - exceeds 44px minimum
 * - Hide on scroll down, show on scroll up
 * - Expandable to show related actions
 * - Sophisticated shadow and animation
 * - Backdrop blur and gradient background
 * - Positioned bottom-right with safe area padding
 */

export interface FABAction {
  /**
   * Unique identifier
   */
  id: string;
  /**
   * Action label
   */
  label: string;
  /**
   * Icon element
   */
  icon: React.ReactNode;
  /**
   * Click handler
   */
  onClick: () => void;
  /**
   * Optional color variant
   */
  variant?: "primary" | "secondary";
}

export interface FABProps extends React.HTMLAttributes<HTMLButtonElement> {
  /**
   * Main action label (for accessibility)
   */
  label?: string;
  /**
   * Main action handler
   */
  onClick?: () => void;
  /**
   * Additional actions (expandable menu)
   */
  actions?: FABAction[];
  /**
   * Hide on scroll down
   */
  hideOnScroll?: boolean;
  /**
   * Icon for main button (default: Plus)
   */
  icon?: React.ReactNode;
  /**
   * Custom position
   */
  position?: "bottom-right" | "bottom-center";
}

const FAB = React.forwardRef<HTMLButtonElement, FABProps>(
  ({
    label = "New action",
    onClick,
    actions = [],
    hideOnScroll = true,
    icon = <Plus className="size-6" />,
    position = "bottom-right",
    className,
    ...props
  }, ref) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [isVisible, setIsVisible] = React.useState(true);
    const [lastScrollY, setLastScrollY] = React.useState(0);

    // Handle scroll behavior
    React.useEffect(() => {
      if (!hideOnScroll) return;

      const handleScroll = () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // Scrolling down
          setIsVisible(false);
          setIsExpanded(false);
        } else {
          // Scrolling up
          setIsVisible(true);
        }

        setLastScrollY(currentScrollY);
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }, [hideOnScroll, lastScrollY]);

    // Close on outside click
    React.useEffect(() => {
      if (!isExpanded) return;

      const handleClickOutside = () => setIsExpanded(false);
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }, [isExpanded]);

    const handleMainClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      if (actions.length > 0) {
        setIsExpanded(!isExpanded);
      } else if (onClick) {
        onClick();
      }
    };

    const positionClasses = {
      "bottom-right": "bottom-6 right-6 sm:bottom-8 sm:right-8",
      "bottom-center": "bottom-6 left-1/2 -translate-x-1/2 sm:bottom-8",
    };

    return (
      <>
        {/* Backdrop for expanded state */}
        {isExpanded && (
          <div
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm transition-opacity"
            onClick={() => setIsExpanded(false)}
            aria-hidden="true"
          />
        )}

        {/* FAB Container */}
        <div
          className={cn(
            "fixed z-50 flex flex-col items-end gap-3",
            positionClasses[position],
            // Safe area padding
            "pb-safe pr-safe",
            // Visibility
            "transition-all duration-300 ease-in-out",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16 pointer-events-none"
          )}
        >
          {/* Expanded Actions */}
          {isExpanded && actions.length > 0 && (
            <div className="flex flex-col items-end gap-2 mb-2">
              {actions.map((action, index) => (
                <button
                  key={action.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                    setIsExpanded(false);
                  }}
                  className={cn(
                    "group flex items-center gap-3 min-h-[48px] px-4 rounded-full",
                    "transition-all duration-200 ease-in-out",
                    "shadow-[0_4px_12px_rgba(0,0,0,0.15)]",
                    "hover:shadow-[0_8px_20px_rgba(0,0,0,0.2)]",
                    "active:scale-95",
                    action.variant === "secondary"
                      ? "bg-accent-peach text-white"
                      : "bg-accent-blue text-white",
                    // Animation
                    "animate-in slide-in-from-right-4 fade-in"
                  )}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: "backwards",
                  }}
                  aria-label={action.label}
                >
                  <span className="text-sm font-medium whitespace-nowrap">
                    {action.label}
                  </span>
                  <span className="size-10 rounded-full bg-white/20 flex items-center justify-center">
                    {action.icon}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Main FAB Button */}
          <button
            ref={ref}
            onClick={handleMainClick}
            className={cn(
              // Size: 56px desktop, 64px mobile (exceeds 44px minimum)
              "size-14 sm:size-16 rounded-full",
              // Background
              "bg-gradient-to-br from-accent-blue to-accent-blue/90",
              "text-white",
              // Shadow system
              "shadow-[0_4px_12px_rgba(59,130,246,0.4),0_2px_6px_rgba(0,0,0,0.15)]",
              "hover:shadow-[0_8px_24px_rgba(59,130,246,0.5),0_4px_12px_rgba(0,0,0,0.2)]",
              // Transitions
              "transition-all duration-200 ease-in-out",
              "hover:scale-110",
              "active:scale-95",
              // Layout
              "flex items-center justify-center",
              className
            )}
            aria-label={label}
            aria-expanded={isExpanded}
            aria-haspopup={actions.length > 0}
            {...props}
          >
            <span
              className={cn(
                "transition-transform duration-200",
                isExpanded && "rotate-45"
              )}
            >
              {isExpanded ? <X className="size-6" /> : icon}
            </span>
          </button>
        </div>
      </>
    );
  }
);

FAB.displayName = "FAB";

export { FAB };
