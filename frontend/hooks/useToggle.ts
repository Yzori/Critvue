"use client";

import { useState, useCallback } from "react";

export interface UseToggleReturn {
  /** Current boolean value */
  value: boolean;
  /** Toggle the value */
  toggle: () => void;
  /** Set value to true */
  setTrue: () => void;
  /** Set value to false */
  setFalse: () => void;
  /** Set to specific value */
  set: (value: boolean) => void;
}

/**
 * Hook for managing boolean toggle state.
 * Replaces the common pattern of:
 *   const [isOpen, setIsOpen] = useState(false);
 *   const toggle = () => setIsOpen(prev => !prev);
 *
 * @example
 * // Basic toggle
 * const { value: isOpen, toggle, setFalse: close } = useToggle(false);
 * <button onClick={toggle}>Toggle</button>
 * <Modal open={isOpen} onClose={close} />
 *
 * @example
 * // Expansion state
 * const { value: isExpanded, toggle: toggleExpand } = useToggle(true);
 */
export function useToggle(initialValue: boolean = false): UseToggleReturn {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  const set = useCallback((newValue: boolean) => {
    setValue(newValue);
  }, []);

  return {
    value,
    toggle,
    setTrue,
    setFalse,
    set,
  };
}

/**
 * Hook for managing multiple related boolean states.
 * Useful for mutually exclusive toggles or grouped visibility states.
 *
 * @example
 * const { values, toggle, setOne, clearAll } = useToggles({
 *   showFilters: false,
 *   showSort: false,
 *   showSearch: true,
 * });
 *
 * // Only one can be open at a time
 * const openPanel = (key: string) => setOne(key, true, { exclusive: true });
 */
export function useToggles<K extends string>(
  initialValues: Record<K, boolean>
): {
  values: Record<K, boolean>;
  toggle: (key: K) => void;
  set: (key: K, value: boolean) => void;
  setOne: (key: K, value: boolean, options?: { exclusive?: boolean }) => void;
  setAll: (value: boolean) => void;
  reset: () => void;
} {
  const [values, setValues] = useState(initialValues);

  const toggle = useCallback((key: K) => {
    setValues((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const set = useCallback((key: K, value: boolean) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const setOne = useCallback(
    (key: K, value: boolean, options?: { exclusive?: boolean }) => {
      setValues((prev) => {
        if (options?.exclusive && value) {
          // Set all to false, then set the specified key to value
          const allFalse = Object.keys(prev).reduce(
            (acc, k) => ({ ...acc, [k]: false }),
            {} as Record<K, boolean>
          );
          return { ...allFalse, [key]: value };
        }
        return { ...prev, [key]: value };
      });
    },
    []
  );

  const setAll = useCallback((value: boolean) => {
    setValues((prev) =>
      Object.keys(prev).reduce(
        (acc, k) => ({ ...acc, [k]: value }),
        {} as Record<K, boolean>
      )
    );
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
  }, [initialValues]);

  return {
    values,
    toggle,
    set,
    setOne,
    setAll,
    reset,
  };
}
