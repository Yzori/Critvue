"use client";

import * as React from "react";
import Link from "next/link";
import { PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Modern FAB (Floating Action Button) Component
 *
 * 2024 Design Patterns:
 * - Extended FAB: Icon + text label for clarity
 * - Scroll-aware: Shrinks to icon-only when scrolling down
 * - Squircle shape: Rounded rectangle (more modern than circle)
 * - Glassmorphism: Subtle backdrop blur with gradient
 * - Entry animation: Bounces in on mount
 * - Micro-interactions: Ripple effect, scale on press
 * - Accessible: ARIA labels, keyboard focus states
 */

export interface FABProps extends React.HTMLAttributes<HTMLAnchorElement> {
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  label?: string;
  shortLabel?: string; // Shown when collapsed
}

const FAB = React.forwardRef<HTMLAnchorElement, FABProps>(
  (
    {
      href = "/review/new",
      onClick,
      icon,
      label = "Request Review",
      shortLabel = "Request",
      className,
      ...props
    },
    ref
  ) => {
    const [isExpanded, setIsExpanded] = React.useState(true);
    const [isVisible, setIsVisible] = React.useState(true);
    const [lastScrollY, setLastScrollY] = React.useState(0);
    const [hasAnimated, setHasAnimated] = React.useState(false);

    // Entry animation delay
    React.useEffect(() => {
      const timer = setTimeout(() => setHasAnimated(true), 100);
      return () => clearTimeout(timer);
    }, []);

    // Scroll-aware behavior: collapse when scrolling down, expand when stopped
    React.useEffect(() => {
      let scrollTimeout: NodeJS.Timeout;

      const handleScroll = () => {
        const currentScrollY = window.scrollY;

        // Hide completely near bottom of page
        const isNearBottom =
          window.innerHeight + currentScrollY >=
          document.documentElement.scrollHeight - 100;

        if (isNearBottom) {
          setIsVisible(false);
        } else if (currentScrollY < 50) {
          // Always expanded near top
          setIsVisible(true);
          setIsExpanded(true);
        } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // Scrolling down - collapse to icon only
          setIsVisible(true);
          setIsExpanded(false);
        } else if (currentScrollY < lastScrollY) {
          // Scrolling up - show but keep collapsed
          setIsVisible(true);
        }

        setLastScrollY(currentScrollY);

        // Expand after scroll stops
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          if (window.scrollY < 200) {
            setIsExpanded(true);
          }
        }, 1500);
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", handleScroll);
        clearTimeout(scrollTimeout);
      };
    }, [lastScrollY]);

    const fabContent = (
      <>
        {/* Icon */}
        <span
          className={cn(
            "flex items-center justify-center",
            "transition-transform duration-300",
            !isExpanded && "scale-110"
          )}
        >
          {icon || <PenLine className="size-5" strokeWidth={2.5} />}
        </span>

        {/* Label - slides in/out */}
        <span
          className={cn(
            "font-semibold text-sm whitespace-nowrap overflow-hidden",
            "transition-all duration-300 ease-out",
            isExpanded
              ? "max-w-[120px] opacity-100 ml-2"
              : "max-w-0 opacity-0 ml-0"
          )}
        >
          {shortLabel}
        </span>
      </>
    );

    const fabClasses = cn(
      // Positioning - above bottom nav
      "fixed bottom-[88px] right-4 z-40",
      "lg:hidden", // Hide on desktop

      // Layout
      "flex items-center justify-center",
      "h-14 px-5",
      isExpanded ? "min-w-[140px]" : "w-14 px-0",

      // Squircle shape (modern rounded rectangle)
      "rounded-2xl",

      // Background with glassmorphism
      "bg-gradient-to-r from-accent-blue via-accent-blue to-accent-peach",
      "backdrop-blur-sm",
      "text-white",

      // Shadow with brand glow
      "shadow-[0_8px_30px_rgba(59,130,246,0.35),0_4px_12px_rgba(0,0,0,0.15)]",

      // Transitions
      "transition-all duration-300",
      "[transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",

      // Hover states
      "hover:shadow-[0_12px_40px_rgba(59,130,246,0.45),0_6px_16px_rgba(0,0,0,0.2)]",
      "hover:scale-[1.02]",

      // Active/pressed state
      "active:scale-95 active:shadow-[0_4px_16px_rgba(59,130,246,0.3)]",

      // Focus state
      "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30",

      // Entry animation
      hasAnimated
        ? "translate-y-0 opacity-100"
        : "translate-y-8 opacity-0",

      // Visibility based on scroll
      !isVisible && "translate-y-24 opacity-0 pointer-events-none",

      // Touch optimization
      "touch-manipulation select-none",

      // Ripple container
      "overflow-hidden relative",

      className
    );

    // Ripple effect on click
    const handleClick = (e: React.MouseEvent) => {
      const button = e.currentTarget;
      const ripple = document.createElement("span");
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255,255,255,0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
      `;

      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    };

    if (onClick) {
      return (
        <button
          onClick={(e) => {
            handleClick(e);
            onClick();
          }}
          className={fabClasses}
          aria-label={label}
          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {fabContent}
        </button>
      );
    }

    return (
      <>
        <Link
          ref={ref}
          href={href}
          className={fabClasses}
          aria-label={label}
          onClick={handleClick}
          {...props}
        >
          {fabContent}
        </Link>

        {/* Ripple animation keyframes */}
        <style jsx global>{`
          @keyframes ripple {
            to {
              transform: scale(4);
              opacity: 0;
            }
          }
        `}</style>
      </>
    );
  }
);

FAB.displayName = "FAB";

export { FAB };
