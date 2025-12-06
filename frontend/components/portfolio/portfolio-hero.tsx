"use client";

/**
 * Portfolio Hero Component
 *
 * The opening statement of the portfolio - shows the creator's identity
 * and their overall growth metrics in an engaging, animated way.
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Sparkles,
  Share2,
  ExternalLink,
  User,
} from "lucide-react";

interface GrowthData {
  totalReviews: number;
  improvementScore: number;
  topCategory: string;
  growthPercentile: number;
  streakDays: number;
  totalProjects: number;
}

interface PortfolioHeroProps {
  user: {
    id: number;
    full_name: string;
    avatar_url?: string | null;
    title?: string;
  } | null;
  growthData: GrowthData;
}

export function PortfolioHero({ user, growthData }: PortfolioHeroProps) {
  return (
    <div className="space-y-8">
      {/* Avatar with Growth Ring Preview */}
      <motion.div
        className="relative mx-auto"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Animated rings around avatar */}
        <div className="relative size-40 mx-auto">
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Progress ring */}
          <svg className="absolute inset-0 size-full -rotate-90">
            <defs>
              <linearGradient id="hero-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4CC9F0" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
            <circle
              cx="80"
              cy="80"
              r="76"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-muted/30"
            />
            <motion.circle
              cx="80"
              cy="80"
              r="76"
              fill="none"
              stroke="url(#hero-gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 478" }}
              animate={{
                strokeDasharray: `${(growthData.growthPercentile / 100) * 478} 478`,
              }}
              transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
            />
          </svg>

          {/* Avatar */}
          <div className="absolute inset-4 rounded-full overflow-hidden border-4 border-background shadow-xl">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="size-full object-cover"
              />
            ) : (
              <div className="size-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="size-16 text-white" />
              </div>
            )}
          </div>

          {/* Percentile badge */}
          <motion.div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.2, type: "spring", bounce: 0.5 }}
          >
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-lg px-3 py-1">
              <TrendingUp className="size-3 mr-1" />
              Top {100 - growthData.growthPercentile}%
            </Badge>
          </motion.div>
        </div>
      </motion.div>

      {/* Name and Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-2">
          {user?.full_name || "Your Portfolio"}
        </h1>
        {user?.title && (
          <p className="text-xl text-muted-foreground">{user.title}</p>
        )}
      </motion.div>

      {/* Growth Stats */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <GrowthStat
          value={growthData.totalProjects}
          label="Projects"
          delay={0.6}
        />
        <div className="w-px h-8 bg-border hidden sm:block" />
        <GrowthStat
          value={growthData.totalReviews}
          label="Reviews"
          delay={0.7}
        />
        <div className="w-px h-8 bg-border hidden sm:block" />
        <GrowthStat
          value={`+${growthData.improvementScore}%`}
          label="Growth"
          highlight
          delay={0.8}
        />
        <div className="w-px h-8 bg-border hidden sm:block" />
        <GrowthStat
          value={growthData.streakDays}
          label="Day Streak"
          delay={0.9}
        />
      </motion.div>

      {/* Tagline */}
      <motion.p
        className="text-lg text-muted-foreground max-w-2xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        A creative journey shaped by{" "}
        <span className="text-foreground font-medium">{growthData.totalReviews} expert critiques</span>,
        showcasing growth in{" "}
        <span className="text-foreground font-medium">{growthData.topCategory}</span>{" "}
        and beyond.
      </motion.p>

      {/* Action Buttons */}
      <motion.div
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <Button
          size="lg"
          variant="outline"
          className="gap-2 group"
        >
          <Share2 className="size-4 group-hover:scale-110 transition-transform" />
          Share Portfolio
        </Button>
        <Button
          size="lg"
          variant="ghost"
          className="gap-2 text-muted-foreground"
        >
          <ExternalLink className="size-4" />
          Public View
        </Button>
      </motion.div>

      {/* Featured Badge */}
      <motion.div
        className="flex items-center justify-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <Sparkles className="size-4 text-amber-500" />
        <span className="text-sm text-muted-foreground">
          Powered by <span className="font-semibold text-foreground">Critvue</span> feedback
        </span>
      </motion.div>
    </div>
  );
}

interface GrowthStatProps {
  value: string | number;
  label: string;
  highlight?: boolean;
  delay?: number;
}

function GrowthStat({ value, label, highlight, delay = 0 }: GrowthStatProps) {
  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", bounce: 0.3 }}
    >
      <div
        className={cn(
          "text-2xl sm:text-3xl font-bold",
          highlight
            ? "text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500"
            : "text-foreground"
        )}
      >
        {value}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </motion.div>
  );
}

export default PortfolioHero;
