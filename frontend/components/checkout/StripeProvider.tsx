"use client";

/**
 * Stripe Provider Component
 *
 * Provides Stripe Elements context for payment forms.
 * Loads Stripe.js with the publishable key from environment.
 *
 * NOTE: This provider should only render children after clientSecret is available.
 * Without a clientSecret, it renders children without Elements context (for loading states).
 */

import { ReactNode } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, Appearance } from "@stripe/stripe-js";

// Initialize Stripe with publishable key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

// Stripe Elements appearance theme
export const stripeAppearance: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#6366f1", // Indigo-500
    colorBackground: "#ffffff",
    colorText: "#1f2937",
    colorDanger: "#ef4444",
    fontFamily: "Inter, system-ui, sans-serif",
    spacingUnit: "4px",
    borderRadius: "8px",
  },
  rules: {
    ".Input": {
      border: "1px solid #e5e7eb",
      boxShadow: "none",
    },
    ".Input:focus": {
      border: "1px solid #6366f1",
      boxShadow: "0 0 0 1px #6366f1",
    },
    ".Label": {
      fontWeight: "500",
      fontSize: "14px",
    },
  },
};

interface StripeProviderProps {
  children: ReactNode;
  clientSecret?: string;
}

/**
 * StripeProvider wraps children with Stripe Elements context.
 *
 * - If clientSecret is provided, mounts Elements with that secret
 * - If no clientSecret, renders children without Elements (for loading states)
 */
export function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  // Only mount Elements when we have a clientSecret
  if (!clientSecret) {
    return <>{children}</>;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: stripeAppearance,
      }}
    >
      {children}
    </Elements>
  );
}

export default StripeProvider;
