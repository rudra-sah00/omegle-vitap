/**
 * LiveKit RTC Configuration
 * Optimized settings for 1-on-1 video chat
 */

export const LIVEKIT_CONFIG = {
  TIMEOUTS: {
    CONNECT: 30000,
    TRACK_CREATION: 20000,
    PUBLISH: 10000,
  },
  
  RETRY: {
    MAX_CONNECT_ATTEMPTS: 2,
    BACKOFF_DELAYS: [2000, 4000],
  },
  
  VIDEO: {
    resolution: {
      width: 1280,
      height: 720,
      frameRate: 30,
    },
    presets: {
      excellent: { width: 1920, height: 1080, frameRate: 30, maxBitrate: 2500000 },
      good: { width: 1280, height: 720, frameRate: 30, maxBitrate: 1500000 },
      poor: { width: 640, height: 360, frameRate: 24, maxBitrate: 500000 },
      unknown: { width: 1280, height: 720, frameRate: 30, maxBitrate: 1200000 },
    },
  },
  
  AUDIO: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    presets: {
      excellent: { maxBitrate: 64000 },
      good: { maxBitrate: 48000 },
      poor: { maxBitrate: 24000 },
      unknown: { maxBitrate: 48000 },
    },
  },
} as const;

export type NetworkQuality = 'excellent' | 'good' | 'poor' | 'unknown';

/**
 * Get video settings based on network quality
 */
export function getVideoSettingsForNetwork(quality: NetworkQuality) {
  return LIVEKIT_CONFIG.VIDEO.presets[quality];
}

/**
 * Get audio settings based on network quality
 */
export function getAudioSettingsForNetwork(quality: NetworkQuality) {
  return LIVEKIT_CONFIG.AUDIO.presets[quality];
}

/**
 * Detect if device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Detect if browser is Safari
 */
export function isSafariBrowser(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

/**
 * Detect slow network connection
 */
export function isSlowNetwork(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  try {
    const networkInfo = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
    if (networkInfo) {
      const slowTypes = ['slow-2g', '2g'];
      return slowTypes.includes(networkInfo.effectiveType || '');
    }
  } catch {
    // Network Information API not available in this browser - fallback to false
  }
  return false;
}
