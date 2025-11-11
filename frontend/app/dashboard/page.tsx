"use client";

/**
 * Dashboard Home Page
 * Main landing page for authenticated users
 * Features:
 * - Welcome message with user's name
 * - Account information card
 * - Quick actions for common tasks
 * - Loading states with Suspense
 * - Brand-consistent styling
 */

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { Suspense } from "react";

function DashboardContent() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          Welcome back, {user?.full_name || "User"}!
        </h1>
        <p className="text-base sm:text-lg text-foreground-muted">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          icon={<FolderOpen className="size-5 text-accent-blue" />}
          label="Active Projects"
          value="3"
          trend="+2 this week"
          bgColor="bg-accent-blue/10"
        />
        <StatCard
          icon={<MessageSquare className="size-5 text-accent-peach" />}
          label="Feedback Received"
          value="24"
          trend="+8 this week"
          bgColor="bg-accent-peach/10"
        />
        <StatCard
          icon={<CheckCircle2 className="size-5 text-green-600" />}
          label="Completed Reviews"
          value="12"
          trend="Last 30 days"
          bgColor="bg-green-50"
        />
        <StatCard
          icon={<Clock className="size-5 text-amber-600" />}
          label="Pending Reviews"
          value="5"
          trend="Awaiting feedback"
          bgColor="bg-amber-50"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Card */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
              Quick Actions
            </h2>
            <Plus className="size-5 text-foreground-muted" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Account Info Card */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-12 rounded-xl bg-gradient-to-br from-accent-blue to-accent-peach flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xl">
                {user?.full_name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">
                Your Account
              </h2>
              <p className="text-sm text-foreground-muted">Account details</p>
            </div>
          </div>

          <div className="space-y-4">
            <InfoRow label="Full Name" value={user?.full_name || "N/A"} />
            <InfoRow label="Email" value={user?.email || "N/A"} />
            <InfoRow
              label="Status"
              value={
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    user?.is_active
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      user?.is_active ? "bg-green-600" : "bg-red-600"
                    }`}
                  />
                  {user?.is_active ? "Active" : "Inactive"}
                </span>
              }
            />
            <InfoRow
              label="Verified"
              value={
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    user?.is_verified
                      ? "bg-blue-50 text-blue-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {user?.is_verified ? (
                    <>
                      <CheckCircle2 className="size-3" />
                      Verified
                    </>
                  ) : (
                    <>
                      <Clock className="size-3" />
                      Not Verified
                    </>
                  )}
                </span>
              }
            />
          </div>

          <Button
            variant="outline"
            className="w-full mt-6 gap-2 min-h-[44px]"
            onClick={() => {
              // Navigate to settings
            }}
          >
            <Settings className="size-4" />
            Account Settings
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
            Recent Activity
          </h2>
          <TrendingUp className="size-5 text-foreground-muted" />
        </div>

        <div className="space-y-4">
          <ActivityItem
            icon={<MessageSquare className="size-4 text-accent-blue" />}
            title="New feedback received"
            description="Your design mockup received 3 new comments"
            time="2 hours ago"
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
        </div>

        <Button variant="outline" className="w-full mt-6 min-h-[44px]">
          View All Activity
        </Button>
      </div>
    </div>
  );
}

// Helper Components

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  bgColor: string;
}

function StatCard({ icon, label, value, trend, bgColor }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`size-10 rounded-xl ${bgColor} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-foreground-muted">{label}</p>
        <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
        <p className="text-xs text-foreground-muted mt-2">{trend}</p>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "accent-blue" | "accent-peach";
}

function ActionButton({ icon, title, description, color }: ActionButtonProps) {
  const colorClasses = {
    "accent-blue": "bg-accent-blue text-white hover:opacity-90",
    "accent-peach": "bg-accent-peach text-white hover:opacity-90",
  };

  return (
    <button
      className="group p-4 rounded-xl border border-border bg-background hover:bg-accent-blue/5 transition-all text-left min-h-[96px] flex flex-col justify-center"
      onClick={() => {
        // Handle navigation
      }}
    >
      <div
        className={`size-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-foreground text-base">{title}</h3>
      <p className="text-sm text-foreground-muted mt-1">{description}</p>
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
      <span className="text-sm text-foreground-muted">{label}</span>
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
}

function ActivityItem({ icon, title, description, time }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-accent-blue/5 transition-colors">
      <div className="size-10 rounded-lg bg-background-subtle flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground text-sm">{title}</h4>
        <p className="text-sm text-foreground-muted mt-0.5">{description}</p>
        <p className="text-xs text-foreground-muted mt-1">{time}</p>
      </div>
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

// Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-10 bg-muted rounded-lg w-64" />
        <div className="h-6 bg-muted rounded-lg w-96" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6 h-32" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-8 h-96" />
        <div className="rounded-2xl border border-border bg-card p-8 h-96" />
      </div>
    </div>
  );
}
