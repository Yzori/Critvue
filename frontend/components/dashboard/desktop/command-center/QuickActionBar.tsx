"use client";

/**
 * Quick Action Bar Component
 *
 * Persistent action bar with keyboard shortcuts.
 * Floats at bottom of viewport for quick access to common actions.
 *
 * Features:
 * - Role-specific actions (creator vs reviewer)
 * - Keyboard shortcut hints
 * - Icon + label display
 * - Glassmorphic background
 * - Auto-hide on scroll down, show on scroll up
 *
 * Brand Compliance:
 * - Critvue brand colors
 * - Smooth animations
 * - WCAG AA accessible
 * - Keyboard navigation support
 *
 * @module QuickActionBar
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll } from "framer-motion";
import {
  Plus,
  Search,
  CheckCircle2,
  Filter,
  Briefcase,
  FileText,
  TrendingUp,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
  action: () => void;
  disabled?: boolean;
  badge?: string | number;
}

export interface QuickActionBarProps {
  /**
   * Current role (creator or reviewer)
   */
  role: "creator" | "reviewer";

  /**
   * Custom actions (overrides defaults)
   */
  actions?: QuickAction[];

  /**
   * Whether to enable auto-hide on scroll
   */
  autoHide?: boolean;

  /**
   * Optional className
   */
  className?: string;
}

/**
 * Quick Action Bar Component
 *
 * Provides quick access to common actions with keyboard shortcuts.
 */
export function QuickActionBar({
  role,
  actions,
  autoHide = true,
  className,
}: QuickActionBarProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);

  // Default actions based on role
  const defaultActions = React.useMemo(() => {
    if (role === "creator") {
      return [
        {
          id: "new-review",
          label: "New Review",
          icon: <Plus className="size-4" />,
          shortcut: "N",
          action: () => router.push("/review/new"),
        },
        {
          id: "search",
          label: "Search",
          icon: <Search className="size-4" />,
          shortcut: "/",
          action: () => {
            // Trigger command palette by dispatching keyboard event
            const event = new KeyboardEvent("keydown", {
              key: "k",
              metaKey: true,
              bubbles: true,
            });
            document.dispatchEvent(event);
          },
        },
        {
          id: "accept-all",
          label: "Accept All",
          icon: <CheckCircle2 className="size-4" />,
          shortcut: "A",
          action: () => console.log("Accept all - TODO: Implement bulk accept"),
          badge: 3,
        },
        {
          id: "filter",
          label: "Filter",
          icon: <Filter className="size-4" />,
          shortcut: "F",
          action: () => console.log("Filter - TODO: Implement filter modal"),
        },
      ];
    }

    // Reviewer actions
    return [
      {
        id: "browse",
        label: "Browse",
        icon: <Briefcase className="size-4" />,
        shortcut: "B",
        action: () => router.push("/browse"),
      },
      {
        id: "search",
        label: "Search",
        icon: <Search className="size-4" />,
        shortcut: "/",
        action: () => {
          // Trigger command palette by dispatching keyboard event
          const event = new KeyboardEvent("keydown", {
            key: "k",
            metaKey: true,
            bubbles: true,
          });
          document.dispatchEvent(event);
        },
      },
      {
        id: "continue-draft",
        label: "Continue Draft",
        icon: <FileText className="size-4" />,
        shortcut: "C",
        action: () => console.log("Continue draft - TODO: Navigate to latest draft"),
      },
      {
        id: "earnings",
        label: "Earnings",
        icon: <TrendingUp className="size-4" />,
        shortcut: "E",
        action: () => router.push("/reviewer/earnings"),
      },
    ];
  }, [role, router]);

  const displayActions = actions || defaultActions;

  // Handle scroll direction for auto-hide
  React.useEffect(() => {
    if (!autoHide) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, autoHide]);

  // Register keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Find matching action
      const action = displayActions.find(
        (a) => a.shortcut.toLowerCase() === e.key.toLowerCase()
      );

      if (action && !action.disabled) {
        e.preventDefault();
        action.action();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [displayActions]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 400,
          }}
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2",
            "z-50",
            className
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2",
              "px-4 py-3",
              "rounded-2xl",
              "border border-border",
              "bg-background/95 backdrop-blur-md",
              "shadow-2xl",
              "max-w-fit"
            )}
          >
            {displayActions.map((action, index) => (
              <React.Fragment key={action.id}>
                {index > 0 && (
                  <div className="w-px h-6 bg-border" aria-hidden="true" />
                )}
                <QuickActionButton action={action} />
              </React.Fragment>
            ))}

            {/* Command Hint */}
            <div className="w-px h-6 bg-border ml-2" aria-hidden="true" />
            <div className="flex items-center gap-1.5 px-2 text-xs text-muted-foreground">
              <Command className="size-3.5" />
              <span className="font-medium">+K</span>
              <span className="hidden sm:inline">for more</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Individual Quick Action Button
 */
function QuickActionButton({ action }: { action: QuickAction }) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      className="relative"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={action.action}
        disabled={action.disabled}
        className={cn(
          "relative",
          "flex items-center gap-2",
          "px-3 py-2",
          "h-auto",
          "font-medium",
          "hover:bg-accent-blue/10 hover:text-accent-blue",
          "transition-colors",
          "group"
        )}
        aria-label={`${action.label} (Shortcut: ${action.shortcut})`}
      >
        <div className="flex items-center justify-center">
          {action.icon}
        </div>
        <span className="text-sm hidden sm:inline">{action.label}</span>

        {/* Badge */}
        {action.badge !== undefined && (
          <span
            className={cn(
              "size-5 rounded-full",
              "bg-accent-blue text-white",
              "text-xs font-semibold",
              "flex items-center justify-center",
              "group-hover:scale-110",
              "transition-transform"
            )}
          >
            {action.badge}
          </span>
        )}

        {/* Keyboard Shortcut Hint */}
        <kbd
          className={cn(
            "hidden sm:flex",
            "items-center justify-center",
            "size-5",
            "rounded",
            "bg-muted",
            "text-xs font-mono font-medium",
            "text-muted-foreground",
            "group-hover:bg-accent-blue/20 group-hover:text-accent-blue",
            "transition-colors"
          )}
        >
          {action.shortcut}
        </kbd>
      </Button>

      {/* Hover Tooltip (Mobile) */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "sm:hidden",
              "absolute bottom-full left-1/2 -translate-x-1/2 mb-2",
              "px-2 py-1",
              "rounded-lg",
              "bg-foreground text-background",
              "text-xs font-medium whitespace-nowrap",
              "pointer-events-none"
            )}
          >
            {action.label}
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 -mt-px"
              aria-hidden="true"
            >
              <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-foreground" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
