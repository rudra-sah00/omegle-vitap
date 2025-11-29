/**
 * Browser Polyfills for Safari and older browsers
 * Ensures compatibility with webkit-prefixed APIs
 *
 * This module provides polyfills for WebRTC and Media Devices APIs
 * to ensure cross-browser compatibility, especially for Safari.
 */

// Track if polyfills have been initialized to prevent duplicate initialization
let isInitialized = false;

// Type definitions for legacy webkit-prefixed APIs
interface LegacyWindow extends Window {
  webkitRTCPeerConnection?: typeof RTCPeerConnection;
  mozRTCPeerConnection?: typeof RTCPeerConnection;
}

type LegacyGetUserMedia = (
  constraints: MediaStreamConstraints,
  successCallback: (stream: MediaStream) => void,
  errorCallback: (error: Error) => void
) => void;

interface LegacyNavigator extends Navigator {
  webkitGetUserMedia?: LegacyGetUserMedia;
  mozGetUserMedia?: LegacyGetUserMedia;
  msGetUserMedia?: LegacyGetUserMedia;
  MSStream?: unknown;
}

/**
 * Initialize browser polyfills
 * Should be called once at application startup (in root layout)
 * Safe to call multiple times - will only initialize once
 */
export function initBrowserPolyfills(): void {
  // Prevent duplicate initialization
  if (isInitialized) {
    return;
  }

  // Only run in browser environment
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return;
  }

  const legacyWindow = window as LegacyWindow;
  const legacyNavigator = navigator as LegacyNavigator;

  try {
    // Polyfill for RTCPeerConnection (Safari with webkit prefix)
    if (!window.RTCPeerConnection && legacyWindow.webkitRTCPeerConnection) {
      window.RTCPeerConnection = legacyWindow.webkitRTCPeerConnection;
    }

    // Polyfill for mediaDevices object
    if (!navigator.mediaDevices && legacyNavigator.webkitGetUserMedia) {
      // Create a minimal mediaDevices object for legacy browsers
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {},
        writable: true,
        configurable: true,
      });
    }

    // Polyfill for getUserMedia (convert callback-based to Promise-based)
    if (navigator.mediaDevices && !navigator.mediaDevices.getUserMedia) {
      const getUserMedia =
        legacyNavigator.webkitGetUserMedia ||
        legacyNavigator.mozGetUserMedia ||
        legacyNavigator.msGetUserMedia;

      if (getUserMedia) {
        navigator.mediaDevices.getUserMedia = function (constraints: MediaStreamConstraints) {
          return new Promise((resolve, reject) => {
            getUserMedia.call(navigator, constraints, resolve, reject);
          });
        };
      }
    }

    isInitialized = true;
  } catch {
    // Failed to initialize browser polyfills
  }
}

/**
 * Check if browser supports WebRTC and Media Devices APIs
 *
 * Performs comprehensive compatibility check including:
 * - RTCPeerConnection support (with webkit/moz prefixes)
 * - getUserMedia API availability
 *
 * @returns {boolean} True if browser supports required WebRTC features
 *
 * @example
 * ```typescript
 * if (!isBrowserSupported()) {
 *   showError('Please use a modern browser');
 * }
 * ```
 */
export function isBrowserSupported(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const legacyWindow = window as LegacyWindow;
  const legacyNavigator = navigator as LegacyNavigator;

  // Check for RTCPeerConnection (with webkit prefix support)
  const hasWebRTC = !!(
    window.RTCPeerConnection ||
    legacyWindow.webkitRTCPeerConnection ||
    legacyWindow.mozRTCPeerConnection
  );

  // Check for getUserMedia (with webkit prefix support)
  const hasGetUserMedia = !!(
    (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ||
    legacyNavigator.webkitGetUserMedia ||
    legacyNavigator.mozGetUserMedia ||
    legacyNavigator.msGetUserMedia
  );

  return hasWebRTC && hasGetUserMedia;
}

/**
 * Detect if the current browser is Safari
 *
 * Uses user agent string to identify Safari browser.
 * Excludes Chrome and Android browsers that may contain "safari" in UA.
 *
 * @returns {boolean} True if browser is Safari
 *
 * @example
 * ```typescript
 * if (isSafari()) {
 *   // Use H.264 codec for better performance
 * }
 * ```
 */
export function isSafari(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent.toLowerCase();
  return /^((?!chrome|android).)*safari/i.test(ua);
}

/**
 * Detect if running on iOS device
 *
 * Checks for iPad, iPhone, or iPod in user agent.
 * Excludes Windows Phone's MSStream to avoid false positives.
 *
 * @returns {boolean} True if running on iOS
 *
 * @example
 * ```typescript
 * if (isIOS()) {
 *   // Apply iOS-specific optimizations
 * }
 * ```
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const legacyNavigator = navigator as LegacyNavigator;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !legacyNavigator.MSStream;
}
