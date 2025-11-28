/**
 * Toast Notification Utilities
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

let activeToastIds = new Set<string>();
let lastToastMessage = '';
let lastToastTime = 0;

/**
 * Show error toast
 */
export function showError(message: string, code?: ErrorCode) {
  const now = Date.now();
  
  if (message === lastToastMessage && now - lastToastTime < 3000) {
    return;
  }
  
  toast.dismiss();
  activeToastIds.clear();
  
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
  
  setTimeout(() => {
    activeToastIds.delete(toastId);
  }, 4000);
}

/**
 * Show success toast
 */
export function showSuccess(message: string) {
  const now = Date.now();
  
  if (message === lastToastMessage && now - lastToastTime < 3000) {
    return;
  }
  
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
  
  if (message === lastToastMessage && now - lastToastTime < 3000) {
    return;
  }
  
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
  
  if (message === lastToastMessage && now - lastToastTime < 3000) {
    return;
  }
  
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
