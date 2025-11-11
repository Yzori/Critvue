/**
 * Success Alert Component
 * Displays success messages with proper styling and accessibility
 */

import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessAlertProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function SuccessAlert({ message, onDismiss, className }: SuccessAlertProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4",
        className
      )}
    >
      <CheckCircle2 className="size-5 shrink-0 text-green-600 mt-0.5" aria-hidden="true" />
      <div className="flex-1 text-sm text-green-900">
        {message}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 p-2 -mr-2 text-green-600 hover:text-green-800 transition-colors rounded-md touch-manipulation"
          aria-label="Dismiss message"
        >
          <X className="size-5" />
        </button>
      )}
    </div>
  );
}
