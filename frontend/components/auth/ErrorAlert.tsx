/**
 * Error Alert Component
 * Displays error messages with proper styling and accessibility
 * Uses Critvue's destructive color scheme
 */

import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorAlert({ message, onDismiss, className }: ErrorAlertProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4",
        className
      )}
    >
      <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" aria-hidden="true" />
      <div className="flex-1 text-sm text-foreground">
        {message}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors rounded-md touch-manipulation"
          aria-label="Dismiss error"
        >
          <X className="size-5" />
        </button>
      )}
    </div>
  );
}
