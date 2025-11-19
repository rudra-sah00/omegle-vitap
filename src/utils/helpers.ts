/**
 * Generate a unique ID based on timestamp and random string
 * @returns A unique identifier string
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Format a timestamp to a human-readable time string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string (HH:MM)
 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/**
 * Sanitize user input by removing potentially dangerous characters
 * @param input - Raw user input string
 * @returns Sanitized string with HTML tags removed
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, "");
};
