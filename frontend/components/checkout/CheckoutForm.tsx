"use client";

/**
 * Checkout Form Component
 *
 * The actual payment form that uses Stripe hooks.
 * Must be rendered inside Elements context.
 */

import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CreditCard, ShieldCheck } from "lucide-react";
import { PaymentBreakdown } from "./PaymentBreakdown";
import { PaymentBreakdown as PaymentBreakdownType } from "@/lib/api/payments";

type CheckoutStatus = "loading" | "ready" | "processing" | "success" | "error";

interface CheckoutFormProps {
  reviewRequestId: number;
  breakdown: PaymentBreakdownType;
  isProUser: boolean;
  status: CheckoutStatus;
  errorMessage: string | null;
  onStatusChange: (status: CheckoutStatus) => void;
  onErrorChange: (error: string | null) => void;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CheckoutForm({
  reviewRequestId,
  breakdown,
  isProUser,
  status,
  errorMessage,
  onStatusChange,
  onErrorChange,
  onSuccess,
  onCancel,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    onStatusChange("processing");
    onErrorChange(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/review/${reviewRequestId}/payment-success`,
      },
      redirect: "if_required",
    });

    if (error) {
      onErrorChange(error.message || "Payment failed. Please try again.");
      onStatusChange("error");
    } else {
      onStatusChange("success");
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment breakdown */}
      <PaymentBreakdown
        perReviewAmount={breakdown.per_review_amount}
        reviewsRequested={breakdown.reviews_requested}
        subtotal={breakdown.subtotal}
        discountPercent={breakdown.discount_percent}
        discountAmount={breakdown.discount_amount}
        total={breakdown.total}
        platformFee={breakdown.platform_fee}
        reviewerEarnings={breakdown.reviewer_earnings}
        isProUser={isProUser}
      />

      {/* Payment element */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          Payment Details
        </div>
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Security notice */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4" />
        <span>Your payment is secured by Stripe. Critvue never stores your card details.</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={status === "processing"}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !elements || status === "processing"}
          className="flex-1"
        >
          {status === "processing" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>Pay ${Number(breakdown.total).toFixed(2)}</>
          )}
        </Button>
      </div>
    </form>
  );
}

export default CheckoutForm;
