"use client";

import { useState, useCallback, useMemo } from "react";

export interface UseSelectionReturn<T> {
  /** Set of selected items */
  selected: Set<T>;
  /** Array of selected items */
  selectedArray: T[];
  /** Number of selected items */
  count: number;
  /** Whether max selection limit reached */
  isMaxReached: boolean;
  /** Check if an item is selected */
  isSelected: (item: T) => boolean;
  /** Toggle an item's selection */
  toggle: (item: T) => void;
  /** Select an item */
  select: (item: T) => void;
  /** Deselect an item */
  deselect: (item: T) => void;
  /** Select multiple items */
  selectMany: (items: T[]) => void;
  /** Deselect multiple items */
  deselectMany: (items: T[]) => void;
  /** Select all items from a list */
  selectAll: (items: T[]) => void;
  /** Clear all selections */
  clear: () => void;
  /** Reset to initial selection */
  reset: () => void;
  /** Replace selection with new items */
  setSelection: (items: T[]) => void;
}

export interface UseSelectionOptions<T> {
  /** Maximum number of items that can be selected */
  maxSelection?: number;
  /** Callback when selection changes */
  onChange?: (selected: T[]) => void;
}

/**
 * Hook for managing item selection state.
 * Replaces the common pattern of:
 *   const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
 *   const handleToggle = (id) => { ... }
 *
 * @example
 * // Basic selection
 * const { selected, toggle, isSelected, clear } = useSelection<number>();
 *
 * items.map(item => (
 *   <Checkbox
 *     checked={isSelected(item.id)}
 *     onChange={() => toggle(item.id)}
 *   />
 * ))
 *
 * @example
 * // With max selection
 * const { toggle, isMaxReached } = useSelection<string>({
 *   maxSelection: 5,
 * });
 *
 * @example
 * // With initial selection and onChange
 * const selection = useSelection<number>([1, 2, 3], {
 *   onChange: (selected) => updateFilter(selected),
 * });
 */
export function useSelection<T>(
  initialSelected: T[] = [],
  options: UseSelectionOptions<T> = {}
): UseSelectionReturn<T> {
  const { maxSelection, onChange } = options;

  const [selected, setSelected] = useState<Set<T>>(
    () => new Set(initialSelected)
  );

  const selectedArray = useMemo(() => Array.from(selected), [selected]);
  const count = selected.size;
  const isMaxReached = maxSelection !== undefined && count >= maxSelection;

  const isSelected = useCallback((item: T) => selected.has(item), [selected]);

  const updateSelection = useCallback(
    (newSet: Set<T>) => {
      setSelected(newSet);
      onChange?.(Array.from(newSet));
    },
    [onChange]
  );

  const toggle = useCallback(
    (item: T) => {
      setSelected((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(item)) {
          newSet.delete(item);
        } else if (!maxSelection || newSet.size < maxSelection) {
          newSet.add(item);
        }
        onChange?.(Array.from(newSet));
        return newSet;
      });
    },
    [maxSelection, onChange]
  );

  const select = useCallback(
    (item: T) => {
      setSelected((prev) => {
        if (prev.has(item)) return prev;
        if (maxSelection && prev.size >= maxSelection) return prev;
        const newSet = new Set(prev);
        newSet.add(item);
        onChange?.(Array.from(newSet));
        return newSet;
      });
    },
    [maxSelection, onChange]
  );

  const deselect = useCallback(
    (item: T) => {
      setSelected((prev) => {
        if (!prev.has(item)) return prev;
        const newSet = new Set(prev);
        newSet.delete(item);
        onChange?.(Array.from(newSet));
        return newSet;
      });
    },
    [onChange]
  );

  const selectMany = useCallback(
    (items: T[]) => {
      setSelected((prev) => {
        const newSet = new Set(prev);
        for (const item of items) {
          if (maxSelection && newSet.size >= maxSelection) break;
          newSet.add(item);
        }
        onChange?.(Array.from(newSet));
        return newSet;
      });
    },
    [maxSelection, onChange]
  );

  const deselectMany = useCallback(
    (items: T[]) => {
      setSelected((prev) => {
        const newSet = new Set(prev);
        for (const item of items) {
          newSet.delete(item);
        }
        onChange?.(Array.from(newSet));
        return newSet;
      });
    },
    [onChange]
  );

  const selectAll = useCallback(
    (items: T[]) => {
      const itemsToSelect = maxSelection ? items.slice(0, maxSelection) : items;
      const newSet = new Set(itemsToSelect);
      updateSelection(newSet);
    },
    [maxSelection, updateSelection]
  );

  const clear = useCallback(() => {
    updateSelection(new Set());
  }, [updateSelection]);

  const reset = useCallback(() => {
    updateSelection(new Set(initialSelected));
  }, [initialSelected, updateSelection]);

  const setSelection = useCallback(
    (items: T[]) => {
      const itemsToSelect = maxSelection ? items.slice(0, maxSelection) : items;
      updateSelection(new Set(itemsToSelect));
    },
    [maxSelection, updateSelection]
  );

  return {
    selected,
    selectedArray,
    count,
    isMaxReached,
    isSelected,
    toggle,
    select,
    deselect,
    selectMany,
    deselectMany,
    selectAll,
    clear,
    reset,
    setSelection,
  };
}

/**
 * Hook for managing selection mode (bulk actions).
 * Combines selection state with a mode toggle.
 *
 * @example
 * const { isSelectionMode, enterSelectionMode, exitSelectionMode, selection } =
 *   useSelectionMode<number>();
 *
 * {isSelectionMode ? (
 *   <>
 *     <button onClick={exitSelectionMode}>Cancel</button>
 *     <button onClick={() => deleteMany(selection.selectedArray)}>
 *       Delete ({selection.count})
 *     </button>
 *   </>
 * ) : (
 *   <button onClick={enterSelectionMode}>Select</button>
 * )}
 */
export function useSelectionMode<T>(
  options: UseSelectionOptions<T> = {}
): {
  isSelectionMode: boolean;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  toggleSelectionMode: () => void;
  selection: UseSelectionReturn<T>;
} {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const selection = useSelection<T>([], options);

  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    selection.clear();
  }, [selection]);

  const toggleSelectionMode = useCallback(() => {
    if (isSelectionMode) {
      exitSelectionMode();
    } else {
      enterSelectionMode();
    }
  }, [isSelectionMode, enterSelectionMode, exitSelectionMode]);

  return {
    isSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    toggleSelectionMode,
    selection,
  };
}

/**
 * Hook for managing list state with CRUD operations.
 *
 * @example
 * const { items, add, remove, update, move, clear } = useList<Todo>([]);
 *
 * // Add item
 * add({ id: 1, text: "New todo" });
 *
 * // Update item
 * update(0, { ...items[0], completed: true });
 *
 * // Remove by index
 * remove(0);
 *
 * // Reorder items
 * move(0, 2); // Move first item to third position
 */
export function useList<T>(initialItems: T[] = []): {
  items: T[];
  add: (item: T) => void;
  addMany: (items: T[]) => void;
  remove: (index: number) => void;
  removeWhere: (predicate: (item: T) => boolean) => void;
  update: (index: number, item: T) => void;
  updateWhere: (predicate: (item: T) => boolean, updater: (item: T) => T) => void;
  move: (fromIndex: number, toIndex: number) => void;
  clear: () => void;
  reset: () => void;
  setItems: (items: T[]) => void;
} {
  const [items, setItems] = useState<T[]>(initialItems);

  const add = useCallback((item: T) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const addMany = useCallback((newItems: T[]) => {
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const remove = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeWhere = useCallback((predicate: (item: T) => boolean) => {
    setItems((prev) => prev.filter((item) => !predicate(item)));
  }, []);

  const update = useCallback((index: number, item: T) => {
    setItems((prev) => prev.map((x, i) => (i === index ? item : x)));
  }, []);

  const updateWhere = useCallback(
    (predicate: (item: T) => boolean, updater: (item: T) => T) => {
      setItems((prev) =>
        prev.map((item) => (predicate(item) ? updater(item) : item))
      );
    },
    []
  );

  const move = useCallback((fromIndex: number, toIndex: number) => {
    setItems((prev) => {
      const newItems = [...prev];
      const [item] = newItems.splice(fromIndex, 1);
      if (item !== undefined) {
        newItems.splice(toIndex, 0, item);
      }
      return newItems;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const reset = useCallback(() => {
    setItems(initialItems);
  }, [initialItems]);

  return {
    items,
    add,
    addMany,
    remove,
    removeWhere,
    update,
    updateWhere,
    move,
    clear,
    reset,
    setItems,
  };
}
