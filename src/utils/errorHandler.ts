/**
 * Centralized error handling utility
 * Provides user-friendly error messages without exposing technical details
 */

export function getErrorMessage(error: any): string {
  // Permission errors
  if (error?.code === 'PERMISSION_DENIED' || error?.name === 'NotAllowedError') {
    return 'Permission denied. Please allow access to continue.';
  }

  // Device errors
  if (error?.name === 'NotFoundError' || error?.message?.includes('device')) {
    return 'Device not found. Please check your camera and microphone.';
  }

  // Network errors
  if (error?.message?.includes('network') || error?.message?.includes('connection')) {
    return 'Connection issue. Please check your internet and try again.';
  }

  if (error?.message?.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  // Firebase/Database errors
  if (error?.code?.includes('firebase') || error?.code?.includes('database')) {
    return 'Unable to connect. Please try again in a moment.';
  }

  // Agora-specific errors
  if (error?.code === 'INVALID_OPERATION' || error?.code?.includes('AgoraRTC')) {
    return 'Something went wrong. Please refresh and try again.';
  }

  // Token errors
  if (error?.message?.includes('token') || error?.message?.includes('authentication')) {
    return 'Session expired. Please refresh the page.';
  }

  // Generic fallback
  return 'Something went wrong. Please try again.';
}

export function handleError(error: any, context?: string): void {
  // In development, you might want to log errors
  if (process.env.NODE_ENV === 'development') {
    // Errors are already being handled gracefully
  }
  // In production, errors are handled silently with user-friendly messages
}
