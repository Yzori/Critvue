import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badge Component - Modern 2025 Design
 *
 * Features:
 * - Multiple variants: success, warning, error, info, neutral
 * - Three sizes: sm, md, lg
 * - Optional dot indicator with pulse animation
 * - Full accessibility with icon + color + label
 * - Enhanced visual styling with subtle shadows
 */

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-200",
  {
    variants: {
      variant: {
        success: "bg-green-50 text-green-700 border border-green-200/50 shadow-sm shadow-green-100/50 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30 dark:shadow-green-900/20",
        warning: "bg-amber-50 text-amber-700 border border-amber-200/50 shadow-sm shadow-amber-100/50 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 dark:shadow-amber-900/20",
        error: "bg-red-50 text-red-700 border border-red-200/50 shadow-sm shadow-red-100/50 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30 dark:shadow-red-900/20",
        info: "bg-blue-50 text-blue-700 border border-blue-200/50 shadow-sm shadow-blue-100/50 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30 dark:shadow-blue-900/20",
        neutral: "bg-gray-50 text-gray-700 border border-gray-200/50 shadow-sm shadow-gray-100/50 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/30 dark:shadow-gray-900/20",
        primary: "bg-accent-blue/10 text-accent-blue border border-accent-blue/20 shadow-sm shadow-accent-blue/5",
        secondary: "bg-accent-peach/10 text-accent-peach border border-accent-peach/20 shadow-sm shadow-accent-peach/5",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
    },
  }
);

const dotVariants = cva("rounded-full", {
  variants: {
    variant: {
      success: "bg-green-600",
      warning: "bg-amber-600",
      error: "bg-red-600",
      info: "bg-blue-600",
      neutral: "bg-gray-600",
      primary: "bg-accent-blue",
      secondary: "bg-accent-peach",
    },
    size: {
      sm: "size-1",
      md: "size-1.5",
      lg: "size-2",
    },
  },
  defaultVariants: {
    variant: "neutral",
    size: "md",
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Show a dot indicator (status indicator)
   */
  showDot?: boolean;
  /**
   * Pulse animation for the dot (for active/live states)
   */
  pulse?: boolean;
  /**
   * Optional icon to display before the label
   */
  icon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({
    className,
    variant,
    size,
    showDot = false,
    pulse = false,
    icon,
    children,
    ...props
  }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {showDot && (
          <span className="relative inline-flex">
            <span className={cn(dotVariants({ variant, size }))} />
            {pulse && (
              <span
                className={cn(
                  "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                  variant === "success" && "bg-green-600",
                  variant === "warning" && "bg-amber-600",
                  variant === "error" && "bg-red-600",
                  variant === "info" && "bg-blue-600",
                  variant === "neutral" && "bg-gray-600",
                  variant === "primary" && "bg-accent-blue",
                  variant === "secondary" && "bg-accent-peach"
                )}
              />
            )}
          </span>
        )}
        {icon && <span className="inline-flex items-center">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
