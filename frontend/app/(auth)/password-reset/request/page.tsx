"use client";

/**
 * Password Reset Request Page
 * Request password reset link via email
 */

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/auth/FormField";
import { ErrorAlert } from "@/components/auth/ErrorAlert";
import { SuccessAlert } from "@/components/auth/SuccessAlert";
import { requestPasswordReset } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

export default function PasswordResetRequestPage() {
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState("");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form validation errors
  const [emailError, setEmailError] = useState("");

  /**
   * Validate email field
   */
  const validateEmail = (): boolean => {
    if (!email) {
      setEmailError("Email is required");
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate email
    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);

    try {
      await requestPasswordReset({ email });
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="space-y-6">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="size-16 rounded-full bg-green-100 flex items-center justify-center">
            <Mail className="size-8 text-green-600" />
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Check your email
          </h1>
          <p className="text-muted-foreground">
            We've sent password reset instructions to <strong>{email}</strong>
          </p>
        </div>

        {/* Instructions */}
        <SuccessAlert
          message="If an account exists with this email, you will receive a password reset link shortly."
        />

        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            Click the link in the email to reset your password. The link will expire in 1 hour.
          </p>
          <p>
            Didn't receive the email? Check your spam folder or{" "}
            <button
              onClick={() => setSuccess(false)}
              className="text-accent-blue hover:underline font-medium"
            >
              try again
            </button>
            .
          </p>
        </div>

        {/* Back to Login */}
        <Button
          onClick={() => router.push("/login")}
          variant="outline"
          className="w-full"
        >
          <ArrowLeft className="size-4" />
          Back to login
        </Button>
      </div>
    );
  }

  // Request form
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Reset your password
        </h1>
        <p className="text-muted-foreground">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <ErrorAlert
          message={error}
          onDismiss={() => setError("")}
        />
      )}

      {/* Reset Request Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email Field */}
        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError("");
          }}
          error={emailError}
          placeholder="you@example.com"
          autoComplete="email"
          autoFocus
          required
          disabled={isLoading}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Sending reset link...
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>

      {/* Back to Login */}
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 px-1 -mx-1 touch-manipulation"
        >
          <ArrowLeft className="size-4" />
          Back to login
        </Link>
      </div>
    </div>
  );
}
