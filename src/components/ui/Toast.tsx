"use client";

import { useEffect, useState } from "react";

/** Toast notification types */
export type ToastType = "success" | "error" | "warning" | "info";

/**
 * Props for Toast component
 */
interface ToastProps {
  /** Message to display */
  message: string;
  /** Type of toast (affects color) */
  type?: ToastType;
  /** Duration in milliseconds before auto-close */
  duration?: number;
  /** Callback when toast is closed */
  onClose: () => void;
}

/**
 * Toast notification component with auto-dismiss
 * @param props - Toast component props
 * @returns Toast notification element
 */
export function Toast({ message, type = "info", duration = 4000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  }[type];

  const icon = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  }[type];

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] max-w-md transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      <div
        className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3`}
      >
        <span className="text-xl font-bold">{icon}</span>
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-white hover:text-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
