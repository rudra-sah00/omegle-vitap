/**
 * Toast Notification Utilities
 * Centralized toast management with deduplication and error tracking
 */

import toast from 'react-hot-toast';

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
 */
class ToastManager {
  private activeToastIds = new Set<string>();
  private lastToastMessage = '';
  private lastToastTime = 0;

  /**
   * Check if toast should be deduplicated
   */
  private shouldDedupe(message: string): boolean {
    const now = Date.now();
    return message === this.lastToastMessage && 
           now - this.lastToastTime < TOAST_CONFIG.DEDUPE_WINDOW_MS;
  }

  /**
   * Update last toast tracking
   */
  private trackToast(message: string): void {
    this.lastToastMessage = message;
    this.lastToastTime = Date.now();
  }

  /**
   * Clear all active toasts
   */
  private clearActiveToasts(): void {
    toast.dismiss();
    this.activeToastIds.clear();
  }

  /**
   * Show error toast
   */
  error(message: string, _code?: ErrorCode): void {
    if (this.shouldDedupe(message)) return;
    
    this.clearActiveToasts();
    
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
 * Show error toast
 */
export function showError(message: string, code?: ErrorCode): void {
  toastManager.error(message, code);
}

/**
 * Show success toast
 */
export function showSuccess(message: string): void {
  toastManager.success(message);
}

/**
 * Show info toast
 */
export function showInfo(message: string): void {
  toastManager.info(message);
}

/**
 * Show warning toast
 */
export function showWarning(message: string): void {
  toastManager.warning(message);
}

/**
 * Reset toast manager (for testing)
 */
export function resetToastManager(): void {
  toastManager.reset();
}

/**
 * Parse media errors into user-friendly messages
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
 * Parse connection errors
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
