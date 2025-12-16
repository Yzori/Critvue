"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ClaimButton } from "@/components/reviewer/claim-button";
import { TierLockedButton } from "@/components/tier/tier-locked-review";
import { UserTier } from "@/lib/types/tier";
import { ReviewRequestDetail } from "@/lib/api/reviews/requests";
import {
  DollarSign,
  MessageSquare,
  CheckCircle2,
  Users,
  Clock,
  Shield,
} from "lucide-react";

interface SidebarProps {
  review: ReviewRequestDetail;
  isPaidReview: boolean;
  availableSlots: number;
  totalSlots: number;
  isOwner: boolean;
  canClaimSlot: boolean;
  tierRestriction: { isLocked: boolean; requiredTier: UserTier | null };
  userTier: UserTier;
  deadlineInfo: { text: string; variant: string; urgent: boolean } | null;
}

export function Sidebar({
  review,
  isPaidReview,
  availableSlots,
  totalSlots,
  isOwner,
  canClaimSlot,
  tierRestriction,
  userTier,
  deadlineInfo,
}: SidebarProps) {
  const router = useRouter();

  return (
    <aside className="w-full lg:w-[380px] shrink-0 order-1 lg:order-2">
      <div className="lg:sticky lg:top-20 space-y-4">
        <div className="rounded-3xl overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-black/30">
          {/* Gradient Header */}
          <div className={cn(
            "p-6 text-white",
            isPaidReview
              ? "bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500"
              : "bg-gradient-to-br from-accent-blue via-cyan-500 to-blue-500"
          )}>
            {isPaidReview ? (
              <>
                <p className="text-sm text-white/80 mb-1">Budget</p>
                <p className="text-4xl font-bold">${review.budget}</p>
                <p className="text-sm text-white/70 mt-1">per review</p>
              </>
            ) : (
              <>
                <p className="text-sm text-white/80 mb-1">Review Type</p>
                <p className="text-2xl font-bold">Free Review</p>
                <p className="text-sm text-white/70 mt-1">Community feedback</p>
              </>
            )}
          </div>

          {/* Card Body */}
          <div className="bg-white dark:bg-[var(--dark-tier-2)] p-6 space-y-5">
            {/* Requester Row */}
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-full bg-gradient-to-br from-accent-blue to-cyan-500 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-accent-blue/25">
                {review.requester_avatar ? (
                  <img
                    src={review.requester_avatar}
                    alt={review.requester_username || "Requester"}
                    className="size-full rounded-full object-cover"
                  />
                ) : (
                  (review.requester_username?.[0] || "?").toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate text-lg">
                  {review.requester_username || "Anonymous"}
                </p>
                <p className="text-sm text-foreground-muted">Requester</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/30 border border-gray-100 dark:border-gray-700">
                <p className="text-2xl font-bold text-accent-blue">{availableSlots}</p>
                <p className="text-xs text-foreground-muted font-medium">Slots Open</p>
              </div>
              <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/30 border border-gray-100 dark:border-gray-700">
                <p className="text-2xl font-bold text-foreground">{totalSlots}</p>
                <p className="text-xs text-foreground-muted font-medium">Total Slots</p>
              </div>
            </div>

            {/* CTA Button - Desktop */}
            <div className="hidden lg:block">
              {canClaimSlot ? (
                tierRestriction.isLocked && tierRestriction.requiredTier ? (
                  <TierLockedButton
                    requiredTier={tierRestriction.requiredTier}
                    currentTier={userTier}
                    size="lg"
                    className="w-full"
                  />
                ) : (
                  <ClaimButton
                    reviewRequestId={review.id}
                    paymentAmount={review.budget || null}
                    reviewType={review.review_type}
                    title={review.title}
                    requiresNda={review.requires_nda}
                    className="w-full shadow-lg shadow-accent-blue/25 hover:shadow-xl hover:shadow-accent-blue/30 transition-shadow"
                  />
                )
              ) : isOwner ? (
                <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-accent-blue/5 to-accent-blue/10 border border-accent-blue/20">
                  <CheckCircle2 className="size-6 mx-auto mb-2 text-accent-blue" />
                  <p className="text-sm font-semibold text-foreground">Your Review Request</p>
                </div>
              ) : availableSlots === 0 ? (
                <div className="text-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <Users className="size-6 mx-auto mb-2 text-foreground-muted" />
                  <p className="text-sm font-semibold text-foreground-muted">All Slots Filled</p>
                </div>
              ) : (
                <Button
                  className="w-full bg-accent-blue hover:bg-accent-blue/90 shadow-lg shadow-accent-blue/25"
                  size="lg"
                  onClick={() => router.push("/login")}
                >
                  Sign in to Claim
                </Button>
              )}
            </div>

            {/* Deadline Warning */}
            {deadlineInfo && deadlineInfo.urgent && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/20 dark:to-orange-500/10 border border-amber-200 dark:border-amber-500/30">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                    <Clock className="size-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">{deadlineInfo.text}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Deadline approaching</p>
                  </div>
                </div>
              </div>
            )}

            {/* NDA Badge */}
            {review.requires_nda && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-500/20 dark:to-violet-500/10 border border-purple-200 dark:border-purple-500/30">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                    <Shield className="size-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">NDA Required</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">Sign before viewing files</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
