/**
 * Toast Notification Utilities
 * Centralized toast management with deduplication and error tracking
 * 
 * @description Provides a unified interface for displaying toast notifications
 * with automatic deduplication, consistent styling, and error code tracking.
 * 
 * @example
 * ```tsx
 * import { showError, showSuccess, ErrorCode } from '@/lib/toast';
 * 
 * showError('Connection failed', ErrorCode.CONNECTION_LOST);
 * showSuccess('Connected successfully!');
 * ```
 */

import toast from 'react-hot-toast';
import { analytics } from '@/services/firebase';

/**
 * Error codes for categorizing and tracking errors
 * Format: E[Category][Sequence]
 * - E0xx: Connection/Backend errors
 * - E1xx: Media/Permission errors
 * - E2xx: RTC/Channel errors
 * - E3xx: Messaging errors
 */
export enum ErrorCode {
  BACKEND_UNAVAILABLE = 'E001',
  CONNECTION_TIMEOUT = 'E002',
  CONNECTION_LOST = 'E003',
  AUTH_FAILED = 'E004',
  CAMERA_PERMISSION_DENIED = 'E101',
  MIC_PERMISSION_DENIED = 'E102',
  CAMERA_IN_USE = 'E103',
  MIC_IN_USE = 'E104',
  MEDIA_DEVICE_NOT_FOUND = 'E105',
  CHANNEL_JOIN_FAILED = 'E201',
  CHANNEL_LEAVE_FAILED = 'E202',
  PUBLISH_FAILED = 'E203',
  MESSAGE_SEND_FAILED = 'E301',
  MESSAGE_SERVICE_UNAVAILABLE = 'E302',
}

/** Toast configuration */
const TOAST_CONFIG = {
  DEDUPE_WINDOW_MS: 3000,
  ERROR_DURATION: 4000,
  SUCCESS_DURATION: 3000,
  INFO_DURATION: 3000,
  WARNING_DURATION: 3500,
} as const;

/** Toast style presets */
const TOAST_STYLES = {
  base: {
    padding: '12px 20px',
    borderRadius: '8px',
  },
  error: {
    background: '#ef4444',
    color: '#fff',
  },
  success: {
    background: '#10b981',
    color: '#fff',
  },
  info: {
    background: '#3b82f6',
    color: '#fff',
  },
  warning: {
    background: '#f59e0b',
    color: '#fff',
  },
} as const;

/**
 * Toast Manager Class
 * Encapsulates toast state for better testability and control
 * 
 * @internal This class is used internally by the toast utility functions
 */
class ToastManager {
  private activeToastIds = new Set<string>();
  private lastToastMessage = '';
  private lastToastTime = 0;

  /**
   * Check if toast should be deduplicated
   * @param message - The message to check
   * @returns Whether this message should be skipped
   */
  private shouldDedupe(message: string): boolean {
    const now = Date.now();
    return message === this.lastToastMessage && 
           now - this.lastToastTime < TOAST_CONFIG.DEDUPE_WINDOW_MS;
  }

  /**
   * Update last toast tracking
   * @param message - The message to track
   */
  private trackToast(message: string): void {
    this.lastToastMessage = message;
    this.lastToastTime = Date.now();
  }

  /**
   * Clear all active toasts from the screen
   */
  private clearActiveToasts(): void {
    toast.dismiss();
    this.activeToastIds.clear();
  }

  /**
   * Log error to analytics for tracking
   * @param message - Error message
   * @param code - Error code for categorization
   */
  private logErrorToAnalytics(message: string, code?: ErrorCode): void {
    if (code) {
      const errorType = this.getErrorTypeFromCode(code);
      analytics.trackError(errorType, `[${code}] ${message}`);
    }
  }

  /**
   * Map error code to analytics error type
   * @param code - The error code
   * @returns The analytics error type
   */
  private getErrorTypeFromCode(code: ErrorCode): 'camera_permission' | 'microphone_permission' | 'connection' | 'rtc' | 'websocket' | 'media_device' {
    if (code === ErrorCode.CAMERA_PERMISSION_DENIED) return 'camera_permission';
    if (code === ErrorCode.MIC_PERMISSION_DENIED) return 'microphone_permission';
    if (code === ErrorCode.CAMERA_IN_USE || code === ErrorCode.MIC_IN_USE || code === ErrorCode.MEDIA_DEVICE_NOT_FOUND) return 'media_device';
    if (code === ErrorCode.CHANNEL_JOIN_FAILED || code === ErrorCode.CHANNEL_LEAVE_FAILED || code === ErrorCode.PUBLISH_FAILED) return 'rtc';
    if (code === ErrorCode.MESSAGE_SEND_FAILED || code === ErrorCode.MESSAGE_SERVICE_UNAVAILABLE) return 'websocket';
    return 'connection';
  }

  /**
   * Show error toast with optional error code tracking
   * @param message - The error message to display
   * @param code - Optional error code for analytics
   */
  error(message: string, code?: ErrorCode): void {
    if (this.shouldDedupe(message)) return;
    
    this.clearActiveToasts();
    
    // Track error in analytics
    this.logErrorToAnalytics(message, code);
    
    const toastId = toast.error(message, {
      duration: TOAST_CONFIG.ERROR_DURATION,
      position: 'top-center',
      style: { ...TOAST_STYLES.base, ...TOAST_STYLES.error },
    });
    
    this.activeToastIds.add(toastId);
    this.trackToast(message);
    
    setTimeout(() => {
      this.activeToastIds.delete(toastId);
    }, TOAST_CONFIG.ERROR_DURATION);
  }

  /**
   * Show success toast
   */
  success(message: string): void {
    if (this.shouldDedupe(message)) return;
    
    this.clearActiveToasts();
    
    toast.success(message, {
      duration: TOAST_CONFIG.SUCCESS_DURATION,
      position: 'top-center',
      style: { ...TOAST_STYLES.base, ...TOAST_STYLES.success },
    });
    
    this.trackToast(message);
  }

  /**
   * Show info toast
   */
  info(message: string): void {
    if (this.shouldDedupe(message)) return;
    
    this.clearActiveToasts();
    
    toast(message, {
      duration: TOAST_CONFIG.INFO_DURATION,
      position: 'top-center',
      icon: 'ℹ️',
      style: { ...TOAST_STYLES.base, ...TOAST_STYLES.info },
    });
    
    this.trackToast(message);
  }

  /**
   * Show warning toast
   */
  warning(message: string): void {
    if (this.shouldDedupe(message)) return;
    
    this.clearActiveToasts();
    
    toast(message, {
      duration: TOAST_CONFIG.WARNING_DURATION,
      position: 'top-center',
      icon: '⚠️',
      style: { ...TOAST_STYLES.base, ...TOAST_STYLES.warning },
    });
    
    this.trackToast(message);
  }

  /**
   * Reset manager state (useful for testing)
   */
  reset(): void {
    this.activeToastIds.clear();
    this.lastToastMessage = '';
    this.lastToastTime = 0;
  }
}

// Singleton instance
const toastManager = new ToastManager();

/**
 * Show an error toast notification
 * 
 * @param message - The error message to display
 * @param code - Optional error code for analytics tracking
 * 
 * @example
 * ```tsx
 * showError('Failed to connect', ErrorCode.CONNECTION_LOST);
 * ```
 */
export function showError(message: string, code?: ErrorCode): void {
  toastManager.error(message, code);
}

/**
 * Show a success toast notification
 * 
 * @param message - The success message to display
 * 
 * @example
 * ```tsx
 * showSuccess('Connected successfully!');
 * ```
 */
export function showSuccess(message: string): void {
  toastManager.success(message);
}

/**
 * Show an info toast notification
 * 
 * @param message - The info message to display
 * 
 * @example
 * ```tsx
 * showInfo('Your partner left the chat');
 * ```
 */
export function showInfo(message: string): void {
  toastManager.info(message);
}

/**
 * Show a warning toast notification
 * 
 * @param message - The warning message to display
 * 
 * @example
 * ```tsx
 * showWarning('Connection quality is poor');
 * ```
 */
export function showWarning(message: string): void {
  toastManager.warning(message);
}

/**
 * Reset toast manager state
 * Useful for testing or clearing toast state
 */
export function resetToastManager(): void {
  toastManager.reset();
}

/**
 * Parse media-related errors into user-friendly messages
 * 
 * @param error - The error to parse (can be Error, string, or unknown)
 * @returns Object with user-friendly message and error code
 * 
 * @example
 * ```tsx
 * try {
 *   await startCamera();
 * } catch (error) {
 *   const { message, code } = parseMediaError(error);
 *   showError(message, code);
 * }
 * ```
 */
export function parseMediaError(error: unknown): { message: string; code: ErrorCode } {
  const errorStr = String(error).toLowerCase();
  
  if (errorStr.includes('permission_denied')) {
    if (errorStr.includes('camera')) {
      return {
        message: 'Camera access denied. Please allow camera permissions in your browser settings and refresh.',
        code: ErrorCode.CAMERA_PERMISSION_DENIED,
      };
    }
    if (errorStr.includes('microphone')) {
      return {
        message: 'Microphone access denied. Please allow microphone permissions in your browser settings and refresh.',
        code: ErrorCode.MIC_PERMISSION_DENIED,
      };
    }
    return {
      message: 'Camera or microphone access denied. Please allow permissions in your browser settings and refresh.',
      code: ErrorCode.CAMERA_PERMISSION_DENIED,
    };
  }
  
  if (errorStr.includes('device_in_use')) {
    if (errorStr.includes('camera')) {
      return {
        message: 'Camera is being used by another application. Please close other apps and try again.',
        code: ErrorCode.CAMERA_IN_USE,
      };
    }
    if (errorStr.includes('microphone')) {
      return {
        message: 'Microphone is being used by another application. Please close other apps and try again.',
        code: ErrorCode.MIC_IN_USE,
      };
    }
    return {
      message: 'Camera or microphone is being used by another application. Please close other apps and try again.',
      code: ErrorCode.CAMERA_IN_USE,
    };
  }
  
  if (errorStr.includes('device_not_found')) {
    if (errorStr.includes('camera')) {
      return {
        message: 'No camera found. Please connect a camera and try again.',
        code: ErrorCode.MEDIA_DEVICE_NOT_FOUND,
      };
    }
    if (errorStr.includes('microphone')) {
      return {
        message: 'No microphone found. Please connect a microphone and try again.',
        code: ErrorCode.MEDIA_DEVICE_NOT_FOUND,
      };
    }
    return {
      message: 'Camera or microphone not found. Please connect a device and try again.',
      code: ErrorCode.MEDIA_DEVICE_NOT_FOUND,
    };
  }
  
  if (errorStr.includes('permission') || errorStr.includes('notallowed')) {
    if (errorStr.includes('video') || errorStr.includes('camera')) {
      return {
        message: 'Camera access denied. Please allow camera permissions in your browser settings.',
        code: ErrorCode.CAMERA_PERMISSION_DENIED,
      };
    }
    return {
      message: 'Microphone access denied. Please allow microphone permissions in your browser settings.',
      code: ErrorCode.MIC_PERMISSION_DENIED,
    };
  }
  
  if (errorStr.includes('notfound') || errorStr.includes('no device') || errorStr.includes('no camera') || errorStr.includes('no microphone')) {
    if (errorStr.includes('camera')) {
      return {
        message: 'No camera found. Please connect a camera and try again.',
        code: ErrorCode.MEDIA_DEVICE_NOT_FOUND,
      };
    }
    if (errorStr.includes('microphone')) {
      return {
        message: 'No microphone found. Please connect a microphone and try again.',
        code: ErrorCode.MEDIA_DEVICE_NOT_FOUND,
      };
    }
    return {
      message: 'Camera or microphone not found. Please connect a device and try again.',
      code: ErrorCode.MEDIA_DEVICE_NOT_FOUND,
    };
  }
  
  if (errorStr.includes('in use') || errorStr.includes('notreadable')) {
    return {
      message: 'Camera or microphone is being used by another application. Please close other apps and try again.',
      code: ErrorCode.CAMERA_IN_USE,
    };
  }
  
  if (errorStr.includes('timeout')) {
    return {
      message: 'Device access timed out. This may be due to slow device or permission prompt delay. Please try again.',
      code: ErrorCode.CONNECTION_TIMEOUT,
    };
  }
  
  return {
    message: 'Failed to access camera or microphone. Please check your device settings and try again.',
    code: ErrorCode.MEDIA_DEVICE_NOT_FOUND,
  };
}

/**
 * Parse connection-related errors into user-friendly messages
 * 
 * @param error - The error to parse (can be Error, string, or unknown)
 * @returns Object with user-friendly message and error code
 * 
 * @example
 * ```tsx
 * try {
 *   await connectToServer();
 * } catch (error) {
 *   const { message, code } = parseConnectionError(error);
 *   showError(message, code);
 * }
 * ```
 */
export function parseConnectionError(error: unknown): { message: string; code: ErrorCode } {
  const errorStr = String(error).toLowerCase();
  
  if (errorStr.includes('timeout') || errorStr.includes('timed out')) {
    return {
      message: 'Connection timed out. Please check your internet connection and try again.',
      code: ErrorCode.CONNECTION_TIMEOUT,
    };
  }
  
  if (errorStr.includes('token') || errorStr.includes('invalid token')) {
    return {
      message: 'Session expired. Please try starting a new chat.',
      code: ErrorCode.AUTH_FAILED,
    };
  }
  
  if (errorStr.includes('backend') || errorStr.includes('unavailable')) {
    return {
      message: 'Service temporarily unavailable. Please try again in a moment.',
      code: ErrorCode.BACKEND_UNAVAILABLE,
    };
  }
  
  if (errorStr.includes('network') || errorStr.includes('offline')) {
    return {
      message: 'No internet connection. Please check your network and try again.',
      code: ErrorCode.CONNECTION_LOST,
    };
  }
  
  return {
    message: 'Connection failed. Please check your internet and try again.',
    code: ErrorCode.CONNECTION_LOST,
  };
}
