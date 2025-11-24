"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * FAB (Floating Action Button) Component - Mobile CTA
 *
 * Brand-Consistent Features:
 * - Primary CTA for "Request Review" on mobile
 * - Gradient background: from-accent-blue to-accent-peach
 * - Positioned above bottom nav: bottom-24 right-4
 * - 56x56px size (exceeds 44px minimum)
 * - Smooth shadow and scale animations
 * - Hidden on desktop (lg:hidden)
 * - Pulse animation to draw attention (optional)
 */

export interface FABProps extends React.HTMLAttributes<HTMLAnchorElement> {
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  label?: string;
  pulse?: boolean; // Add pulse animation for attention
}

const FAB = React.forwardRef<HTMLAnchorElement, FABProps>(
  (
    {
      href = "/review/new",
      onClick,
      icon,
      label = "Request Review",
      pulse = false,
      className,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(true);
    const [lastScrollY, setLastScrollY] = React.useState(0);

    // Optional: Hide FAB on scroll down, show on scroll up
    // Commented out by default - uncomment if desired
    /*
    React.useEffect(() => {
      const handleScroll = () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY < 100) {
          // Always show near top
          setIsVisible(true);
        } else if (currentScrollY > lastScrollY) {
          // Scrolling down - hide
          setIsVisible(false);
        } else {
          // Scrolling up - show
          setIsVisible(true);
        }

        setLastScrollY(currentScrollY);
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);
    */

    const fabContent = (
      <>
        {icon || <Plus className="size-6" />}
        <span className="sr-only">{label}</span>

        {/* Pulse ring animation (optional) */}
        {pulse && (
          <span
            className={cn(
              "absolute inset-0 rounded-full",
              "bg-gradient-to-r from-accent-blue to-accent-peach",
              "animate-ping opacity-75"
            )}
            aria-hidden="true"
          />
        )}
      </>
    );

    const fabClasses = cn(
      // Layout - 56x56px (exceeds 44px minimum)
      "fixed bottom-24 right-4 z-40",
      "size-14",
      "lg:hidden", // Hide on desktop
      // Display
      "flex items-center justify-center",
      "rounded-full",
      // Gradient background
      "bg-gradient-to-r from-accent-blue to-accent-peach",
      "text-white",
      // Shadow
      "shadow-lg hover:shadow-xl",
      // Transitions
      "transition-all duration-300",
      // States
      "hover:scale-110 active:scale-95",
      "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-blue/50",
      // Visibility
      isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0",
      // Touch optimization
      "touch-manipulation",
      className
    );

    if (onClick) {
      return (
        <button
          onClick={onClick}
          className={fabClasses}
          aria-label={label}
          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {fabContent}
        </button>
      );
    }

    return (
      <Link
        ref={ref}
        href={href}
        className={fabClasses}
        aria-label={label}
        {...props}
      >
        {fabContent}
      </Link>
    );
  }
);

FAB.displayName = "FAB";

export { FAB };
