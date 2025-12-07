"use client";

/**
 * Public Profile Page
 *
 * Displays any user's public profile by their ID or username.
 * Supports SEO-friendly URLs like /profile/johndoe as well as /profile/123.
 * Shows view-only mode for other users, with options to request review or contact.
 */

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Share2,
  Mail,
  ArrowRight,
  Sparkles,
  Award,
  Shield,
  Briefcase,
} from "lucide-react";

// API imports
import { getUserProfile, getUserDNA, ReviewerDNAResponse, ProfileData } from "@/lib/api/profile";
import { getUserFeaturedPortfolio, PortfolioItem } from "@/lib/api/portfolio";
import { getFileUrl } from "@/lib/api/client";
import { getUserBadges, Badge as ApiBadge } from "@/lib/api/karma";
import { ApiClientError } from "@/lib/api/client";

// Component imports
import { ProfilePageSkeleton } from "@/components/profile/profile-skeleton";
import {
  ProfileLoadError,
  ProfileNotFoundError,
  NetworkError,
} from "@/components/profile/error-states";
import { useAuth } from "@/contexts/AuthContext";
import { TierBadge } from "@/components/tier/tier-badge";
import { UserTier, getTierInfo } from "@/lib/types/tier";

// Premium components
import { ReviewerDNA, ReviewerDNAData } from "@/components/profile/reviewer-dna";
import { BadgeGrid, Badge as BadgeType } from "@/components/profile/progressive-badge";
import { ContextualStatCard } from "@/components/profile/contextual-stat-card";
import { FeaturedWorksCarousel } from "@/components/profile/featured-works-carousel";
import { InviteReviewerModal } from "@/components/profile/invite-reviewer-modal";

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
function transformApiBadges(apiBadges: ApiBadge[]): BadgeType[] {
  const badgeIconMap: Record<string, string> = {
    first_review: 'trophy',
    reviews_10: 'award',
    reviews_50: 'award',
    reviews_100: 'award',
    reviews_500: 'trophy',
    streak_7: 'flame',
    streak_30: 'flame',
    streak_100: 'flame',
    five_star_streak: 'star',
    helpful_reviewer: 'heart',
    code_expert: 'target',
    design_expert: 'target',
    writing_expert: 'target',
    early_adopter: 'zap',
    speed_demon: 'zap',
    deep_thinker: 'message',
    mentor: 'users',
  };

  const categoryMap: Record<string, BadgeType['category']> = {
    skill: 'expertise',
    milestone: 'milestone',
    streak: 'streak',
    quality: 'behavior',
    special: 'community',
    seasonal: 'community',
  };

  return apiBadges.map((badge) => ({
    id: badge.badge_code,
    name: badge.badge_name,
    description: badge.badge_description,
    icon: badgeIconMap[badge.badge_code] || 'award',
    category: categoryMap[badge.category] || 'milestone',
    status: 'earned' as const,
    earnedAt: badge.earned_at || undefined,
    rarity: badge.rarity,
  }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PublicProfilePage({ params }: PageProps) {
  const resolvedParams = use(params);
  // Support both numeric IDs and usernames
  const identifier = resolvedParams.id;
  const numericId = parseInt(identifier, 10);
  const isNumericId = !isNaN(numericId);

  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const { user: currentUser } = useAuth();

  // Check if viewing own profile - redirect to /profile if so
  // Only compare if we have a numeric ID
  const isOwnProfile = isNumericId && currentUser?.id === numericId;

  // State management
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [featuredItems, setFeaturedItems] = useState<PortfolioItem[]>([]);
  const [reviewerDNA, setReviewerDNA] = useState<ReviewerDNAData>(defaultReviewerDNA);
  const [dnaMetadata, setDNAMetadata] = useState<{ hasSufficientData: boolean; reviewsAnalyzed: number }>({ hasSufficientData: false, reviewsAnalyzed: 0 });
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    type: "not_found" | "network" | "server" | "unknown";
    message: string;
  } | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Redirect to own profile page if viewing self
  useEffect(() => {
    if (isOwnProfile) {
      router.replace("/profile");
    }
  }, [isOwnProfile, router]);

  // Load profile data on mount
  useEffect(() => {
    if (!isOwnProfile && identifier) {
      loadProfileData();
    }
  }, [identifier, isOwnProfile]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      const profile = await getUserProfile(identifier);
      setProfileData(profile);

      // Use the numeric user ID from the profile for API calls that require it
      const userId = parseInt(profile.id, 10);

      // Fetch DNA, featured items, and badges in parallel
      const [featuredResponse, dnaResponse, badgesResponse] = await Promise.all([
        getUserFeaturedPortfolio(userId).catch(() => []),
        getUserDNA(identifier).catch(() => null),
        getUserBadges(userId).catch(() => []),
      ]);

      setFeaturedItems(featuredResponse);

      // Transform and set DNA data
      if (dnaResponse) {
        setReviewerDNA(transformDNAResponse(dnaResponse));
        setDNAMetadata({
          hasSufficientData: dnaResponse.has_sufficient_data,
          reviewsAnalyzed: dnaResponse.reviews_analyzed,
        });
      }

      // Transform and set badges, including tier badge
      const transformedBadges = transformApiBadges(badgesResponse);

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
    } catch (err) {
      console.error("Profile load error:", err);

      if (err instanceof ApiClientError) {
        if (err.status === 404) {
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

  // Show loading while redirecting to own profile
  if (isOwnProfile) {
    return <ProfilePageSkeleton />;
  }

  if (loading) return <ProfilePageSkeleton />;

  if (error) {
    switch (error.type) {
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

                {/* Bio */}
                {profileData.bio && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3 max-w-2xl">
                    {profileData.bio}
                  </p>
                )}

                {/* Quick stats row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
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
                  <span className="text-muted-foreground hidden sm:inline">|</span>
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{profileData.total_reviews_given}</span> reviews
                  </span>
                  <span className="text-muted-foreground hidden sm:inline">|</span>
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{profileData.karma_points}</span> karma
                  </span>
                  <span className="text-muted-foreground hidden sm:inline">|</span>
                  <span className="text-muted-foreground text-xs">
                    Member since {new Date(profileData.member_since).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-start gap-2 lg:ml-auto">
              <Button
                size="sm"
                className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                onClick={() => setInviteModalOpen(true)}
              >
                Request Review
                <ArrowRight className="size-4" />
              </Button>
              <Link href={`/portfolio/${identifier}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Briefcase className="size-4" />
                  Portfolio
                </Button>
              </Link>
              <Button variant="outline" size="sm">
                <Mail className="size-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="size-4" />
              </Button>
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
                <p className="text-sm text-muted-foreground">Unique review fingerprint</p>
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
                DNA profile building in progress
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
                size="md"
              />
            </motion.div>
          </div>

          {/* Achievements/Badges Section */}
          <motion.div
            className="col-span-12 lg:col-span-8 bg-background rounded-2xl border border-border/60 p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Achievements</h2>
                <p className="text-sm text-muted-foreground">Earned badges and milestones</p>
              </div>
            </div>
            <BadgeGrid badges={badges} maxDisplay={6} />
            {badges.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No badges earned yet
              </p>
            )}
          </motion.div>

          {/* Skills Card */}
          <motion.div
            className="col-span-12 lg:col-span-4 bg-background rounded-2xl border border-border/60 p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Code className="size-5 text-blue-500" />
              <h2 className="text-lg font-bold text-foreground">Skills & Expertise</h2>
            </div>
            {profileData.specialty_tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
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
            ) : (
              <p className="text-sm text-muted-foreground">No skills listed</p>
            )}
          </motion.div>

          {/* Featured Works Section */}
          <motion.div
            className="col-span-12 bg-background rounded-2xl border border-border/60 p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="size-5 text-amber-500 fill-amber-500" />
                <div>
                  <h2 className="text-lg font-bold text-foreground">Featured Works</h2>
                  <p className="text-sm text-muted-foreground">
                    {featuredItems.length > 0
                      ? "Handpicked highlights from this creator"
                      : "This creator hasn't featured any works yet"}
                  </p>
                </div>
              </div>
              <Link href={`/portfolio/${identifier}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Briefcase className="size-4" />
                  View Full Portfolio
                </Button>
              </Link>
            </div>

            {featuredItems.length > 0 ? (
              <FeaturedWorksCarousel items={featuredItems} />
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                <Sparkles className="size-10 mx-auto text-amber-400/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Check out their full portfolio to see their work
                </p>
              </div>
            )}
          </motion.div>

        </div>
      </main>

      {/* Invite Reviewer Modal */}
      {profileData && (
        <InviteReviewerModal
          open={inviteModalOpen}
          onOpenChange={setInviteModalOpen}
          reviewerId={parseInt(profileData.id, 10)}
          reviewerName={profileData.full_name || profileData.username || "this reviewer"}
        />
      )}
    </div>
  );
}
