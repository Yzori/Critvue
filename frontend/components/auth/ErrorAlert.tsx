/**
 * Error Alert Component
 * Compact inline error display with dismiss option
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
        "flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2",
        className
      )}
    >
      <AlertCircle className="size-4 shrink-0 text-destructive" aria-hidden="true" />
      <span className="flex-1 text-sm text-destructive font-medium">
        {message}
      </span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 p-1 -mr-1 text-destructive/60 hover:text-destructive transition-colors rounded touch-manipulation"
          aria-label="Dismiss error"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
