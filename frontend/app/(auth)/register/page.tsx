"use client";

/**
 * Registration Page
 * New user registration with validation and password strength indicator
 * Includes terms of service acceptance
 */

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/auth/FormField";
import { ErrorAlert } from "@/components/auth/ErrorAlert";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { SocialLogin } from "@/components/auth/SocialLogin";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form validation errors
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: "",
  });

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    const newErrors = {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: "",
    };

    // Full name validation
    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    }

    // Email validation
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Terms acceptance validation
    if (!acceptTerms) {
      newErrors.terms = "You must accept the terms and conditions";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => !error);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email,
        password,
        full_name: fullName.trim(),
      });
      // Navigation happens in the register function
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Create your account
        </h1>
        <p className="text-muted-foreground">
          Join Critvue and get feedback on your creative work
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <ErrorAlert
          message={error}
          onDismiss={() => setError("")}
        />
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Full Name Field */}
        <FormField
          label="Full Name"
          type="text"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (errors.fullName) setErrors({ ...errors, fullName: "" });
          }}
          error={errors.fullName}
          placeholder="John Doe"
          autoComplete="name"
          required
          disabled={isLoading}
        />

        {/* Email Field */}
        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors({ ...errors, email: "" });
          }}
          error={errors.email}
          placeholder="you@example.com"
          autoComplete="email"
          required
          disabled={isLoading}
        />

        {/* Password Field */}
        <div className="relative">
          <FormField
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors({ ...errors, password: "" });
            }}
            error={errors.password}
            placeholder="Create a strong password"
            autoComplete="new-password"
            required
            disabled={isLoading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
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
        {password && <PasswordStrength password={password} />}

        {/* Confirm Password Field */}
        <div className="relative">
          <FormField
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
            }}
            error={errors.confirmPassword}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            required
            disabled={isLoading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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

        {/* Terms of Service */}
        <div className="space-y-2">
          <label className="flex items-start gap-3 cursor-pointer py-2 -ml-2 pl-2 group touch-manipulation">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => {
                setAcceptTerms(e.target.checked);
                if (errors.terms) setErrors({ ...errors, terms: "" });
              }}
              disabled={isLoading}
              aria-invalid={!!errors.terms}
              className="mt-0.5 size-5 rounded border-border text-accent-blue focus:ring-accent-blue focus:ring-offset-0 flex-shrink-0 min-w-[20px]"
            />
            <span className="text-sm text-foreground">
              I agree to the{" "}
              <Link
                href="/terms"
                className="text-accent-blue hover:underline"
                target="_blank"
                onClick={(e) => e.stopPropagation()}
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-accent-blue hover:underline"
                target="_blank"
                onClick={(e) => e.stopPropagation()}
              >
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.terms && (
            <p className="text-sm text-destructive" role="alert">
              {errors.terms}
            </p>
          )}
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
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      {/* Social Login */}
      <SocialLogin disabled={isLoading} />

      {/* Sign In Link */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link
          href="/login"
          className="text-accent-blue font-medium hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
