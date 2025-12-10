"use client";

/**
 * Onboarding Checker Component
 *
 * Checks if the authenticated user needs to complete onboarding
 * and displays the onboarding modal if needed.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingModal } from "./OnboardingModal";
import { getOnboardingStatus } from "@/lib/api/onboarding";

export function OnboardingChecker() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const checkOnboardingStatus = useCallback(async () => {
    if (!isAuthenticated || isLoading || hasChecked) return;

    try {
      const status = await getOnboardingStatus();
      if (!status.onboardingCompleted) {
        setShowOnboarding(true);
      }
    } catch {
      // Silently fail - user might not have access or endpoint might fail
    } finally {
      setHasChecked(true);
    }
  }, [isAuthenticated, isLoading, hasChecked]);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  // Reset check when user changes (e.g., logout + new login)
  useEffect(() => {
    if (!isAuthenticated) {
      setHasChecked(false);
      setShowOnboarding(false);
    }
  }, [isAuthenticated]);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    // Optionally refresh user data or redirect
    window.location.reload();
  }, []);

  // Only render modal if user is authenticated and onboarding is incomplete
  if (!isAuthenticated || !showOnboarding) {
    return null;
  }

  return (
    <OnboardingModal
      isOpen={showOnboarding}
      onComplete={handleOnboardingComplete}
    />
  );
}
