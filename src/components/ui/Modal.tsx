"use client";

import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Props for Modal component
 */
interface ModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal content */
  children: ReactNode;
}

/**
 * Modal dialog component with overlay and keyboard support
 * @param props - Modal component props
 * @returns Modal portal element
 */
export default function Modal({ isOpen, onClose, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-scaleIn relative"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "scaleIn 0.2s ease-out",
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
