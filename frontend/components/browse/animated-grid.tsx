"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface AnimatedGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Animated Grid Wrapper - Smooth transitions when content changes
 *
 * Features:
 * - Fade in/out animations when filters change
 * - Staggered children animations
 * - Smooth layout shifts
 * - Performance optimized with layout animations
 */
export function AnimatedGrid({ children, className }: AnimatedGridProps) {
  const childrenArray = React.Children.toArray(children);

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="popLayout">
        {childrenArray.map((child, index) => (
          <motion.div
            key={`item-${index}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              duration: 0.3,
              delay: Math.min(index * 0.03, 0.5),
            }}
            layout
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
