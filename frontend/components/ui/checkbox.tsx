/**
 * Checkbox Component
 * Custom checkbox following Critvue design system
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.ComponentProps<"input"> {
  label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={checkboxId}
          ref={ref}
          className={cn(
            "size-4 rounded border-border text-accent-blue",
            "focus:ring-2 focus:ring-accent-blue focus:ring-offset-0",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "cursor-pointer transition-colors",
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={checkboxId}
            className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
