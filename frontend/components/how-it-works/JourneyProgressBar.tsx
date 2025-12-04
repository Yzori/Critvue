"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Chapter {
  id: string;
  label: string;
  shortLabel?: string;
}

interface JourneyProgressBarProps {
  chapters: Chapter[];
  activeChapter: number;
  progress: number;
  onChapterClick: (index: number) => void;
  perspective: "creator" | "reviewer";
  className?: string;
}

/**
 * Sticky progress bar showing journey through How It Works page
 * Features:
 * - Fill animation as user scrolls
 * - Clickable chapter dots for navigation
 * - Current chapter label
 * - Perspective-aware colors (blue/peach)
 */
export function JourneyProgressBar({
  chapters,
  activeChapter,
  progress,
  onChapterClick,
  perspective,
  className,
}: JourneyProgressBarProps) {
  const prefersReducedMotion = useReducedMotion();
  const isCreator = perspective === "creator";

  return (
    <motion.div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[var(--dark-tier-2)]/95 backdrop-blur-md border-b border-gray-200/50 dark:border-border shadow-sm",
        className
      )}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.5,
        ease: "easeOut",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Progress bar fill */}
        <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              isCreator
                ? "bg-gradient-to-r from-blue-500 via-accent-blue to-blue-600"
                : "bg-gradient-to-r from-orange-500 via-accent-peach to-amber-500"
            )}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress }}
            style={{ transformOrigin: "left" }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.1,
              ease: "linear",
            }}
          />
        </div>

        {/* Chapter navigation */}
        <div className="flex items-center justify-between py-3">
          {/* Chapter dots - Desktop */}
          <div className="hidden sm:flex items-center gap-2">
            {chapters.map((chapter, index) => (
              <button
                key={chapter.id}
                onClick={() => onChapterClick(index)}
                className={cn(
                  "group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 touch-manipulation",
                  index === activeChapter
                    ? isCreator
                      ? "bg-accent-blue/10"
                      : "bg-accent-peach/10"
                    : "hover:bg-gray-100 dark:hover:bg-white/10"
                )}
                aria-label={`Go to ${chapter.label}`}
                aria-current={index === activeChapter ? "step" : undefined}
              >
                {/* Dot */}
                <motion.div
                  className={cn(
                    "size-2.5 rounded-full transition-all duration-300",
                    index === activeChapter
                      ? isCreator
                        ? "bg-accent-blue"
                        : "bg-accent-peach"
                      : index < activeChapter
                        ? "bg-gray-400"
                        : "bg-gray-300"
                  )}
                  animate={
                    index === activeChapter && !prefersReducedMotion
                      ? {
                          scale: [1, 1.2, 1],
                        }
                      : {}
                  }
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                {/* Label - only show for active chapter on medium screens */}
                <span
                  className={cn(
                    "text-xs font-medium transition-all duration-300 hidden lg:block",
                    index === activeChapter
                      ? isCreator
                        ? "text-accent-blue"
                        : "text-accent-peach"
                      : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200"
                  )}
                >
                  {chapter.shortLabel || chapter.label}
                </span>
              </button>
            ))}
          </div>

          {/* Mobile: Simple dots */}
          <div className="flex sm:hidden items-center gap-1.5">
            {chapters.map((_, index) => (
              <button
                key={index}
                onClick={() => onChapterClick(index)}
                className="p-1 touch-manipulation"
                aria-label={`Go to chapter ${index + 1}`}
              >
                <div
                  className={cn(
                    "size-2 rounded-full transition-all duration-300",
                    index === activeChapter
                      ? isCreator
                        ? "bg-accent-blue scale-125"
                        : "bg-accent-peach scale-125"
                      : index < activeChapter
                        ? "bg-gray-400"
                        : "bg-gray-300"
                  )}
                />
              </button>
            ))}
          </div>

          {/* Current chapter label */}
          <motion.div
            key={activeChapter}
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {activeChapter + 1}/{chapters.length}
            </span>
            <span
              className={cn(
                "text-sm font-semibold",
                isCreator ? "text-accent-blue" : "text-accent-peach"
              )}
            >
              {chapters[activeChapter]?.label}
            </span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
