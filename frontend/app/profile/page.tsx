"use client";

/**
 * Profile Page - Premium Redesign
 *
 * A unique, distinctive profile that sets Critvue apart with:
 * - Reviewer DNA radar chart (unique fingerprint visualization)
 * - Bento grid layout with visual hierarchy
 * - Progressive badge system with locked/in-progress states
 * - Contextual stats with percentiles and trends
 * - Dual-track activity heatmap
 * - Impact timeline with rich storytelling
 *
 * Mobile-responsive (375px → 2xl)
 * WCAG 2.1 Level AA compliant
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Star,
  CheckCircle2,
  Clock,
  MessageSquare,
  Code,
  Pencil,
  Share2,
  Mail,
  ArrowRight,
  Sparkles,
} from "lucide-react";

// API imports
import { getMyProfile } from "@/lib/api/profile";
import { getUserPortfolio, PortfolioItem } from "@/lib/api/portfolio";
import { ApiClientError } from "@/lib/api/client";

// Component imports
import { ProfilePageSkeleton } from "@/components/profile/profile-skeleton";
import {
  ProfileLoadError,
  ProfileNotFoundError,
  AuthenticationRequiredError,
  NetworkError,
  EmptyPortfolioState,
} from "@/components/profile/error-states";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { useAuth } from "@/contexts/AuthContext";
import { TierBadge } from "@/components/tier/tier-badge";
import { UserTier } from "@/lib/types/tier";

// New premium components
import { ReviewerDNA, ReviewerDNAData } from "@/components/profile/reviewer-dna";
import { BadgeGrid, Badge as BadgeType } from "@/components/profile/progressive-badge";
import { ActivityHeatmap, DayActivity } from "@/components/profile/activity-heatmap";
import { ContextualStatCard } from "@/components/profile/contextual-stat-card";
import { ImpactTimeline, TimelineEvent } from "@/components/profile/impact-timeline";

interface ProfileData {
  id: string;
  username: string;
  full_name: string;
  title: string;
  bio: string;
  avatar_url?: string;
  rating: number;
  total_reviews_given: number;
  total_reviews_received: number;
  avg_response_time_hours: number;
  member_since: string;
  verified: boolean;
  badges: string[];
  specialty_tags: string[];
  user_tier: string;
  karma_points: number;
  tier_achieved_at?: string;
}

// Mock data for new components (replace with real API data)
const mockReviewerDNA: ReviewerDNAData = {
  speed: 85,
  depth: 72,
  specificity: 90,
  constructiveness: 88,
  technical: 76,
  encouragement: 94,
};

const mockBadges: BadgeType[] = [
  { id: '1', name: 'First Review', description: 'Completed your first review', icon: 'trophy', category: 'milestone', status: 'earned', earnedAt: '2024-01-15', rarity: 'common' },
  { id: '2', name: 'Speed Demon', description: 'Complete 10 reviews in under 24 hours', icon: 'zap', category: 'behavior', status: 'earned', earnedAt: '2024-02-20', rarity: 'uncommon' },
  { id: '3', name: 'Century Club', description: 'Complete 100 reviews', icon: 'award', category: 'milestone', status: 'in_progress', progress: 67, currentValue: 67, targetValue: 100 },
  { id: '4', name: 'Deep Thinker', description: 'Average 500+ words per review', icon: 'message', category: 'behavior', status: 'in_progress', progress: 45, currentValue: 225, targetValue: 500 },
  { id: '5', name: 'Mentor', description: 'Help 10 new reviewers', icon: 'users', category: 'community', status: 'locked', requirement: 'Help 10 newcomers' },
  { id: '6', name: 'Code Expert', description: 'Earn expertise in code reviews', icon: 'target', category: 'expertise', status: 'earned', earnedAt: '2024-03-10', rarity: 'rare' },
];

const mockActivityData: DayActivity[] = (() => {
  const data: DayActivity[] = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const hasActivity = Math.random() > 0.4;
    const reviewsGiven = hasActivity ? Math.floor(Math.random() * 5) : 0;
    const reviewsReceived = hasActivity ? Math.floor(Math.random() * 3) : 0;
    const commentsGiven = hasActivity ? Math.floor(Math.random() * 8) : 0;
    const dateStr = date.toISOString().split('T')[0] ?? '';
    data.push({
      date: dateStr,
      reviewsGiven,
      reviewsReceived,
      commentsGiven,
      total: reviewsGiven + reviewsReceived + commentsGiven,
    });
  }
  return data;
})();

const mockTimelineEvents: TimelineEvent[] = [
  { id: '1', type: 'review_given', title: 'Reviewed "Dashboard Redesign"', description: 'Provided detailed feedback on UI/UX improvements', timestamp: new Date().toISOString(), metadata: { projectName: 'Dashboard Redesign', rating: 5, quote: 'Exceptional attention to detail!' } },
  { id: '2', type: 'badge_earned', title: 'Earned "Speed Demon" badge', description: 'Completed 10 reviews in under 24 hours', timestamp: new Date(Date.now() - 86400000).toISOString(), metadata: { badgeName: 'Speed Demon' } },
  { id: '3', type: 'milestone', title: 'Reached 50 reviews!', timestamp: new Date(Date.now() - 172800000).toISOString(), metadata: { milestoneValue: 50 } },
  { id: '4', type: 'rating', title: 'Received 5-star rating', description: 'For review on E-commerce App', timestamp: new Date(Date.now() - 259200000).toISOString(), metadata: { rating: 5, projectName: 'E-commerce App' } },
  { id: '5', type: 'review_given', title: 'Reviewed "Portfolio Website"', timestamp: new Date(Date.now() - 345600000).toISOString(), metadata: { projectName: 'Portfolio Website' } },
];

export default function ProfilePage() {
  const prefersReducedMotion = useReducedMotion();
  const { updateUserAvatar } = useAuth();
  const [isOwnProfile] = useState(true);

  // State management
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    type: "not_found" | "auth_required" | "network" | "server" | "unknown";
    message: string;
  } | null>(null);

  // Load profile data on mount
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      const profile = await getMyProfile();
      setProfileData(profile);

      const portfolioResponse = await getUserPortfolio(Number(profile.id), { page_size: 20 });
      setPortfolioItems(portfolioResponse.items);
    } catch (err) {
      console.error("Profile load error:", err);

      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          setError({ type: "auth_required", message: "Authentication required" });
        } else if (err.status === 404) {
          setError({ type: "not_found", message: "Profile not found" });
        } else if (err.status >= 500) {
          setError({ type: "server", message: "Server error occurred" });
        } else {
          setError({ type: "unknown", message: err.message || "Failed to load profile" });
        }
      } else if (err instanceof Error && err.message === "Failed to fetch") {
        setError({ type: "network", message: "Network connection error" });
      } else {
        setError({ type: "unknown", message: "An unexpected error occurred" });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ProfilePageSkeleton />;

  if (error) {
    switch (error.type) {
      case "auth_required": return <AuthenticationRequiredError />;
      case "not_found": return <ProfileNotFoundError onRetry={loadProfileData} />;
      case "network": return <NetworkError onRetry={loadProfileData} />;
      default: return <ProfileLoadError onRetry={loadProfileData} />;
    }
  }

  if (!profileData) return <ProfileLoadError onRetry={loadProfileData} />;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Section - Compact & Modern */}
      <section className="relative bg-white border-b border-gray-200/60">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/30" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Left: Avatar + Basic Info */}
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <motion.div
                className="shrink-0"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
              >
                <div className="relative">
                  {isOwnProfile ? (
                    <AvatarUpload
                      currentAvatarUrl={profileData.avatar_url}
                      onUploadComplete={(newAvatarUrl) => {
                        setProfileData((prev) => prev ? { ...prev, avatar_url: newAvatarUrl } : prev);
                        updateUserAvatar(newAvatarUrl);
                      }}
                      onUploadError={(error) => console.error("Avatar upload error:", error)}
                    />
                  ) : (
                    <>
                      {profileData.avatar_url ? (
                        <img
                          src={profileData.avatar_url}
                          alt={profileData.full_name}
                          className="size-20 sm:size-24 rounded-2xl border-2 border-white shadow-lg object-cover"
                        />
                      ) : (
                        <div className="size-20 sm:size-24 rounded-2xl border-2 border-white shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <User className="size-10 sm:size-12 text-white" />
                        </div>
                      )}
                    </>
                  )}

                  {profileData.verified && (
                    <motion.div
                      className="absolute -bottom-1 -right-1 size-7 rounded-full bg-blue-500 border-2 border-white shadow flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                    >
                      <CheckCircle2 className="size-4 text-white" />
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Name & Title */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                    {profileData.full_name}
                  </h1>
                  <TierBadge
                    tier={profileData.user_tier as UserTier}
                    size="sm"
                    showName={true}
                  />
                </div>
                <p className="text-sm text-gray-600 mb-2">{profileData.title}</p>

                {/* Quick stats row */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={cn(
                            "size-3.5",
                            i <= Math.floor(profileData.rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          )}
                        />
                      ))}
                    </div>
                    <span className="font-semibold text-gray-900">{profileData.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-600">
                    <span className="font-semibold text-gray-900">{profileData.total_reviews_given}</span> reviews
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-600">
                    <span className="font-semibold text-gray-900">{profileData.karma_points}</span> karma
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-start gap-2 lg:ml-auto">
              {isOwnProfile ? (
                <>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Pencil className="size-4" />
                    Edit Profile
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="size-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                    Request Review
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="size-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content - Bento Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-12 gap-4 sm:gap-6">

          {/* Row 1: Reviewer DNA (Hero) + Stats */}
          {/* Reviewer DNA - Large Card */}
          <motion.div
            className="col-span-12 lg:col-span-5 bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Reviewer DNA</h2>
                <p className="text-sm text-gray-500">Your unique review fingerprint</p>
              </div>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                <Sparkles className="size-4 mr-1" />
                Share
              </Button>
            </div>
            <div className="flex justify-center">
              <ReviewerDNA data={mockReviewerDNA} size="md" />
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="col-span-12 lg:col-span-7 grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <ContextualStatCard
                label="Reviews Given"
                value={profileData.total_reviews_given}
                icon={<MessageSquare className="size-6 text-white" />}
                iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
                trend={{ value: 23, direction: 'up', label: 'from last month' }}
                percentile={92}
                comparison="Top 8% of reviewers"
                sparklineData={[12, 19, 15, 25, 22, 30, 28, 35, 32, 40, 38, 45]}
                size="md"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ContextualStatCard
                label="Karma Points"
                value={profileData.karma_points}
                icon={<Star className="size-6 text-white" />}
                iconBg="bg-gradient-to-br from-purple-500 to-indigo-600"
                trend={{ value: 15, direction: 'up' }}
                percentile={78}
                sparklineData={[100, 120, 115, 140, 135, 160, 155, 180, 175, 200]}
                size="md"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <ContextualStatCard
                label="Avg Rating"
                value={profileData.rating}
                suffix=""
                icon={<Star className="size-6 text-white fill-white" />}
                iconBg="bg-gradient-to-br from-amber-400 to-amber-600"
                percentile={85}
                comparison="Above platform average"
                size="md"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ContextualStatCard
                label="Avg Response"
                value={profileData.avg_response_time_hours}
                suffix="h"
                icon={<Clock className="size-6 text-white" />}
                iconBg="bg-gradient-to-br from-green-500 to-emerald-600"
                trend={{ value: 12, direction: 'down', label: 'faster than last month' }}
                percentile={88}
                comparison="Faster than 88% of peers"
                size="md"
              />
            </motion.div>
          </div>

          {/* Row 2: Badges + Bio */}
          {/* Badges Section */}
          <motion.div
            className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Achievements</h2>
                <p className="text-sm text-gray-500">Your journey and progress</p>
              </div>
              <Link href="/dashboard/karma">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  View All
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              </Link>
            </div>
            <BadgeGrid badges={mockBadges} maxDisplay={6} />
          </motion.div>

          {/* Bio & Skills Card */}
          <motion.div
            className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              {profileData.bio || "No bio yet. Tell the world about yourself!"}
            </p>

            {/* Skills */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Code className="size-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Skills & Expertise
                </span>
              </div>
              {profileData.specialty_tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profileData.specialty_tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      size="sm"
                      className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : isOwnProfile ? (
                <Link href="/browse">
                  <Button variant="outline" size="sm" className="w-full text-gray-600">
                    Add your skills
                  </Button>
                </Link>
              ) : (
                <p className="text-sm text-gray-400">No skills listed</p>
              )}
            </div>

            {/* Member since */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Member since {new Date(profileData.member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </motion.div>

          {/* Row 3: Activity Heatmap */}
          <motion.div
            className="col-span-12 bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Activity</h2>
                <p className="text-sm text-gray-500">Your contribution history</p>
              </div>
            </div>
            <ActivityHeatmap
              data={mockActivityData}
              currentStreak={12}
              longestStreak={34}
              totalContributions={mockActivityData.reduce((sum, d) => sum + d.total, 0)}
            />
          </motion.div>

          {/* Row 4: Timeline + Portfolio Preview */}
          {/* Timeline */}
          <motion.div
            className="col-span-12 lg:col-span-5 bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <ImpactTimeline events={mockTimelineEvents} maxDisplay={5} />
          </motion.div>

          {/* Portfolio Preview */}
          <motion.div
            className="col-span-12 lg:col-span-7 bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Portfolio</h2>
                <p className="text-sm text-gray-500">Recent work and projects</p>
              </div>
              {isOwnProfile && (
                <Button variant="outline" size="sm" className="gap-2">
                  <Pencil className="size-4" />
                  Add Project
                </Button>
              )}
            </div>

            {portfolioItems.length === 0 ? (
              <EmptyPortfolioState isOwnProfile={isOwnProfile} />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {portfolioItems.slice(0, 6).map((item, index) => (
                  <motion.div
                    key={item.id}
                    className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer bg-gray-100"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => item.project_url && window.open(item.project_url, "_blank")}
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Code className="size-8 text-gray-300" />
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm font-medium truncate">{item.title}</p>
                      <Badge variant="info" size="sm" className="mt-1 capitalize text-[10px]">
                        {item.content_type}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {portfolioItems.length > 6 && (
              <Button variant="ghost" className="w-full mt-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                View all {portfolioItems.length} projects
                <ArrowRight className="size-4 ml-2" />
              </Button>
            )}
          </motion.div>

        </div>
      </main>
    </div>
  );
}
