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
import { Briefcase, Palette } from "lucide-react";

// Import dashboard components
import CreatorDashboard from "@/components/dashboard/creator-dashboard";
import ReviewerDashboard from "@/components/dashboard/reviewer-dashboard";

type DashboardRole = "creator" | "reviewer";

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();

  // Get initial role from URL param or localStorage, default to creator
  const getInitialRole = (): DashboardRole => {
    const urlRole = searchParams?.get("role");
    if (urlRole === "creator" || urlRole === "reviewer") {
      return urlRole;
    }

    if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem("dashboardRole");
      if (savedRole === "creator" || savedRole === "reviewer") {
        return savedRole;
      }
    }

    return "creator";
  };

  const [activeRole, setActiveRole] = useState<DashboardRole>(getInitialRole());

  // Persist role selection to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboardRole", activeRole);
    }
  }, [activeRole]);

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-foreground tracking-tight">
              Welcome back{user?.full_name && <span className="hidden sm:inline">, {user.full_name}</span>}!
            </h1>
            <Badge variant="success" showDot pulse size="sm" className="sm:text-sm">
              Active
            </Badge>
          </div>

          {/* Role Toggle - Mobile-first design with brand colors */}
          <div className="flex-shrink-0">
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
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl">
          {activeRole === "creator"
            ? "Here's what's happening with your projects today."
            : "Manage your review claims, track earnings, and view your performance."}
        </p>
      </div>

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
