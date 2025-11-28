/**
 * Media State Utilities
 * Session storage for media device preferences
 * 
 * @description Provides utilities for persisting camera and microphone
 * state in session storage. This allows users' media preferences to
 * persist across page navigations within the same session.
 * 
 * @example
 * ```tsx
 * import { persistCameraState, getPersistedCameraState } from '@/lib/media';
 * 
 * // Save state
 * persistCameraState(true);
 * 
 * // Retrieve state
 * const isCameraOn = getPersistedCameraState();
 * ```
 */

/** Storage keys for media state */
const STORAGE_KEYS = {
  CAMERA_STATE: 'omegle_camera_state',
  MIC_STATE: 'omegle_mic_state',
  LAST_UPDATED: 'omegle_media_last_updated',
} as const;

/** Default states for camera and microphone */
const DEFAULT_CAMERA_STATE = false;
const DEFAULT_MIC_STATE = false;

/**
 * Get persisted camera state from session storage
 * 
 * @returns The persisted camera state, or default (false) if not set
 * 
 * @example
 * ```tsx
 * const isCameraOn = getPersistedCameraState();
 * if (isCameraOn) {
 *   await enableCamera();
 * }
 * ```
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
 * Get persisted microphone state from session storage
 * 
 * @returns The persisted microphone state, or default (false) if not set
 * 
 * @example
 * ```tsx
 * const isMicOn = getPersistedMicState();
 * if (isMicOn) {
 *   await enableMicrophone();
 * }
 * ```
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
 * Persist camera state to session storage
 * 
 * @param isOn - Whether the camera is on
 * 
 * @example
 * ```tsx
 * const handleToggleCamera = () => {
 *   const newState = !isCameraOn;
 *   setCameraOn(newState);
 *   persistCameraState(newState);
 * };
 * ```
 */
export function persistCameraState(isOn: boolean): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem(STORAGE_KEYS.CAMERA_STATE, String(isOn));
    sessionStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
  } catch {
    // Storage quota exceeded or private mode - silently ignore
  }
}

/**
 * Persist microphone state to session storage
 * 
 * @param isOn - Whether the microphone is on
 * 
 * @example
 * ```tsx
 * const handleToggleMic = () => {
 *   const newState = !isMicOn;
 *   setMicOn(newState);
 *   persistMicState(newState);
 * };
 * ```
 */
export function persistMicState(isOn: boolean): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem(STORAGE_KEYS.MIC_STATE, String(isOn));
    sessionStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
  } catch {
    // Storage quota exceeded or private mode - silently ignore
  }
}

/**
 * Get both persisted media states at once
 * 
 * @returns Object containing camera and mic states
 * 
 * @example
 * ```tsx
 * const { camera, mic } = getPersistedMediaStates();
 * await initializeMedia(camera, mic);
 * ```
 */
export function getPersistedMediaStates(): { camera: boolean; mic: boolean } {
  return {
    camera: getPersistedCameraState(),
    mic: getPersistedMicState(),
  };
}

/**
 * Clear all persisted media states from session storage
 * Useful when user logs out or wants to reset preferences
 * 
 * @example
 * ```tsx
 * const handleReset = () => {
 *   clearPersistedMediaStates();
 *   setCameraOn(false);
 *   setMicOn(false);
 * };
 * ```
 */
export function clearPersistedMediaStates(): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.removeItem(STORAGE_KEYS.CAMERA_STATE);
    sessionStorage.removeItem(STORAGE_KEYS.MIC_STATE);
    sessionStorage.removeItem(STORAGE_KEYS.LAST_UPDATED);
  } catch {
    // Storage access failed - silently ignore
  }
}
