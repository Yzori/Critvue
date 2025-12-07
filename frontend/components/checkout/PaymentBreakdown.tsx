"use client";

/**
 * Payment Breakdown Component
 *
 * Shows a detailed breakdown of payment for expert reviews:
 * - Subtotal (per review * number of reviews)
 * - Pro discount (if applicable)
 * - Platform fee disclosure
 * - Final total
 */

import { DollarSign, BadgePercent, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PaymentBreakdownProps {
  perReviewAmount: number;
  reviewsRequested: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  platformFee: number;
  reviewerEarnings: number;
  isProUser: boolean;
}

export function PaymentBreakdown({
  perReviewAmount,
  reviewsRequested,
  subtotal,
  discountPercent,
  discountAmount,
  total,
  platformFee,
  reviewerEarnings,
  isProUser,
}: PaymentBreakdownProps) {
  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(amount));
  };

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <DollarSign className="h-4 w-4 text-muted-foreground" />
        Payment Summary
      </div>

      <div className="space-y-2 text-sm">
        {/* Per review breakdown */}
        <div className="flex justify-between text-muted-foreground">
          <span>
            {formatCurrency(perReviewAmount)} x {reviewsRequested} review
            {reviewsRequested > 1 ? "s" : ""}
          </span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        {/* Pro discount */}
        {Number(discountAmount) > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="flex items-center gap-1">
              <BadgePercent className="h-3 w-3" />
              Pro discount ({discountPercent}%)
            </span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
        )}

        {/* Non-pro user hint */}
        {!isProUser && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Info className="h-3 w-3" />
            <span>
              Pro subscribers get 15% off expert reviews.{" "}
              <a href="/pricing" className="text-primary hover:underline">
                Upgrade
              </a>
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t pt-2 mt-2" />

        {/* Total */}
        <div className="flex justify-between font-semibold text-base">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>

        {/* Reviewer earnings disclosure */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                <Info className="h-3 w-3" />
                <span>
                  Reviewer earns {formatCurrency(reviewerEarnings)} per review
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">
                A 20% platform fee ({formatCurrency(platformFee)} per review) supports
                the Critvue platform and ensures quality reviews.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

export default PaymentBreakdown;
