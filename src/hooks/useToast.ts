import { useState, useCallback } from "react";
import { ToastType } from "@/components/ui/Toast";

/**
 * Internal toast data structure
 */
interface ToastData {
  /** Unique toast identifier */
  id: number;
  /** Toast message content */
  message: string;
  /** Type of toast (success, error, warning, info) */
  type: ToastType;
}

let toastId = 0;

/**
 * Hook for managing toast notifications
 * @returns Toast management functions and current toast list
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = toastId++;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string) => showToast(message, "success"), [showToast]);
  const error = useCallback((message: string) => showToast(message, "error"), [showToast]);
  const warning = useCallback((message: string) => showToast(message, "warning"), [showToast]);
  const info = useCallback((message: string) => showToast(message, "info"), [showToast]);

  return {
    toasts,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}
