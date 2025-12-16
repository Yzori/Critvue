"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  Activity,
  Award,
  Swords,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { adminUsersApi, AdminStats } from "@/lib/api/admin/users";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

function StatCard({ title, value, change, changeLabel, icon: Icon, color, bgColor }: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <Card className="bg-background border-border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
            {change !== undefined && changeLabel && (
              <div className="flex items-center gap-1 mt-2">
                {isPositive ? (
                  <ArrowUp className="h-3 w-3 text-green-500" />
                ) : isNegative ? (
                  <ArrowDown className="h-3 w-3 text-red-500" />
                ) : (
                  <Minus className="h-3 w-3 text-muted-foreground" />
                )}
                <span className={cn(
                  "text-xs font-medium",
                  isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-muted-foreground"
                )}>
                  {isPositive && "+"}{change}
                </span>
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              </div>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", bgColor)}>
            <Icon className={cn("h-6 w-6", color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ChartBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

function ChartBar({ label, value, maxValue, color }: ChartBarProps) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-16 shrink-0">{label}</span>
      <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
      <span className="text-sm font-medium text-foreground w-12 text-right">{value}</span>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("overview");

  // Mock data for charts (would be fetched from API in production)
  const [weeklyData] = React.useState({
    users: [12, 18, 15, 22, 28, 25, 30],
    reviews: [45, 52, 48, 63, 71, 68, 75],
    challenges: [2, 3, 1, 4, 3, 5, 4],
  });

  const [roleDistribution] = React.useState({
    creators: 245,
    reviewers: 89,
    admins: 5,
  });

  const [tierDistribution] = React.useState({
    novice: 120,
    contributor: 85,
    skilled: 62,
    trusted_advisor: 41,
    expert: 23,
    master: 8,
  });

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await adminUsersApi.getStats();
        setStats(data);
      } catch {
        // Failed to fetch stats - silent fail
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Platform metrics and insights</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Total Users"
              value={stats?.total_users?.toLocaleString() || "0"}
              change={stats?.new_users_this_week || 0}
              changeLabel="this week"
              icon={Users}
              color="text-blue-600"
              bgColor="bg-blue-100"
            />
            <StatCard
              title="Active Today"
              value={stats?.active_users_today?.toLocaleString() || "0"}
              icon={Activity}
              color="text-green-600"
              bgColor="bg-green-100"
            />
            <StatCard
              title="Total Reviews"
              value={stats?.total_reviews?.toLocaleString() || "0"}
              icon={Award}
              color="text-purple-600"
              bgColor="bg-purple-100"
            />
            <StatCard
              title="Active Challenges"
              value={stats?.active_challenges?.toLocaleString() || "0"}
              icon={Swords}
              color="text-amber-600"
              bgColor="bg-amber-100"
            />
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#4CC9F0] data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-[#4CC9F0] data-[state=active]:text-white">
            Users
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-[#4CC9F0] data-[state=active]:text-white">
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Activity Chart */}
            <Card className="bg-background border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Weekly Activity</CardTitle>
                <CardDescription>New users and reviews this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">New Users</span>
                      <Badge className="bg-blue-100 text-blue-700">
                        {weeklyData.users.reduce((a, b) => a + b, 0)} total
                      </Badge>
                    </div>
                    <div className="flex items-end gap-1 h-24">
                      {weeklyData.users.map((value, index) => {
                        const maxValue = Math.max(...weeklyData.users);
                        const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-1">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${height}%` }}
                              transition={{ delay: index * 0.05, duration: 0.3 }}
                              className="w-full bg-blue-500 rounded-t"
                            />
                            <span className="text-xs text-muted-foreground">{dayLabels[index]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Reviews Completed</span>
                      <Badge className="bg-purple-100 text-purple-700">
                        {weeklyData.reviews.reduce((a, b) => a + b, 0)} total
                      </Badge>
                    </div>
                    <div className="flex items-end gap-1 h-24">
                      {weeklyData.reviews.map((value, index) => {
                        const maxValue = Math.max(...weeklyData.reviews);
                        const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-1">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${height}%` }}
                              transition={{ delay: index * 0.05, duration: 0.3 }}
                              className="w-full bg-purple-500 rounded-t"
                            />
                            <span className="text-xs text-muted-foreground">{dayLabels[index]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Application Stats */}
            <Card className="bg-background border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Applications This Month</CardTitle>
                <CardDescription>Expert reviewer application status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-amber-600" />
                      <span className="text-sm font-medium text-amber-700">Pending</span>
                    </div>
                    <p className="text-3xl font-bold text-amber-900">
                      {stats?.pending_applications || 0}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Approved</span>
                    </div>
                    <p className="text-3xl font-bold text-green-900">
                      {stats?.approved_this_month || 0}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-medium text-red-700">Rejected</span>
                    </div>
                    <p className="text-3xl font-bold text-red-900">
                      {stats?.rejected_this_month || 0}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Avg Review</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-900">
                      {stats?.avg_review_time_days?.toFixed(1) || 0}d
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Role Distribution */}
            <Card className="bg-background border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">User Roles</CardTitle>
                <CardDescription>Distribution of user roles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ChartBar
                  label="Creators"
                  value={roleDistribution.creators}
                  maxValue={Math.max(...Object.values(roleDistribution))}
                  color="bg-blue-500"
                />
                <ChartBar
                  label="Reviewers"
                  value={roleDistribution.reviewers}
                  maxValue={Math.max(...Object.values(roleDistribution))}
                  color="bg-purple-500"
                />
                <ChartBar
                  label="Admins"
                  value={roleDistribution.admins}
                  maxValue={Math.max(...Object.values(roleDistribution))}
                  color="bg-red-500"
                />
              </CardContent>
            </Card>

            {/* Tier Distribution */}
            <Card className="bg-background border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">User Tiers</CardTitle>
                <CardDescription>Distribution by tier level</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ChartBar
                  label="Novice"
                  value={tierDistribution.novice}
                  maxValue={Math.max(...Object.values(tierDistribution))}
                  color="bg-gray-400"
                />
                <ChartBar
                  label="Contributor"
                  value={tierDistribution.contributor}
                  maxValue={Math.max(...Object.values(tierDistribution))}
                  color="bg-green-500"
                />
                <ChartBar
                  label="Skilled"
                  value={tierDistribution.skilled}
                  maxValue={Math.max(...Object.values(tierDistribution))}
                  color="bg-blue-500"
                />
                <ChartBar
                  label="Trusted"
                  value={tierDistribution.trusted_advisor}
                  maxValue={Math.max(...Object.values(tierDistribution))}
                  color="bg-purple-500"
                />
                <ChartBar
                  label="Expert"
                  value={tierDistribution.expert}
                  maxValue={Math.max(...Object.values(tierDistribution))}
                  color="bg-amber-500"
                />
                <ChartBar
                  label="Master"
                  value={tierDistribution.master}
                  maxValue={Math.max(...Object.values(tierDistribution))}
                  color="bg-orange-500"
                />
              </CardContent>
            </Card>

            {/* Moderation Stats */}
            <Card className="bg-background border-border shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Moderation Overview</CardTitle>
                <CardDescription>User status and moderation metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-xl bg-muted">
                    <p className="text-3xl font-bold text-foreground">{stats?.total_reviewers || 0}</p>
                    <p className="text-sm text-muted-foreground mt-1">Active Reviewers</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-muted">
                    <p className="text-3xl font-bold text-foreground">{stats?.total_admins || 0}</p>
                    <p className="text-sm text-muted-foreground mt-1">Admins</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-red-50">
                    <p className="text-3xl font-bold text-red-600">{stats?.banned_users || 0}</p>
                    <p className="text-sm text-red-500 mt-1">Banned Users</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-amber-50">
                    <p className="text-3xl font-bold text-amber-600">{stats?.suspended_users || 0}</p>
                    <p className="text-sm text-amber-500 mt-1">Suspended Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Challenge Stats */}
            <Card className="bg-background border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Challenge Activity</CardTitle>
                <CardDescription>Weekly challenge creation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 h-32 mb-4">
                  {weeklyData.challenges.map((value, index) => {
                    const maxValue = Math.max(...weeklyData.challenges);
                    const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-1">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                          className="w-full bg-amber-500 rounded-t"
                        />
                        <span className="text-xs text-muted-foreground">{dayLabels[index]}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">Total this week</span>
                  <Badge className="bg-amber-100 text-amber-700">
                    {weeklyData.challenges.reduce((a, b) => a + b, 0)} challenges
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-background border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
                <CardDescription>Key metrics at a glance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-5 w-5 text-blue-500" />
                    <span className="text-sm text-foreground">New users this week</span>
                  </div>
                  <span className="font-semibold text-foreground">{stats?.new_users_this_week || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-foreground">Active users today</span>
                  </div>
                  <span className="font-semibold text-foreground">{stats?.active_users_today || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-purple-500" />
                    <span className="text-sm text-foreground">Total reviews completed</span>
                  </div>
                  <span className="font-semibold text-foreground">{stats?.total_reviews || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <Swords className="h-5 w-5 text-amber-500" />
                    <span className="text-sm text-foreground">Active challenges</span>
                  </div>
                  <span className="font-semibold text-foreground">{stats?.active_challenges || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
