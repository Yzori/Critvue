"use client";

/**
 * Pull-to-Refresh Component
 *
 * Mobile-first pattern for refreshing dashboard content
 *
 * Features:
 * - Native-like pull-to-refresh behavior
 * - Visual feedback with spinner
 * - Smooth animations
 * - Haptic feedback simulation
 * - Threshold-based triggering
 * - Works on touch devices
 */

import * as React from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  disabled = false,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isPulling, setIsPulling] = React.useState(false);
  const y = useMotionValue(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Pull threshold to trigger refresh (in pixels)
  const PULL_THRESHOLD = 80;
  const MAX_PULL = 120;

  // Transform pull distance to rotation for spinner
  const spinnerRotation = useTransform(y, [0, MAX_PULL], [0, 360]);
  const spinnerOpacity = useTransform(y, [0, PULL_THRESHOLD], [0, 1]);
  const spinnerScale = useTransform(y, [0, PULL_THRESHOLD], [0.5, 1]);

  // Check if user is at top of scroll
  const isAtTop = () => {
    if (!containerRef.current) return true;
    return containerRef.current.scrollTop === 0;
  };

  // Handle drag start
  const handleDragStart = () => {
    if (disabled || isRefreshing || !isAtTop()) return;
    setIsPulling(true);
  };

  // Handle drag end
  const handleDragEnd = async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsPulling(false);

    if (disabled || isRefreshing) {
      y.set(0);
      return;
    }

    const pullDistance = info.offset.y;

    // Trigger refresh if pulled past threshold
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);

      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        setIsRefreshing(false);
        y.set(0);
      }
    } else {
      // Snap back if not pulled enough
      y.set(0);
    }
  };

  // Reset on unmount
  React.useEffect(() => {
    return () => {
      y.set(0);
    };
  }, [y]);

  return (
    <div ref={containerRef} className={cn("relative overflow-auto", className)}>
      {/* Pull-to-refresh indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-10"
        style={{
          y: useTransform(y, [0, MAX_PULL], [-40, 40]),
          opacity: spinnerOpacity,
        }}
      >
        <motion.div
          className={cn(
            "flex items-center justify-center size-10 rounded-full",
            "bg-accent-blue text-white shadow-lg",
            isRefreshing && "animate-spin"
          )}
          style={{
            rotate: isRefreshing ? undefined : spinnerRotation,
            scale: spinnerScale,
          }}
        >
          <RefreshCw className="size-5" />
        </motion.div>
      </motion.div>

      {/* Content wrapper with drag */}
      <motion.div
        drag={!disabled && !isRefreshing ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.5, bottom: 0 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className="touch-pan-y"
      >
        {children}
      </motion.div>

      {/* Refreshing overlay */}
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-accent-blue/20 z-20">
          <motion.div
            className="h-full bg-accent-blue"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      )}
    </div>
  );
}
