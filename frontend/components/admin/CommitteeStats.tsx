"use client";

/**
 * Committee Stats Dashboard
 *
 * A modern stats dashboard for the expert application review committee.
 * Shows key metrics with animated numbers and visual flair.
 */

import { motion } from "framer-motion";
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommitteeStats } from "@/lib/api/admin";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "success" | "warning" | "info";
  delay?: number;
}

function StatCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  variant = "default",
  delay = 0,
}: StatCardProps) {
  const variantStyles = {
    default: "from-gray-50 to-white border-gray-200/50",
    success: "from-green-50/50 to-white border-green-200/30",
    warning: "from-amber-50/50 to-white border-amber-200/30",
    info: "from-blue-50/50 to-white border-blue-200/30",
  };

  const iconStyles = {
    default: "bg-gray-100 text-gray-600",
    success: "bg-green-100 text-green-600",
    warning: "bg-amber-100 text-amber-600",
    info: "bg-blue-100 text-blue-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 shadow-sm transition-all hover:shadow-md",
        variantStyles[variant]
      )}
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-gray-100/50 to-transparent" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: delay + 0.1 }}
            className="text-3xl font-bold tracking-tight"
          >
            {value}
          </motion.p>
          {trendValue && (
            <div className="flex items-center gap-1 text-xs">
              {trend === "up" && (
                <TrendingUp className="h-3 w-3 text-green-500" />
              )}
              <span
                className={cn(
                  trend === "up" && "text-green-600",
                  trend === "down" && "text-red-600",
                  trend === "neutral" && "text-muted-foreground"
                )}
              >
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className={cn("rounded-xl p-3", iconStyles[variant])}>{icon}</div>
      </div>
    </motion.div>
  );
}

interface CommitteeStatsDashboardProps {
  stats: CommitteeStats | null;
  isLoading?: boolean;
}

export function CommitteeStatsDashboard({
  stats,
  isLoading,
}: CommitteeStatsDashboardProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl bg-gray-100"
          />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Main stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pending Applications"
          value={stats.pending_applications}
          icon={<Users className="h-5 w-5" />}
          variant="warning"
          delay={0}
        />
        <StatCard
          label="Under Review"
          value={stats.under_review}
          icon={<Clock className="h-5 w-5" />}
          variant="info"
          delay={0.1}
        />
        <StatCard
          label="Approved This Month"
          value={stats.approved_this_month}
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="success"
          delay={0.2}
        />
        <StatCard
          label="Rejected This Month"
          value={stats.rejected_this_month}
          icon={<XCircle className="h-5 w-5" />}
          variant="default"
          delay={0.3}
        />
      </div>

      {/* Personal stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="relative overflow-hidden rounded-2xl border border-accent-blue/20 bg-gradient-to-br from-accent-blue/5 to-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-accent-blue/10 p-3">
              <Briefcase className="h-5 w-5 text-accent-blue" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                My Claimed
              </p>
              <p className="text-2xl font-bold">{stats.my_claimed_count}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-green-200/30 bg-gradient-to-br from-green-50/50 to-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-green-100 p-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                My Votes This Month
              </p>
              <p className="text-2xl font-bold">{stats.my_votes_this_month}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="relative overflow-hidden rounded-2xl border border-gray-200/50 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gray-100 p-3">
              <Clock className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Avg Review Time
              </p>
              <p className="text-2xl font-bold">
                {stats.avg_review_time_days.toFixed(1)}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  days
                </span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
