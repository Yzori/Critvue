import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "dark:bg-input/30 border-input h-12 w-full min-w-0 rounded-lg border bg-transparent px-4 py-2 text-base shadow-xs",
        "outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm touch-manipulation",
        // Enhanced transitions
        "transition-all duration-200 ease-out",
        // Focus styles with accent-blue glow
        "focus-visible:border-accent-blue focus-visible:ring-accent-blue/20 focus-visible:ring-[3px]",
        "focus-visible:shadow-[0_0_0_3px_rgba(76,201,240,0.1),0_1px_2px_rgba(0,0,0,0.05)]",
        // Hover state (subtle)
        "hover:border-border-medium hover:bg-muted/30",
        // Error states
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
