/**
 * Media State Utilities
 * Session storage for media device preferences
 */

const STORAGE_KEYS = {
  CAMERA_STATE: 'omegle_camera_state',
  MIC_STATE: 'omegle_mic_state',
  LAST_UPDATED: 'omegle_media_last_updated',
} as const;

const DEFAULT_CAMERA_STATE = false;
const DEFAULT_MIC_STATE = false;

/**
 * Get persisted camera state
 */
export function getPersistedCameraState(): boolean {
  if (typeof window === 'undefined') return DEFAULT_CAMERA_STATE;
  
  try {
    const stored = sessionStorage.getItem(STORAGE_KEYS.CAMERA_STATE);
    return stored !== null ? stored === 'true' : DEFAULT_CAMERA_STATE;
  } catch {
    return DEFAULT_CAMERA_STATE;
  }
}

/**
 * Get persisted microphone state
 */
export function getPersistedMicState(): boolean {
  if (typeof window === 'undefined') return DEFAULT_MIC_STATE;
  
  try {
    const stored = sessionStorage.getItem(STORAGE_KEYS.MIC_STATE);
    return stored !== null ? stored === 'true' : DEFAULT_MIC_STATE;
  } catch {
    return DEFAULT_MIC_STATE;
  }
}

/**
 * Persist camera state
 */
export function persistCameraState(isOn: boolean): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem(STORAGE_KEYS.CAMERA_STATE, String(isOn));
    sessionStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
  } catch {
    // Failed to save camera state
  }
}

/**
 * Persist microphone state
 */
export function persistMicState(isOn: boolean): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem(STORAGE_KEYS.MIC_STATE, String(isOn));
    sessionStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
  } catch {
    // Failed to save mic state
  }
}

/**
 * Get both persisted states
 */
export function getPersistedMediaStates(): { camera: boolean; mic: boolean } {
  return {
    camera: getPersistedCameraState(),
    mic: getPersistedMicState(),
  };
}

/**
 * Clear all persisted media states
 */
export function clearPersistedMediaStates(): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.removeItem(STORAGE_KEYS.CAMERA_STATE);
    sessionStorage.removeItem(STORAGE_KEYS.MIC_STATE);
    sessionStorage.removeItem(STORAGE_KEYS.LAST_UPDATED);
  } catch {
    // Failed to clear media states
  }
}
