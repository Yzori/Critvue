"use client";

/**
 * Expert Review Checkout Component
 *
 * Full checkout flow for expert reviews with:
 * - Payment breakdown preview
 * - Stripe Payment Element
 * - Success/error states
 * - Loading states
 *
 * This component manages its own clientSecret and wraps the payment form
 * in Elements context once ready.
 */

import { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, CreditCard, ShieldCheck } from "lucide-react";
import { PaymentBreakdown } from "./PaymentBreakdown";
import { stripeAppearance } from "./StripeProvider";
import {
  createPaymentIntent,
  calculatePayment,
  PaymentBreakdown as PaymentBreakdownType,
} from "@/lib/api/payments";
import { CheckoutForm } from "./CheckoutForm";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface ExpertReviewCheckoutProps {
  reviewRequestId: number;
  budget: number;
  reviewsRequested: number;
  isProUser: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

type CheckoutStatus = "loading" | "ready" | "processing" | "success" | "error";

export function ExpertReviewCheckout({
  reviewRequestId,
  budget,
  reviewsRequested,
  isProUser,
  onSuccess,
  onCancel,
}: ExpertReviewCheckoutProps) {
  const [status, setStatus] = useState<CheckoutStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<PaymentBreakdownType | null>(null);

  // Calculate payment breakdown on mount
  useEffect(() => {
    async function fetchBreakdown() {
      try {
        const response = await calculatePayment({
          budget,
          reviews_requested: reviewsRequested,
          apply_pro_discount: isProUser,
        });
        setBreakdown(response.breakdown);
      } catch (error) {
        console.error("Error calculating payment:", error);
        setErrorMessage("Failed to calculate payment. Please try again.");
        setStatus("error");
      }
    }

    fetchBreakdown();
  }, [budget, reviewsRequested, isProUser]);

  // Create payment intent
  useEffect(() => {
    async function fetchPaymentIntent() {
      try {
        const response = await createPaymentIntent({
          review_request_id: reviewRequestId,
        });
        setClientSecret(response.client_secret);
        setStatus("ready");
      } catch (error) {
        console.error("Error creating payment intent:", error);
        setErrorMessage("Failed to initialize payment. Please try again.");
        setStatus("error");
      }
    }

    if (breakdown) {
      fetchPaymentIntent();
    }
  }, [reviewRequestId, breakdown]);

  // Loading state
  if (status === "loading" || !breakdown) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Preparing checkout...</p>
      </div>
    );
  }

  // Success state
  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="rounded-full bg-green-100 p-3">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold">Payment Successful!</h3>
        <p className="text-sm text-muted-foreground text-center">
          Your expert review request is now live.
          <br />
          Reviewers will be able to claim it shortly.
        </p>
      </div>
    );
  }

  // Error state without clientSecret
  if (status === "error" && !clientSecret) {
    return (
      <div className="space-y-6">
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
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => window.location.reload()}
            className="flex-1"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Ready state - render Elements with clientSecret
  if (!clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Initializing payment...</p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: stripeAppearance,
      }}
    >
      <CheckoutForm
        reviewRequestId={reviewRequestId}
        breakdown={breakdown}
        isProUser={isProUser}
        status={status}
        errorMessage={errorMessage}
        onStatusChange={setStatus}
        onErrorChange={setErrorMessage}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}

export default ExpertReviewCheckout;
