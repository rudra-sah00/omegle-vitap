import { describe, it, expect, afterEach } from 'vitest';
import { isBrowserSupported, isSafari, isIOS } from '@/lib/browser-polyfill';

describe('Browser Polyfill Utilities', () => {
  const originalNavigator = global.navigator;
  const originalWindow = global.window;

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
    Object.defineProperty(global, 'window', {
      value: originalWindow,
      writable: true,
    });
  });

  describe('isBrowserSupported', () => {
    it('should return false when window is undefined', () => {
      // @ts-expect-error - testing undefined window
      global.window = undefined;
      expect(isBrowserSupported()).toBe(false);
    });

    it('should return false when navigator is undefined', () => {
      // @ts-expect-error - testing undefined navigator
      global.navigator = undefined;
      expect(isBrowserSupported()).toBe(false);
    });

    it('should return true when RTCPeerConnection and getUserMedia are available', () => {
      Object.defineProperty(global, 'window', {
        value: {
          RTCPeerConnection: class {},
        },
        writable: true,
      });
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0',
          mediaDevices: {
            getUserMedia: () => Promise.resolve(),
          },
        },
        writable: true,
      });
      expect(isBrowserSupported()).toBe(true);
    });

    it('should return true when webkit prefixed APIs are available', () => {
      Object.defineProperty(global, 'window', {
        value: {
          webkitRTCPeerConnection: class {},
        },
        writable: true,
      });
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0',
          webkitGetUserMedia: () => {},
        },
        writable: true,
      });
      expect(isBrowserSupported()).toBe(true);
    });

    it('should return true when moz prefixed APIs are available', () => {
      Object.defineProperty(global, 'window', {
        value: {
          mozRTCPeerConnection: class {},
        },
        writable: true,
      });
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0',
          mozGetUserMedia: () => {},
        },
        writable: true,
      });
      expect(isBrowserSupported()).toBe(true);
    });

    it('should return false when no WebRTC support', () => {
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
      });
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0',
          mediaDevices: {
            getUserMedia: () => Promise.resolve(),
          },
        },
        writable: true,
      });
      expect(isBrowserSupported()).toBe(false);
    });

    it('should return false when no getUserMedia support', () => {
      Object.defineProperty(global, 'window', {
        value: {
          RTCPeerConnection: class {},
        },
        writable: true,
      });
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0',
        },
        writable: true,
      });
      expect(isBrowserSupported()).toBe(false);
    });
  });

  describe('isSafari', () => {
    it('should return false when navigator is undefined', () => {
      // @ts-expect-error - testing undefined navigator
      global.navigator = undefined;
      expect(isSafari()).toBe(false);
    });

    it('should return true for Safari on macOS', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        },
        writable: true,
      });
      expect(isSafari()).toBe(true);
    });

    it('should return true for Safari on iOS', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
        },
        writable: true,
      });
      expect(isSafari()).toBe(true);
    });

    it('should return false for Chrome', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        writable: true,
      });
      expect(isSafari()).toBe(false);
    });

    it('should return false for Firefox', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',
        },
        writable: true,
      });
      expect(isSafari()).toBe(false);
    });

    it('should return false for Chrome on Android', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36',
        },
        writable: true,
      });
      expect(isSafari()).toBe(false);
    });
  });

  describe('isIOS', () => {
    it('should return false when navigator is undefined', () => {
      // @ts-expect-error - testing undefined navigator
      global.navigator = undefined;
      expect(isIOS()).toBe(false);
    });

    it('should return true for iPhone', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
        },
        writable: true,
      });
      expect(isIOS()).toBe(true);
    });

    it('should return true for iPad', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
        },
        writable: true,
      });
      expect(isIOS()).toBe(true);
    });

    it('should return true for iPod', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (iPod; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
        },
        writable: true,
      });
      expect(isIOS()).toBe(true);
    });

    it('should return false for macOS Safari', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        },
        writable: true,
      });
      expect(isIOS()).toBe(false);
    });

    it('should return false for Android', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36',
        },
        writable: true,
      });
      expect(isIOS()).toBe(false);
    });

    it('should return false for Windows Phone with MSStream', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; iPad)',
          MSStream: {},
        },
        writable: true,
      });
      expect(isIOS()).toBe(false);
    });
  });
});
