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

/**
 * Show error toast with user-friendly message
 */
export function showError(message: string, code?: ErrorCode) {
  toast.error(message, {
    duration: 4000,
    position: 'top-center',
    style: {
      background: '#ef4444',
      color: '#fff',
      padding: '12px 20px',
      borderRadius: '8px',
    },
  });
  
  // Log error code for debugging (not visible to user)
  if (code && process.env.NODE_ENV === 'development') {
    console.error(`[${code}] ${message}`);
  }
}

/**
 * Show success toast
 */
export function showSuccess(message: string) {
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
}

/**
 * Show info toast
 */
export function showInfo(message: string) {
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
}

/**
 * Show warning toast
 */
export function showWarning(message: string) {
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
  
  if (errorStr.includes('notfound') || errorStr.includes('no device')) {
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
