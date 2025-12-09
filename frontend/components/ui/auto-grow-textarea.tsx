"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AutoGrowTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  minRows?: number;
  maxRows?: number;
  showCharCount?: boolean;
  maxChars?: number;
  charCountPosition?: "inside" | "outside";
}

const AutoGrowTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutoGrowTextareaProps
>(
  (
    {
      className,
      value,
      onChange,
      minRows = 2,
      maxRows = 8,
      showCharCount = false,
      maxChars,
      charCountPosition = "inside",
      placeholder,
      disabled,
      ...props
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const [isFocused, setIsFocused] = React.useState(false);

    // Combine refs
    React.useImperativeHandle(ref, () => textareaRef.current!);

    // Calculate line height and adjust height
    React.useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Reset height to calculate proper scrollHeight
      textarea.style.height = "auto";

      // Get computed styles
      const computedStyle = getComputedStyle(textarea);
      const lineHeight = parseFloat(computedStyle.lineHeight) || 24;
      const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
      const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
      const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
      const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;

      const minHeight =
        lineHeight * minRows + paddingTop + paddingBottom + borderTop + borderBottom;
      const maxHeight =
        lineHeight * maxRows + paddingTop + paddingBottom + borderTop + borderBottom;

      // Set new height based on content
      const newHeight = Math.min(
        Math.max(textarea.scrollHeight, minHeight),
        maxHeight
      );
      textarea.style.height = `${newHeight}px`;

      // Enable overflow when at max height
      textarea.style.overflowY =
        textarea.scrollHeight > maxHeight ? "auto" : "hidden";
    }, [value, minRows, maxRows]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (maxChars && newValue.length > maxChars) return;
      onChange(newValue);
    };

    const charCount = value.length;
    const isNearLimit = maxChars && charCount > maxChars * 0.9;
    const isAtLimit = maxChars && charCount >= maxChars;

    return (
      <div className="relative w-full">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            // Base styles
            "w-full rounded-xl border-2 bg-background backdrop-blur-sm px-4 py-3",
            "text-base text-foreground leading-relaxed transition-all duration-200",
            "placeholder:text-muted-foreground/60",
            // Focus styles
            "focus:outline-none focus:ring-0 focus:border-accent-blue",
            // Scrollbar styling
            "scrollbar-thin scrollbar-thumb-rounded-full",
            "scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent",
            // Disabled
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
            // Resize behavior
            "resize-none overflow-hidden",
            className
          )}
          style={{
            minHeight: `${minRows * 1.5 + 1.5}rem`,
          }}
          {...props}
        />

        {/* Character count */}
        {showCharCount && (
          <div
            className={cn(
              "text-xs transition-opacity duration-200",
              charCountPosition === "inside"
                ? "absolute bottom-2 right-3 pointer-events-none"
                : "mt-1.5 text-right pr-1",
              isFocused || charCount > 0 ? "opacity-100" : "opacity-0",
              isAtLimit
                ? "text-red-500 font-medium"
                : isNearLimit
                  ? "text-amber-500"
                  : "text-muted-foreground/60"
            )}
          >
            {charCount}
            {maxChars && ` / ${maxChars}`}
          </div>
        )}
      </div>
    );
  }
);

AutoGrowTextarea.displayName = "AutoGrowTextarea";

export { AutoGrowTextarea };
