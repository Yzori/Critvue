"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Star,
  CheckCircle2,
  Mail,
  Calendar,
  Clock,
  Award,
  Shield,
  Zap,
  TrendingUp,
  Heart,
  MessageSquare,
  Palette,
  Code,
  Camera,
  Music,
  FileText,
  Pencil,
} from "lucide-react";

// API imports
import { getMyProfile, ProfileData as ApiProfileData } from "@/lib/api/profile";
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

/**
 * Profile Page
 *
 * Features:
 * - Glassmorphism hero section with gradient background
 * - Dual-role toggle (Creator/Reviewer/Both)
 * - Bento grid stats dashboard
 * - Trust signals with badges
 * - Portfolio showcase
 * - Reviews & testimonials
 * - Mobile-responsive (375px → 2xl)
 * - WCAG 2.1 Level AA compliant
 */

type ProfileRole = "creator" | "reviewer" | "both";

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
}

export default function ProfilePage() {
  const prefersReducedMotion = useReducedMotion();
  const [activeRole, setActiveRole] = useState<ProfileRole>("both");
  const [isOwnProfile, setIsOwnProfile] = useState(true);

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

  /**
   * Load profile and portfolio data from API
   */
  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load profile data
      const profile = await getMyProfile();
      setProfileData(profile);

      // Load portfolio items
      const portfolioResponse = await getUserPortfolio(Number(profile.id), {
        page_size: 20,
      });
      setPortfolioItems(portfolioResponse.items);
    } catch (err) {
      console.error("Profile load error:", err);

      // Handle different error types
      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          setError({
            type: "auth_required",
            message: "Authentication required",
          });
        } else if (err.status === 404) {
          setError({
            type: "not_found",
            message: "Profile not found",
          });
        } else if (err.status >= 500) {
          setError({
            type: "server",
            message: "Server error occurred",
          });
        } else {
          setError({
            type: "unknown",
            message: err.message || "Failed to load profile",
          });
        }
      } else if (err instanceof Error && err.message === "Failed to fetch") {
        setError({
          type: "network",
          message: "Network connection error",
        });
      } else {
        setError({
          type: "unknown",
          message: "An unexpected error occurred",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading skeleton
  if (loading) {
    return <ProfilePageSkeleton />;
  }

  // Show error states
  if (error) {
    switch (error.type) {
      case "auth_required":
        return <AuthenticationRequiredError />;
      case "not_found":
        return <ProfileNotFoundError onRetry={loadProfileData} />;
      case "network":
        return <NetworkError onRetry={loadProfileData} />;
      default:
        return <ProfileLoadError onRetry={loadProfileData} />;
    }
  }

  // Profile data should exist at this point
  if (!profileData) {
    return <ProfileLoadError onRetry={loadProfileData} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section - Glassmorphism */}
      <section className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/10 via-purple-500/5 to-accent-peach/10" />
        <div className="absolute inset-0 backdrop-blur-3xl" />

        {/* Content Container */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 lg:gap-12 items-start">
            {/* Avatar */}
            <motion.div
              className="shrink-0"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
            >
              <div className="relative">
                {isOwnProfile ? (
                  <AvatarUpload
                    currentAvatarUrl={profileData.avatar_url}
                    onUploadComplete={(newAvatarUrl) => {
                      setProfileData((prev) =>
                        prev ? { ...prev, avatar_url: newAvatarUrl } : prev
                      );
                    }}
                    onUploadError={(error) => {
                      console.error("Avatar upload error:", error);
                    }}
                  />
                ) : (
                  <>
                    {profileData.avatar_url ? (
                      <img
                        src={profileData.avatar_url}
                        alt={profileData.full_name}
                        className="size-24 sm:size-28 lg:size-32 rounded-full border-4 border-white shadow-xl object-cover"
                      />
                    ) : (
                      <div className="size-24 sm:size-28 lg:size-32 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-accent-blue to-accent-peach flex items-center justify-center">
                        <User className="size-12 sm:size-14 lg:size-16 text-white" />
                      </div>
                    )}
                  </>
                )}

                {/* Verification Badge */}
                {profileData.verified && (
                  <motion.div
                    className="absolute bottom-0 right-0 size-8 sm:size-10 rounded-full bg-accent-blue border-4 border-white shadow-lg flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                  >
                    <CheckCircle2 className="size-4 sm:size-5 text-white" />
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.2, duration: 0.5 }}
              >
                {/* Name & Rating Row */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-2">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900">
                    {profileData.full_name}
                  </h1>

                  {/* Star Rating */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-gray-200/50 shadow-sm">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "size-3.5 sm:size-4",
                            i < Math.floor(profileData.rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {profileData.rating.toFixed(1)}
                    </span>
                  </div>

                  {profileData.verified && (
                    <Badge variant="info" size="sm" icon={<CheckCircle2 className="size-3.5" />}>
                      Verified
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <p className="text-base sm:text-lg text-gray-600 mb-3 font-medium">
                  {profileData.title}
                </p>

                {/* Bio */}
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4 max-w-2xl">
                  {profileData.bio}
                </p>

                {/* Specialty Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {profileData.specialty_tags.map((tag, index) => (
                    <motion.div
                      key={tag}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: prefersReducedMotion ? 0 : 0.3 + index * 0.05 }}
                    >
                      <Badge variant="neutral" size="sm">
                        {tag}
                      </Badge>
                    </motion.div>
                  ))}
                </div>

                {/* Role Toggle */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <motion.div
                    className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white/60 backdrop-blur-sm border-2 border-gray-200/50 shadow-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: prefersReducedMotion ? 0 : 0.4 }}
                  >
                    <motion.button
                      onClick={() => setActiveRole("creator")}
                      className={cn(
                        "relative px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition-all duration-300 min-h-[48px] touch-manipulation",
                        activeRole === "creator"
                          ? "text-white shadow-lg"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50"
                      )}
                      whileHover={activeRole !== "creator" ? { scale: 1.02 } : {}}
                      whileTap={{ scale: 0.98 }}
                    >
                      {activeRole === "creator" && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-accent-blue via-blue-500 to-blue-600 rounded-xl"
                          layoutId="activeRole"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <Palette className="size-4" />
                        Creator
                      </span>
                    </motion.button>

                    <motion.button
                      onClick={() => setActiveRole("reviewer")}
                      className={cn(
                        "relative px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition-all duration-300 min-h-[48px] touch-manipulation",
                        activeRole === "reviewer"
                          ? "text-white shadow-lg"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50"
                      )}
                      whileHover={activeRole !== "reviewer" ? { scale: 1.02 } : {}}
                      whileTap={{ scale: 0.98 }}
                    >
                      {activeRole === "reviewer" && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-accent-peach via-orange-500 to-orange-600 rounded-xl"
                          layoutId="activeRole"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <Award className="size-4" />
                        Reviewer
                      </span>
                    </motion.button>

                    <motion.button
                      onClick={() => setActiveRole("both")}
                      className={cn(
                        "relative px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition-all duration-300 min-h-[48px] touch-manipulation",
                        activeRole === "both"
                          ? "text-white shadow-lg"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50"
                      )}
                      whileHover={activeRole !== "both" ? { scale: 1.02 } : {}}
                      whileTap={{ scale: 0.98 }}
                    >
                      {activeRole === "both" && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-xl"
                          layoutId="activeRole"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <Zap className="size-4" />
                        Both
                      </span>
                    </motion.button>
                  </motion.div>
                </div>

                {/* CTA Button */}
                {!isOwnProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: prefersReducedMotion ? 0 : 0.5 }}
                  >
                    <Button size="lg" className="min-h-[48px]">
                      Request Review
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom border with gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </section>

      {/* Stats Dashboard - Bento Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.6 }}
        >
          {/* Reviews Given - Large card on desktop */}
          <motion.div
            className="col-span-2 md:col-span-1 p-6 sm:p-8 rounded-2xl bg-white border-2 border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/5 to-blue-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="size-12 sm:size-14 rounded-xl bg-gradient-to-br from-accent-blue to-blue-600 flex items-center justify-center mb-4 shadow-lg">
                <MessageSquare className="size-6 sm:size-7 text-white" />
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-1">
                {profileData.total_reviews_given}
              </div>
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Reviews Given
              </div>
            </div>
          </motion.div>

          {/* Rating */}
          <motion.div
            className="p-6 sm:p-8 rounded-2xl bg-white border-2 border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.1 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-amber-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="size-12 sm:size-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-4 shadow-lg">
                <Star className="size-6 sm:size-7 text-white fill-white" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-gray-900 mb-1">
                {profileData.rating.toFixed(1)}
              </div>
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Avg Rating
              </div>
            </div>
          </motion.div>

          {/* Response Time */}
          <motion.div
            className="p-6 sm:p-8 rounded-2xl bg-white border-2 border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="size-12 sm:size-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg">
                <Clock className="size-6 sm:size-7 text-white" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-gray-900 mb-1">
                {profileData.avg_response_time_hours}h
              </div>
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Avg Response
              </div>
            </div>
          </motion.div>

          {/* Member Since */}
          <motion.div
            className="p-6 sm:p-8 rounded-2xl bg-white border-2 border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.3 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="size-12 sm:size-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg">
                <Calendar className="size-6 sm:size-7 text-white" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">
                {new Date(profileData.member_since).getFullYear()}
              </div>
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Member Since
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Trust Signals - Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.7 }}
        >
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
            Achievements
          </h2>

          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {profileData.badges.map((badge, index) => (
              <motion.div
                key={badge}
                className="shrink-0 px-6 py-4 rounded-xl bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200/50 shadow-md hover:shadow-lg transition-all duration-300 group"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                    <Award className="size-5 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900 whitespace-nowrap">
                    {badge}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Portfolio Showcase - Bento Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.8 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Portfolio</h2>
            {isOwnProfile && (
              <Button variant="outline" size="sm">
                <Pencil className="size-4 mr-2" />
                Add Project
              </Button>
            )}
          </div>

          {/* Content Type Filters */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
            {[
              { label: "All", icon: null },
              { label: "Code", icon: Code },
              { label: "Design", icon: Palette },
              { label: "Video", icon: Camera },
              { label: "Writing", icon: FileText },
              { label: "Audio", icon: Music },
            ].map((filter) => (
              <button
                key={filter.label}
                className="shrink-0 px-4 py-2 rounded-xl font-semibold text-sm bg-white border-2 border-gray-200 hover:border-accent-blue hover:bg-accent-blue/5 transition-all duration-200 flex items-center gap-2"
              >
                {filter.icon && <filter.icon className="size-4" />}
                {filter.label}
              </button>
            ))}
          </div>

          {/* Bento Grid - Real Portfolio Data */}
          {portfolioItems.length === 0 ? (
            <EmptyPortfolioState isOwnProfile={isOwnProfile} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] gap-3 sm:gap-4">
              {portfolioItems.map((item, index) => {
                // First item gets large card treatment
                const isLarge = index === 0;
                const cardClasses = isLarge ? "col-span-2 row-span-2" : "";

                return (
                  <motion.div
                    key={item.id}
                    className={cn(
                      "relative rounded-2xl overflow-hidden group cursor-pointer",
                      cardClasses
                    )}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: prefersReducedMotion ? 0 : 0.9 + index * 0.05 }}
                    whileHover={{ scale: isLarge ? 1.02 : 1.05 }}
                    onClick={() => item.project_url && window.open(item.project_url, "_blank")}
                  >
                    {/* Background Image or Gradient */}
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Content */}
                    <div
                      className={cn(
                        "absolute bottom-0 left-0 right-0 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                        isLarge ? "p-6" : "p-4"
                      )}
                    >
                      <Badge variant="info" size="sm" className="mb-2 capitalize">
                        {item.content_type}
                      </Badge>
                      <h3
                        className={cn(
                          "font-bold mb-1 line-clamp-2",
                          isLarge ? "text-lg" : "text-sm"
                        )}
                      >
                        {item.title}
                      </h3>
                      {item.rating && (
                        <div
                          className={cn(
                            "flex items-center gap-1",
                            isLarge ? "text-sm" : "text-xs"
                          )}
                        >
                          <Star className="size-3 fill-amber-400 text-amber-400" />
                          <span>{item.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </section>

      {/* Reviews & Testimonials */}
      <section className="bg-gradient-to-br from-gray-50 to-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.9 }}
          >
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
              Reviews & Testimonials
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                {
                  reviewer: "Sarah Chen",
                  avatar: "SC",
                  rating: 5,
                  date: "2 weeks ago",
                  review:
                    "Exceptional attention to detail! The feedback on my UI designs was thorough and actionable. Highly recommend for anyone looking to elevate their work.",
                  project: "Dashboard Redesign",
                },
                {
                  reviewer: "Michael Torres",
                  avatar: "MT",
                  rating: 5,
                  date: "1 month ago",
                  review:
                    "Fast turnaround and insightful code review. Caught several performance issues I had missed. Professional and friendly communication throughout.",
                  project: "React E-commerce App",
                },
                {
                  reviewer: "Emma Wilson",
                  avatar: "EW",
                  rating: 4,
                  date: "3 weeks ago",
                  review:
                    "Great feedback on accessibility improvements. The suggestions were practical and easy to implement. Would definitely work with again.",
                  project: "Portfolio Website",
                },
              ].map((testimonial, index) => (
                <motion.div
                  key={testimonial.reviewer}
                  className="p-6 rounded-2xl bg-white border-2 border-gray-200/50 shadow-md hover:shadow-xl transition-all duration-300 group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: prefersReducedMotion ? 0 : 1.0 + index * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  {/* Star Rating */}
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "size-4",
                          i < testimonial.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        )}
                      />
                    ))}
                  </div>

                  {/* Review Text */}
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">
                    {testimonial.review}
                  </p>

                  {/* Project Badge */}
                  <Badge variant="neutral" size="sm" className="mb-4">
                    {testimonial.project}
                  </Badge>

                  {/* Reviewer Info */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className="size-10 rounded-full bg-gradient-to-br from-accent-blue to-accent-peach flex items-center justify-center text-white font-bold text-sm">
                      {testimonial.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">
                        {testimonial.reviewer}
                      </div>
                      <div className="text-xs text-gray-500">{testimonial.date}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* View All Button */}
            <div className="text-center mt-8">
              <Button variant="outline" size="lg">
                View All Reviews
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Activity Heatmap - Optional (Placeholder for future) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: prefersReducedMotion ? 0 : 1.1 }}
        >
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
            Activity Overview
          </h2>
          <div className="p-12 rounded-2xl bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200/50 text-center">
            <Calendar className="size-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">Activity heatmap coming soon</p>
            <p className="text-sm text-gray-500 mt-2">
              Track your review activity over the past 12 months
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
