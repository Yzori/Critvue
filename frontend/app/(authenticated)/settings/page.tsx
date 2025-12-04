"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Settings Index Page
 *
 * Redirects to the Account settings page by default.
 * This ensures users always land on a specific settings section.
 */
export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings/account");
  }, [router]);

  return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue" />
    </div>
  );
}
