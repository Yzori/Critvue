import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

/**
 * Progress Component - Modern 2025 Design
 *
 * A visual indicator for completion status with smooth animations.
 * Built on Radix UI Progress for full accessibility.
 */

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /**
   * Progress value (0-100)
   */
  value?: number;
  /**
   * Visual variant for different contexts
   */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gradient';
  /**
   * Show animated stripes (for loading/in-progress states)
   */
  showStripes?: boolean;
  /**
   * Size of the progress bar
   */
  size?: 'sm' | 'md' | 'lg';
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(
  (
    {
      className,
      value = 0,
      variant = 'default',
      showStripes = false,
      size = 'md',
      ...props
    },
    ref
  ) => {
    const clampedValue = Math.min(100, Math.max(0, value || 0));

    return (
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-gray-100',
          size === 'sm' && 'h-1',
          size === 'md' && 'h-2',
          size === 'lg' && 'h-3',
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            'h-full w-full flex-1 transition-all duration-500 ease-out',
            variant === 'default' && 'bg-accent-blue',
            variant === 'success' && 'bg-green-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'error' && 'bg-red-500',
            variant === 'gradient' &&
              'bg-gradient-to-r from-accent-blue via-accent-peach to-accent-blue bg-[length:200%_100%] animate-gradient',
            showStripes &&
              'bg-stripe-pattern animate-stripe-scroll'
          )}
          style={{ transform: `translateX(-${100 - clampedValue}%)` }}
        />
      </ProgressPrimitive.Root>
    );
  }
);

Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
