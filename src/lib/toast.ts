/**
 * Toast notification utility
 * User-friendly error messages without exposing technical details
 */

import toast from 'react-hot-toast';

/**
 * Error codes for internal tracking
 */
export enum ErrorCode {
  // Connection errors
  BACKEND_UNAVAILABLE = 'E001',
  CONNECTION_TIMEOUT = 'E002',
  CONNECTION_LOST = 'E003',
  AUTH_FAILED = 'E004',
  
  // Media errors
  CAMERA_PERMISSION_DENIED = 'E101',
  MIC_PERMISSION_DENIED = 'E102',
  CAMERA_IN_USE = 'E103',
  MIC_IN_USE = 'E104',
  MEDIA_DEVICE_NOT_FOUND = 'E105',
  
  // Channel errors
  CHANNEL_JOIN_FAILED = 'E201',
  CHANNEL_LEAVE_FAILED = 'E202',
  PUBLISH_FAILED = 'E203',
  
  // Messaging errors
  MESSAGE_SEND_FAILED = 'E301',
  MESSAGE_SERVICE_UNAVAILABLE = 'E302',
}

// Track currently displayed toasts to prevent duplicates
let activeToastIds = new Set<string>();
let lastToastMessage = '';
let lastToastTime = 0;

/**
 * Show error toast with user-friendly message
 * Prevents duplicate toasts and ensures only one is shown at a time
 */
export function showError(message: string, code?: ErrorCode) {
  const now = Date.now();
  
  // Prevent duplicate messages within 3 seconds
  if (message === lastToastMessage && now - lastToastTime < 3000) {
    return;
  }
  
  // Dismiss all existing toasts before showing new one
  toast.dismiss();
  activeToastIds.clear();
  
  // Show new toast
  const toastId = toast.error(message, {
    duration: 4000,
    position: 'top-center',
    style: {
      background: '#ef4444',
      color: '#fff',
      padding: '12px 20px',
      borderRadius: '8px',
    },
  });
  
  activeToastIds.add(toastId);
  lastToastMessage = message;
  lastToastTime = now;
  
  // Remove from active set after duration
  setTimeout(() => {
    activeToastIds.delete(toastId);
  }, 4000);
}

/**
 * Show success toast
 */
export function showSuccess(message: string) {
  const now = Date.now();
  
  // Prevent duplicate messages within 3 seconds
  if (message === lastToastMessage && now - lastToastTime < 3000) {
    return;
  }
  
  // Dismiss all existing toasts before showing new one
  toast.dismiss();
  activeToastIds.clear();
  
  toast.success(message, {
    duration: 3000,
    position: 'top-center',
    style: {
      background: '#10b981',
      color: '#fff',
      padding: '12px 20px',
      borderRadius: '8px',
    },
  });
  
  lastToastMessage = message;
  lastToastTime = now;
}

/**
 * Show info toast
 */
export function showInfo(message: string) {
  const now = Date.now();
  
  // Prevent duplicate messages within 3 seconds
  if (message === lastToastMessage && now - lastToastTime < 3000) {
    return;
  }
  
  // Dismiss all existing toasts before showing new one
  toast.dismiss();
  activeToastIds.clear();
  
  toast(message, {
    duration: 3000,
    position: 'top-center',
    icon: 'ℹ️',
    style: {
      background: '#3b82f6',
      color: '#fff',
      padding: '12px 20px',
      borderRadius: '8px',
    },
  });
  
  lastToastMessage = message;
  lastToastTime = now;
}

/**
 * Show warning toast
 */
export function showWarning(message: string) {
  const now = Date.now();
  
  // Prevent duplicate messages within 3 seconds
  if (message === lastToastMessage && now - lastToastTime < 3000) {
    return;
  }
  
  // Dismiss all existing toasts before showing new one
  toast.dismiss();
  activeToastIds.clear();
  
  toast(message, {
    duration: 3500,
    position: 'top-center',
    icon: '⚠️',
    style: {
      background: '#f59e0b',
      color: '#fff',
      padding: '12px 20px',
      borderRadius: '8px',
    },
  });
  
  lastToastMessage = message;
  lastToastTime = now;
}

/**
 * Parse technical errors into user-friendly messages
 */
export function parseMediaError(error: unknown): { message: string; code: ErrorCode } {
  const errorStr = String(error).toLowerCase();
  
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
  
  if (errorStr.includes('device_not_found') || errorStr.includes('notfound') || errorStr.includes('no device') || errorStr.includes('no camera') || errorStr.includes('no microphone')) {
    // Extract the specific device type from the error message
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
  
  return {
    message: 'Failed to access camera or microphone. Please check your device settings.',
    code: ErrorCode.MEDIA_DEVICE_NOT_FOUND,
  };
}

/**
 * Parse connection errors into user-friendly messages
 */
export function parseConnectionError(error: unknown): { message: string; code: ErrorCode } {
  const errorStr = String(error).toLowerCase();
  
  if (errorStr.includes('timeout')) {
    return {
      message: 'Connection timed out. Please check your internet connection.',
      code: ErrorCode.CONNECTION_TIMEOUT,
    };
  }
  
  if (errorStr.includes('backend') || errorStr.includes('unavailable')) {
    return {
      message: 'Service temporarily unavailable. Please try again in a moment.',
      code: ErrorCode.BACKEND_UNAVAILABLE,
    };
  }
  
  return {
    message: 'Connection failed. Please check your internet and try again.',
    code: ErrorCode.CONNECTION_LOST,
  };
}
