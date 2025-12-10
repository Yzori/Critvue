"use client";

import { useState, useCallback, useMemo, ChangeEvent } from "react";

export type ValidationRule<T> = {
  validate: (value: T[keyof T], values: T) => boolean;
  message: string;
};

export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

export interface UseFormStateReturn<T extends Record<string, unknown>> {
  /** Current form values */
  values: T;
  /** Current validation errors by field */
  errors: Partial<Record<keyof T, string>>;
  /** Whether form has been modified */
  isDirty: boolean;
  /** Whether form is currently submitting */
  isSubmitting: boolean;
  /** Update a single field value */
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  /** Update multiple field values */
  setValues: (values: Partial<T>) => void;
  /** Get change handler for input elements */
  getInputProps: (field: keyof T) => {
    value: T[keyof T];
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  };
  /** Set a field error */
  setError: (field: keyof T, message: string | null) => void;
  /** Set multiple field errors */
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  /** Clear all errors */
  clearErrors: () => void;
  /** Validate all fields and return whether valid */
  validate: () => boolean;
  /** Validate a single field */
  validateField: (field: keyof T) => boolean;
  /** Reset form to initial values */
  reset: () => void;
  /** Reset to specific values */
  resetTo: (values: T) => void;
  /** Set submitting state */
  setSubmitting: (isSubmitting: boolean) => void;
  /** Handle form submission with validation */
  handleSubmit: (
    onSubmit: (values: T) => void | Promise<void>
  ) => (e?: React.FormEvent) => Promise<void>;
}

export interface UseFormStateOptions<T extends Record<string, unknown>> {
  /** Validation rules for fields */
  validationRules?: ValidationRules<T>;
  /** Validate on field change (default: false) */
  validateOnChange?: boolean;
  /** Validate on field blur (default: false) */
  validateOnBlur?: boolean;
  /** Callback when values change */
  onChange?: (values: T) => void;
}

/**
 * Hook for managing form state with validation.
 * Replaces the common pattern of multiple useState for form fields.
 *
 * @example
 * // Basic usage
 * const form = useFormState({
 *   name: "",
 *   email: "",
 *   message: "",
 * });
 *
 * <input {...form.getInputProps("name")} />
 * <input {...form.getInputProps("email")} />
 * {form.errors.email && <span>{form.errors.email}</span>}
 *
 * @example
 * // With validation
 * const form = useFormState(
 *   { email: "", password: "" },
 *   {
 *     validationRules: {
 *       email: [
 *         { validate: (v) => !!v, message: "Email is required" },
 *         { validate: (v) => v.includes("@"), message: "Invalid email" },
 *       ],
 *       password: [
 *         { validate: (v) => v.length >= 8, message: "Min 8 characters" },
 *       ],
 *     },
 *   }
 * );
 *
 * <form onSubmit={form.handleSubmit(async (values) => {
 *   await submitForm(values);
 * })}>
 */
export function useFormState<T extends Record<string, unknown>>(
  initialValues: T,
  options: UseFormStateOptions<T> = {}
): UseFormStateReturn<T> {
  const {
    validationRules = {} as ValidationRules<T>,
    validateOnChange = false,
    onChange,
  } = options;

  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrorsState] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setSubmitting] = useState(false);
  const [initialValuesRef] = useState(initialValues);

  const isDirty = useMemo(() => {
    return Object.keys(values).some(
      (key) => values[key as keyof T] !== initialValuesRef[key as keyof T]
    );
  }, [values, initialValuesRef]);

  const validateField = useCallback(
    (field: keyof T): boolean => {
      const rules = validationRules[field];
      if (!rules) return true;

      for (const rule of rules) {
        // Cast to avoid complex generic type inference issues
        const validateFn = rule.validate as (value: unknown, values: T) => boolean;
        if (!validateFn(values[field], values)) {
          setErrorsState((prev) => ({ ...prev, [field]: rule.message }));
          return false;
        }
      }

      setErrorsState((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      return true;
    },
    [values, validationRules]
  );

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    for (const field of Object.keys(validationRules) as (keyof T)[]) {
      const rules = validationRules[field];
      if (!rules) continue;

      for (const rule of rules) {
        // Cast to avoid complex generic type inference issues
        const validateFn = rule.validate as (value: unknown, values: T) => boolean;
        if (!validateFn(values[field], values)) {
          newErrors[field] = rule.message;
          isValid = false;
          break;
        }
      }
    }

    setErrorsState(newErrors);
    return isValid;
  }, [values, validationRules]);

  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValuesState((prev) => {
        const newValues = { ...prev, [field]: value };
        onChange?.(newValues);
        return newValues;
      });

      // Clear error for this field
      setErrorsState((prev) => {
        if (prev[field]) {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        }
        return prev;
      });

      if (validateOnChange) {
        // Validate after state update
        setTimeout(() => validateField(field), 0);
      }
    },
    [onChange, validateOnChange, validateField]
  );

  const setValues = useCallback(
    (newValues: Partial<T>) => {
      setValuesState((prev) => {
        const updated = { ...prev, ...newValues };
        onChange?.(updated);
        return updated;
      });
    },
    [onChange]
  );

  const getInputProps = useCallback(
    (field: keyof T) => ({
      value: values[field] as T[keyof T],
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
        setValue(field, value as T[keyof T]);
      },
    }),
    [values, setValue]
  );

  const setError = useCallback((field: keyof T, message: string | null) => {
    setErrorsState((prev) => {
      if (message === null) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return { ...prev, [field]: message };
    });
  }, []);

  const setErrors = useCallback(
    (newErrors: Partial<Record<keyof T, string>>) => {
      setErrorsState((prev) => ({ ...prev, ...newErrors }));
    },
    []
  );

  const clearErrors = useCallback(() => {
    setErrorsState({});
  }, []);

  const reset = useCallback(() => {
    setValuesState(initialValuesRef);
    setErrorsState({});
    setSubmitting(false);
  }, [initialValuesRef]);

  const resetTo = useCallback((newValues: T) => {
    setValuesState(newValues);
    setErrorsState({});
    setSubmitting(false);
  }, []);

  const handleSubmit = useCallback(
    (onSubmit: (values: T) => void | Promise<void>) => {
      return async (e?: React.FormEvent) => {
        e?.preventDefault();

        if (!validate()) {
          return;
        }

        setSubmitting(true);
        try {
          await onSubmit(values);
        } finally {
          setSubmitting(false);
        }
      };
    },
    [validate, values]
  );

  return {
    values,
    errors,
    isDirty,
    isSubmitting,
    setValue,
    setValues,
    getInputProps,
    setError,
    setErrors,
    clearErrors,
    validate,
    validateField,
    reset,
    resetTo,
    setSubmitting,
    handleSubmit,
  };
}

/**
 * Hook for managing file input state with preview support.
 *
 * @example
 * const imageUpload = useFileState({
 *   accept: "image/*",
 *   maxSize: 5 * 1024 * 1024, // 5MB
 * });
 *
 * <input type="file" onChange={imageUpload.handleChange} />
 * {imageUpload.preview && <img src={imageUpload.preview} />}
 * {imageUpload.error && <span>{imageUpload.error}</span>}
 */
export function useFileState(options: {
  accept?: string;
  maxSize?: number;
  onSelect?: (file: File) => void;
} = {}): {
  file: File | null;
  preview: string | null;
  error: string | null;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  clear: () => void;
  setFile: (file: File | null) => void;
} {
  const { accept, maxSize, onSelect } = options;
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0] || null;
      setError(null);

      if (!selectedFile) {
        setFile(null);
        setPreview(null);
        return;
      }

      // Validate file type
      if (accept) {
        const acceptedTypes = accept.split(",").map((t) => t.trim());
        const isValidType = acceptedTypes.some((type) => {
          if (type.endsWith("/*")) {
            return selectedFile.type.startsWith(type.replace("/*", "/"));
          }
          return selectedFile.type === type || selectedFile.name.endsWith(type);
        });

        if (!isValidType) {
          setError(`Invalid file type. Accepted: ${accept}`);
          return;
        }
      }

      // Validate file size
      if (maxSize && selectedFile.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
        setError(`File too large. Max size: ${maxSizeMB}MB`);
        return;
      }

      setFile(selectedFile);

      // Create preview for images
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }

      onSelect?.(selectedFile);
    },
    [accept, maxSize, onSelect]
  );

  const clear = useCallback(() => {
    setFile(null);
    setPreview(null);
    setError(null);
  }, []);

  return {
    file,
    preview,
    error,
    handleChange,
    clear,
    setFile,
  };
}
