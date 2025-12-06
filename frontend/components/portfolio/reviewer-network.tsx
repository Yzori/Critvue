"use client";

/**
 * Reviewer Network Visualization
 *
 * Shows the network of expert reviewers who contributed to the creator's growth.
 * Displays their specialties, review counts, and impact scores in an engaging way.
 */

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  MessageSquare,
  TrendingUp,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface Reviewer {
  id: number;
  name: string;
  avatar: string | null;
  specialty: string;
  reviewCount: number;
  impactScore: number;
}

interface ReviewerNetworkProps {
  reviewers: Reviewer[];
  className?: string;
}

export function ReviewerNetwork({ reviewers, className }: ReviewerNetworkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [selectedReviewer, setSelectedReviewer] = useState<Reviewer | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // Sort by impact score
  const sortedReviewers = [...reviewers].sort((a, b) => b.impactScore - a.impactScore);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Network Visualization */}
      <div className="flex flex-col lg:flex-row gap-8 items-center">
        {/* Central Node (You) + Connections */}
        <div className="relative flex-1 min-h-[400px] flex items-center justify-center">
          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {sortedReviewers.map((reviewer, index) => {
              const angle = (index / sortedReviewers.length) * 2 * Math.PI - Math.PI / 2;
              const radius = 150;
              const centerX = 200;
              const centerY = 200;
              const endX = centerX + Math.cos(angle) * radius;
              const endY = centerY + Math.sin(angle) * radius;

              return (
                <motion.line
                  key={`line-${reviewer.id}`}
                  x1={centerX}
                  y1={centerY}
                  x2={endX}
                  y2={endY}
                  stroke={hoveredId === reviewer.id ? "#4CC9F0" : "#E5E7EB"}
                  strokeWidth={hoveredId === reviewer.id ? 3 : 2}
                  strokeDasharray={hoveredId === reviewer.id ? "0" : "5 5"}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>

          {/* Central "You" Node */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
            initial={{ scale: 0, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : {}}
            transition={{ delay: 0.3, type: "spring", bounce: 0.4 }}
          >
            <div className="relative">
              <div className="size-24 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-1 shadow-xl">
                <div className="size-full rounded-full bg-background flex items-center justify-center">
                  <span className="text-lg font-bold text-foreground">You</span>
                </div>
              </div>
              {/* Pulse effect */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-pink-500/30"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 0, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </motion.div>

          {/* Reviewer Nodes */}
          {sortedReviewers.map((reviewer, index) => {
            const angle = (index / sortedReviewers.length) * 2 * Math.PI - Math.PI / 2;
            const radius = 150;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <motion.div
                key={reviewer.id}
                className="absolute left-1/2 top-1/2 z-10"
                style={{
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={isInView ? { scale: 1, opacity: 1 } : {}}
                transition={{ delay: 0.5 + index * 0.1, type: "spring", bounce: 0.4 }}
                onMouseEnter={() => setHoveredId(reviewer.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setSelectedReviewer(reviewer)}
              >
                <ReviewerNode
                  reviewer={reviewer}
                  isHighlighted={hoveredId === reviewer.id}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Stats Panel */}
        <div className="flex-1 max-w-md space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Your Growth Network
            </h3>
            <p className="text-muted-foreground">
              {reviewers.length} experts have contributed to your creative journey,
              providing {reviewers.reduce((sum, r) => sum + r.reviewCount, 0)} total reviews.
            </p>
          </div>

          {/* Top Reviewers List */}
          <div className="space-y-3">
            {sortedReviewers.slice(0, 4).map((reviewer, index) => (
              <motion.div
                key={reviewer.id}
                className={cn(
                  "p-4 rounded-xl border border-border/50 bg-background transition-all cursor-pointer",
                  hoveredId === reviewer.id && "border-accent-blue shadow-md"
                )}
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.8 + index * 0.1 }}
                onMouseEnter={() => setHoveredId(reviewer.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setSelectedReviewer(reviewer)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {reviewer.avatar ? (
                      <img
                        src={reviewer.avatar}
                        alt={reviewer.name}
                        className="size-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="size-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {reviewer.name.charAt(0)}
                      </div>
                    )}
                    {/* Rank badge */}
                    {index < 3 && (
                      <div
                        className={cn(
                          "absolute -top-1 -right-1 size-5 rounded-full flex items-center justify-center text-xs font-bold text-white",
                          index === 0 && "bg-amber-500",
                          index === 1 && "bg-gray-400",
                          index === 2 && "bg-orange-600"
                        )}
                      >
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate">
                      {reviewer.name}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {reviewer.specialty}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-emerald-500 font-semibold">
                      <TrendingUp className="size-4" />
                      {reviewer.impactScore}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {reviewer.reviewCount} reviews
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Overall Impact */}
          <motion.div
            className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-border/50"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.2 }}
          >
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="size-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {Math.round(
                    reviewers.reduce((sum, r) => sum + r.impactScore, 0) / reviewers.length
                  )}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Average Impact Score
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Reviewer Detail Modal */}
      <AnimatePresence>
        {selectedReviewer && (
          <ReviewerDetailModal
            reviewer={selectedReviewer}
            onClose={() => setSelectedReviewer(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface ReviewerNodeProps {
  reviewer: Reviewer;
  isHighlighted: boolean;
}

function ReviewerNode({ reviewer, isHighlighted }: ReviewerNodeProps) {
  const size = Math.max(48, Math.min(72, 40 + reviewer.impactScore / 3));

  return (
    <div className="relative cursor-pointer group">
      {/* Avatar */}
      <div
        className={cn(
          "rounded-full border-2 transition-all overflow-hidden",
          isHighlighted
            ? "border-accent-blue shadow-lg shadow-accent-blue/30 scale-110"
            : "border-border"
        )}
        style={{ width: size, height: size }}
      >
        {reviewer.avatar ? (
          <img
            src={reviewer.avatar}
            alt={reviewer.name}
            className="size-full object-cover"
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
            {reviewer.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Tooltip on hover */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 -bottom-2 translate-y-full pointer-events-none transition-all",
          isHighlighted ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium whitespace-nowrap shadow-lg">
          {reviewer.name}
        </div>
      </div>

      {/* Review count badge */}
      <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-accent-blue text-white text-[10px] font-bold">
        {reviewer.reviewCount}
      </div>
    </div>
  );
}

interface ReviewerDetailModalProps {
  reviewer: Reviewer;
  onClose: () => void;
}

function ReviewerDetailModal({ reviewer, onClose }: ReviewerDetailModalProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        className="relative bg-background rounded-2xl p-6 max-w-md w-full shadow-2xl border border-border"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          {reviewer.avatar ? (
            <img
              src={reviewer.avatar}
              alt={reviewer.name}
              className="size-16 rounded-full object-cover"
            />
          ) : (
            <div className="size-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
              {reviewer.name.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold text-foreground">{reviewer.name}</h3>
            <p className="text-muted-foreground">{reviewer.specialty}</p>
            <Badge variant="info" className="mt-2">
              <Star className="size-3 mr-1" />
              Expert Reviewer
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-2 text-blue-500 mb-1">
              <MessageSquare className="size-4" />
              <span className="text-sm font-medium">Reviews Given</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {reviewer.reviewCount}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-2 text-emerald-500 mb-1">
              <TrendingUp className="size-4" />
              <span className="text-sm font-medium">Impact Score</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {reviewer.impactScore}%
            </div>
          </div>
        </div>

        {/* Impact Description */}
        <p className="text-muted-foreground mb-6">
          This reviewer has significantly contributed to your growth, with their feedback
          directly improving {reviewer.reviewCount} of your projects by an average of{" "}
          {reviewer.impactScore}%.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button className="flex-1 gap-2">
            View Profile
            <ExternalLink className="size-4" />
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ReviewerNetwork;
