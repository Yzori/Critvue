"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ClaimButton } from "@/components/reviewer/claim-button";
import { TierLockedButton } from "@/components/tier/tier-locked-review";
import { UserTier } from "@/lib/types/tier";
import { ReviewRequestDetail } from "@/lib/api/reviews/requests";

interface MobileBarProps {
  review: ReviewRequestDetail;
  isPaidReview: boolean;
  availableSlots: number;
  isOwner: boolean;
  canClaimSlot: boolean;
  tierRestriction: { isLocked: boolean; requiredTier: UserTier | null };
  userTier: UserTier;
}

export function MobileBar({
  review,
  isPaidReview,
  availableSlots,
  isOwner,
  canClaimSlot,
  tierRestriction,
  userTier,
}: MobileBarProps) {
  const router = useRouter();

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[var(--dark-tier-2)]/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="px-4 py-4 pb-safe">
          <div className="flex items-center gap-4">
            {isPaidReview && (
              <div className="shrink-0">
                <p className="text-xs text-foreground-muted">Budget</p>
                <p className="text-2xl font-bold text-foreground">${review.budget}</p>
              </div>
            )}

            <div className="flex-1">
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
                    className="w-full"
                  />
                )
              ) : isOwner ? (
                <Button variant="outline" className="w-full" size="lg" disabled>
                  Your Review Request
                </Button>
              ) : availableSlots === 0 ? (
                <Button variant="outline" className="w-full" size="lg" disabled>
                  All Slots Filled
                </Button>
              ) : (
                <Button className="w-full bg-accent-blue hover:bg-accent-blue/90" size="lg" onClick={() => router.push("/login")}>
                  Sign in to Claim
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Bottom padding for mobile action bar */}
      <div className="lg:hidden h-28" />
    </>
  );
}
