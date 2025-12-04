"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion, animate } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  /** Target value to count to */
  value: number;
  /** Text to display before the number */
  prefix?: string;
  /** Text to display after the number (e.g., "+", "%", "k") */
  suffix?: string;
  /** Duration of the animation in seconds */
  duration?: number;
  /** Decimal places to show */
  decimals?: number;
  /** Additional class names */
  className?: string;
  /** Format number with commas */
  formatNumber?: boolean;
}

/**
 * Animated counter that counts up when entering viewport
 * Used for stats like "2,500+ reviews delivered"
 */
export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  duration = 2,
  decimals = 0,
  className,
  formatNumber = true,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayValue(latest);
      },
    });

    return () => controls.stop();
  }, [isInView, value, duration, prefersReducedMotion]);

  const formattedValue = formatNumber
    ? displayValue.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : displayValue.toFixed(decimals);

  return (
    <motion.span
      ref={ref}
      className={cn("tabular-nums", className)}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5 }}
    >
      {prefix}
      {formattedValue}
      {suffix}
    </motion.span>
  );
}

/**
 * Stat card with animated counter, icon, and label
 */
interface StatCardProps {
  value: number;
  suffix?: string;
  label: string;
  icon?: React.ReactNode;
  className?: string;
  perspective?: "creator" | "reviewer";
}

export function AnimatedStatCard({
  value,
  suffix,
  label,
  icon,
  className,
  perspective = "creator",
}: StatCardProps) {
  const isCreator = perspective === "creator";

  return (
    <motion.div
      className={cn(
        "flex flex-col items-center p-6 rounded-2xl bg-white/80 dark:bg-[var(--dark-tier-2)] backdrop-blur-sm border border-gray-200 dark:border-border shadow-lg",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4, shadow: "0 20px 40px rgba(0,0,0,0.1)" }}
    >
      {icon && (
        <div
          className={cn(
            "size-12 rounded-xl flex items-center justify-center mb-4",
            isCreator ? "bg-accent-blue/10" : "bg-accent-peach/10"
          )}
        >
          <div className={isCreator ? "text-accent-blue" : "text-accent-peach"}>
            {icon}
          </div>
        </div>
      )}
      <AnimatedCounter
        value={value}
        suffix={suffix}
        className={cn(
          "text-3xl sm:text-4xl font-bold",
          isCreator ? "text-accent-blue" : "text-accent-peach"
        )}
      />
      <p className="text-sm sm:text-base text-gray-600 dark:text-muted-foreground mt-2 text-center">
        {label}
      </p>
    </motion.div>
  );
}
