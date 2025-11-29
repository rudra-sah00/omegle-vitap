import { describe, it, expect, afterEach } from 'vitest';
import {
  LIVEKIT_CONFIG,
  getVideoSettingsForNetwork,
  getAudioSettingsForNetwork,
  isMobileDevice,
  isSafariBrowser,
  isSlowNetwork,
} from '@/services/livekit/config';

describe('LiveKit Config', () => {
  describe('LIVEKIT_CONFIG constants', () => {
    it('should have correct timeout values', () => {
      expect(LIVEKIT_CONFIG.TIMEOUTS.CONNECT).toBe(30000);
      expect(LIVEKIT_CONFIG.TIMEOUTS.TRACK_CREATION).toBe(20000);
      expect(LIVEKIT_CONFIG.TIMEOUTS.PUBLISH).toBe(10000);
    });

    it('should have correct retry values', () => {
      expect(LIVEKIT_CONFIG.RETRY.MAX_CONNECT_ATTEMPTS).toBe(2);
      expect(LIVEKIT_CONFIG.RETRY.BACKOFF_DELAYS).toEqual([2000, 4000]);
    });

    it('should have correct video resolution', () => {
      expect(LIVEKIT_CONFIG.VIDEO.resolution).toEqual({
        width: 1280,
        height: 720,
        frameRate: 30,
      });
    });

    it('should have video presets for all quality levels', () => {
      expect(LIVEKIT_CONFIG.VIDEO.presets.excellent).toBeDefined();
      expect(LIVEKIT_CONFIG.VIDEO.presets.good).toBeDefined();
      expect(LIVEKIT_CONFIG.VIDEO.presets.poor).toBeDefined();
      expect(LIVEKIT_CONFIG.VIDEO.presets.unknown).toBeDefined();
    });

    it('should have audio settings', () => {
      expect(LIVEKIT_CONFIG.AUDIO.echoCancellation).toBe(true);
      expect(LIVEKIT_CONFIG.AUDIO.noiseSuppression).toBe(true);
      expect(LIVEKIT_CONFIG.AUDIO.autoGainControl).toBe(true);
    });

    it('should have audio presets for all quality levels', () => {
      expect(LIVEKIT_CONFIG.AUDIO.presets.excellent).toBeDefined();
      expect(LIVEKIT_CONFIG.AUDIO.presets.good).toBeDefined();
      expect(LIVEKIT_CONFIG.AUDIO.presets.poor).toBeDefined();
      expect(LIVEKIT_CONFIG.AUDIO.presets.unknown).toBeDefined();
    });
  });

  describe('getVideoSettingsForNetwork', () => {
    it('should return excellent settings for excellent quality', () => {
      const settings = getVideoSettingsForNetwork('excellent');
      expect(settings).toEqual({
        width: 1920,
        height: 1080,
        frameRate: 30,
        maxBitrate: 2500000,
      });
    });

    it('should return good settings for good quality', () => {
      const settings = getVideoSettingsForNetwork('good');
      expect(settings).toEqual({
        width: 1280,
        height: 720,
        frameRate: 30,
        maxBitrate: 1500000,
      });
    });

    it('should return poor settings for poor quality', () => {
      const settings = getVideoSettingsForNetwork('poor');
      expect(settings).toEqual({
        width: 640,
        height: 360,
        frameRate: 24,
        maxBitrate: 500000,
      });
    });

    it('should return unknown settings for unknown quality', () => {
      const settings = getVideoSettingsForNetwork('unknown');
      expect(settings).toEqual({
        width: 1280,
        height: 720,
        frameRate: 30,
        maxBitrate: 1200000,
      });
    });
  });

  describe('getAudioSettingsForNetwork', () => {
    it('should return excellent settings for excellent quality', () => {
      const settings = getAudioSettingsForNetwork('excellent');
      expect(settings).toEqual({ maxBitrate: 64000 });
    });

    it('should return good settings for good quality', () => {
      const settings = getAudioSettingsForNetwork('good');
      expect(settings).toEqual({ maxBitrate: 48000 });
    });

    it('should return poor settings for poor quality', () => {
      const settings = getAudioSettingsForNetwork('poor');
      expect(settings).toEqual({ maxBitrate: 24000 });
    });

    it('should return unknown settings for unknown quality', () => {
      const settings = getAudioSettingsForNetwork('unknown');
      expect(settings).toEqual({ maxBitrate: 48000 });
    });
  });

  describe('isMobileDevice', () => {
    const originalNavigator = global.navigator;

    afterEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
    });

    it('should return false when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-expect-error - testing undefined window
      global.window = undefined;
      expect(isMobileDevice()).toBe(false);
      global.window = originalWindow;
    });

    it('should return true for Android user agent', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36' },
        writable: true,
      });
      expect(isMobileDevice()).toBe(true);
    });

    it('should return true for iPhone user agent', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0) AppleWebKit/605.1.15' },
        writable: true,
      });
      expect(isMobileDevice()).toBe(true);
    });

    it('should return true for iPad user agent', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15' },
        writable: true,
      });
      expect(isMobileDevice()).toBe(true);
    });

    it('should return false for desktop user agent', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        writable: true,
      });
      expect(isMobileDevice()).toBe(false);
    });
  });

  describe('isSafariBrowser', () => {
    const originalNavigator = global.navigator;

    afterEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
    });

    it('should return false when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-expect-error - testing undefined window
      global.window = undefined;
      expect(isSafariBrowser()).toBe(false);
      global.window = originalWindow;
    });

    it('should return true for Safari user agent', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        },
        writable: true,
      });
      expect(isSafariBrowser()).toBe(true);
    });

    it('should return false for Chrome user agent', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        writable: true,
      });
      expect(isSafariBrowser()).toBe(false);
    });

    it('should return false for Android Chrome user agent', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36',
        },
        writable: true,
      });
      expect(isSafariBrowser()).toBe(false);
    });
  });

  describe('isSlowNetwork', () => {
    const originalNavigator = global.navigator;

    afterEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
    });

    it('should return false when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-expect-error - testing undefined window
      global.window = undefined;
      expect(isSlowNetwork()).toBe(false);
      global.window = originalWindow;
    });

    it('should return true for 2g connection', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0',
          connection: { effectiveType: '2g' },
        },
        writable: true,
      });
      expect(isSlowNetwork()).toBe(true);
    });

    it('should return true for slow-2g connection', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0',
          connection: { effectiveType: 'slow-2g' },
        },
        writable: true,
      });
      expect(isSlowNetwork()).toBe(true);
    });

    it('should return false for 4g connection', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0',
          connection: { effectiveType: '4g' },
        },
        writable: true,
      });
      expect(isSlowNetwork()).toBe(false);
    });

    it('should return false for 3g connection', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0',
          connection: { effectiveType: '3g' },
        },
        writable: true,
      });
      expect(isSlowNetwork()).toBe(false);
    });

    it('should return false when connection API is not available', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0',
        },
        writable: true,
      });
      expect(isSlowNetwork()).toBe(false);
    });
  });
});
