"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, Check, User, Users } from "lucide-react";

interface MatchingVisualizationProps {
  perspective: "creator" | "reviewer";
  className?: string;
  /** Trigger the matching animation */
  isInView?: boolean;
}

/**
 * Animated SVG visualization showing the matching process
 * - User dot on left (creator) or right (reviewer)
 * - Multiple reviewer/project dots on opposite side
 * - Connection lines drawn with path animation
 * - Celebration effect on successful match
 */
export function MatchingVisualization({
  perspective,
  className,
  isInView = false,
}: MatchingVisualizationProps) {
  const prefersReducedMotion = useReducedMotion();
  const [matchComplete, setMatchComplete] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);

  const isCreator = perspective === "creator";

  // Reset and start animation when coming into view
  useEffect(() => {
    if (isInView && !animationStarted) {
      setAnimationStarted(true);
      const timer = setTimeout(() => {
        setMatchComplete(true);
      }, prefersReducedMotion ? 100 : 2000);
      return () => clearTimeout(timer);
    }
  }, [isInView, animationStarted, prefersReducedMotion]);

  // Reset when scrolling away
  useEffect(() => {
    if (!isInView) {
      setMatchComplete(false);
      setAnimationStarted(false);
    }
  }, [isInView]);

  const reviewerNodes = [
    { id: 1, y: 60, delay: 0.2, name: "Alex", specialty: "UI/UX" },
    { id: 2, y: 140, delay: 0.4, name: "Sam", specialty: "Frontend", isMatch: true },
    { id: 3, y: 220, delay: 0.6, name: "Jordan", specialty: "Backend" },
  ];

  const projectNodes = [
    { id: 1, y: 60, delay: 0.2, name: "Portfolio", type: "Design" },
    { id: 2, y: 140, delay: 0.4, name: "React App", type: "Code", isMatch: true },
    { id: 3, y: 220, delay: 0.6, name: "API", type: "Backend" },
  ];

  const nodes = isCreator ? reviewerNodes : projectNodes;
  const matchedNode = nodes.find((n) => n.isMatch);

  return (
    <div className={cn("relative w-full max-w-2xl mx-auto", className)}>
      {/* SVG Container */}
      <div className="relative h-[280px] sm:h-[320px]">
        <svg
          viewBox="0 0 400 280"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop
                offset="0%"
                stopColor={isCreator ? "#3B82F6" : "#F97316"}
                stopOpacity="0.8"
              />
              <stop
                offset="100%"
                stopColor={isCreator ? "#60A5FA" : "#FB923C"}
                stopOpacity="0.8"
              />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Connection lines - draw to all nodes with different opacity */}
          {nodes.map((node) => (
            <motion.path
              key={node.id}
              d={`M 80 140 Q 200 ${node.y} 320 ${node.y}`}
              fill="none"
              stroke={node.isMatch ? "url(#lineGradient)" : "#E5E7EB"}
              strokeWidth={node.isMatch ? 3 : 1}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={
                animationStarted
                  ? {
                      pathLength: 1,
                      opacity: node.isMatch ? 1 : 0.3,
                    }
                  : {}
              }
              transition={{
                pathLength: {
                  duration: prefersReducedMotion ? 0 : 1.2,
                  delay: prefersReducedMotion ? 0 : node.delay,
                  ease: "easeInOut",
                },
                opacity: {
                  duration: prefersReducedMotion ? 0 : 0.3,
                  delay: prefersReducedMotion ? 0 : node.delay,
                },
              }}
              filter={node.isMatch && matchComplete ? "url(#glow)" : undefined}
            />
          ))}

          {/* User node (left side) */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={animationStarted ? { scale: 1, opacity: 1 } : {}}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.5,
              ease: "backOut",
            }}
          >
            <circle
              cx="80"
              cy="140"
              r="32"
              className={isCreator ? "fill-accent-blue" : "fill-accent-peach"}
            />
            <circle
              cx="80"
              cy="140"
              r="28"
              className="fill-white"
            />
            <foreignObject x="56" y="116" width="48" height="48">
              <div className="flex items-center justify-center w-full h-full">
                <User
                  className={cn(
                    "size-6",
                    isCreator ? "text-accent-blue" : "text-accent-peach"
                  )}
                />
              </div>
            </foreignObject>
          </motion.g>

          {/* Reviewer/Project nodes (right side) */}
          {nodes.map((node) => (
            <motion.g
              key={node.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={animationStarted ? { scale: 1, opacity: 1 } : {}}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.5,
                delay: prefersReducedMotion ? 0 : node.delay,
                ease: "backOut",
              }}
            >
              {/* Outer ring for matched node */}
              {node.isMatch && matchComplete && (
                <motion.circle
                  cx="320"
                  cy={node.y}
                  r="38"
                  fill="none"
                  className={isCreator ? "stroke-accent-blue" : "stroke-accent-peach"}
                  strokeWidth="2"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}

              <circle
                cx="320"
                cy={node.y}
                r="28"
                className={cn(
                  node.isMatch && matchComplete
                    ? isCreator
                      ? "fill-accent-blue"
                      : "fill-accent-peach"
                    : "fill-gray-200"
                )}
              />
              <circle
                cx="320"
                cy={node.y}
                r="24"
                className={cn(
                  node.isMatch && matchComplete ? "fill-white" : "fill-gray-100"
                )}
              />

              <foreignObject x="296" y={node.y - 24} width="48" height="48">
                <div className="flex items-center justify-center w-full h-full">
                  {node.isMatch && matchComplete ? (
                    <Check
                      className={cn(
                        "size-5",
                        isCreator ? "text-accent-blue" : "text-accent-peach"
                      )}
                    />
                  ) : (
                    <Users className="size-5 text-gray-400" />
                  )}
                </div>
              </foreignObject>
            </motion.g>
          ))}

          {/* Traveling pulse on matched line */}
          {animationStarted && matchedNode && !matchComplete && (
            <motion.circle
              r="6"
              className={isCreator ? "fill-accent-blue" : "fill-accent-peach"}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                cx: [80, 140, 260, 320],
                cy: [140, 140, matchedNode.y, matchedNode.y],
              }}
              transition={{
                duration: prefersReducedMotion ? 0 : 1.5,
                delay: prefersReducedMotion ? 0 : 0.5,
                ease: "easeInOut",
              }}
            />
          )}
        </svg>

        {/* Labels */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:translate-x-0">
          <motion.div
            className={cn(
              "text-center px-3 py-2 rounded-xl",
              isCreator ? "bg-accent-blue/10" : "bg-accent-peach/10"
            )}
            initial={{ opacity: 0, x: -20 }}
            animate={animationStarted ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <p
              className={cn(
                "text-xs sm:text-sm font-semibold",
                isCreator ? "text-accent-blue" : "text-accent-peach"
              )}
            >
              {isCreator ? "You" : "You"}
            </p>
          </motion.div>
        </div>

        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-0">
          <motion.div
            className="text-center px-3 py-2 rounded-xl bg-gray-100"
            initial={{ opacity: 0, x: 20 }}
            animate={animationStarted ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <p className="text-xs sm:text-sm font-semibold text-gray-600">
              {isCreator ? "Reviewers" : "Projects"}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Match celebration */}
      <AnimatePresence>
        {matchComplete && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4, ease: "backOut" }}
          >
            <div
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-full shadow-lg",
                isCreator
                  ? "bg-accent-blue text-white"
                  : "bg-accent-peach text-white"
              )}
            >
              <Sparkles className="size-5" />
              <span className="font-semibold text-sm sm:text-base">
                {isCreator ? "Perfect match found!" : "Project claimed!"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse rings animation on match */}
      {matchComplete && !prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2",
                isCreator ? "border-accent-blue/30" : "border-accent-peach/30"
              )}
              initial={{ width: 0, height: 0, opacity: 0.8 }}
              animate={{
                width: [0, 300],
                height: [0, 300],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.3,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
