"use client";

/**
 * Creative Dashboard - Immersive Workspace
 *
 * A non-standard, artistic dashboard that feels like:
 * - Creator: A studio where work lives as canvases
 * - Reviewer: A critic's desk with work to evaluate
 *
 * Features:
 * - Glassmorphism and organic gradients
 * - Bento-style asymmetric grid layout
 * - Role switching with persistent selection
 * - Responsive design (adapts to mobile)
 */

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { CreativeSpace } from "@/components/dashboard/creative";

type DashboardRole = "creator" | "reviewer";

function DashboardContent() {
  const searchParams = useSearchParams();

  const [activeRole, setActiveRole] = useState<DashboardRole>("creator");
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

    setMounted(true);
  }, [searchParams]);

  // Persist role selection to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("dashboardRole", activeRole);
    }
  }, [activeRole, mounted]);

  if (!mounted) {
    return <DashboardSkeleton />;
  }

  return <CreativeSpace initialRole={activeRole} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-b border-white/20 dark:border-white/5">
        <div className="max-w-[1800px] mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
              <div className="hidden sm:block space-y-2">
                <div className="h-3 w-16 rounded bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
                <div className="h-5 w-24 rounded bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
              </div>
            </div>
            <div className="h-12 w-48 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-[1800px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="md:col-span-1 lg:row-span-2">
            <div className="h-[280px] rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
          </div>
          <div className="md:col-span-1">
            <div className="h-[140px] rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
          </div>
          <div className="md:col-span-1">
            <div className="h-[140px] rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <div className="h-[200px] rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
