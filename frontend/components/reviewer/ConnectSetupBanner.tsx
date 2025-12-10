"use client";

/**
 * Connect Setup Banner Component
 *
 * Shows a banner prompting reviewers to set up Stripe Connect
 * to receive payments for expert reviews.
 *
 * Only shows if:
 * - User has not completed Connect onboarding
 * - User has not dismissed the banner (stored in localStorage)
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Wallet, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getConnectStatus } from "@/lib/api/payments";

interface ConnectSetupBannerProps {
  /** Optional class name for styling */
  className?: string;
}

const DISMISS_KEY = "critvue_connect_banner_dismissed";

export function ConnectSetupBanner({ className }: ConnectSetupBannerProps) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if banner was dismissed
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      setLoading(false);
      return;
    }

    // Check Connect status
    async function checkStatus() {
      try {
        const status = await getConnectStatus();
        // Show banner if not fully onboarded
        if (!status.payouts_enabled) {
          setVisible(true);
        }
      } catch {
        // Don't show banner on error
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setVisible(false);
  };

  if (loading || !visible) {
    return null;
  }

  return (
    <div
      className={`relative rounded-lg border bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 p-4 ${className || ""}`}
    >
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="rounded-full bg-primary/10 p-2 shrink-0">
          <Wallet className="h-5 w-5 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-sm">
            Set up payouts to earn from expert reviews
          </h3>
          <p className="text-sm text-muted-foreground">
            Connect your bank account to receive payments when you complete paid reviews.
            You'll earn 75% of each review's budget.
          </p>
          <Link href="/reviewer/settings/payouts">
            <Button size="sm" className="mt-2">
              Set Up Payouts
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ConnectSetupBanner;
