/**
 * Utility to persist user's media device preferences across sessions
 * Camera and mic states remain ON/OFF across multiple matches until user manually changes them
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
 * Get persisted camera state
 */
export function getPersistedCameraState(): boolean {
  if (typeof window === 'undefined') return DEFAULT_CAMERA_STATE;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CAMERA_STATE);
    return stored !== null ? stored === 'true' : DEFAULT_CAMERA_STATE;
  } catch (error) {
    console.warn('Failed to read camera state from localStorage:', error);
    return DEFAULT_CAMERA_STATE;
  }
}

/**
 * Get persisted microphone state
 */
export function getPersistedMicState(): boolean {
  if (typeof window === 'undefined') return DEFAULT_MIC_STATE;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MIC_STATE);
    return stored !== null ? stored === 'true' : DEFAULT_MIC_STATE;
  } catch (error) {
    console.warn('Failed to read mic state from localStorage:', error);
    return DEFAULT_MIC_STATE;
  }
}

/**
 * Persist camera state
 */
export function persistCameraState(isOn: boolean): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.CAMERA_STATE, String(isOn));
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
  } catch (error) {
    console.warn('Failed to save camera state to localStorage:', error);
  }
}

/**
 * Persist microphone state
 */
export function persistMicState(isOn: boolean): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.MIC_STATE, String(isOn));
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
  } catch (error) {
    console.warn('Failed to save mic state to localStorage:', error);
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
    localStorage.removeItem(STORAGE_KEYS.CAMERA_STATE);
    localStorage.removeItem(STORAGE_KEYS.MIC_STATE);
    localStorage.removeItem(STORAGE_KEYS.LAST_UPDATED);
  } catch (error) {
    console.warn('Failed to clear media states from localStorage:', error);
  }
}
