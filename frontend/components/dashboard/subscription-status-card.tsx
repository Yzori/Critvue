"use client";

/**
 * Subscription Status Card - Shows current tier and benefits
 * Displays on Creator Dashboard with upgrade CTA for free users
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Zap, ArrowRight, TrendingUp, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscriptionStatus {
  tier: string;
  status: string | null;
  monthly_reviews_used: number;
  monthly_reviews_limit: number;
  reviews_remaining: number;
  reviews_reset_at: string | null;
  has_unlimited_reviews: boolean;
  expert_review_discount: number;
  has_priority_queue: boolean;
}

export default function SubscriptionStatusCard() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/subscriptions/status`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error("Failed to fetch subscription status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (subscription?.tier === "free") {
      router.push("/pricing");
      return;
    }

    // For Pro users, open Stripe customer portal
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/subscriptions/portal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          return_url: `${window.location.origin}/dashboard`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.portal_url;
      }
    } catch (error) {
      console.error("Failed to open customer portal:", error);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (!subscription) return null;

  const isPro = subscription.tier === "pro";
  const isActive = subscription.status === "active";
  const reviewsPercentage = subscription.monthly_reviews_limit > 0
    ? (subscription.monthly_reviews_used / subscription.monthly_reviews_limit) * 100
    : 0;

  return (
    <motion.div
      className={cn(
        "rounded-2xl p-6 border-2 transition-all duration-300",
        isPro && isActive
          ? "bg-gradient-to-br from-accent-blue/5 via-accent-purple/5 to-accent-blue/10 border-accent-blue/30"
          : "bg-gradient-to-br from-gray-50 to-white border-gray-200"
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl",
            isPro && isActive ? "bg-accent-blue/10" : "bg-gray-100"
          )}>
            {isPro && isActive ? (
              <Crown className="size-5 text-accent-blue" />
            ) : (
              <Star className="size-5 text-gray-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isPro && isActive ? "Pro Subscription" : "Free Plan"}
            </h3>
            {isActive && (
              <Badge variant="success" size="sm" showDot className="mt-1">
                Active
              </Badge>
            )}
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleManageSubscription}
          className="min-h-[40px]"
        >
          <Settings className="size-4 mr-2" />
          {isPro && isActive ? "Manage" : "Upgrade"}
        </Button>
      </div>

      {/* Free Tier - Review Limit */}
      {!isPro && (
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Community Reviews</span>
              <span className="font-semibold text-gray-900">
                {subscription.monthly_reviews_used} / {subscription.monthly_reviews_limit}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full transition-all",
                  reviewsPercentage >= 100
                    ? "bg-red-500"
                    : reviewsPercentage >= 66
                    ? "bg-yellow-500"
                    : "bg-green-500"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(reviewsPercentage, 100)}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {subscription.reviews_remaining > 0
                ? `${subscription.reviews_remaining} reviews remaining this month`
                : "Monthly limit reached. Upgrade to Pro for unlimited reviews!"}
            </p>
          </div>

          {/* Upgrade CTA */}
          {subscription.reviews_remaining <= 1 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-accent-blue/10 to-accent-purple/10 rounded-xl border border-accent-blue/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="size-4 text-accent-blue" />
                <span className="text-sm font-semibold text-gray-900">Unlock unlimited reviews</span>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Get unlimited community reviews, 15% off expert reviews, and priority queue for just $9/month
              </p>
              <Button
                size="sm"
                onClick={() => router.push("/pricing")}
                className="w-full bg-accent-blue hover:bg-accent-blue/90 text-white"
              >
                Upgrade to Pro
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Pro Tier - Benefits */}
      {isPro && isActive && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="size-4 text-accent-blue" />
                <span className="text-xs font-medium text-gray-600">Community Reviews</span>
              </div>
              <p className="text-lg font-bold text-gray-900">Unlimited</p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="size-4 text-accent-blue" />
                <span className="text-xs font-medium text-gray-600">Expert Discount</span>
              </div>
              <p className="text-lg font-bold text-gray-900">15% Off</p>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-gray-100">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-gray-700">
                <div className="size-1.5 rounded-full bg-accent-blue"></div>
                Priority queue for expert reviews
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <div className="size-1.5 rounded-full bg-accent-blue"></div>
                Advanced analytics and insights
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <div className="size-1.5 rounded-full bg-accent-blue"></div>
                Early access to new features
              </li>
            </ul>
          </div>
        </div>
      )}
    </motion.div>
  );
}
