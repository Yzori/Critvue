/**
 * Reviewer Dashboard Stats Component
 *
 * Displays key metrics for reviewers:
 * - Active reviews (claimed, in progress)
 * - Total completed reviews
 * - Total earnings (pending + paid)
 * - Average rating
 *
 * Brand Compliance:
 * - Uses Critvue purple/blue gradients
 * - Glassmorphism effects
 * - Smooth animations
 * - Mobile-first responsive design
 */

"use client";

import * as React from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Clock, CheckCircle2, DollarSign, Star } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { ReviewerDashboard } from "@/lib/api/reviewer";

export interface DashboardStatsProps {
  stats: ReviewerDashboard["stats"];
  activeClaimsCount: number;
  isLoading?: boolean;
}

export function DashboardStats({
  stats,
  activeClaimsCount,
  isLoading = false,
}: DashboardStatsProps) {
  const prefersReducedMotion = useReducedMotion();

  // Sample trend data (will be replaced with real historical data later)
  const activeTrendData = [0, 1, 1, 2, 2, activeClaimsCount, activeClaimsCount];
  const completedTrendData = [
    0,
    2,
    5,
    8,
    10,
    Math.max(0, stats.total_reviews - 2),
    stats.total_reviews,
  ];
  const earningsTrendData = [
    0,
    10,
    25,
    40,
    60,
    Math.max(0, stats.total_earned - 20),
    stats.total_earned,
  ];
  const ratingTrendData = [0, 3.5, 4.0, 4.2, 4.3, 4.5, stats.average_rating];

  const statsConfig = [
    {
      icon: <Clock className="text-accent-blue" />,
      label: "Active Reviews",
      value: isLoading ? "..." : String(activeClaimsCount),
      trend:
        activeClaimsCount > 0 ? `${activeClaimsCount} in progress` : "No active claims",
      trendDirection: "neutral" as const,
      trendData: activeTrendData,
      comparison: "Current status",
      bgColor: "bg-accent-blue/10",
      sparklineColor: "hsl(217 91% 60%)", // accent-blue
    },
    {
      icon: <CheckCircle2 className="text-green-600" />,
      label: "Completed",
      value: isLoading ? "..." : String(stats.total_reviews),
      trend:
        stats.total_reviews > 0
          ? `${stats.total_reviews} total`
          : "No reviews yet",
      trendDirection: "up" as const,
      trendData: completedTrendData,
      comparison: "All time",
      bgColor: "bg-green-50 dark:bg-green-500/10",
      sparklineColor: "hsl(142 71% 45%)", // green-600
    },
    {
      icon: <DollarSign className="text-accent-peach" />,
      label: "Total Earnings",
      value: isLoading
        ? "..."
        : `$${stats.total_earned.toFixed(2)}`,
      trend:
        stats.pending_payment > 0
          ? `$${stats.pending_payment.toFixed(2)} pending`
          : "All released",
      trendDirection: stats.total_earned > 0 ? ("up" as const) : ("neutral" as const),
      trendData: earningsTrendData,
      comparison: "All time",
      bgColor: "bg-accent-peach/10",
      sparklineColor: "hsl(27 94% 54%)", // accent-peach
    },
    {
      icon: <Star className="text-amber-500" />,
      label: "Average Rating",
      value: isLoading
        ? "..."
        : stats.average_rating
          ? `${stats.average_rating.toFixed(1)}/5`
          : "N/A",
      trend:
        stats.average_rating
          ? stats.average_rating >= 4.5
            ? "Excellent"
            : stats.average_rating >= 4.0
              ? "Very good"
              : "Good"
          : "No ratings yet",
      trendDirection:
        stats.average_rating && stats.average_rating >= 4.5
          ? ("up" as const)
          : ("neutral" as const),
      trendData: ratingTrendData,
      comparison: "From creators",
      bgColor: "bg-amber-50 dark:bg-amber-500/10",
      sparklineColor: "hsl(45 93% 47%)", // amber-500
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-6 h-40 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {statsConfig.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.4,
            delay: prefersReducedMotion ? 0 : index * 0.15,
          }}
        >
          <StatCard {...stat} />
        </motion.div>
      ))}
    </div>
  );
}
