"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  FileText,
  Swords,
  UserCog,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Activity,
  Star,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCard {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface RecentActivity {
  id: number;
  type: "user_joined" | "application_approved" | "application_rejected" | "challenge_created" | "user_banned";
  message: string;
  timestamp: string;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<{
    totalUsers: number;
    newUsersThisWeek: number;
    pendingApplications: number;
    approvedThisMonth: number;
    rejectedThisMonth: number;
    activeChallenges: number;
    totalReviews: number;
    avgResponseTime: number;
  } | null>(null);
  const [recentActivity, setRecentActivity] = React.useState<RecentActivity[]>([]);

  // Fetch dashboard data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch committee stats
        const statsResponse = await fetch("/api/v1/admin/applications/stats", {
          credentials: "include",
        });

        if (statsResponse.ok) {
          const data = await statsResponse.json();
          setStats({
            totalUsers: data.total_users || 0,
            newUsersThisWeek: data.new_users_this_week || 0,
            pendingApplications: data.pending_applications || 0,
            approvedThisMonth: data.approved_this_month || 0,
            rejectedThisMonth: data.rejected_this_month || 0,
            activeChallenges: data.active_challenges || 0,
            totalReviews: data.total_reviews || 0,
            avgResponseTime: data.avg_review_time_days || 0,
          });
        }

        // Mock recent activity for now
        setRecentActivity([
          { id: 1, type: "user_joined", message: "New user registered: john@example.com", timestamp: "5 min ago" },
          { id: 2, type: "application_approved", message: "Application #APP-2024-0042 approved", timestamp: "12 min ago" },
          { id: 3, type: "challenge_created", message: "New challenge created: Design Sprint #5", timestamp: "1 hour ago" },
          { id: 4, type: "application_rejected", message: "Application #APP-2024-0041 rejected", timestamp: "2 hours ago" },
          { id: 5, type: "user_joined", message: "New user registered: sarah@example.com", timestamp: "3 hours ago" },
        ]);
      } catch {
        // Failed to fetch dashboard data - silent fail
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards: StatCard[] = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      change: stats?.newUsersThisWeek || 0,
      changeLabel: "new this week",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Pending Applications",
      value: stats?.pendingApplications || 0,
      icon: FileText,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Active Challenges",
      value: stats?.activeChallenges || 0,
      icon: Swords,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Avg Response Time",
      value: `${stats?.avgResponseTime || 0}d`,
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ];

  const quickActions: QuickAction[] = [
    {
      label: "Review Applications",
      description: "Review pending expert applications",
      href: "/admin/applications",
      icon: FileText,
      badge: stats?.pendingApplications ? `${stats.pendingApplications} pending` : undefined,
      badgeColor: "bg-amber-100 text-amber-700",
    },
    {
      label: "Manage Users",
      description: "View, edit, and moderate users",
      href: "/admin/users",
      icon: Users,
    },
    {
      label: "Manage Challenges",
      description: "Create and manage challenges",
      href: "/admin/challenges",
      icon: Swords,
    },
    {
      label: "Committee Members",
      description: "Manage review committee",
      href: "/admin/committee",
      icon: UserCog,
    },
  ];

  const getActivityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "user_joined":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "application_approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "application_rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "challenge_created":
        return <Swords className="h-4 w-4 text-purple-500" />;
      case "user_banned":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of platform activity and quick actions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </>
        ) : (
          statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-background border-border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                        {stat.change !== undefined && stat.changeLabel && (
                          <div className="flex items-center gap-1 mt-2">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-green-600">+{stat.change}</span>
                            <span className="text-xs text-muted-foreground">{stat.changeLabel}</span>
                          </div>
                        )}
                      </div>
                      <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                        <Icon className={cn("h-6 w-6", stat.color)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card className="bg-background border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="group flex items-start gap-4 p-4 rounded-xl border border-border hover:border-[#4CC9F0] hover:bg-[#4CC9F0]/5 transition-all"
                    >
                      <div className="p-2 rounded-lg bg-muted group-hover:bg-[#4CC9F0]/10 transition-colors">
                        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-[#4CC9F0]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground group-hover:text-[#4CC9F0]">
                            {action.label}
                          </h3>
                          {action.badge && (
                            <Badge className={cn("text-xs", action.badgeColor)}>
                              {action.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{action.description}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-[#4CC9F0] transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card className="bg-background border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Latest platform events</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      <div className="p-1.5 rounded-full bg-muted">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground line-clamp-2">{activity.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="ghost" className="w-full mt-4 text-[#4CC9F0]" asChild>
                <Link href="/admin/moderation/audit">
                  View All Activity
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-background border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved This Month</p>
                <p className="text-2xl font-bold text-foreground">{stats?.approvedThisMonth || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected This Month</p>
                <p className="text-2xl font-bold text-foreground">{stats?.rejectedThisMonth || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#4CC9F0]/10">
                <Star className="h-6 w-6 text-[#4CC9F0]" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
                <p className="text-2xl font-bold text-foreground">{stats?.totalReviews || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
