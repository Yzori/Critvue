/**
 * FormField Component
 * Reusable form field with label, input, and error message
 * Follows Critvue design system with proper spacing and typography
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps extends React.ComponentProps<typeof Input> {
  label: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export function FormField({
  label,
  error,
  helperText,
  id,
  containerClassName,
  className,
  ...props
}: FormFieldProps) {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");
  const hasError = !!error;

  return (
    <div className={cn("space-y-2", containerClassName)}>
      <Label
        htmlFor={fieldId}
        className="text-sm font-medium text-foreground"
      >
        {label}
      </Label>
      <Input
        id={fieldId}
        aria-invalid={hasError}
        aria-describedby={
          hasError
            ? `${fieldId}-error`
            : helperText
              ? `${fieldId}-helper`
              : undefined
        }
        className={className}
        {...props}
      />
      {hasError && (
        <p
          id={`${fieldId}-error`}
          className="text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
      {!hasError && helperText && (
        <p
          id={`${fieldId}-helper`}
          className="text-sm text-muted-foreground"
        >
          {helperText}
        </p>
      )}
    </div>
  );
}
