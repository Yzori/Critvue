"use client";

/**
 * Login Page
 * User authentication with email/password
 * Includes "Remember me" and "Forgot password" options
 */

import { useState, useEffect, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/auth/FormField";
import { ErrorAlert } from "@/components/auth/ErrorAlert";
import { SocialLogin } from "@/components/auth/SocialLogin";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const searchParams = useSearchParams();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form validation errors
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  // Handle OAuth error redirects
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        google_auth_failed: "Google sign-in failed. Please try again.",
        account_inactive: "Your account is inactive. Please contact support.",
      };
      setError(errorMessages[errorParam] || "Sign-in failed. Please try again.");
    }
  }, [searchParams]);

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    const newErrors = {
      email: "",
      password: "",
    };

    // Email validation
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
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
      await login({ email, password });
      // Navigation happens in the login function
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Welcome back
        </h1>
        <p className="text-muted-foreground">
          Sign in to your Critvue account
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <ErrorAlert
          message={error}
          onDismiss={() => setError("")}
        />
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
            placeholder="Enter your password"
            autoComplete="current-password"
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

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer py-2 -ml-2 pl-2 touch-manipulation">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
              className="size-5 rounded border-border text-accent-blue focus:ring-accent-blue focus:ring-offset-0 min-w-[20px]"
            />
            <span className="text-sm text-foreground">Remember me</span>
          </label>

          <Link
            href="/password-reset/request"
            className="text-sm text-accent-blue hover:underline py-2 -mr-2 pr-2 touch-manipulation inline-block"
          >
            Forgot password?
          </Link>
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
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      {/* Social Login */}
      <SocialLogin disabled={isLoading} />

      {/* Sign Up Link */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Don't have an account? </span>
        <Link
          href="/register"
          className="text-accent-blue font-medium hover:underline"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
