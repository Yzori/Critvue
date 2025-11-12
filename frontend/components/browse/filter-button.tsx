"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface FilterButtonProps {
  label: string;
  activeCount?: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Filter Button Component - Compact pill button with popover
 *
 * Features:
 * - 40px height, fully rounded pill shape
 * - Glassmorphism background with backdrop blur
 * - Active state badge showing filter count
 * - Smooth hover and active transitions
 * - Radix UI Popover for accessibility
 * - WCAG 2.1 AA compliant
 */
export function FilterButton({
  label,
  activeCount = 0,
  children,
  className,
}: FilterButtonProps) {
  const [open, setOpen] = React.useState(false);
  const isActive = activeCount > 0;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            // Base styles
            "relative inline-flex items-center justify-center gap-2",
            "min-w-[140px] h-[40px] px-4",
            "rounded-full",
            "text-sm font-medium",
            "transition-all duration-200 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 focus-visible:ring-offset-2",
            "active:scale-[0.98]",
            // Glassmorphism
            "backdrop-blur-[12px]",
            // Active state (with filters applied)
            isActive
              ? [
                  "bg-gradient-to-br from-blue-50/90 to-orange-50/90",
                  "border border-accent-blue/30",
                  "text-blue-700",
                  "shadow-md shadow-blue-100/50",
                ]
              : [
                  // Default state
                  "bg-white/70",
                  "border border-black/10",
                  "text-gray-700",
                  "hover:bg-white/90",
                  "hover:shadow-lg shadow-black/5",
                  "hover:-translate-y-[1px]",
                ],
            className
          )}
        >
          <span className="truncate">{label}</span>

          {/* Active count badge */}
          {activeCount > 0 && (
            <span
              className={cn(
                "inline-flex items-center justify-center",
                "min-w-[20px] h-[20px] px-1.5",
                "rounded-full",
                "bg-accent-blue text-white",
                "text-xs font-semibold",
                "animate-in zoom-in duration-200"
              )}
              aria-label={`${activeCount} filter${activeCount === 1 ? "" : "s"} active`}
            >
              {activeCount}
            </span>
          )}

          {/* Chevron icon */}
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-200",
              open && "rotate-180"
            )}
            aria-hidden="true"
          />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className={cn(
            // Base popover styles
            "z-50 min-w-[240px] max-w-[320px]",
            "rounded-xl p-3",
            // Glassmorphism
            "bg-white/90 backdrop-blur-[24px]",
            "border border-white/30",
            "shadow-2xl shadow-blue-900/20",
            // Animation
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "data-[side=bottom]:slide-in-from-top-2",
            "data-[side=top]:slide-in-from-bottom-2",
            // Ensure proper stacking
            "will-change-[transform,opacity]"
          )}
          sideOffset={8}
          align="start"
          role="menu"
          aria-label={`${label} options`}
        >
          {children}

          {/* Optional arrow */}
          <Popover.Arrow className="fill-white/90" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
