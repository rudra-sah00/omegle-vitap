/**
 * Timeout Constants
 * Centralized timeout values for consistency
 */

// Connection timeouts
export const RTC_INIT_TIMEOUT = 15000; // 15 seconds - RTC initialization
export const SEARCH_TIMEOUT = 30000; // 30 seconds - Match search timeout
export const BACKEND_CHECK_TIMEOUT = 5000; // 5 seconds - Backend status check
export const REDIRECT_DELAY = 3000; // 3 seconds - Error redirect delay

// Retry delays
export const RETRY_BASE_DELAY = 1000; // 1 second - Base delay for retry attempts

// Typing indicator timeouts
export const TYPING_INDICATOR_TIMEOUT = 3000; // 3 seconds - Auto-hide typing indicator
export const TYPING_DEBOUNCE_DELAY = 300; // 300ms - Debounce for "stopped typing"

// Duplicate prevention
export const MESSAGE_PENDING_CLEAR_DELAY = 1000; // 1 second - Clear pending message tracking
export const EMOJI_PICKER_HIDE_DELAY = 2000; // 2 seconds - Auto-hide emoji picker

// Error display
export const ERROR_DEDUPE_WINDOW = 5000; // 5 seconds - Prevent duplicate error toasts

// Polling intervals
export const ONLINE_STATUS_CHECK_INTERVAL = 60000; // 1 minute - Backend status polling
export const DEVICE_UPDATE_INTERVAL = 2000; // 2 seconds - Update device IDs

// User activity
export const IDLE_TIMEOUT = 300000; // 5 minutes - User idle detection

// Session cleanup
export const LEAVE_DEBOUNCE_DELAY = 500; // 500ms - Prevent rapid leave actions
export const FIND_NEXT_DEBOUNCE_DELAY = 500; // 500ms - Prevent rapid next actions

