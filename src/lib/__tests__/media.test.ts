import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPersistedCameraState,
  getPersistedMicState,
  persistCameraState,
  persistMicState,
  getPersistedMediaStates,
  clearPersistedMediaStates,
} from '@/lib/media';

describe('Media State Utilities', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  describe('getPersistedCameraState', () => {
    it('should return false by default when nothing is stored', () => {
      expect(getPersistedCameraState()).toBe(false);
    });

    it('should return true when camera state is stored as true', () => {
      sessionStorage.setItem('omegle_camera_state', 'true');
      expect(getPersistedCameraState()).toBe(true);
    });

    it('should return false when camera state is stored as false', () => {
      sessionStorage.setItem('omegle_camera_state', 'false');
      expect(getPersistedCameraState()).toBe(false);
    });
  });

  describe('getPersistedMicState', () => {
    it('should return false by default when nothing is stored', () => {
      expect(getPersistedMicState()).toBe(false);
    });

    it('should return true when mic state is stored as true', () => {
      sessionStorage.setItem('omegle_mic_state', 'true');
      expect(getPersistedMicState()).toBe(true);
    });

    it('should return false when mic state is stored as false', () => {
      sessionStorage.setItem('omegle_mic_state', 'false');
      expect(getPersistedMicState()).toBe(false);
    });
  });

  describe('persistCameraState', () => {
    it('should persist camera state as true', () => {
      persistCameraState(true);
      expect(sessionStorage.getItem('omegle_camera_state')).toBe('true');
    });

    it('should persist camera state as false', () => {
      persistCameraState(false);
      expect(sessionStorage.getItem('omegle_camera_state')).toBe('false');
    });

    it('should update last updated timestamp', () => {
      persistCameraState(true);
      expect(sessionStorage.getItem('omegle_media_last_updated')).not.toBeNull();
    });
  });

  describe('persistMicState', () => {
    it('should persist mic state as true', () => {
      persistMicState(true);
      expect(sessionStorage.getItem('omegle_mic_state')).toBe('true');
    });

    it('should persist mic state as false', () => {
      persistMicState(false);
      expect(sessionStorage.getItem('omegle_mic_state')).toBe('false');
    });

    it('should update last updated timestamp', () => {
      persistMicState(true);
      expect(sessionStorage.getItem('omegle_media_last_updated')).not.toBeNull();
    });
  });

  describe('getPersistedMediaStates', () => {
    it('should return default states when nothing is stored', () => {
      expect(getPersistedMediaStates()).toEqual({ camera: false, mic: false });
    });

    it('should return stored states', () => {
      persistCameraState(true);
      persistMicState(true);
      expect(getPersistedMediaStates()).toEqual({ camera: true, mic: true });
    });

    it('should return mixed states correctly', () => {
      persistCameraState(true);
      persistMicState(false);
      expect(getPersistedMediaStates()).toEqual({ camera: true, mic: false });
    });
  });

  describe('clearPersistedMediaStates', () => {
    it('should clear all media states', () => {
      persistCameraState(true);
      persistMicState(true);

      clearPersistedMediaStates();

      expect(sessionStorage.getItem('omegle_camera_state')).toBeNull();
      expect(sessionStorage.getItem('omegle_mic_state')).toBeNull();
      expect(sessionStorage.getItem('omegle_media_last_updated')).toBeNull();
    });
  });
});
