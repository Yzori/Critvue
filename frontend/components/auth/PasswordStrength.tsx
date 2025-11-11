/**
 * Password Strength Indicator
 * Visual feedback for password strength with criteria checklist
 * Uses Critvue brand colors for status indication
 */

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
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

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = getPasswordStrength(password);

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
                  "flex size-4 items-center justify-center rounded-full",
                  passed ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
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
