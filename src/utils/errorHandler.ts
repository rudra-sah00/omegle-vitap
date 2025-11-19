/**
 * Centralized error handling utility
 * Provides user-friendly error messages without exposing technical details
 */

/**
 * Converts various error types into user-friendly messages
 * Handles permission, device, network, Firebase, and Agora errors
 *
 * @param error - The error object to convert (unknown type for flexibility)
 * @returns A user-friendly error message string
 */
export function getErrorMessage(error: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const err = error as any;

  // Permission errors
  if (err?.code === "PERMISSION_DENIED" || err?.name === "NotAllowedError") {
    return "Permission denied. Please allow access to continue.";
  }

  // Device errors
  if (err?.name === "NotFoundError" || err?.message?.includes("device")) {
    return "Device not found. Please check your camera and microphone.";
  }

  // Network errors
  if (err?.message?.includes("network") || err?.message?.includes("connection")) {
    return "Connection issue. Please check your internet and try again.";
  }

  if (err?.message?.includes("timeout")) {
    return "Request timed out. Please try again.";
  }

  // Firebase/Database errors
  if (err?.code?.includes("firebase") || err?.code?.includes("database")) {
    return "Unable to connect. Please try again in a moment.";
  }

  // Agora-specific errors
  if (err?.code === "INVALID_OPERATION" || err?.code?.includes("AgoraRTC")) {
    return "Something went wrong. Please refresh and try again.";
  }

  // Token errors
  if (err?.message?.includes("token") || err?.message?.includes("authentication")) {
    return "Session expired. Please refresh the page.";
  }

  // Generic fallback
  return "Something went wrong. Please try again.";
}

/**
 * Centralized error handler for logging and processing errors
 * In development, errors can be logged; in production, handled silently
 *
 * @param _error - The error object to handle
 * @param _context - Optional context string describing where the error occurred
 */
export function handleError(_error: unknown, _context?: string): void {
  // In development, you might want to log errors
  if (process.env.NODE_ENV === "development") {
    // Errors are already being handled gracefully
  }
  // In production, errors are handled silently with user-friendly messages
}
