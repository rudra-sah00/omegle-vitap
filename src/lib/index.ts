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

// Types
export type { AgoraRTCConfig } from './agora/agora-rtc';
export type { MessageData } from '@/hooks/useWebSocketChat';
