"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export interface UseAsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseAsyncReturn<T> extends UseAsyncState<T> {
  /** Re-execute the async function */
  refetch: () => Promise<void>;
  /** Manually set data */
  setData: React.Dispatch<React.SetStateAction<T | null>>;
  /** Reset to initial state */
  reset: () => void;
  /** Check if currently executing */
  isExecuting: boolean;
}

export interface UseAsyncOptions {
  /** Execute immediately on mount (default: true) */
  immediate?: boolean;
  /** Initial loading state (default: true if immediate) */
  initialLoading?: boolean;
  /** Callback on success */
  onSuccess?: (data: unknown) => void;
  /** Callback on error */
  onError?: (error: string) => void;
}

/**
 * Hook for managing async operations with loading, error, and data states.
 * Replaces the common pattern of:
 *   const [data, setData] = useState(null);
 *   const [isLoading, setIsLoading] = useState(true);
 *   const [error, setError] = useState(null);
 *
 * @example
 * // Basic usage - executes immediately
 * const { data, isLoading, error, refetch } = useAsync(() => fetchUser(userId));
 *
 * @example
 * // Deferred execution
 * const { data, isLoading, execute } = useAsync(() => submitForm(formData), { immediate: false });
 * const handleSubmit = () => execute();
 *
 * @example
 * // With callbacks
 * const { data } = useAsync(() => fetchData(), {
 *   onSuccess: (data) => toast.success("Loaded!"),
 *   onError: (err) => toast.error(err),
 * });
 */
export function useAsync<T>(
  asyncFn: () => Promise<T>,
  options: UseAsyncOptions = {}
): UseAsyncReturn<T> {
  const {
    immediate = true,
    initialLoading = immediate,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Track mounted state to prevent state updates after unmount
  const mountedRef = useRef(true);
  // Track the async function to handle stale closures
  const asyncFnRef = useRef(asyncFn);
  asyncFnRef.current = asyncFn;

  const execute = useCallback(async () => {
    if (!mountedRef.current) return;

    setIsLoading(true);
    setIsExecuting(true);
    setError(null);

    try {
      const result = await asyncFnRef.current();
      if (mountedRef.current) {
        setData(result);
        onSuccess?.(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsExecuting(false);
      }
    }
  }, [onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setIsExecuting(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) {
      execute();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [immediate, execute]);

  return {
    data,
    isLoading,
    error,
    isExecuting,
    refetch: execute,
    setData,
    reset,
  };
}

/**
 * Variant for async functions that take parameters.
 * Execute is called manually with arguments.
 *
 * @example
 * const { execute, isLoading } = useAsyncCallback(async (id: string) => {
 *   return await deleteItem(id);
 * });
 * const handleDelete = (id: string) => execute(id);
 */
export function useAsyncCallback<T, Args extends unknown[]>(
  asyncFn: (...args: Args) => Promise<T>,
  options: Omit<UseAsyncOptions, "immediate"> = {}
): UseAsyncReturn<T> & { execute: (...args: Args) => Promise<T | undefined> } {
  const { onSuccess, onError } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const mountedRef = useRef(true);
  const asyncFnRef = useRef(asyncFn);
  asyncFnRef.current = asyncFn;

  const execute = useCallback(
    async (...args: Args): Promise<T | undefined> => {
      if (!mountedRef.current) return;

      setIsLoading(true);
      setIsExecuting(true);
      setError(null);

      try {
        const result = await asyncFnRef.current(...args);
        if (mountedRef.current) {
          setData(result);
          onSuccess?.(result);
        }
        return result;
      } catch (err) {
        if (mountedRef.current) {
          const errorMessage = getErrorMessage(err);
          setError(errorMessage);
          onError?.(errorMessage);
        }
        return undefined;
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
          setIsExecuting(false);
        }
      }
    },
    [onSuccess, onError]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setIsExecuting(false);
  }, []);

  const refetch = useCallback(async () => {
    // For callback version, refetch doesn't make sense without args
    // This is here to satisfy the interface
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    isExecuting,
    execute,
    refetch,
    setData,
    reset,
  };
}

// Helper to extract error message from unknown error type
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "An unexpected error occurred";
}
