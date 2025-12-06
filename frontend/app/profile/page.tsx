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
import { getFileUrl } from "@/lib/api/client";
import { getMyBadges, getAvailableBadges, Badge as ApiBadge } from "@/lib/api/karma";
import { getActivityHeatmap, getActivityTimeline, getEnhancedStats, TimelineEvent as ApiTimelineEvent, EnhancedStatsResponse } from "@/lib/api/activity";
import { ApiClientError } from "@/lib/api/client";

// Component imports
import { ProfilePageSkeleton } from "@/components/profile/profile-skeleton";
import {
  ProfileLoadError,
  ProfileNotFoundError,
  AuthenticationRequiredError,
  NetworkError,
} from "@/components/profile/error-states";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { useAuth } from "@/contexts/AuthContext";
import { TierBadge } from "@/components/tier/tier-badge";
import { UserTier, getTierInfo } from "@/lib/types/tier";

// New premium components
import { ReviewerDNA, ReviewerDNAData } from "@/components/profile/reviewer-dna";
import { BadgeGrid, Badge as BadgeType } from "@/components/profile/progressive-badge";
import { ActivityHeatmap, DayActivity } from "@/components/profile/activity-heatmap";
import { ContextualStatCard } from "@/components/profile/contextual-stat-card";
import { ImpactTimeline, TimelineEvent } from "@/components/profile/impact-timeline";
import { SkillsModal } from "@/components/browse/skills-modal";
import { SelectFeaturedModal } from "@/components/profile/select-featured-modal";

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
  const [featuredItems, setFeaturedItems] = useState<PortfolioItem[]>([]);
  const [selectFeaturedModalOpen, setSelectFeaturedModalOpen] = useState(false);
  const [reviewerDNA, setReviewerDNA] = useState<ReviewerDNAData>(defaultReviewerDNA);
  const [dnaMetadata, setDNAMetadata] = useState<{ hasSufficientData: boolean; reviewsAnalyzed: number }>({ hasSufficientData: false, reviewsAnalyzed: 0 });
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [activityData, setActivityData] = useState<DayActivity[]>([]);
  const [activityStats, setActivityStats] = useState<{ currentStreak: number; longestStreak: number; totalContributions: number }>({ currentStreak: 0, longestStreak: 0, totalContributions: 0 });
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [enhancedStats, setEnhancedStats] = useState<EnhancedStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    type: "not_found" | "auth_required" | "network" | "server" | "unknown";
    message: string;
  } | null>(null);
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);

  // Handle skills update from modal
  const handleSkillsUpdated = (newSkills: string[]) => {
    if (profileData) {
      setProfileData({ ...profileData, specialty_tags: newSkills });
    }
  };

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
      // Extract featured items from portfolio
      setFeaturedItems(portfolioResponse.items.filter((item) => item.is_featured));

      // Transform and set DNA data
      if (dnaResponse) {
        setReviewerDNA(transformDNAResponse(dnaResponse));
        setDNAMetadata({
          hasSufficientData: dnaResponse.has_sufficient_data,
          reviewsAnalyzed: dnaResponse.reviews_analyzed,
        });
      }

      // Transform and set badges, including tier badge
      const transformedBadges = transformApiBadges(earnedBadges, availableBadges);

      // Create tier badge from user's current tier
      const tierInfo = getTierInfo(profile.user_tier as UserTier);
      const tierBadge: BadgeType = {
        id: 'tier-badge',
        name: tierInfo.name,
        description: tierInfo.description,
        icon: 'award',
        imageUrl: tierInfo.badgeImage,
        category: 'tier',
        status: 'earned',
        rarity: profile.user_tier === 'master' ? 'legendary' :
                profile.user_tier === 'expert' ? 'epic' :
                profile.user_tier === 'trusted_advisor' ? 'rare' :
                profile.user_tier === 'skilled' ? 'uncommon' : 'common',
      };

      // Add tier badge at the beginning
      setBadges([tierBadge, ...transformedBadges]);

      // Fetch activity data (heatmap, timeline, enhanced stats) in parallel
      const [heatmapData, timelineData, enhancedStatsData] = await Promise.all([
        getActivityHeatmap(365).catch(() => null),
        getActivityTimeline(10).catch(() => null),
        getEnhancedStats().catch(() => null),
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

      // Set enhanced stats
      if (enhancedStatsData) {
        setEnhancedStats(enhancedStatsData);
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
    <div className="min-h-screen bg-muted/50">
      {/* Hero Section - Compact & Modern */}
      <section className="relative bg-background border-b border-border/60">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/30 dark:from-blue-950/30 dark:via-transparent dark:to-purple-950/20" />

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
                          className="size-20 sm:size-24 rounded-2xl border-2 border-background shadow-lg object-cover"
                        />
                      ) : (
                        <div className="size-20 sm:size-24 rounded-2xl border-2 border-background shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <User className="size-10 sm:size-12 text-white" />
                        </div>
                      )}
                    </>
                  )}

                  {profileData.verified && (
                    <motion.div
                      className="absolute -bottom-1 -right-1 size-7 rounded-full bg-blue-500 border-2 border-background shadow flex items-center justify-center"
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
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                    {profileData.full_name}
                  </h1>
                  <TierBadge
                    tier={profileData.user_tier as UserTier}
                    size="md"
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
                <p className="text-sm text-muted-foreground mb-2">{profileData.title}</p>

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
                              : "text-muted-foreground"
                          )}
                        />
                      ))}
                    </div>
                    <span className="font-semibold text-foreground">{profileData.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{profileData.total_reviews_given}</span> reviews
                  </span>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{profileData.karma_points}</span> karma
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
            className="col-span-12 lg:col-span-5 bg-background rounded-2xl border border-border/60 p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Reviewer DNA</h2>
                <p className="text-sm text-muted-foreground">Your unique review fingerprint</p>
              </div>
              <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50">
                <Sparkles className="size-4 mr-1" />
                Share
              </Button>
            </div>
            <div className="flex justify-center">
              <ReviewerDNA data={reviewerDNA} size="md" />
            </div>
            {!dnaMetadata.hasSufficientData && (
              <p className="text-xs text-muted-foreground text-center mt-2">
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
                trend={enhancedStats?.reviewsGiven.trend}
                percentile={enhancedStats?.reviewsGiven.percentile}
                comparison={enhancedStats?.reviewsGiven.comparison}
                sparklineData={enhancedStats?.reviewsGiven.sparklineData}
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
                trend={enhancedStats?.karmaPoints.trend}
                percentile={enhancedStats?.karmaPoints.percentile}
                sparklineData={enhancedStats?.karmaPoints.sparklineData}
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
                percentile={enhancedStats?.avgRating.percentile}
                comparison={enhancedStats?.avgRating.comparison}
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
                trend={enhancedStats?.avgResponseTime.trend}
                percentile={enhancedStats?.avgResponseTime.percentile}
                comparison={enhancedStats?.avgResponseTime.comparison}
                size="md"
              />
            </motion.div>
          </div>

          {/* Row 2: Badges + Bio */}
          {/* Badges Section */}
          <motion.div
            className="col-span-12 lg:col-span-8 bg-background rounded-2xl border border-border/60 p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Achievements</h2>
                <p className="text-sm text-muted-foreground">Your journey and progress</p>
              </div>
              <Link href="/dashboard/karma">
                <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50">
                  View All
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              </Link>
            </div>
            <BadgeGrid badges={badges.length > 0 ? badges : []} maxDisplay={6} />
          </motion.div>

          {/* Bio & Skills Card */}
          <motion.div
            className="col-span-12 lg:col-span-4 bg-background rounded-2xl border border-border/60 p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-lg font-bold text-foreground mb-3">About</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {profileData.bio || "No bio yet. Tell the world about yourself!"}
            </p>

            {/* Skills */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="size-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Skills & Expertise
                  </span>
                </div>
                {isOwnProfile && profileData.specialty_tags.length > 0 && (
                  <button
                    onClick={() => setSkillsModalOpen(true)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>
              {profileData.specialty_tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profileData.specialty_tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      size="sm"
                      className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : isOwnProfile ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => setSkillsModalOpen(true)}
                >
                  Add your skills
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">No skills listed</p>
              )}
            </div>

            {/* Member since */}
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Member since {new Date(profileData.member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </motion.div>

          {/* Row 3: Recent Activity (Timeline) + Activity Heatmap */}
          {/* Recent Activity Timeline - Left */}
          <motion.div
            className="col-span-12 lg:col-span-5 bg-background rounded-2xl border border-border/60 p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <ImpactTimeline events={timelineEvents.length > 0 ? timelineEvents : []} maxDisplay={5} />
          </motion.div>

          {/* Activity Heatmap - Right */}
          <motion.div
            className="col-span-12 lg:col-span-7 bg-background rounded-2xl border border-border/60 p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Activity</h2>
                <p className="text-sm text-muted-foreground">Your contribution history</p>
              </div>
            </div>
            <ActivityHeatmap
              data={activityData.length > 0 ? activityData : []}
              currentStreak={activityStats.currentStreak}
              longestStreak={activityStats.longestStreak}
              totalContributions={activityStats.totalContributions}
            />
          </motion.div>

          {/* Featured Works Section */}
          <motion.div
            className="col-span-12 bg-background rounded-2xl border border-border/60 p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="size-5 text-amber-500 fill-amber-500" />
                <div>
                  <h2 className="text-lg font-bold text-foreground">Featured Works</h2>
                  <p className="text-sm text-muted-foreground">
                    {featuredItems.length > 0
                      ? "Your handpicked highlights"
                      : "Select up to 3 works to showcase on your profile"}
                  </p>
                </div>
              </div>
              {isOwnProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setSelectFeaturedModalOpen(true)}
                >
                  <Pencil className="size-4" />
                  {featuredItems.length > 0 ? "Edit" : "Select Works"}
                </Button>
              )}
            </div>

            {featuredItems.length === 0 ? (
              <div className="text-center py-8 bg-muted/30 rounded-xl border border-dashed border-border">
                <Sparkles className="size-10 mx-auto text-amber-400 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  {portfolioItems.length > 0
                    ? "Select up to 3 portfolio items to feature on your profile"
                    : "Add projects to your portfolio first, then select which ones to feature"}
                </p>
                {portfolioItems.length > 0 && isOwnProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setSelectFeaturedModalOpen(true)}
                  >
                    <Star className="size-4" />
                    Select Featured Works
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer bg-muted border-2 border-amber-200/50 dark:border-amber-700/30"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => item.project_url && window.open(item.project_url, "_blank")}
                  >
                    {item.image_url ? (
                      <img
                        src={getFileUrl(item.image_url)}
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 flex items-center justify-center">
                        <Sparkles className="size-10 text-amber-500" />
                      </div>
                    )}

                    {/* Featured indicator */}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-amber-500/90 text-white border-0 shadow-lg gap-1">
                        <Star className="size-3 fill-white" />
                        Featured
                      </Badge>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-base font-semibold truncate">{item.title}</p>
                      {item.description && (
                        <p className="text-white/80 text-sm line-clamp-2 mt-1">{item.description}</p>
                      )}
                      <Badge variant="info" size="sm" className="mt-2 capitalize text-xs">
                        {item.content_type}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

        </div>
      </main>

      {/* Skills Modal */}
      <SkillsModal
        open={skillsModalOpen}
        onOpenChange={setSkillsModalOpen}
        currentSkills={profileData?.specialty_tags || []}
        onSkillsUpdated={handleSkillsUpdated}
      />

      {/* Select Featured Works Modal */}
      <SelectFeaturedModal
        open={selectFeaturedModalOpen}
        onOpenChange={setSelectFeaturedModalOpen}
        currentFeaturedIds={featuredItems.map((item) => item.id)}
        onFeaturedUpdated={(newFeaturedItems) => {
          setFeaturedItems(newFeaturedItems);
          // Also update the portfolio items state to reflect featured changes
          setPortfolioItems((prev) =>
            prev.map((item) => ({
              ...item,
              is_featured: newFeaturedItems.some((f) => f.id === item.id),
            }))
          );
        }}
      />
    </div>
  );
}
