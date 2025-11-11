"use client";

/**
 * Dashboard Home Page - Modern 2025 Redesign
 *
 * Key Features:
 * - Enhanced tiered shadow system for depth
 * - Sparkline visualizations in stat cards
 * - Sophisticated micro-interactions
 * - Mobile-first responsive design
 * - Modern hover states with scale + shadow
 * - Improved loading states with shimmer
 * - Touch-friendly interactions (44px+ targets)
 */

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  FolderOpen,
  MessageSquare,
  Plus,
  Settings,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  Zap,
  ArrowRight,
  Bell,
  ChevronDown,
} from "lucide-react";
import { Suspense, useState } from "react";

function DashboardContent() {
  const { user } = useAuth();
  const [mobileSection, setMobileSection] = useState<"overview" | "activity" | "account">("overview");
  const [accountExpanded, setAccountExpanded] = useState(false);

  // Sample trend data for sparklines
  const projectTrendData = [1, 1, 2, 2, 3, 3, 3];
  const feedbackTrendData = [16, 18, 20, 19, 22, 23, 24];
  const completedTrendData = [8, 9, 9, 10, 11, 11, 12];
  const pendingTrendData = [8, 7, 6, 7, 5, 5, 5];

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 pb-24 lg:pb-8">
      {/* Welcome Section - Compact on mobile */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-foreground tracking-tight">
            Welcome back{user?.full_name && <span className="hidden sm:inline">, {user.full_name}</span>}!
          </h1>
          <Badge variant="success" showDot pulse size="sm" className="sm:text-sm">
            Active
          </Badge>
        </div>
        <p className="text-sm sm:text-base lg:text-lg text-foreground-muted max-w-2xl">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Grid - Mobile: 2-column, Desktop: 4-column */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          icon={<FolderOpen className="text-accent-blue" />}
          label="Active Projects"
          value="3"
          trend="+2 this week"
          trendDirection="up"
          trendData={projectTrendData}
          comparison="vs. last week"
          bgColor="bg-accent-blue/10"
          sparklineColor="#3B82F6"
        />
        <StatCard
          icon={<MessageSquare className="text-accent-peach" />}
          label="Feedback Received"
          value="24"
          trend="+8 this week"
          trendDirection="up"
          trendData={feedbackTrendData}
          comparison="vs. last week"
          bgColor="bg-accent-peach/10"
          sparklineColor="#F97316"
        />
        <StatCard
          icon={<CheckCircle2 className="text-green-600" />}
          label="Completed Reviews"
          value="12"
          trend="+3 this month"
          trendDirection="up"
          trendData={completedTrendData}
          comparison="Last 30 days"
          bgColor="bg-green-50"
          sparklineColor="#10B981"
        />
        <StatCard
          icon={<Clock className="text-amber-600" />}
          label="Pending Reviews"
          value="5"
          trend="-3 this week"
          trendDirection="down"
          trendData={pendingTrendData}
          comparison="Awaiting feedback"
          bgColor="bg-amber-50"
          sparklineColor="#F59E0B"
        />
      </div>

      {/* Mobile Section Tabs - Only visible on mobile */}
      <div className="lg:hidden flex gap-1 p-1 bg-muted/50 rounded-xl border border-border">
        <button
          onClick={() => setMobileSection("overview")}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
            mobileSection === "overview"
              ? "bg-background text-foreground shadow-sm"
              : "text-foreground-muted hover:text-foreground"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setMobileSection("activity")}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
            mobileSection === "activity"
              ? "bg-background text-foreground shadow-sm"
              : "text-foreground-muted hover:text-foreground"
          }`}
        >
          Activity
        </button>
        <button
          onClick={() => setMobileSection("account")}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
            mobileSection === "account"
              ? "bg-background text-foreground shadow-sm"
              : "text-foreground-muted hover:text-foreground"
          }`}
        >
          Account
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Quick Actions Card - Show on "overview" tab on mobile, always on desktop */}
        <div className={`lg:col-span-2 rounded-2xl border border-border bg-card p-4 sm:p-6 lg:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] transition-all duration-200 ${
          mobileSection !== "overview" ? "hidden lg:block" : ""
        }`}>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="space-y-0.5 sm:space-y-1">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground">
                Quick Actions
              </h2>
              <p className="text-xs sm:text-sm text-foreground-muted">
                Start your workflow
              </p>
            </div>
            <div className="size-8 sm:size-10 rounded-lg sm:rounded-xl bg-accent-blue/10 flex items-center justify-center">
              <Zap className="size-4 sm:size-5 text-accent-blue" />
            </div>
          </div>

          {/* Mobile: Horizontal scroll with snap */}
          <div className="lg:hidden -mx-4 px-4">
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2">
              <div className="snap-start flex-shrink-0 w-[280px]">
                <ActionButton
                  icon={<Plus className="size-5" />}
                  title="New Project"
                  description="Start a new creative project"
                  color="accent-blue"
                />
              </div>
              <div className="snap-start flex-shrink-0 w-[280px]">
                <ActionButton
                  icon={<MessageSquare className="size-5" />}
                  title="Request Feedback"
                  description="Get AI or human reviews"
                  color="accent-peach"
                />
              </div>
              <div className="snap-start flex-shrink-0 w-[280px]">
                <ActionButton
                  icon={<FileText className="size-5" />}
                  title="View Reports"
                  description="See detailed analytics"
                  color="accent-blue"
                />
              </div>
              <div className="snap-start flex-shrink-0 w-[280px]">
                <ActionButton
                  icon={<Users className="size-5" />}
                  title="Manage Team"
                  description="Invite collaborators"
                  color="accent-peach"
                />
              </div>
            </div>
          </div>

          {/* Desktop: Grid layout */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-4">
            <ActionButton
              icon={<Plus className="size-5" />}
              title="New Project"
              description="Start a new creative project"
              color="accent-blue"
            />
            <ActionButton
              icon={<MessageSquare className="size-5" />}
              title="Request Feedback"
              description="Get AI or human reviews"
              color="accent-peach"
            />
            <ActionButton
              icon={<FileText className="size-5" />}
              title="View Reports"
              description="See detailed analytics"
              color="accent-blue"
            />
            <ActionButton
              icon={<Users className="size-5" />}
              title="Manage Team"
              description="Invite collaborators"
              color="accent-peach"
            />
          </div>
        </div>

        {/* Account Info Card - Collapsible on mobile, show on "account" tab */}
        <div className={`rounded-2xl border border-border bg-card p-4 sm:p-6 lg:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] transition-all duration-200 ${
          mobileSection !== "account" ? "hidden lg:block" : ""
        }`}>
          {/* Header - Collapsible on mobile */}
          <button
            onClick={() => setAccountExpanded(!accountExpanded)}
            className="lg:pointer-events-none w-full flex items-center gap-3 mb-4 sm:mb-6"
          >
            <div className="size-10 sm:size-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-accent-blue to-accent-peach flex items-center justify-center shadow-sm ring-2 ring-accent-blue/20 flex-shrink-0">
              <span className="text-white font-bold text-lg sm:text-xl">
                {user?.full_name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <h2 className="text-base sm:text-lg font-semibold text-foreground truncate">
                Your Account
              </h2>
              <p className="text-xs sm:text-sm text-foreground-muted">Account details</p>
            </div>
            <ChevronDown className={`size-5 text-foreground-muted transition-transform lg:hidden ${accountExpanded ? "rotate-180" : ""}`} />
          </button>

          {/* Content - Collapsible on mobile, always visible on desktop */}
          <div className={`${accountExpanded ? "block" : "hidden"} lg:block space-y-3 sm:space-y-4`}>
            <InfoRow label="Full Name" value={user?.full_name || "N/A"} />
            <InfoRow label="Email" value={user?.email || "N/A"} />
            <InfoRow
              label="Status"
              value={
                <Badge
                  variant={user?.is_active ? "success" : "error"}
                  showDot
                  pulse={user?.is_active}
                  size="sm"
                >
                  {user?.is_active ? "Active" : "Inactive"}
                </Badge>
              }
            />
            <InfoRow
              label="Verified"
              value={
                <Badge
                  variant={user?.is_verified ? "info" : "warning"}
                  icon={user?.is_verified ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
                  size="sm"
                >
                  {user?.is_verified ? "Verified" : "Not Verified"}
                </Badge>
              }
            />
          </div>

          <Button
            variant="outline"
            className={`w-full mt-4 sm:mt-6 gap-2 min-h-[44px] group hover:bg-accent-blue/5 hover:border-accent-blue/30 transition-all ${accountExpanded ? "block" : "hidden"} lg:block`}
            onClick={() => {
              // Navigate to settings
            }}
          >
            <Settings className="size-4 group-hover:rotate-90 transition-transform duration-300" />
            Account Settings
            <ArrowRight className="size-4 ml-auto group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>

      {/* Recent Activity - Show on "activity" tab on mobile, always on desktop */}
      <div className={`rounded-2xl border border-border bg-card p-4 sm:p-6 lg:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] transition-all duration-200 ${
        mobileSection !== "activity" ? "hidden lg:block" : ""
      }`}>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="space-y-0.5 sm:space-y-1">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground">
              Recent Activity
            </h2>
            <p className="text-xs sm:text-sm text-foreground-muted">
              Latest updates from your projects
            </p>
          </div>
          <div className="size-8 sm:size-10 rounded-lg sm:rounded-xl bg-accent-peach/10 flex items-center justify-center">
            <TrendingUp className="size-4 sm:size-5 text-accent-peach" />
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <ActivityItem
            icon={<MessageSquare className="size-4 text-accent-blue" />}
            title="New feedback received"
            description="Your design mockup received 3 new comments"
            time="2 hours ago"
            badge="New"
          />
          <ActivityItem
            icon={<CheckCircle2 className="size-4 text-green-600" />}
            title="Review completed"
            description="AI analysis finished for 'Landing Page V2'"
            time="5 hours ago"
          />
          <ActivityItem
            icon={<Plus className="size-4 text-accent-peach" />}
            title="Project created"
            description="You created 'Mobile App UI'"
            time="Yesterday"
          />
          <ActivityItem
            icon={<Bell className="size-4 text-blue-600" />}
            title="Team invitation sent"
            description="Invited sarah@example.com to collaborate"
            time="2 days ago"
          />
        </div>

        <Button
          variant="outline"
          className="w-full mt-6 min-h-[44px] group hover:bg-accent-blue/5 hover:border-accent-blue/30 transition-all"
        >
          View All Activity
          <ArrowRight className="size-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}

// Helper Components

interface ActionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "accent-blue" | "accent-peach";
}

function ActionButton({ icon, title, description, color }: ActionButtonProps) {
  const colorClasses = {
    "accent-blue": "bg-accent-blue text-white",
    "accent-peach": "bg-accent-peach text-white",
  };

  return (
    <button
      className="group relative p-4 rounded-xl border border-border bg-background hover:bg-accent-blue/5 hover:border-accent-blue/30 transition-all duration-200 text-left min-h-[96px] flex flex-col justify-center shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 active:scale-[0.98]"
      onClick={() => {
        // Handle navigation
      }}
    >
      <div
        className={`size-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200 shadow-sm`}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-foreground text-base">{title}</h3>
      <p className="text-sm text-foreground-muted mt-1">{description}</p>

      {/* Hover indicator */}
      <div className="absolute top-3 right-3 size-5 rounded-full bg-accent-blue/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="size-3 text-accent-blue" />
      </div>
    </button>
  );
}

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border-light last:border-0">
      <span className="text-sm text-foreground-muted font-medium">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">
        {value}
      </span>
    </div>
  );
}

interface ActivityItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
  badge?: string;
}

function ActivityItem({ icon, title, description, time, badge }: ActivityItemProps) {
  return (
    <div className="group flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl hover:bg-accent-blue/5 transition-all duration-200 cursor-pointer border border-transparent hover:border-accent-blue/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)] min-h-[68px]">
      <div className="size-8 sm:size-10 rounded-lg bg-background-subtle flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-foreground text-xs sm:text-sm">{title}</h4>
          {badge && (
            <Badge variant="primary" size="sm">
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-xs sm:text-sm text-foreground-muted mt-0.5 line-clamp-1 sm:line-clamp-none">{description}</p>
        <p className="text-[10px] sm:text-xs text-foreground-muted mt-1 flex items-center gap-1">
          <Clock className="size-3" />
          {time}
        </p>
      </div>
      <ArrowRight className="size-3 sm:size-4 text-foreground-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 hidden sm:block" />
    </div>
  );
}

// Main Page Component with Suspense
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

// Loading Skeleton (will be replaced with enhanced version)
function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-12 bg-muted rounded-xl w-80 max-w-full" />
        <div className="h-6 bg-muted rounded-lg w-96 max-w-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6 h-40" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-8 h-96" />
        <div className="rounded-2xl border border-border bg-card p-8 h-96" />
      </div>
    </div>
  );
}
