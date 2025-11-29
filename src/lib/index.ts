/**
 * Library Exports
 * Centralized exports for lib utilities
 *
 * @description This module provides utility functions for:
 * - Browser compatibility and polyfills
 * - Toast notifications with error tracking
 * - CSS class name utilities
 * - Media state persistence
 *
 * @example
 * ```tsx
 * import { showError, cn, isBrowserSupported, ErrorCode } from '@/lib';
 *
 * if (!isBrowserSupported()) {
 *   showError('Browser not supported', ErrorCode.MEDIA_DEVICE_NOT_FOUND);
 * }
 *
 * const className = cn('base-class', isActive && 'active');
 * ```
 */

// Browser Utilities
export { initBrowserPolyfills, isBrowserSupported, isSafari, isIOS } from './browser-polyfill';

// Toast Notifications
export {
  showError,
  showSuccess,
  showInfo,
  showWarning,
  parseMediaError,
  parseConnectionError,
  resetToastManager,
  ErrorCode,
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
