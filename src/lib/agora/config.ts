/**
 * Agora RTC Configuration and Constants
 */

export const AGORA_CONFIG = {
  LOG_LEVEL: 4, // 0=DEBUG, 1=INFO, 2=WARNING, 3=ERROR, 4=NONE
  
  // Timeouts
  TIMEOUTS: {
    JOIN: {
      BASE: 30000,        // 30s base timeout for join
      SLOW_NETWORK: 35000, // 35s for slow networks
      RETRY_INCREMENT: 5000, // Add 5s per retry
    },
    TRACK_CREATION: {
      MOBILE: 25000,  // 25s for mobile devices
      DESKTOP: 20000, // 20s for desktop
    },
    PUBLISH: 10000,    // 10s for publishing tracks
    TRACK_TOGGLE: 10000, // 10s for toggling camera/mic
  },
  
  // Retry configuration
  RETRY: {
    MAX_JOIN_ATTEMPTS: 2,
    MAX_TRACK_ATTEMPTS: 3,
    BACKOFF_DELAYS: [2000, 4000], // 2s, 4s
    TRACK_BACKOFF_DELAYS: [1000, 2000, 4000], // 1s, 2s, 4s
  },
  
  // Video configuration
  VIDEO: {
    width: 640,
    height: 480,
    frameRate: 30,
    bitrateMin: 400,
    bitrateMax: 1000,
  },
  
  VIDEO_OPTIMIZATION_MODE: 'detail' as const,
  
  // Audio configuration
  AUDIO: {
    AEC: true, // Acoustic Echo Cancellation
    ANS: true, // Automatic Noise Suppression
    AGC: true, // Automatic Gain Control
  },
} as const;

/**
 * Detect if device is mobile
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Detect if device is Safari
 */
export function isSafariBrowser(): boolean {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

/**
 * Detect slow network connection
 */
export function isSlowNetwork(): boolean {
  try {
    const networkInfo = (navigator as any).connection;
    if (networkInfo) {
      const slowTypes = ['slow-2g', '2g'];
      return slowTypes.includes(networkInfo.effectiveType);
    }
  } catch {
    // Ignore if Network Information API not available
  }
  return false;
}
