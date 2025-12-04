"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PerspectiveToggleProps {
  perspective: "creator" | "reviewer";
  onPerspectiveChange: (perspective: "creator" | "reviewer") => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Animated toggle for switching between creator and reviewer perspectives
 * Features sliding pill animation and color transitions
 */
export function PerspectiveToggle({
  perspective,
  onPerspectiveChange,
  className,
  size = "md",
}: PerspectiveToggleProps) {
  const prefersReducedMotion = useReducedMotion();
  const isCreator = perspective === "creator";

  const sizeClasses = {
    sm: {
      container: "p-1 rounded-xl",
      button: "px-4 py-2 text-xs rounded-lg min-h-[36px]",
    },
    md: {
      container: "p-1 sm:p-1.5 rounded-2xl",
      button: "px-6 sm:px-8 md:px-10 py-3 sm:py-4 text-sm sm:text-base rounded-xl min-h-[48px]",
    },
    lg: {
      container: "p-1.5 sm:p-2 rounded-2xl",
      button: "px-8 sm:px-10 md:px-12 py-4 sm:py-5 text-base sm:text-lg rounded-xl min-h-[56px]",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <motion.div
      className={cn(
        "inline-flex items-center gap-1 bg-gradient-to-r from-white via-gray-50 to-white dark:from-[var(--dark-tier-2)] dark:via-[var(--dark-tier-3)] dark:to-[var(--dark-tier-2)] border-2 border-gray-200/50 dark:border-border shadow-xl backdrop-blur-sm",
        sizes.container,
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.2,
        duration: prefersReducedMotion ? 0 : 0.5,
      }}
    >
      {/* Creator Button */}
      <motion.button
        onClick={() => onPerspectiveChange("creator")}
        className={cn(
          "relative font-semibold sm:font-bold transition-all duration-500 touch-manipulation overflow-hidden",
          sizes.button,
          isCreator
            ? "text-white shadow-xl"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/10"
        )}
        whileHover={!isCreator ? { scale: 1.02 } : {}}
        whileTap={{ scale: 0.98 }}
        aria-pressed={isCreator}
        aria-label="View information for creators"
      >
        {isCreator && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-500 via-accent-blue to-blue-600"
            layoutId="perspectiveActiveTab"
            transition={{
              type: "spring",
              bounce: 0.2,
              duration: prefersReducedMotion ? 0 : 0.6,
            }}
          />
        )}
        <span className="relative z-10 whitespace-nowrap">I'm a Creator</span>
      </motion.button>

      {/* Reviewer Button */}
      <motion.button
        onClick={() => onPerspectiveChange("reviewer")}
        className={cn(
          "relative font-semibold sm:font-bold transition-all duration-500 touch-manipulation overflow-hidden",
          sizes.button,
          !isCreator
            ? "text-white shadow-xl"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/10"
        )}
        whileHover={isCreator ? { scale: 1.02 } : {}}
        whileTap={{ scale: 0.98 }}
        aria-pressed={!isCreator}
        aria-label="View information for reviewers"
      >
        {!isCreator && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-orange-500 via-accent-peach to-amber-500"
            layoutId="perspectiveActiveTab"
            transition={{
              type: "spring",
              bounce: 0.2,
              duration: prefersReducedMotion ? 0 : 0.6,
            }}
          />
        )}
        <span className="relative z-10 whitespace-nowrap">I'm a Reviewer</span>
      </motion.button>
    </motion.div>
  );
}
