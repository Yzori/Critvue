"use client";

/**
 * Unified Dashboard - Creator & Reviewer Views
 *
 * Single dashboard with seamless role toggle between:
 * - Creator Mode: View your review requests, track feedback
 * - Reviewer Mode: Claim reviews, track earnings, manage submissions
 *
 * Brand Compliance:
 * - Uses Critvue brand colors (accent-blue #3B82F6, accent-peach #F97316)
 * - Mobile-first responsive design with 44px+ touch targets
 * - Smooth animated transitions with reduced motion support
 * - Glassmorphism and shadow system consistency
 * - Persistent role selection via localStorage
 * - URL parameter support for deep linking
 *
 * Features:
 * - Persistent role selection (localStorage)
 * - URL param support (e.g., /dashboard?role=reviewer)
 * - Smooth transitions between views
 * - Icons: Palette for Creator, Briefcase for Reviewer
 */

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Palette, Star, ArrowRight, X } from "lucide-react";

// Import dashboard components
import CreatorDashboard from "@/components/dashboard/creator-dashboard";
import ReviewerDashboard from "@/components/dashboard/reviewer-dashboard";

type DashboardRole = "creator" | "reviewer";

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();

  // Initialize with creator to match SSR, then update from localStorage after mount
  const [activeRole, setActiveRole] = useState<DashboardRole>("creator");
  const [showExpertBanner, setShowExpertBanner] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Hydrate state from URL params and localStorage after mount
  useEffect(() => {
    const urlRole = searchParams?.get("role");
    if (urlRole === "creator" || urlRole === "reviewer") {
      setActiveRole(urlRole);
    } else {
      const savedRole = localStorage.getItem("dashboardRole");
      if (savedRole === "creator" || savedRole === "reviewer") {
        setActiveRole(savedRole as DashboardRole);
      }
    }

    const dismissed = localStorage.getItem("expertBannerDismissed");
    if (dismissed === "true") {
      setShowExpertBanner(false);
    }

    setMounted(true);
  }, [searchParams]);

  // Persist role selection to localStorage (only after mount to avoid SSR issues)
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("dashboardRole", activeRole);
    }
  }, [activeRole, mounted]);

  // Handle banner dismissal
  const handleDismissBanner = () => {
    setShowExpertBanner(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("expertBannerDismissed", "true");
    }
  };

  // Handle role change
  const handleRoleChange = (role: DashboardRole) => {
    setActiveRole(role);
    // Update URL without navigation
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("role", role);
      window.history.pushState({}, "", url);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-24 lg:pb-8">
      {/* Header with Role Toggle */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-foreground tracking-tight text-center sm:text-left">
              Welcome back{user?.full_name && <span className="hidden sm:inline">, {user.full_name}</span>}!
            </h1>
            <Badge variant="success" showDot pulse size="sm" className="sm:text-sm">
              Active
            </Badge>
          </div>

          {/* Role Toggle - Mobile-first design with brand colors */}
          <div className="flex-shrink-0 w-full sm:w-auto flex justify-center sm:justify-end">
            <div className="inline-flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border shadow-sm">
              <button
                onClick={() => handleRoleChange("creator")}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg
                  text-sm font-medium transition-all duration-200
                  min-h-[44px] min-w-[110px] justify-center
                  ${activeRole === "creator"
                    ? "bg-gradient-to-br from-accent-blue to-accent-blue/90 text-white shadow-md shadow-accent-blue/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }
                `}
                aria-label="Switch to Creator dashboard"
                aria-pressed={activeRole === "creator"}
              >
                <Palette className="size-4" />
                <span>Creator</span>
              </button>

              <button
                onClick={() => handleRoleChange("reviewer")}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg
                  text-sm font-medium transition-all duration-200
                  min-h-[44px] min-w-[110px] justify-center
                  ${activeRole === "reviewer"
                    ? "bg-gradient-to-br from-accent-peach to-accent-peach/90 text-white shadow-md shadow-accent-peach/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }
                `}
                aria-label="Switch to Reviewer dashboard"
                aria-pressed={activeRole === "reviewer"}
              >
                <Briefcase className="size-4" />
                <span>Reviewer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Description text - changes based on role */}
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl text-center sm:text-left mx-auto sm:mx-0">
          {activeRole === "creator"
            ? "Here's what's happening with your projects today."
            : "Manage your review claims, track earnings, and view your performance."}
        </p>
      </div>

      {/* Become an Expert Reviewer Banner - Dismissible */}
      <AnimatePresence>
        {showExpertBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden rounded-2xl"
          >
            <div className="relative rounded-2xl bg-gradient-to-br from-accent-peach via-orange-500 to-accent-peach/90 p-6 sm:p-8 text-white shadow-2xl overflow-hidden">
              {/* Decorative background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
              </div>

              {/* Close button */}
              <button
                onClick={handleDismissBanner}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Dismiss banner"
              >
                <X className="size-5" />
              </button>

              <div className="relative flex flex-col sm:flex-row items-center gap-6">
                {/* Icon */}
                <div className="flex-shrink-0 size-16 sm:size-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/30">
                  <Star className="size-8 sm:size-10 fill-white" />
                </div>

                {/* Content */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-bold drop-shadow-lg">
                    Become an Expert Reviewer
                  </h3>
                  <p className="text-white/90 text-sm sm:text-base leading-relaxed max-w-2xl">
                    Share your expertise, earn $50-150 per review, and help creators improve their work.
                    Join our community of industry professionals.
                  </p>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => router.push("/apply/expert")}
                  size="lg"
                  className="flex-shrink-0 bg-white text-accent-peach hover:bg-gray-50 font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 min-h-[48px]"
                >
                  <span className="hidden sm:inline">Apply Now</span>
                  <span className="sm:hidden">Apply</span>
                  <ArrowRight className="ml-2 size-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard Content - Animated transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeRole}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? false : { opacity: 0, y: -20 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.3,
            ease: "easeInOut"
          }}
        >
          {activeRole === "creator" ? (
            <CreatorDashboard />
          ) : (
            <ReviewerDashboard />
          )}
        </motion.div>
      </AnimatePresence>
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

// Loading Skeleton - Brand compliant with Critvue design system
function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-24 lg:pb-8 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 sm:h-12 bg-muted rounded-xl w-64 sm:w-80 max-w-full" />
          <div className="h-6 bg-muted rounded-full w-16" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="h-6 bg-muted rounded-lg w-96 max-w-full" />
          <div className="h-11 bg-muted rounded-xl w-56" />
        </div>
      </div>

      {/* Stats skeleton - Mobile bento grid */}
      <div className="lg:hidden grid grid-cols-2 gap-3 auto-rows-[minmax(100px,auto)]">
        <div className="row-span-2 rounded-2xl border border-border bg-card p-5 h-full" />
        <div className="rounded-2xl border border-border bg-card p-4 min-h-[100px]" />
        <div className="rounded-2xl border border-border bg-card p-4 min-h-[100px]" />
        <div className="col-span-2 rounded-2xl border border-border bg-card p-4" />
      </div>

      {/* Stats skeleton - Desktop */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6 h-40" />
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-8 h-96" />
        <div className="rounded-2xl border border-border bg-card p-8 h-96" />
      </div>
    </div>
  );
}
