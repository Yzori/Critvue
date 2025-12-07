"use client";

/**
 * Reviewer Payout Settings Page - Redirect
 *
 * This page redirects to the unified billing settings page
 * with the payouts tab selected.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function PayoutSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified billing page with payouts tab
    router.replace("/settings/billing?tab=payouts");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
