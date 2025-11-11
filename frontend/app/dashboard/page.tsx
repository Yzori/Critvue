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
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  Zap,
  ArrowRight,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Suspense, useState, useRef } from "react";

function DashboardContent() {
  const { user } = useAuth();
  const [mobileSection, setMobileSection] = useState<"overview" | "activity" | "account">("overview");
  const [accountExpanded, setAccountExpanded] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sample trend data for sparklines
  const projectTrendData = [1, 1, 2, 2, 3, 3, 3];
  const feedbackTrendData = [16, 18, 20, 19, 22, 23, 24];
  const completedTrendData = [8, 9, 9, 10, 11, 11, 12];
  const pendingTrendData = [8, 7, 6, 7, 5, 5, 5];

  // Quick Actions data
  const quickActions = [
    {
      icon: <Plus className="size-6 text-white" />,
      title: "New Project",
      description: "Start a new creative project",
      gradientClass: "from-accent-blue to-blue-600",
    },
    {
      icon: <MessageSquare className="size-6 text-white" />,
      title: "Request Feedback",
      description: "Get AI or human reviews",
      gradientClass: "from-accent-peach to-orange-600",
    },
    {
      icon: <FileText className="size-6 text-white" />,
      title: "View Reports",
      description: "See detailed analytics",
      gradientClass: "from-accent-blue to-indigo-600",
    },
    {
      icon: <Users className="size-6 text-white" />,
      title: "Manage Team",
      description: "Invite collaborators",
      gradientClass: "from-accent-peach to-pink-600",
    },
  ];

  // Handle scroll position tracking for card indicators
  const handleCardScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const container = e.currentTarget;
    const cardWidth = container.scrollWidth / quickActions.length;
    const index = Math.round(scrollLeft / cardWidth);
    setActiveCardIndex(Math.min(index, quickActions.length - 1));
  };

  // Scroll to specific card
  const scrollToCard = (index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cardWidth = container.scrollWidth / quickActions.length;
    container.scrollTo({
      left: cardWidth * index,
      behavior: "smooth",
    });
  };

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
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Section - Responsive Layout */}
      {/* Mobile: Bento Grid - Apple-style asymmetric layout */}
      <div className="lg:hidden grid grid-cols-2 gap-3 auto-rows-[minmax(100px,auto)]">
        {/* Primary stat - Takes full left column height */}
        <div className="row-span-2">
          <BentoStatLarge
            icon={<FolderOpen className="size-6" />}
            value="3"
            label="Active Projects"
            trend="+2 this week"
            trendDirection="up"
            color="blue"
          />
        </div>

        {/* Secondary stats - Smaller compact pills on right */}
        <BentoStatSmall
          icon={<MessageSquare className="size-5" />}
          value="24"
          label="Feedback"
          color="peach"
        />
        <BentoStatSmall
          icon={<CheckCircle2 className="size-5" />}
          value="12"
          label="Completed"
          color="green"
        />

        {/* Full width bottom stat with progress */}
        <div className="col-span-2">
          <BentoStatProgress
            icon={<Clock className="size-5" />}
            value="5"
            label="Pending Reviews"
            total={17}
            trend="-3 this week"
            color="amber"
          />
        </div>
      </div>

      {/* Desktop: Full stat cards grid with all details */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-6">
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
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setMobileSection("activity")}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
            mobileSection === "activity"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Activity
        </button>
        <button
          onClick={() => setMobileSection("account")}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
            mobileSection === "account"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
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
              <p className="text-xs sm:text-sm text-muted-foreground">
                Start your workflow
              </p>
            </div>
            <div className="size-8 sm:size-10 rounded-lg sm:rounded-xl bg-accent-blue/10 flex items-center justify-center">
              <Zap className="size-4 sm:size-5 text-accent-blue" />
            </div>
          </div>

          {/* Mobile: Horizontal scroll with centered cards + navigation */}
          <div className="lg:hidden">
            <div className="relative">
              {/* Scrollable container - centered with padding */}
              <div
                ref={scrollContainerRef}
                className="overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
                onScroll={handleCardScroll}
              >
                <div className="flex gap-4 px-8">
                  {quickActions.map((action, i) => (
                    <div key={i} className="snap-center flex-shrink-0 w-[calc(100vw-96px)] max-w-[280px]">
                      <ActionButton {...action} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation arrows - outside cards */}
              {activeCardIndex > 0 && (
                <button
                  onClick={() => scrollToCard(activeCardIndex - 1)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 size-8 rounded-full
                    bg-background border border-border shadow-md
                    flex items-center justify-center
                    hover:bg-muted transition-colors"
                  aria-label="Previous card"
                >
                  <ChevronLeft className="size-5 text-foreground" />
                </button>
              )}

              {activeCardIndex < quickActions.length - 1 && (
                <button
                  onClick={() => scrollToCard(activeCardIndex + 1)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 size-8 rounded-full
                    bg-background border border-border shadow-md
                    flex items-center justify-center
                    hover:bg-muted transition-colors"
                  aria-label="Next card"
                >
                  <ChevronRight className="size-5 text-foreground" />
                </button>
              )}
            </div>

            {/* Swipe hint + dots indicator */}
            <div className="flex flex-col items-center gap-2 mt-4">
              {/* Scroll position dots */}
              <div className="flex justify-center gap-1.5" role="tablist" aria-label="Quick action cards">
                {quickActions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToCard(i)}
                    role="tab"
                    aria-selected={i === activeCardIndex}
                    aria-label={`Go to card ${i + 1} of ${quickActions.length}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === activeCardIndex
                        ? 'w-6 bg-accent-blue'
                        : 'w-1.5 bg-border hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </div>

              {/* Swipe hint text */}
              {activeCardIndex === 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 animate-pulse">
                  <span>Swipe to see more</span>
                  <ChevronRight className="size-3" />
                </p>
              )}
            </div>
          </div>

          {/* Desktop: Grid layout */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-4">
            {quickActions.map((action, i) => (
              <ActionButton key={i} {...action} />
            ))}
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
              <p className="text-xs sm:text-sm text-muted-foreground">Account details</p>
            </div>
            <ChevronDown className={`size-5 text-muted-foreground transition-transform lg:hidden ${accountExpanded ? "rotate-180" : ""}`} />
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

          <button
            className={`w-full mt-4 sm:mt-6 flex items-center justify-between px-4 py-3 rounded-lg
              border border-border hover:bg-muted/50
              transition-colors text-left group min-h-[44px] ${accountExpanded ? "block" : "hidden"} lg:block`}
            onClick={() => {
              // Navigate to settings
            }}
          >
            <span className="text-sm font-medium text-foreground">Account Settings</span>

            <ArrowRight className="size-4 text-muted-foreground
              group-hover:text-foreground group-hover:translate-x-1
              transition-all duration-200" />
          </button>
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
            <p className="text-xs sm:text-sm text-muted-foreground">
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
  gradientClass: string;
}

function ActionButton({ icon, title, description, gradientClass }: ActionButtonProps) {
  return (
    <button
      className="group relative overflow-hidden rounded-2xl bg-background
        hover:shadow-lg
        active:scale-[0.98]
        transition-all duration-200 text-left p-6 min-h-[140px] flex flex-col justify-between"
      onClick={() => {
        // Handle navigation
      }}
    >
      {/* Icon with gradient background */}
      <div className={`size-12 rounded-xl bg-gradient-to-br ${gradientClass}
        flex items-center justify-center mb-4
        group-hover:scale-110 group-hover:shadow-lg
        transition-all duration-200`}>
        {icon}
      </div>

      {/* Text content */}
      <div>
        <h3 className="font-semibold text-base mb-1 text-foreground group-hover:text-accent-blue transition-colors">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
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
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
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
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-none">{description}</p>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Clock className="size-3" />
          {time}
        </p>
      </div>
      <ArrowRight className="size-3 sm:size-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 hidden sm:block" />
    </div>
  );
}

/**
 * Bento Grid Components - Apple-style Asymmetric Layout
 *
 * Three component types:
 * 1. BentoStatLarge - Primary metric (tall, prominent)
 * 2. BentoStatSmall - Secondary metrics (compact)
 * 3. BentoStatProgress - Full-width with progress bar
 */

interface BentoStatLargeProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  color: "blue" | "peach" | "green" | "amber";
}

interface BentoStatSmallProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: "blue" | "peach" | "green" | "amber";
}

interface BentoStatProgressProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  total: number;
  trend?: string;
  color: "blue" | "peach" | "green" | "amber";
}

// Large primary stat - Takes 2 rows
function BentoStatLarge({ icon, value, label, trend, trendDirection = "neutral", color }: BentoStatLargeProps) {
  const iconColors = {
    blue: "text-accent-blue",
    peach: "text-accent-peach",
    green: "text-green-600",
    amber: "text-amber-600",
  };

  const iconBgColors = {
    blue: "bg-accent-blue/10",
    peach: "bg-accent-peach/10",
    green: "bg-green-500/10",
    amber: "bg-amber-500/10",
  };

  const getTrendColor = () => {
    switch (trendDirection) {
      case "up": return "text-green-600";
      case "down": return "text-red-600";
      default: return "text-muted-foreground";
    }
  };

  const TrendIcon = () => {
    const iconClass = "size-3.5";
    switch (trendDirection) {
      case "up": return <TrendingUp className={iconClass} />;
      case "down": return <TrendingUp className={`${iconClass} rotate-180`} />;
      default: return null;
    }
  };

  return (
    <div
      className="h-full rounded-2xl border border-border bg-card p-5
        shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]
        hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.08)]
        transition-all duration-200
        flex flex-col items-center justify-between
        cursor-pointer active:scale-[0.98]"
    >
      {/* Icon at top - centered */}
      <div className={`size-12 rounded-xl ${iconBgColors[color]}
        flex items-center justify-center`}>
        <div className={iconColors[color]}>
          {icon}
        </div>
      </div>

      {/* Value and label - Centered vertically and horizontally */}
      <div className="flex-1 flex flex-col items-center justify-center my-4 text-center">
        <div className="text-4xl font-bold text-foreground leading-none mb-2 tracking-tight">
          {value}
        </div>
        <div className="text-sm text-foreground font-medium">
          {label}
        </div>
      </div>

      {/* Trend at bottom - centered */}
      {trend && (
        <div className={`flex items-center justify-center gap-1.5 text-xs font-medium ${getTrendColor()}`}>
          <TrendIcon />
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}

// Small compact stat
function BentoStatSmall({ icon, value, label, color }: BentoStatSmallProps) {
  const iconColors = {
    blue: "text-accent-blue",
    peach: "text-accent-peach",
    green: "text-green-600",
    amber: "text-amber-600",
  };

  const iconBgColors = {
    blue: "bg-accent-blue/10",
    peach: "bg-accent-peach/10",
    green: "bg-green-500/10",
    amber: "bg-amber-500/10",
  };

  return (
    <div
      className="rounded-2xl border border-border bg-card p-4
        shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]
        hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.08)]
        transition-all duration-200
        flex flex-col items-center justify-center text-center
        cursor-pointer active:scale-[0.98]
        min-h-[100px]"
    >
      {/* Icon - centered */}
      <div className={`size-9 rounded-lg ${iconBgColors[color]}
        flex items-center justify-center mb-2`}>
        <div className={iconColors[color]}>
          {icon}
        </div>
      </div>

      {/* Value - centered */}
      <div className="text-2xl font-bold text-foreground leading-none mb-1">
        {value}
      </div>

      {/* Label - centered */}
      <div className="text-xs text-muted-foreground font-medium">
        {label}
      </div>
    </div>
  );
}

// Full-width stat with progress bar
function BentoStatProgress({ icon, value, label, total, trend, color }: BentoStatProgressProps) {
  const iconColors = {
    blue: "text-accent-blue",
    peach: "text-accent-peach",
    green: "text-green-600",
    amber: "text-amber-600",
  };

  const iconBgColors = {
    blue: "bg-accent-blue/10",
    peach: "bg-accent-peach/10",
    green: "bg-green-500/10",
    amber: "bg-amber-500/10",
  };

  const progressColors = {
    blue: "bg-accent-blue",
    peach: "bg-accent-peach",
    green: "bg-green-500",
    amber: "bg-amber-500",
  };

  const percentage = Math.round((Number(value) / total) * 100);

  return (
    <div
      className="rounded-2xl border border-border bg-card p-4
        shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]
        hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.08)]
        transition-all duration-200
        cursor-pointer active:scale-[0.98]"
    >
      <div className="flex items-center gap-3 mb-3">
        {/* Icon */}
        <div className={`size-10 rounded-lg ${iconBgColors[color]}
          flex items-center justify-center flex-shrink-0`}>
          <div className={iconColors[color]}>
            {icon}
          </div>
        </div>

        {/* Label and value */}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-muted-foreground font-medium mb-0.5">
            {label}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground leading-none">
              {value}
            </span>
            <span className="text-sm text-muted-foreground">
              of {total}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${progressColors[color]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Trend text */}
      {trend && (
        <p className="text-xs text-muted-foreground mt-2">
          {trend}
        </p>
      )}
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
