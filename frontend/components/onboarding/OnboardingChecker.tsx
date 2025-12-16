"use client";

/**
 * Onboarding Checker Component
 *
 * Checks if the authenticated user needs to complete onboarding
 * and redirects to the onboarding page if needed.
 *
 * This component runs in the background and redirects users who
 * haven't completed onboarding to the dedicated onboarding page.
 */

import { useEffect, useCallback, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getOnboardingStatus } from "@/lib/api/onboarding";

// Pages that don't require onboarding check (auth pages, onboarding page itself)
const EXCLUDED_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/onboarding",
  "/verify-email",
  "/terms",
  "/privacy",
];

export function OnboardingChecker() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const [hasChecked, setHasChecked] = useState(false);

  const checkOnboardingStatus = useCallback(async () => {
    // Skip check if not authenticated, still loading, or already checked
    if (!isAuthenticated || isLoading || hasChecked) return;

    // Skip check for excluded paths
    if (EXCLUDED_PATHS.some((path) => pathname?.startsWith(path))) {
      return;
    }

    try {
      const status = await getOnboardingStatus();
      if (!status.onboardingCompleted) {
        // Redirect to onboarding page
        router.push("/onboarding");
      }
    } catch {
      // Silently fail - user might not have access or endpoint might fail
    } finally {
      setHasChecked(true);
    }
  }, [isAuthenticated, isLoading, hasChecked, pathname, router]);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  // Reset check when user changes (e.g., logout + new login)
  useEffect(() => {
    if (!isAuthenticated) {
      setHasChecked(false);
    }
  }, [isAuthenticated]);

  // This component doesn't render anything visible
  return null;
}
