"use client";

import { useState, useCallback, useEffect } from "react";

export interface UseModalReturn<T = undefined> {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Data passed to the modal */
  data: T | undefined;
  /** Open the modal, optionally with data */
  open: (data?: T) => void;
  /** Close the modal */
  close: () => void;
  /** Toggle the modal */
  toggle: () => void;
  /** Update the modal data without changing open state */
  setData: (data: T | undefined) => void;
}

export interface UseModalOptions<T> {
  /** Initial open state (default: false) */
  initialOpen?: boolean;
  /** Initial data */
  initialData?: T;
  /** Callback when modal opens */
  onOpen?: (data?: T) => void;
  /** Callback when modal closes */
  onClose?: () => void;
  /** Clear data when modal closes (default: true) */
  clearOnClose?: boolean;
}

/**
 * Hook for managing modal/dialog state.
 * Replaces the common pattern of:
 *   const [isOpen, setIsOpen] = useState(false);
 *   const [modalData, setModalData] = useState(null);
 *
 * @example
 * // Simple modal without data
 * const confirmModal = useModal();
 * <button onClick={() => confirmModal.open()}>Delete</button>
 * <ConfirmDialog open={confirmModal.isOpen} onClose={confirmModal.close} />
 *
 * @example
 * // Modal with data
 * const editModal = useModal<User>();
 * <button onClick={() => editModal.open(user)}>Edit</button>
 * <EditUserDialog
 *   open={editModal.isOpen}
 *   user={editModal.data}
 *   onClose={editModal.close}
 * />
 *
 * @example
 * // With callbacks
 * const modal = useModal<Item>({
 *   onOpen: (item) => trackEvent('modal_opened', { item_id: item?.id }),
 *   onClose: () => resetForm(),
 * });
 */
export function useModal<T = undefined>(
  options: UseModalOptions<T> = {}
): UseModalReturn<T> {
  const {
    initialOpen = false,
    initialData,
    onOpen,
    onClose,
    clearOnClose = true,
  } = options;

  const [isOpen, setIsOpen] = useState(initialOpen);
  const [data, setData] = useState<T | undefined>(initialData);

  const open = useCallback(
    (newData?: T) => {
      setData(newData);
      setIsOpen(true);
      onOpen?.(newData);
    },
    [onOpen]
  );

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
    if (clearOnClose) {
      setData(undefined);
    }
  }, [onClose, clearOnClose]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, close, open]);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    setData,
  };
}

export interface UseConfirmModalReturn extends UseModalReturn<void> {
  /** Confirm the action */
  confirm: () => void;
  /** Whether confirmation is pending */
  isPending: boolean;
}

export interface UseConfirmModalOptions {
  /** Callback when confirmed */
  onConfirm: () => void | Promise<void>;
  /** Callback when cancelled */
  onCancel?: () => void;
}

/**
 * Hook for confirmation dialogs with async action support.
 *
 * @example
 * const deleteConfirm = useConfirmModal({
 *   onConfirm: async () => {
 *     await deleteItem(itemId);
 *     toast.success("Deleted!");
 *   },
 * });
 *
 * <button onClick={deleteConfirm.open}>Delete</button>
 * <ConfirmDialog
 *   open={deleteConfirm.isOpen}
 *   onClose={deleteConfirm.close}
 *   onConfirm={deleteConfirm.confirm}
 *   isPending={deleteConfirm.isPending}
 * />
 */
export function useConfirmModal(
  options: UseConfirmModalOptions
): UseConfirmModalReturn {
  const { onConfirm, onCancel } = options;
  const [isPending, setIsPending] = useState(false);

  const modal = useModal<void>({
    onClose: onCancel,
  });

  const confirm = useCallback(async () => {
    setIsPending(true);
    try {
      await onConfirm();
      modal.close();
    } finally {
      setIsPending(false);
    }
  }, [onConfirm, modal]);

  return {
    ...modal,
    confirm,
    isPending,
  };
}

/**
 * Hook for managing multiple modals with only one open at a time.
 *
 * @example
 * const modals = useModalGroup(['edit', 'delete', 'share'] as const);
 *
 * <button onClick={() => modals.open('edit', user)}>Edit</button>
 * <button onClick={() => modals.open('delete')}>Delete</button>
 *
 * <EditModal open={modals.isOpen('edit')} data={modals.getData('edit')} />
 * <DeleteModal open={modals.isOpen('delete')} />
 */
export function useModalGroup<K extends string, T = unknown>(
  _keys: readonly K[]
): {
  activeModal: K | null;
  data: Partial<Record<K, T>>;
  isOpen: (key: K) => boolean;
  open: (key: K, data?: T) => void;
  close: () => void;
  getData: (key: K) => T | undefined;
  setData: (key: K, data: T) => void;
} {
  const [activeModal, setActiveModal] = useState<K | null>(null);
  const [data, setDataState] = useState<Partial<Record<K, T>>>({});

  const isOpen = useCallback(
    (key: K) => activeModal === key,
    [activeModal]
  );

  const open = useCallback((key: K, modalData?: T) => {
    setActiveModal(key);
    if (modalData !== undefined) {
      setDataState((prev) => ({ ...prev, [key]: modalData }));
    }
  }, []);

  const close = useCallback(() => {
    setActiveModal(null);
  }, []);

  const getData = useCallback(
    (key: K) => data[key],
    [data]
  );

  const setData = useCallback((key: K, newData: T) => {
    setDataState((prev) => ({ ...prev, [key]: newData }));
  }, []);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeModal) {
        close();
      }
    };

    if (activeModal) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [activeModal, close]);

  return {
    activeModal,
    data,
    isOpen,
    open,
    close,
    getData,
    setData,
  };
}
