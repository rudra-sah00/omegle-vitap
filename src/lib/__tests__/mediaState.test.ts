import {
  getPersistedCameraState,
  getPersistedMicState,
  persistCameraState,
  persistMicState,
  getPersistedMediaStates,
  clearPersistedMediaStates,
} from '../mediaState';

describe('mediaState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getPersistedCameraState', () => {
    it('should return false by default', () => {
      expect(getPersistedCameraState()).toBe(false);
    });

    it('should return persisted state when true', () => {
      localStorage.setItem('omegle_camera_state', 'true');
      expect(getPersistedCameraState()).toBe(true);
    });

    it('should return persisted state when false', () => {
      localStorage.setItem('omegle_camera_state', 'false');
      expect(getPersistedCameraState()).toBe(false);
    });

    it('should handle invalid stored values', () => {
      localStorage.setItem('omegle_camera_state', 'invalid');
      expect(getPersistedCameraState()).toBe(false);
    });
  });

  describe('getPersistedMicState', () => {
    it('should return false by default', () => {
      expect(getPersistedMicState()).toBe(false);
    });

    it('should return persisted state when true', () => {
      localStorage.setItem('omegle_mic_state', 'true');
      expect(getPersistedMicState()).toBe(true);
    });

    it('should return persisted state when false', () => {
      localStorage.setItem('omegle_mic_state', 'false');
      expect(getPersistedMicState()).toBe(false);
    });

    it('should handle invalid stored values', () => {
      localStorage.setItem('omegle_mic_state', 'invalid');
      expect(getPersistedMicState()).toBe(false);
    });
  });

  describe('persistCameraState', () => {
    it('should persist camera state as true', () => {
      persistCameraState(true);
      expect(localStorage.getItem('omegle_camera_state')).toBe('true');
    });

    it('should persist camera state as false', () => {
      persistCameraState(false);
      expect(localStorage.getItem('omegle_camera_state')).toBe('false');
    });
  });

  describe('persistMicState', () => {
    it('should persist mic state as true', () => {
      persistMicState(true);
      expect(localStorage.getItem('omegle_mic_state')).toBe('true');
    });

    it('should persist mic state as false', () => {
      persistMicState(false);
      expect(localStorage.getItem('omegle_mic_state')).toBe('false');
    });
  });

  describe('getPersistedMediaStates', () => {
    it('should return both states as false by default', () => {
      const states = getPersistedMediaStates();
      expect(states).toEqual({ camera: false, mic: false });
    });

    it('should return persisted states', () => {
      localStorage.setItem('omegle_camera_state', 'true');
      localStorage.setItem('omegle_mic_state', 'true');
      const states = getPersistedMediaStates();
      expect(states).toEqual({ camera: true, mic: true });
    });

    it('should handle mixed states', () => {
      localStorage.setItem('omegle_camera_state', 'true');
      localStorage.setItem('omegle_mic_state', 'false');
      const states = getPersistedMediaStates();
      expect(states).toEqual({ camera: true, mic: false });
    });
  });

  describe('clearPersistedMediaStates', () => {
    it('should clear both camera and mic states', () => {
      localStorage.setItem('omegle_camera_state', 'false');
      localStorage.setItem('omegle_mic_state', 'false');
      clearPersistedMediaStates();
      expect(localStorage.getItem('omegle_camera_state')).toBeNull();
      expect(localStorage.getItem('omegle_mic_state')).toBeNull();
    });

    it('should not throw if states do not exist', () => {
      expect(() => clearPersistedMediaStates()).not.toThrow();
    });
  });
});
