"use client";

/**
 * Growth Milestones Component
 *
 * Displays achievements earned through the feedback journey.
 * Features a timeline-like layout with earned and locked achievements.
 */

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
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
  Lock,
  CheckCircle2,
} from "lucide-react";

interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string | null;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

interface GrowthMilestonesProps {
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

const rarityConfig = {
  common: {
    gradient: "from-gray-400 to-gray-500",
    glow: "shadow-gray-400/20",
    border: "border-gray-300 dark:border-gray-600",
    bg: "bg-gray-50 dark:bg-gray-900/50",
    text: "text-gray-600 dark:text-gray-400",
  },
  uncommon: {
    gradient: "from-green-400 to-emerald-500",
    glow: "shadow-green-400/30",
    border: "border-green-300 dark:border-green-700",
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-600 dark:text-green-400",
  },
  rare: {
    gradient: "from-blue-400 to-blue-600",
    glow: "shadow-blue-400/40",
    border: "border-blue-300 dark:border-blue-700",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
  },
  epic: {
    gradient: "from-purple-400 to-purple-600",
    glow: "shadow-purple-400/50",
    border: "border-purple-300 dark:border-purple-700",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-600 dark:text-purple-400",
  },
  legendary: {
    gradient: "from-amber-400 to-orange-500",
    glow: "shadow-amber-400/60",
    border: "border-amber-300 dark:border-amber-700",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-600 dark:text-amber-400",
  },
};

export function GrowthMilestones({ milestones, className }: GrowthMilestonesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const earnedMilestones = milestones.filter((m) => m.earnedAt !== null);
  const lockedMilestones = milestones.filter((m) => m.earnedAt === null);

  return (
    <div ref={containerRef} className={cn("space-y-12", className)}>
      {/* Summary Stats */}
      <motion.div
        className="flex flex-wrap justify-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <div className="text-4xl font-bold text-foreground">{earnedMilestones.length}</div>
          <div className="text-sm text-muted-foreground">Achievements Earned</div>
        </div>
        <div className="w-px h-12 bg-border hidden sm:block" />
        <div className="text-center">
          <div className="text-4xl font-bold text-muted-foreground">{lockedMilestones.length}</div>
          <div className="text-sm text-muted-foreground">To Unlock</div>
        </div>
        <div className="w-px h-12 bg-border hidden sm:block" />
        <div className="text-center">
          <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
            {earnedMilestones.filter((m) => m.rarity === "legendary" || m.rarity === "epic").length}
          </div>
          <div className="text-sm text-muted-foreground">Rare Achievements</div>
        </div>
      </motion.div>

      {/* Earned Milestones */}
      <div>
        <motion.h3
          className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          <CheckCircle2 className="size-5 text-emerald-500" />
          Earned Achievements
        </motion.h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {earnedMilestones.map((milestone, index) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              index={index}
              isInView={isInView}
              earned={true}
            />
          ))}
        </div>
      </div>

      {/* Locked Milestones */}
      {lockedMilestones.length > 0 && (
        <div>
          <motion.h3
            className="text-lg font-semibold text-muted-foreground mb-6 flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.4 }}
          >
            <Lock className="size-5" />
            Locked Achievements
          </motion.h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedMilestones.map((milestone, index) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                index={index + earnedMilestones.length}
                isInView={isInView}
                earned={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <motion.div
        className="max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Overall Progress</span>
          <span className="font-semibold text-foreground">
            {Math.round((earnedMilestones.length / milestones.length) * 100)}%
          </span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={isInView ? { width: `${(earnedMilestones.length / milestones.length) * 100}%` } : {}}
            transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
          />
        </div>
        <p className="text-center text-sm text-muted-foreground mt-3">
          Keep submitting work for reviews to unlock more achievements!
        </p>
      </motion.div>
    </div>
  );
}

interface MilestoneCardProps {
  milestone: Milestone;
  index: number;
  isInView: boolean;
  earned: boolean;
}

function MilestoneCard({ milestone, index, isInView, earned }: MilestoneCardProps) {
  const Icon = iconMap[milestone.icon] || Award;
  const config = rarityConfig[milestone.rarity];

  return (
    <motion.div
      className={cn(
        "relative p-5 rounded-2xl border-2 transition-all",
        earned
          ? cn(config.border, config.bg, "hover:shadow-lg", config.glow)
          : "border-border/50 bg-muted/30 opacity-60"
      )}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={isInView ? { opacity: earned ? 1 : 0.6, y: 0, scale: 1 } : {}}
      transition={{ delay: 0.3 + index * 0.1, type: "spring", bounce: 0.3 }}
      whileHover={earned ? { scale: 1.02, y: -4 } : {}}
    >
      {/* Rarity badge */}
      <Badge
        className={cn(
          "absolute -top-2 -right-2 capitalize text-xs",
          earned
            ? cn("bg-gradient-to-r text-white border-0", config.gradient)
            : "bg-muted text-muted-foreground"
        )}
      >
        {milestone.rarity}
      </Badge>

      {/* Icon */}
      <div
        className={cn(
          "size-14 rounded-xl flex items-center justify-center mb-4",
          earned ? cn("bg-gradient-to-br shadow-lg", config.gradient) : "bg-muted"
        )}
      >
        {earned ? (
          <Icon className="size-7 text-white" />
        ) : (
          <Lock className="size-6 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <h4 className={cn("font-semibold mb-1", earned ? "text-foreground" : "text-muted-foreground")}>
        {milestone.title}
      </h4>
      <p className={cn("text-sm mb-3", earned ? "text-muted-foreground" : "text-muted-foreground/60")}>
        {milestone.description}
      </p>

      {/* Earned date or locked indicator */}
      {earned && milestone.earnedAt ? (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-emerald-500" />
          Earned {new Date(milestone.earnedAt).toLocaleDateString()}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
          <Lock className="size-3.5" />
          Keep improving to unlock
        </div>
      )}

      {/* Shimmer effect for legendary/epic */}
      {earned && (milestone.rarity === "legendary" || milestone.rarity === "epic") && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
            animate={{ translateX: ["−100%", "100%"] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeInOut",
            }}
          />
        </div>
      )}
    </motion.div>
  );
}

export default GrowthMilestones;
