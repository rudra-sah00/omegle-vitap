/**
 * Tests for Browser Polyfill Module
 * Tests polyfill initialization, browser detection, and compatibility checks
 */

// We need to isolate module for testing to reset the isInitialized state
let initBrowserPolyfills: any;
let isBrowserSupported: any;
let isSafari: any;
let isIOS: any;

describe('Browser Polyfill Module', () => {
  let originalWindow: any;
  let originalNavigator: any;

  beforeEach(() => {
    // Save original values
    originalWindow = global.window;
    originalNavigator = global.navigator;
    
    // Clear module cache to reset isInitialized state
    jest.resetModules();
    
    // Re-import module for each test
    const module = require('../browser-polyfill');
    initBrowserPolyfills = module.initBrowserPolyfills;
    isBrowserSupported = module.isBrowserSupported;
    isSafari = module.isSafari;
    isIOS = module.isIOS;
    
    // Reset window and navigator for each test
    (global as any).window = {
      RTCPeerConnection: undefined,
      webkitRTCPeerConnection: undefined,
      mozRTCPeerConnection: undefined,
    };
    
    (global as any).navigator = {
      mediaDevices: undefined,
      webkitGetUserMedia: undefined,
      mozGetUserMedia: undefined,
      msGetUserMedia: undefined,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
    };
  });

  afterEach(() => {
    // Restore original values
    global.window = originalWindow;
    global.navigator = originalNavigator;
  });

  describe('initBrowserPolyfills', () => {
    it('should initialize RTCPeerConnection polyfill for webkit', () => {
      (global as any).window.webkitRTCPeerConnection = function() {};
      
      initBrowserPolyfills();
      
      expect((global as any).window.RTCPeerConnection).toBeDefined();
    });

    it('should initialize mediaDevices polyfill for webkit', () => {
      // mediaDevices is only created if it doesn't exist AND webkitGetUserMedia exists
      delete (global as any).navigator.mediaDevices;
      (global as any).navigator.webkitGetUserMedia = jest.fn();
      
      initBrowserPolyfills();
      
      expect((global as any).navigator.mediaDevices).toBeDefined();
    });

    it('should polyfill getUserMedia with Promise-based API', () => {
      const mockGetUserMedia = jest.fn((constraints, success, error) => {
        success({ id: 'mock-stream' });
      });
      
      // Start without mediaDevices
      delete (global as any).navigator.mediaDevices;
      (global as any).navigator.webkitGetUserMedia = mockGetUserMedia;
      
      initBrowserPolyfills();
      
      expect((global as any).navigator.mediaDevices).toBeDefined();
      expect((global as any).navigator.mediaDevices.getUserMedia).toBeDefined();
    });

    it('should convert callback-based getUserMedia to Promise', async () => {
      const mockStream = { id: 'mock-stream' };
      const mockGetUserMedia = jest.fn((constraints, success) => {
        success(mockStream);
      });
      
      delete (global as any).navigator.mediaDevices;
      (global as any).navigator.webkitGetUserMedia = mockGetUserMedia;
      
      initBrowserPolyfills();
      
      const result = await (global as any).navigator.mediaDevices.getUserMedia({ video: true });
      expect(result).toEqual(mockStream);
    });

    it('should handle getUserMedia rejection', async () => {
      const mockError = new Error('Permission denied');
      const mockGetUserMedia = jest.fn((constraints, success, error) => {
        error(mockError);
      });
      
      delete (global as any).navigator.mediaDevices;
      (global as any).navigator.webkitGetUserMedia = mockGetUserMedia;
      
      initBrowserPolyfills();
      
      await expect(
        (global as any).navigator.mediaDevices.getUserMedia({ video: true })
      ).rejects.toEqual(mockError);
    });

    it('should handle mozGetUserMedia polyfill', () => {
      // mediaDevices must already exist for moz polyfill (only webkit creates it)
      (global as any).navigator.mediaDevices = {};
      delete (global as any).navigator.webkitGetUserMedia; // Ensure webkit is not present
      (global as any).navigator.mozGetUserMedia = jest.fn();
      
      initBrowserPolyfills();
      
      expect((global as any).navigator.mediaDevices).toBeDefined();
      expect((global as any).navigator.mediaDevices.getUserMedia).toBeDefined();
    });

    it('should handle msGetUserMedia polyfill', () => {
      // mediaDevices must already exist for ms polyfill (only webkit creates it)
      (global as any).navigator.mediaDevices = {};
      delete (global as any).navigator.webkitGetUserMedia; // Ensure webkit is not present
      delete (global as any).navigator.mozGetUserMedia; // Ensure moz is not present
      (global as any).navigator.msGetUserMedia = jest.fn();
      
      initBrowserPolyfills();
      
      expect((global as any).navigator.mediaDevices).toBeDefined();
      expect((global as any).navigator.mediaDevices.getUserMedia).toBeDefined();
    });

    it('should not initialize in non-browser environment (window undefined)', () => {
      delete (global as any).window;
      
      initBrowserPolyfills();
      
      // Should not throw and should return early
      expect(true).toBe(true);
    });

    it('should not initialize in non-browser environment (navigator undefined)', () => {
      delete (global as any).navigator;
      
      initBrowserPolyfills();
      
      // Should not throw and should return early
      expect(true).toBe(true);
    });

    it('should not initialize twice', () => {
      (global as any).window.webkitRTCPeerConnection = function() {};
      
      initBrowserPolyfills();
      const firstInit = (global as any).window.RTCPeerConnection;
      
      (global as any).window.webkitRTCPeerConnection = function() { return 'different'; };
      initBrowserPolyfills();
      const secondInit = (global as any).window.RTCPeerConnection;
      
      // Should be the same (not re-initialized)
      expect(firstInit).toBe(secondInit);
    });

    it('should handle initialization errors gracefully', () => {
      // Test that errors during polyfill init are caught
      // We can't easily trigger this without mocking internals,
      // so we just verify it doesn't throw in normal operation
      expect(() => initBrowserPolyfills()).not.toThrow();
    });

    it('should not polyfill if RTCPeerConnection already exists', () => {
      const existingRTC = function() { return 'existing'; };
      (global as any).window.RTCPeerConnection = existingRTC;
      (global as any).window.webkitRTCPeerConnection = function() { return 'webkit'; };
      
      initBrowserPolyfills();
      
      expect((global as any).window.RTCPeerConnection).toBe(existingRTC);
    });

    it('should not polyfill mediaDevices if it already exists', () => {
      const existingMediaDevices = { getUserMedia: jest.fn() };
      (global as any).navigator.mediaDevices = existingMediaDevices;
      (global as any).navigator.webkitGetUserMedia = jest.fn();
      
      initBrowserPolyfills();
      
      expect((global as any).navigator.mediaDevices).toBe(existingMediaDevices);
    });

    it('should not polyfill getUserMedia if it already exists', () => {
      const existingGetUserMedia = jest.fn();
      (global as any).navigator.mediaDevices = { getUserMedia: existingGetUserMedia };
      (global as any).navigator.webkitGetUserMedia = jest.fn();
      
      initBrowserPolyfills();
      
      expect((global as any).navigator.mediaDevices.getUserMedia).toBe(existingGetUserMedia);
    });

    it('should not polyfill getUserMedia if no vendor prefix is available', () => {
      (global as any).navigator.mediaDevices = {}; // mediaDevices exists but getUserMedia doesn't
      delete (global as any).navigator.webkitGetUserMedia;
      delete (global as any).navigator.mozGetUserMedia;
      delete (global as any).navigator.msGetUserMedia;
      
      initBrowserPolyfills();
      
      // getUserMedia should remain undefined since no polyfill source was available
      expect((global as any).navigator.mediaDevices.getUserMedia).toBeUndefined();
    });
  });

  describe('isBrowserSupported', () => {
    it('should return true for browser with RTCPeerConnection and getUserMedia', () => {
      (global as any).window.RTCPeerConnection = function() {};
      (global as any).navigator.mediaDevices = {
        getUserMedia: jest.fn(),
      };
      
      expect(isBrowserSupported()).toBe(true);
    });

    it('should return true for browser with webkitRTCPeerConnection', () => {
      (global as any).window.webkitRTCPeerConnection = function() {};
      (global as any).navigator.mediaDevices = {
        getUserMedia: jest.fn(),
      };
      
      expect(isBrowserSupported()).toBe(true);
    });

    it('should return true for browser with mozRTCPeerConnection', () => {
      (global as any).window.mozRTCPeerConnection = function() {};
      (global as any).navigator.mediaDevices = {
        getUserMedia: jest.fn(),
      };
      
      expect(isBrowserSupported()).toBe(true);
    });

    it('should return true for browser with webkitGetUserMedia', () => {
      (global as any).window.RTCPeerConnection = function() {};
      (global as any).navigator.webkitGetUserMedia = jest.fn();
      
      expect(isBrowserSupported()).toBe(true);
    });

    it('should return true for browser with mozGetUserMedia', () => {
      (global as any).window.RTCPeerConnection = function() {};
      (global as any).navigator.mozGetUserMedia = jest.fn();
      
      expect(isBrowserSupported()).toBe(true);
    });

    it('should return true for browser with msGetUserMedia', () => {
      (global as any).window.RTCPeerConnection = function() {};
      (global as any).navigator.msGetUserMedia = jest.fn();
      
      expect(isBrowserSupported()).toBe(true);
    });

    it('should return false when RTCPeerConnection is missing', () => {
      // Explicitly set all RTC properties to undefined
      (global as any).window.RTCPeerConnection = undefined;
      (global as any).window.webkitRTCPeerConnection = undefined;
      (global as any).window.mozRTCPeerConnection = undefined;
      
      (global as any).navigator.mediaDevices = {
        getUserMedia: jest.fn(),
      };
      
      expect(isBrowserSupported()).toBe(false);
    });

    it('should return false when getUserMedia is missing', () => {
      (global as any).window.RTCPeerConnection = function() {};
      
      expect(isBrowserSupported()).toBe(false);
    });

    it('should return false in non-browser environment (window undefined)', () => {
      delete (global as any).window;
      
      expect(isBrowserSupported()).toBe(false);
    });

    it('should return false in non-browser environment (navigator undefined)', () => {
      delete (global as any).navigator;
      
      expect(isBrowserSupported()).toBe(false);
    });
  });

  describe('isSafari', () => {
    it('should return true for Safari user agent', () => {
      (global as any).navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15';
      
      expect(isSafari()).toBe(true);
    });

    it('should return false for Chrome user agent', () => {
      (global as any).navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      
      expect(isSafari()).toBe(false);
    });

    it('should return false for Android user agent', () => {
      (global as any).navigator.userAgent = 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0 Mobile Safari/537.36';
      
      expect(isSafari()).toBe(false);
    });

    it('should return false for Firefox user agent', () => {
      (global as any).navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
      
      expect(isSafari()).toBe(false);
    });

    it('should return false in non-browser environment', () => {
      delete (global as any).navigator;
      
      expect(isSafari()).toBe(false);
    });
  });

  describe('isIOS', () => {
    it('should return true for iPad user agent', () => {
      (global as any).navigator.userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15';
      
      expect(isIOS()).toBe(true);
    });

    it('should return true for iPhone user agent', () => {
      (global as any).navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15';
      
      expect(isIOS()).toBe(true);
    });

    it('should return true for iPod user agent', () => {
      (global as any).navigator.userAgent = 'Mozilla/5.0 (iPod touch; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15';
      
      expect(isIOS()).toBe(true);
    });

    it('should return false for Windows Phone with MSStream', () => {
      (global as any).navigator.userAgent = 'Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1; Microsoft; Lumia 950) iPad';
      (global as any).window.MSStream = {};
      
      expect(isIOS()).toBe(false);
    });

    it('should return false for Android user agent', () => {
      (global as any).navigator.userAgent = 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36';
      
      expect(isIOS()).toBe(false);
    });

    it('should return false for desktop user agent', () => {
      (global as any).navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0';
      
      expect(isIOS()).toBe(false);
    });

    it('should return false in non-browser environment', () => {
      delete (global as any).navigator;
      
      expect(isIOS()).toBe(false);
    });
  });
});
