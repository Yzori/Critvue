"use client";

/**
 * Password Reset Page
 * Reset password with token from email
 */

import { useState, FormEvent, useEffect, Suspense } from "react";
import { useToggle, useFormState } from "@/hooks";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/auth/FormField";
import { ErrorAlert } from "@/components/auth/ErrorAlert";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { resetPassword } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";

function PasswordResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get token from URL
  const [token, setToken] = useState("");

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  // Form state using useFormState
  const form = useFormState({
    newPassword: "",
    confirmPassword: "",
  });

  // Boolean states using useToggle
  const showPasswordState = useToggle();
  const showConfirmPasswordState = useToggle();
  const loadingState = useToggle();
  const successState = useToggle();

  // Error states
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });

  // Convenient aliases
  const showPassword = showPasswordState.value;
  const showConfirmPassword = showConfirmPasswordState.value;
  const isLoading = loadingState.value;
  const success = successState.value;

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    const newErrors = {
      password: "",
      confirmPassword: "",
    };

    // Password validation
    if (!form.values.newPassword) {
      newErrors.password = "Password is required";
    } else if (form.values.newPassword.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    // Confirm password validation
    if (!form.values.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (form.values.newPassword !== form.values.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return !newErrors.password && !newErrors.confirmPassword;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Check if token exists
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
      return;
    }

    // Validate form
    if (!validateForm()) {
      return;
    }

    loadingState.setTrue();

    try {
      await resetPassword({
        token,
        new_password: form.values.newPassword,
      });
      successState.setTrue();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      loadingState.setFalse();
    }
  };

  // Success state
  if (success) {
    return (
      <div className="space-y-6">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="size-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="size-8 text-green-600" />
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Password reset successful
          </h1>
          <p className="text-muted-foreground">
            Your password has been successfully reset
          </p>
        </div>

        {/* Success Message */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          You can now sign in with your new password.
        </div>

        {/* Sign In Button */}
        <Button
          onClick={() => router.push("/login")}
          className="w-full"
        >
          Sign in to your account
        </Button>
      </div>
    );
  }

  // Invalid token state
  if (!token) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Invalid reset link
          </h1>
          <p className="text-muted-foreground">
            This password reset link is invalid or has expired
          </p>
        </div>

        {/* Error Message */}
        <ErrorAlert
          message="Please request a new password reset link to continue."
        />

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => router.push("/password-reset/request")}
            className="w-full"
          >
            Request new reset link
          </Button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-accent-blue hover:underline"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Reset form
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Set new password
        </h1>
        <p className="text-muted-foreground">
          Enter your new password below
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <ErrorAlert
          message={error}
          onDismiss={() => setError("")}
        />
      )}

      {/* Reset Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* New Password Field */}
        <div className="relative">
          <FormField
            label="New Password"
            type={showPassword ? "text" : "password"}
            value={form.values.newPassword}
            onChange={(e) => {
              form.setValue("newPassword", e.target.value);
              if (errors.password) setErrors({ ...errors, password: "" });
            }}
            error={errors.password}
            placeholder="Enter your new password"
            autoComplete="new-password"
            autoFocus
            required
            disabled={isLoading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={showPasswordState.toggle}
            className="absolute right-0 top-[2.125rem] p-3 text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="size-5" />
            ) : (
              <Eye className="size-5" />
            )}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {form.values.newPassword && <PasswordStrength password={form.values.newPassword} />}

        {/* Confirm Password Field */}
        <div className="relative">
          <FormField
            label="Confirm New Password"
            type={showConfirmPassword ? "text" : "password"}
            value={form.values.confirmPassword}
            onChange={(e) => {
              form.setValue("confirmPassword", e.target.value);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
            }}
            error={errors.confirmPassword}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            required
            disabled={isLoading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={showConfirmPasswordState.toggle}
            className="absolute right-0 top-[2.125rem] p-3 text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showConfirmPassword ? (
              <EyeOff className="size-5" />
            ) : (
              <Eye className="size-5" />
            )}
          </button>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Resetting password...
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>

      {/* Back to Login */}
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 px-1 -mx-1 touch-manipulation"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}

export default function PasswordResetPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-accent-blue" />
      </div>
    }>
      <PasswordResetContent />
    </Suspense>
  );
}
