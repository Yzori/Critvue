"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ReviewRequestDetail } from "@/lib/api/reviews";
import { Button } from "@/components/ui/button";
import {
  Download,
  Edit,
  Share2,
  Flag,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { UserTier } from "@/lib/types/tier";
import { TierLockedButton } from "@/components/tier/tier-locked-review";
import { useAuth } from "@/contexts/AuthContext";
import { ClaimButton } from "@/components/reviewer/claim-button";

/**
 * ActionBar Component
 *
 * Features:
 * - Context-aware actions based on user role and request status
 * - Claim slot button for reviewers
 * - Edit button for request owners
 * - Download all files button
 * - Share button
 * - Back navigation
 * - Mobile-responsive with priority actions
 * - Glassmorphism design
 * - WCAG 2.1 Level AA compliant
 * - 44px minimum touch targets
 */

interface ActionBarProps {
  review: ReviewRequestDetail;
  isOwner?: boolean;
  currentUserId?: number;
  className?: string;
}

// Tier limits for paid reviews (matches backend)
const TIER_PAID_LIMITS: Record<UserTier, { canAcceptPaid: boolean; maxPrice: number | null }> = {
  [UserTier.NOVICE]: { canAcceptPaid: false, maxPrice: null },
  [UserTier.CONTRIBUTOR]: { canAcceptPaid: false, maxPrice: null },
  [UserTier.SKILLED]: { canAcceptPaid: false, maxPrice: null },
  [UserTier.TRUSTED_ADVISOR]: { canAcceptPaid: true, maxPrice: 25 },
  [UserTier.EXPERT]: { canAcceptPaid: true, maxPrice: 100 },
  [UserTier.MASTER]: { canAcceptPaid: true, maxPrice: null }, // unlimited
};

// Get the minimum tier required for a given price
function getRequiredTierForPrice(price: number): UserTier {
  if (price <= 25) return UserTier.TRUSTED_ADVISOR;
  if (price <= 100) return UserTier.EXPERT;
  return UserTier.MASTER;
}

// Check if user's tier can claim a paid review
function canTierClaimPrice(tier: UserTier, price: number): boolean {
  const limits = TIER_PAID_LIMITS[tier];
  if (!limits.canAcceptPaid) return false;
  if (limits.maxPrice === null) return true; // unlimited
  return price <= limits.maxPrice;
}

export function ActionBar({
  review,
  isOwner = false,
  currentUserId,
  className,
}: ActionBarProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Get user's tier (default to NOVICE if not set)
  const userTier = (user?.user_tier as UserTier) || UserTier.NOVICE;

  // Check if this is a paid/expert review
  const isPaidReview = review.review_type === "expert" && review.budget && review.budget > 0;
  const reviewPrice = review.budget || 0;

  // Check tier restrictions for paid reviews
  const tierRestriction = React.useMemo(() => {
    if (!isPaidReview) return { isLocked: false, requiredTier: null };

    const canClaim = canTierClaimPrice(userTier, reviewPrice);
    if (canClaim) return { isLocked: false, requiredTier: null };

    const requiredTier = getRequiredTierForPrice(reviewPrice);
    return { isLocked: true, requiredTier };
  }, [isPaidReview, userTier, reviewPrice]);

  // Check if user can claim a slot (base conditions)
  const canClaimSlot = React.useMemo(() => {
    if (!currentUserId || isOwner) return false;

    // Allow claiming if review is pending or in_review with available slots
    if (review.status !== "pending" && review.status !== "in_review") return false;

    // Check if there are available slots
    const availableSlots = review.slots?.filter((s) => s.status === "available").length || 0;
    if (availableSlots === 0) return false;

    // Check if user already has a claimed slot
    const userSlots = review.slots?.filter((s) => s.reviewer_id === currentUserId) || [];
    return userSlots.length === 0;
  }, [currentUserId, isOwner, review]);

  // Handle download all files
  const handleDownloadAll = () => {
    if (review.files.length === 0) {
      toast.info("No files to download");
      return;
    }

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

    review.files.forEach((file) => {
      let url = "";
      if (file.file_url) {
        // If it's already an absolute URL, use as-is
        url = file.file_url.startsWith("http") ? file.file_url : `${BACKEND_URL}${file.file_url}`;
      } else {
        url = `${BACKEND_URL}/files/${file.filename}`;
      }
      const link = document.createElement("a");
      link.href = url;
      link.download = file.original_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    toast.success("Downloading files...", {
      description: `${review.files.length} file(s) queued for download.`,
    });
  };

  // Handle share
  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: review.title,
          text: review.description,
          url: url,
        });
      } catch {
        // User cancelled or error occurred - silent fail
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      } catch {
        toast.error("Failed to copy link");
      }
    }
  };

  // Handle report
  const handleReport = () => {
    toast.info("Report feature coming soon", {
      description: "This will allow you to flag inappropriate content.",
    });
  };

  return (
    <div
      className={cn(
        "sticky top-0 z-20",
        "bg-white/80 backdrop-blur-xl border-b border-gray-200/50",
        "shadow-sm",
        className
      )}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left: Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="min-h-[44px]"
            aria-label="Go back"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tier Locked Button (when user's tier is too low for paid review) */}
            {canClaimSlot && tierRestriction.isLocked && tierRestriction.requiredTier && (
              <TierLockedButton
                requiredTier={tierRestriction.requiredTier}
                currentTier={userTier}
                size="md"
              />
            )}

            {/* Claim Slot Button (Primary CTA for reviewers - only when not tier-locked) */}
            {canClaimSlot && !tierRestriction.isLocked && (
              <ClaimButton
                reviewRequestId={review.id}
                paymentAmount={review.budget || null}
                reviewType={review.review_type}
                title={review.title}
                requiresNda={review.requires_nda}
              />
            )}

            {/* Edit Button (for owners) */}
            {isOwner && review.status === "draft" && (
              <Button
                variant="outline"
                size="default"
                onClick={() => router.push(`/review/${review.id}/edit`)}
                className="min-h-[44px]"
              >
                <Edit className="size-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            )}

            {/* Download All Files */}
            {review.files.length > 0 && (
              <Button
                variant="outline"
                size="default"
                onClick={handleDownloadAll}
                className="min-h-[44px]"
                aria-label="Download all files"
              >
                <Download className="size-4" />
                <span className="hidden sm:inline">Download All</span>
              </Button>
            )}

            {/* Share Button */}
            <Button
              variant="outline"
              size="default"
              onClick={handleShare}
              className="min-h-[44px]"
              aria-label="Share review request"
            >
              <Share2 className="size-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>

            {/* Report Button (if not owner) */}
            {!isOwner && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReport}
                className="min-h-[44px] min-w-[44px] text-gray-500 hover:text-red-600"
                aria-label="Report review request"
              >
                <Flag className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
