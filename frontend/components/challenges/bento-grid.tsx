"use client";

import { ReactNode, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

// Staggered container for bento grid
interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      className={cn("grid gap-4 md:gap-5", className)}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.08,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// Individual bento item with staggered animation
interface BentoItemProps {
  children: ReactNode;
  className?: string;
  index?: number;
}

export function BentoItem({ children, className, index = 0 }: BentoItemProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: {
          opacity: 0,
          y: 20,
        },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 120,
            damping: 20,
            delay: index * 0.03,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// Hero bento item
export function BentoHero({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <BentoItem className={cn("col-span-full lg:col-span-2 row-span-2", className)}>
      {children}
    </BentoItem>
  );
}

// Staggered list animation wrapper
interface StaggeredListProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function StaggeredList({ children, className, delay = 0 }: StaggeredListProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.06,
            delayChildren: delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: {
          opacity: 0,
          x: -15,
        },
        visible: {
          opacity: 1,
          x: 0,
          transition: {
            type: "spring",
            stiffness: 120,
            damping: 15,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// Fade up animation
interface FadeUpProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FadeUp({ children, className, delay = 0 }: FadeUpProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
    >
      {children}
    </motion.div>
  );
}

// Scale in animation
export function ScaleIn({ children, className, delay = 0 }: FadeUpProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={{
        duration: 0.4,
        delay,
        type: "spring",
        stiffness: 120,
        damping: 18,
      }}
    >
      {children}
    </motion.div>
  );
}

// Animated counter
interface AnimatedCounterProps {
  value: number;
  className?: string;
  suffix?: string;
  duration?: number;
}

export function AnimatedCounter({ value, className, suffix = "", duration = 1.2 }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
    >
      {isInView ? (
        <Counter from={0} to={value} duration={duration} />
      ) : (
        0
      )}
      {suffix}
    </motion.span>
  );
}

function Counter({ from, to, duration }: { from: number; to: number; duration: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);

  return (
    <motion.span
      ref={nodeRef}
      onAnimationStart={() => {
        const node = nodeRef.current;
        if (!node) return;

        const startTime = performance.now();
        const updateCounter = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / (duration * 1000), 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(from + (to - from) * eased);

          node.textContent = current.toString();

          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          }
        };

        requestAnimationFrame(updateCounter);
      }}
    >
      {from}
    </motion.span>
  );
}

// Pulse indicator with Critvue colors
export function PulseIndicator({ className, color = "blue" }: { className?: string; color?: string }) {
  const colors = {
    blue: "bg-accent-blue",
    peach: "bg-accent-peach",
    sage: "bg-accent-sage",
    red: "bg-red-500",
  };

  return (
    <span className={cn("relative flex h-2 w-2", className)}>
      <motion.span
        className={cn(
          "absolute inline-flex h-full w-full rounded-full opacity-75",
          colors[color as keyof typeof colors] || colors.blue
        )}
        animate={{ scale: [1, 1.5, 1], opacity: [0.75, 0, 0.75] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span
        className={cn(
          "relative inline-flex rounded-full h-2 w-2",
          colors[color as keyof typeof colors] || colors.blue
        )}
      />
    </span>
  );
}

// Shimmer loading effect
export function ShimmerCard({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-gray-100 border border-border", className)}>
      <motion.div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
        }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
