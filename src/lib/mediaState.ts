/**
 * Utility to persist user's media device preferences within the current page session only
 * Camera and mic states remain ON/OFF during page usage but reset on page reload
 * Uses sessionStorage instead of localStorage to ensure fresh start on each page load
 */

const STORAGE_KEYS = {
  CAMERA_STATE: 'omegle_camera_state',
  MIC_STATE: 'omegle_mic_state',
  LAST_UPDATED: 'omegle_media_last_updated',
} as const;

// Default states (start with both OFF for privacy)
const DEFAULT_CAMERA_STATE = false;
const DEFAULT_MIC_STATE = false;

/**
 * Get persisted camera state from current session only
 */
export function getPersistedCameraState(): boolean {
  if (typeof window === 'undefined') return DEFAULT_CAMERA_STATE;
  
  try {
    const stored = sessionStorage.getItem(STORAGE_KEYS.CAMERA_STATE);
    return stored !== null ? stored === 'true' : DEFAULT_CAMERA_STATE;
  } catch (error) {
    return DEFAULT_CAMERA_STATE;
  }
}

/**
 * Get persisted microphone state from current session only
 */
export function getPersistedMicState(): boolean {
  if (typeof window === 'undefined') return DEFAULT_MIC_STATE;
  
  try {
    const stored = sessionStorage.getItem(STORAGE_KEYS.MIC_STATE);
    return stored !== null ? stored === 'true' : DEFAULT_MIC_STATE;
  } catch (error) {
    return DEFAULT_MIC_STATE;
  }
}

/**
 * Persist camera state to current session only
 */
export function persistCameraState(isOn: boolean): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem(STORAGE_KEYS.CAMERA_STATE, String(isOn));
    sessionStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
  } catch (error) {
    // Failed to save camera state
  }
}

/**
 * Persist microphone state to current session only
 */
export function persistMicState(isOn: boolean): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem(STORAGE_KEYS.MIC_STATE, String(isOn));
    sessionStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
  } catch (error) {
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
 * Clear all persisted media states (useful for logout or reset)
 */
export function clearPersistedMediaStates(): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.removeItem(STORAGE_KEYS.CAMERA_STATE);
    sessionStorage.removeItem(STORAGE_KEYS.MIC_STATE);
    sessionStorage.removeItem(STORAGE_KEYS.LAST_UPDATED);
  } catch (error) {
    // Failed to clear media states
  }
}
