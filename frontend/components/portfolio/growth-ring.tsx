"use client";

/**
 * Growth Ring Visualization
 *
 * A unique tree-ring inspired visualization showing the creator's growth journey.
 * Each ring represents a period of growth, with milestones marked as special nodes.
 * This is the signature visual element of the Critvue portfolio.
 */

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  TrendingUp,
  Users,
  Award,
  Flame,
  Star,
  Zap,
  Trophy,
} from "lucide-react";

interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string | null;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

interface GrowthData {
  totalReviews: number;
  improvementScore: number;
  topCategory: string;
  growthPercentile: number;
  streakDays: number;
  totalProjects: number;
}

interface GrowthRingProps {
  data: GrowthData;
  milestones: Milestone[];
  className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  message: MessageSquare,
  trending: TrendingUp,
  users: Users,
  award: Award,
  flame: Flame,
  star: Star,
  zap: Zap,
  trophy: Trophy,
};

const rarityColors = {
  common: "from-gray-400 to-gray-500",
  uncommon: "from-green-400 to-emerald-500",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-amber-400 to-orange-500",
};

const rarityGlow = {
  common: "shadow-gray-400/30",
  uncommon: "shadow-green-400/30",
  rare: "shadow-blue-400/40",
  epic: "shadow-purple-400/50",
  legendary: "shadow-amber-400/60",
};

export function GrowthRing({ data, milestones, className }: GrowthRingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [hoveredRing, setHoveredRing] = useState<number | null>(null);

  // Calculate ring data based on growth
  // Foundation: based on total projects (each project = 20% progress, max 100%)
  // Early Growth: based on reviews received (each review = 5% progress, max 100%)
  // Breakthrough: based on improvement score (direct percentage)
  // Mastery: based on growth percentile ranking
  const rings = [
    { radius: 60, progress: Math.min(100, data.totalProjects * 20), label: "Foundation", color: "#4CC9F0" },
    { radius: 100, progress: Math.min(100, data.totalReviews * 10), label: "Early Growth", color: "#60A5FA" },
    { radius: 140, progress: Math.min(100, data.improvementScore), label: "Breakthrough", color: "#8B5CF6" },
    { radius: 180, progress: Math.min(100, data.growthPercentile), label: "Mastery", color: "#EC4899" },
  ];

  // Position milestones around the rings
  const getMilestonePosition = (index: number, total: number, ringIndex: number) => {
    const safeRingIndex = Math.min(ringIndex, rings.length - 1);
    const ring = rings[safeRingIndex];
    const radius = (ring?.radius ?? 100) + 30;
    const angle = ((index / total) * 2 * Math.PI) - (Math.PI / 2);
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  // Helper to get ring color safely
  const getRingColor = (ringIndex: number) => {
    const ring = rings[Math.min(ringIndex, rings.length - 1)];
    return ring?.color ?? "#4CC9F0";
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="flex flex-col lg:flex-row items-center gap-12">
        {/* Ring Visualization */}
        <div className="relative flex-1 flex justify-center">
          <svg
            viewBox="-250 -250 500 500"
            className="w-full max-w-[500px] aspect-square"
          >
            {/* Definitions */}
            <defs>
              {rings.map((ring, i) => (
                <linearGradient
                  key={`gradient-${i}`}
                  id={`ring-gradient-${i}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={ring.color} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={ring.color} stopOpacity="0.4" />
                </linearGradient>
              ))}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background circles */}
            {rings.map((ring, i) => (
              <circle
                key={`bg-${i}`}
                cx="0"
                cy="0"
                r={ring.radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-muted/20"
              />
            ))}

            {/* Animated progress rings */}
            {rings.map((ring, i) => {
              const circumference = 2 * Math.PI * ring.radius;
              const strokeDasharray = `${(ring.progress / 100) * circumference} ${circumference}`;

              return (
                <motion.circle
                  key={`progress-${i}`}
                  cx="0"
                  cy="0"
                  r={ring.radius}
                  fill="none"
                  stroke={`url(#ring-gradient-${i})`}
                  strokeWidth={hoveredRing === i ? 8 : 5}
                  strokeLinecap="round"
                  filter="url(#glow)"
                  className="cursor-pointer transition-all"
                  style={{
                    transformOrigin: "center",
                    transform: "rotate(-90deg)",
                  }}
                  initial={{ strokeDasharray: `0 ${circumference}` }}
                  animate={isInView ? { strokeDasharray } : {}}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.3,
                    ease: "easeOut",
                  }}
                  onMouseEnter={() => setHoveredRing(i)}
                  onMouseLeave={() => setHoveredRing(null)}
                />
              );
            })}

            {/* Milestone nodes */}
            {milestones.map((milestone, i) => {
              const earned = milestone.earnedAt !== null;
              const ringIndex = Math.floor(i / 2);
              const pos = getMilestonePosition(i, milestones.length, ringIndex);
              const Icon = iconMap[milestone.icon] || Award;

              return (
                <motion.g
                  key={milestone.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{
                    delay: 1.5 + i * 0.15,
                    type: "spring",
                    bounce: 0.4,
                  }}
                  className="cursor-pointer"
                  onClick={() => setSelectedMilestone(milestone)}
                >
                  {/* Milestone circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={earned ? 20 : 16}
                    className={cn(
                      "transition-all",
                      earned
                        ? "fill-background stroke-2"
                        : "fill-muted/50 stroke-muted-foreground/30"
                    )}
                    style={{
                      stroke: earned ? getRingColor(ringIndex) : undefined,
                    }}
                  />

                  {/* Icon */}
                  <foreignObject
                    x={pos.x - 10}
                    y={pos.y - 10}
                    width="20"
                    height="20"
                  >
                    <div className="flex items-center justify-center size-full">
                      <Icon
                        className={cn(
                          "size-4",
                          earned ? "text-foreground" : "text-muted-foreground/50"
                        )}
                      />
                    </div>
                  </foreignObject>

                  {/* Pulse effect for earned milestones */}
                  {earned && (
                    <motion.circle
                      cx={pos.x}
                      cy={pos.y}
                      r={20}
                      fill="none"
                      stroke={getRingColor(ringIndex)}
                      strokeWidth={2}
                      initial={{ r: 20, opacity: 0.6 }}
                      animate={{
                        r: [20, 30, 20],
                        opacity: [0.6, 0, 0.6],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </motion.g>
              );
            })}

            {/* Center score */}
            <motion.g
              initial={{ opacity: 0, scale: 0.5 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <circle cx="0" cy="0" r="40" className="fill-background" />
              <circle
                cx="0"
                cy="0"
                r="40"
                fill="none"
                stroke="url(#ring-gradient-0)"
                strokeWidth="2"
              />
              <text
                x="0"
                y="-5"
                textAnchor="middle"
                className="fill-foreground font-bold text-2xl"
              >
                {data.improvementScore}%
              </text>
              <text
                x="0"
                y="12"
                textAnchor="middle"
                className="fill-muted-foreground text-[10px] uppercase tracking-wider"
              >
                Growth
              </text>
            </motion.g>
          </svg>

          {/* Ring labels on hover */}
          <AnimatePresence>
            {hoveredRing !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2"
              >
                <Badge variant="secondary" className="shadow-lg">
                  {rings[hoveredRing]?.label}: {rings[hoveredRing]?.progress}%
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Legend & Stats */}
        <div className="flex-1 max-w-md space-y-6">
          {/* Ring Legend */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Growth Layers</h3>
            {rings.map((ring, i) => (
              <motion.div
                key={ring.label}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-colors",
                  hoveredRing === i ? "bg-muted" : "hover:bg-muted/50"
                )}
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.8 + i * 0.1 }}
                onMouseEnter={() => setHoveredRing(i)}
                onMouseLeave={() => setHoveredRing(null)}
              >
                <div
                  className="size-4 rounded-full"
                  style={{ backgroundColor: ring.color }}
                />
                <div className="flex-1">
                  <div className="font-medium text-foreground">{ring.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {ring.progress}% complete
                  </div>
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {ring.progress}%
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<MessageSquare className="size-5" />}
              value={data.totalReviews}
              label="Reviews"
              color="text-blue-500"
              delay={1.2}
              isInView={isInView}
            />
            <StatCard
              icon={<TrendingUp className="size-5" />}
              value={`+${data.improvementScore}%`}
              label="Improvement"
              color="text-emerald-500"
              delay={1.3}
              isInView={isInView}
            />
            <StatCard
              icon={<Flame className="size-5" />}
              value={data.streakDays}
              label="Day Streak"
              color="text-orange-500"
              delay={1.4}
              isInView={isInView}
            />
            <StatCard
              icon={<Trophy className="size-5" />}
              value={`Top ${100 - data.growthPercentile}%`}
              label="Ranking"
              color="text-purple-500"
              delay={1.5}
              isInView={isInView}
            />
          </div>
        </div>
      </div>

      {/* Milestone Detail Modal */}
      <AnimatePresence>
        {selectedMilestone && (
          <MilestoneModal
            milestone={selectedMilestone}
            onClose={() => setSelectedMilestone(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
  delay: number;
  isInView: boolean;
}

function StatCard({ icon, value, label, color, delay, isInView }: StatCardProps) {
  return (
    <motion.div
      className="p-4 rounded-xl bg-background border border-border/50 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay }}
    >
      <div className={cn("mb-2", color)}>{icon}</div>
      <div className="text-xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </motion.div>
  );
}

interface MilestoneModalProps {
  milestone: Milestone;
  onClose: () => void;
}

function MilestoneModal({ milestone, onClose }: MilestoneModalProps) {
  const Icon = iconMap[milestone.icon] || Award;
  const earned = milestone.earnedAt !== null;

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
        className="relative bg-background rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-border"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div
          className={cn(
            "size-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-gradient-to-br shadow-lg",
            rarityColors[milestone.rarity],
            rarityGlow[milestone.rarity]
          )}
        >
          <Icon className="size-8 text-white" />
        </div>

        {/* Content */}
        <div className="text-center">
          <Badge
            className={cn(
              "mb-2 capitalize",
              milestone.rarity === "legendary" && "bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0",
              milestone.rarity === "epic" && "bg-gradient-to-r from-purple-400 to-purple-600 text-white border-0",
              milestone.rarity === "rare" && "bg-gradient-to-r from-blue-400 to-blue-600 text-white border-0"
            )}
          >
            {milestone.rarity}
          </Badge>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {milestone.title}
          </h3>
          <p className="text-muted-foreground mb-4">{milestone.description}</p>
          {earned ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Earned on {new Date(milestone.earnedAt!).toLocaleDateString()}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Not yet earned</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default GrowthRing;
