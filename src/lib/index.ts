/**
 * Library Exports
 * Centralized exports for lib utilities
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

// Media Utilities
export {
  getPersistedCameraState,
  getPersistedMicState,
  persistCameraState,
  persistMicState,
  getPersistedMediaStates,
  clearPersistedMediaStates,
} from './media';

// Types
export type { MessageData } from '@/hooks';
