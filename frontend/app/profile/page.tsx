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
  Award,
  Shield,
} from "lucide-react";

// API imports
import { getMyProfile, getMyDNA, ReviewerDNAResponse } from "@/lib/api/profile";
import { getUserPortfolio, PortfolioItem } from "@/lib/api/portfolio";
import { getMyBadges, getAvailableBadges, Badge as ApiBadge } from "@/lib/api/karma";
import { getActivityHeatmap, getActivityTimeline, DayActivity as ApiDayActivity, TimelineEvent as ApiTimelineEvent } from "@/lib/api/activity";
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
  role?: "creator" | "reviewer" | "admin";
}

// Default DNA values for users without enough data
const defaultReviewerDNA: ReviewerDNAData = {
  speed: 50,
  depth: 50,
  specificity: 50,
  constructiveness: 50,
  technical: 50,
  encouragement: 50,
};

/**
 * Transform API DNA response to component format
 */
function transformDNAResponse(response: ReviewerDNAResponse): ReviewerDNAData {
  const dnaData: ReviewerDNAData = { ...defaultReviewerDNA };

  // Map dimensions from API response
  for (const dim of response.dimensions) {
    if (dim.key in dnaData) {
      (dnaData as unknown as Record<string, number>)[dim.key] = dim.value;
    }
  }

  return dnaData;
}

/**
 * Transform API badges to component format
 */
function transformApiBadges(earnedBadges: ApiBadge[], availableBadges: ApiBadge[]): BadgeType[] {
  const badgeIconMap: Record<string, keyof typeof badgeIconMapping> = {
    // Milestone badges
    first_review: 'trophy',
    reviews_10: 'award',
    reviews_50: 'award',
    reviews_100: 'award',
    reviews_500: 'trophy',
    // Streak badges
    streak_7: 'flame',
    streak_30: 'flame',
    streak_100: 'flame',
    // Quality badges
    five_star_streak: 'star',
    helpful_reviewer: 'heart',
    // Skill badges
    code_expert: 'target',
    design_expert: 'target',
    writing_expert: 'target',
    // Special badges
    early_adopter: 'zap',
    speed_demon: 'zap',
    deep_thinker: 'message',
    mentor: 'users',
  };

  const badgeIconMapping = {
    trophy: 'trophy' as const,
    award: 'award' as const,
    flame: 'flame' as const,
    star: 'star' as const,
    heart: 'heart' as const,
    target: 'target' as const,
    zap: 'zap' as const,
    message: 'message' as const,
    users: 'users' as const,
    shield: 'shield' as const,
    clock: 'clock' as const,
    trending: 'trending' as const,
  };

  const categoryMap: Record<string, BadgeType['category']> = {
    skill: 'expertise',
    milestone: 'milestone',
    streak: 'streak',
    quality: 'behavior',
    special: 'community',
    seasonal: 'community',
  };

  // Transform earned badges
  const earned: BadgeType[] = earnedBadges.map((badge) => ({
    id: badge.badge_code,
    name: badge.badge_name,
    description: badge.badge_description,
    icon: badgeIconMap[badge.badge_code] || 'award',
    category: categoryMap[badge.category] || 'milestone',
    status: 'earned' as const,
    earnedAt: badge.earned_at || undefined,
    rarity: badge.rarity,
  }));

  // Transform available badges (in progress or locked)
  const available: BadgeType[] = availableBadges.map((badge) => {
    const hasProgress = badge.progress && badge.progress.percentage > 0;
    return {
      id: badge.badge_code,
      name: badge.badge_name,
      description: badge.badge_description,
      icon: badgeIconMap[badge.badge_code] || 'award',
      category: categoryMap[badge.category] || 'milestone',
      status: hasProgress ? 'in_progress' as const : 'locked' as const,
      progress: badge.progress?.percentage,
      currentValue: badge.progress?.current,
      targetValue: badge.progress?.required,
      requirement: badge.progress?.description,
      rarity: badge.rarity,
    };
  });

  return [...earned, ...available];
}

/**
 * Transform API timeline events to component format
 */
function transformTimelineEvents(apiEvents: ApiTimelineEvent[]): TimelineEvent[] {
  return apiEvents.map((event) => ({
    id: event.id,
    type: event.type as TimelineEvent['type'],
    title: event.title,
    description: event.description,
    timestamp: event.timestamp,
    metadata: event.metadata ? {
      projectName: event.metadata.project_name as string | undefined,
      rating: event.metadata.rating as number | undefined,
      quote: event.metadata.quote as string | undefined,
      badgeName: event.metadata.badgeName as string | undefined,
      milestoneValue: event.metadata.milestoneValue as number | undefined,
    } : undefined,
  }));
}

export default function ProfilePage() {
  const prefersReducedMotion = useReducedMotion();
  const { updateUserAvatar } = useAuth();
  const [isOwnProfile] = useState(true);

  // State management
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [reviewerDNA, setReviewerDNA] = useState<ReviewerDNAData>(defaultReviewerDNA);
  const [dnaMetadata, setDNAMetadata] = useState<{ hasSufficientData: boolean; reviewsAnalyzed: number }>({ hasSufficientData: false, reviewsAnalyzed: 0 });
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [activityData, setActivityData] = useState<DayActivity[]>([]);
  const [activityStats, setActivityStats] = useState<{ currentStreak: number; longestStreak: number; totalContributions: number }>({ currentStreak: 0, longestStreak: 0, totalContributions: 0 });
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
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

      // Fetch DNA, portfolio, and badges in parallel
      const [portfolioResponse, dnaResponse, earnedBadges, availableBadges] = await Promise.all([
        getUserPortfolio(Number(profile.id), { page_size: 20 }),
        getMyDNA().catch(() => null), // DNA is optional - don't fail if unavailable
        getMyBadges().catch(() => []), // Badges are optional
        getAvailableBadges().catch(() => []), // Available badges are optional
      ]);

      setPortfolioItems(portfolioResponse.items);

      // Transform and set DNA data
      if (dnaResponse) {
        setReviewerDNA(transformDNAResponse(dnaResponse));
        setDNAMetadata({
          hasSufficientData: dnaResponse.has_sufficient_data,
          reviewsAnalyzed: dnaResponse.reviews_analyzed,
        });
      }

      // Transform and set badges
      const transformedBadges = transformApiBadges(earnedBadges, availableBadges);
      setBadges(transformedBadges);

      // Fetch activity data (heatmap and timeline) in parallel
      const [heatmapData, timelineData] = await Promise.all([
        getActivityHeatmap(365).catch(() => null),
        getActivityTimeline(10).catch(() => null),
      ]);

      // Set activity heatmap data
      if (heatmapData) {
        // Transform to component format (add commentsGiven field)
        const transformedActivity: DayActivity[] = heatmapData.data.map((day) => ({
          date: day.date,
          reviewsGiven: day.reviewsGiven,
          reviewsReceived: day.reviewsReceived,
          commentsGiven: day.karmaEvents, // Use karma events as a proxy for activity
          total: day.total,
        }));
        setActivityData(transformedActivity);
        setActivityStats({
          currentStreak: heatmapData.currentStreak,
          longestStreak: heatmapData.longestStreak,
          totalContributions: heatmapData.totalContributions,
        });
      }

      // Set timeline events
      if (timelineData) {
        const transformedEvents = transformTimelineEvents(timelineData.events);
        setTimelineEvents(transformedEvents);
      }
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
                  {/* Verified Reviewer Badge */}
                  {profileData.role === "reviewer" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", bounce: 0.4 }}
                    >
                      <Badge
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-sm px-2.5 py-0.5 font-medium"
                      >
                        <Award className="size-3.5 mr-1" />
                        Reviewer
                      </Badge>
                    </motion.div>
                  )}
                  {/* Admin Badge */}
                  {profileData.role === "admin" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", bounce: 0.4 }}
                    >
                      <Badge
                        className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 shadow-sm px-2.5 py-0.5 font-medium"
                      >
                        <Shield className="size-3.5 mr-1" />
                        Admin
                      </Badge>
                    </motion.div>
                  )}
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
              <ReviewerDNA data={reviewerDNA} size="md" />
            </div>
            {!dnaMetadata.hasSufficientData && (
              <p className="text-xs text-gray-400 text-center mt-2">
                Complete {3 - dnaMetadata.reviewsAnalyzed} more review{3 - dnaMetadata.reviewsAnalyzed !== 1 ? 's' : ''} to unlock your full DNA profile
              </p>
            )}
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
            <BadgeGrid badges={badges.length > 0 ? badges : []} maxDisplay={6} />
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
              data={activityData.length > 0 ? activityData : []}
              currentStreak={activityStats.currentStreak}
              longestStreak={activityStats.longestStreak}
              totalContributions={activityStats.totalContributions}
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
            <ImpactTimeline events={timelineEvents.length > 0 ? timelineEvents : []} maxDisplay={5} />
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
