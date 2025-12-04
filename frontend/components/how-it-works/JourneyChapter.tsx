"use client";

import { ReactNode } from "react";
import { motion, useReducedMotion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface JourneyChapterProps {
  id: string;
  children: ReactNode;
  className?: string;
  /** Delay before animation starts (in seconds) */
  delay?: number;
  /** Background variant */
  variant?: "default" | "alt" | "gradient";
  /** Perspective for gradient colors */
  perspective?: "creator" | "reviewer";
}

/**
 * Wrapper component for journey chapters with scroll-triggered animations
 * Provides consistent entrance animations and styling for each section
 */
export function JourneyChapter({
  id,
  children,
  className,
  delay = 0,
  variant = "default",
  perspective = "creator",
}: JourneyChapterProps) {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants: Variants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 40,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.6,
        delay: prefersReducedMotion ? 0 : delay,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.1,
      },
    },
  };

  const backgroundClasses = {
    default: "bg-white dark:bg-[var(--dark-tier-1)]",
    alt: "bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-[var(--dark-tier-2)] dark:via-[var(--dark-tier-1)] dark:to-[var(--dark-tier-2)]",
    gradient:
      perspective === "creator"
        ? "bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 dark:from-accent-blue/10 dark:via-[var(--dark-tier-1)] dark:to-accent-blue/5"
        : "bg-gradient-to-br from-orange-50/50 via-white to-orange-50/30 dark:from-accent-peach/10 dark:via-[var(--dark-tier-1)] dark:to-accent-peach/5",
  };

  return (
    <motion.section
      id={id}
      className={cn(
        "py-16 md:py-24 relative overflow-hidden",
        backgroundClasses[variant],
        className
      )}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.section>
  );
}

/**
 * Child item component for staggered animations within a chapter
 */
interface JourneyItemProps {
  children: ReactNode;
  className?: string;
  /** Custom delay for this item */
  delay?: number;
}

export function JourneyItem({ children, className, delay = 0 }: JourneyItemProps) {
  const prefersReducedMotion = useReducedMotion();

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.5,
        delay: prefersReducedMotion ? 0 : delay,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

/**
 * Header component for chapter sections
 */
interface ChapterHeaderProps {
  badge?: string;
  badgeVariant?: "info" | "success" | "primary" | "secondary";
  title: string;
  subtitle?: string;
  perspective?: "creator" | "reviewer";
  className?: string;
}

export function ChapterHeader({
  badge,
  title,
  subtitle,
  perspective = "creator",
  className,
}: ChapterHeaderProps) {
  const prefersReducedMotion = useReducedMotion();
  const isCreator = perspective === "creator";

  return (
    <motion.div
      className={cn("text-center mb-12 md:mb-16", className)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
    >
      {badge && (
        <span
          className={cn(
            "inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4",
            isCreator
              ? "bg-accent-blue/10 text-accent-blue"
              : "bg-accent-peach/10 text-accent-peach"
          )}
        >
          {badge}
        </span>
      )}
      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-foreground mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-muted-foreground max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
