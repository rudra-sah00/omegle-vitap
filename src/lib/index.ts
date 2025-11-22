/**
 * Library Exports
 * Centralized exports for lib utilities and services
 * Follows production structure best practices
 */

// Browser Utilities
export { 
  initBrowserPolyfills, 
  isBrowserSupported, 
  isSafari, 
  isIOS 
} from './browser-polyfill';

// Toast Notifications
export { 
  showError, 
  showSuccess, 
  showInfo, 
  showWarning, 
  parseMediaError,
  ErrorCode 
} from './toast';

// General Utilities
export { cn } from './utils';

// Time Utilities
export { isServiceOnline } from './time';

// Types
export type { MessageData } from './agora-rtm';
export type { AgoraRTCConfig } from './agora-rtc';
