"use client";

/**
 * Password Strength Indicator with HIBP Breach Detection
 * Visual feedback for password strength with criteria checklist
 * Checks password against Have I Been Pwned database
 * Uses Critvue brand colors for status indication
 */

import { useState, useEffect, useCallback } from "react";
import { Check, X, AlertTriangle, Loader2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
  onBreachStatusChange?: (isBreached: boolean) => void;
}

interface PasswordCriteria {
  label: string;
  test: (password: string) => boolean;
}

const criteria: PasswordCriteria[] = [
  {
    label: "At least 8 characters",
    test: (pwd) => pwd.length >= 8,
  },
  {
    label: "Contains uppercase letter",
    test: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    label: "Contains lowercase letter",
    test: (pwd) => /[a-z]/.test(pwd),
  },
  {
    label: "Contains number",
    test: (pwd) => /\d/.test(pwd),
  },
  {
    label: "Contains special character",
    test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
  },
];

/**
 * Check if password has been exposed in data breaches using HIBP API
 * Uses k-anonymity: only sends first 5 chars of SHA-1 hash
 */
async function checkPasswordBreach(password: string): Promise<{ breached: boolean; count: number }> {
  try {
    // Create SHA-1 hash of password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();

    // Send first 5 characters to HIBP API (k-anonymity)
    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        "Add-Padding": "true", // Adds padding to prevent timing attacks
      },
    });

    if (!response.ok) {
      console.error("HIBP API error:", response.status);
      return { breached: false, count: 0 };
    }

    const text = await response.text();
    const lines = text.split("\n");

    for (const line of lines) {
      const [hashSuffix, count] = line.split(":");
      if (hashSuffix.trim() === suffix) {
        return { breached: true, count: parseInt(count.trim(), 10) };
      }
    }

    return { breached: false, count: 0 };
  } catch (error) {
    console.error("Failed to check password breach:", error);
    return { breached: false, count: 0 };
  }
}

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!password) {
    return { score: 0, label: "Enter a password", color: "bg-border-medium" };
  }

  const passedCriteria = criteria.filter((c) => c.test(password)).length;
  const score = (passedCriteria / criteria.length) * 100;

  if (score < 40) {
    return { score, label: "Weak", color: "bg-destructive" };
  } else if (score < 80) {
    return { score, label: "Medium", color: "bg-accent-peach" };
  } else {
    return { score, label: "Strong", color: "bg-green-500" };
  }
}

export function PasswordStrength({ password, onBreachStatusChange }: PasswordStrengthProps) {
  const [breachStatus, setBreachStatus] = useState<{
    checked: boolean;
    loading: boolean;
    breached: boolean;
    count: number;
  }>({
    checked: false,
    loading: false,
    breached: false,
    count: 0,
  });

  const strength = getPasswordStrength(password);

  // Debounced breach check
  const checkBreach = useCallback(async (pwd: string) => {
    if (pwd.length < 8) {
      setBreachStatus({ checked: false, loading: false, breached: false, count: 0 });
      return;
    }

    setBreachStatus((prev) => ({ ...prev, loading: true }));
    const result = await checkPasswordBreach(pwd);
    setBreachStatus({
      checked: true,
      loading: false,
      breached: result.breached,
      count: result.count,
    });
    onBreachStatusChange?.(result.breached);
  }, [onBreachStatusChange]);

  useEffect(() => {
    if (!password || password.length < 8) {
      setBreachStatus({ checked: false, loading: false, breached: false, count: 0 });
      return;
    }

    // Debounce the API call
    const timer = setTimeout(() => {
      checkBreach(password);
    }, 500);

    return () => clearTimeout(timer);
  }, [password, checkBreach]);

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Password strength</span>
          <span
            className={cn(
              "font-medium",
              strength.score < 40 && "text-destructive",
              strength.score >= 40 && strength.score < 80 && "text-accent-peach",
              strength.score >= 80 && "text-green-600"
            )}
          >
            {strength.label}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              strength.color
            )}
            style={{ width: `${strength.score}%` }}
            role="progressbar"
            aria-valuenow={strength.score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Password strength"
          />
        </div>
      </div>

      {/* Breach Status */}
      {password.length >= 8 && (
        <div
          className={cn(
            "flex items-center gap-2 p-3 rounded-lg text-sm transition-all duration-300",
            breachStatus.loading && "bg-muted/50",
            breachStatus.checked && breachStatus.breached && "bg-destructive/10 border border-destructive/20",
            breachStatus.checked && !breachStatus.breached && "bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-900"
          )}
        >
          {breachStatus.loading ? (
            <>
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Checking password security...</span>
            </>
          ) : breachStatus.checked ? (
            breachStatus.breached ? (
              <>
                <AlertTriangle className="size-4 text-destructive flex-shrink-0" />
                <div>
                  <span className="text-destructive font-medium">Password found in data breach</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    This password appeared in {breachStatus.count.toLocaleString()} breaches. Choose a different password.
                  </p>
                </div>
              </>
            ) : (
              <>
                <Shield className="size-4 text-green-600 flex-shrink-0" />
                <span className="text-green-700 dark:text-green-400">Password not found in known breaches</span>
              </>
            )
          ) : null}
        </div>
      )}

      {/* Criteria Checklist */}
      <div className="space-y-1.5">
        {criteria.map((criterion, index) => {
          const passed = criterion.test(password);
          return (
            <div
              key={index}
              className="flex items-center gap-2 text-sm"
            >
              <div
                className={cn(
                  "flex size-4 items-center justify-center rounded-full transition-all duration-200",
                  passed ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400" : "bg-muted text-muted-foreground"
                )}
              >
                {passed ? (
                  <Check className="size-3" strokeWidth={3} />
                ) : (
                  <X className="size-3" strokeWidth={2} />
                )}
              </div>
              <span
                className={cn(
                  "transition-colors",
                  passed ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {criterion.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
