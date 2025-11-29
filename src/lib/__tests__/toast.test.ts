import { describe, it, expect } from 'vitest';
import { parseMediaError, parseConnectionError, ErrorCode } from '@/lib/toast';

describe('Toast Utilities', () => {
  describe('ErrorCode enum', () => {
    it('should have correct error code values', () => {
      expect(ErrorCode.BACKEND_UNAVAILABLE).toBe('E001');
      expect(ErrorCode.CONNECTION_TIMEOUT).toBe('E002');
      expect(ErrorCode.CONNECTION_LOST).toBe('E003');
      expect(ErrorCode.AUTH_FAILED).toBe('E004');
      expect(ErrorCode.CAMERA_PERMISSION_DENIED).toBe('E101');
      expect(ErrorCode.MIC_PERMISSION_DENIED).toBe('E102');
      expect(ErrorCode.CAMERA_IN_USE).toBe('E103');
      expect(ErrorCode.MIC_IN_USE).toBe('E104');
      expect(ErrorCode.MEDIA_DEVICE_NOT_FOUND).toBe('E105');
      expect(ErrorCode.CHANNEL_JOIN_FAILED).toBe('E201');
      expect(ErrorCode.CHANNEL_LEAVE_FAILED).toBe('E202');
      expect(ErrorCode.PUBLISH_FAILED).toBe('E203');
      expect(ErrorCode.MESSAGE_SEND_FAILED).toBe('E301');
      expect(ErrorCode.MESSAGE_SERVICE_UNAVAILABLE).toBe('E302');
    });
  });

  describe('parseMediaError', () => {
    describe('permission denied errors', () => {
      it('should parse camera permission denied', () => {
        const result = parseMediaError('PERMISSION_DENIED camera');
        expect(result.code).toBe(ErrorCode.CAMERA_PERMISSION_DENIED);
        expect(result.message).toContain('Camera access denied');
      });

      it('should parse microphone permission denied', () => {
        const result = parseMediaError('PERMISSION_DENIED microphone');
        expect(result.code).toBe(ErrorCode.MIC_PERMISSION_DENIED);
        expect(result.message).toContain('Microphone access denied');
      });

      it('should parse generic permission denied', () => {
        const result = parseMediaError('PERMISSION_DENIED');
        expect(result.code).toBe(ErrorCode.CAMERA_PERMISSION_DENIED);
        expect(result.message).toContain('Camera or microphone access denied');
      });
    });

    describe('device in use errors', () => {
      it('should parse camera in use', () => {
        const result = parseMediaError('DEVICE_IN_USE camera');
        expect(result.code).toBe(ErrorCode.CAMERA_IN_USE);
        expect(result.message).toContain('Camera is being used');
      });

      it('should parse microphone in use', () => {
        const result = parseMediaError('DEVICE_IN_USE microphone');
        expect(result.code).toBe(ErrorCode.MIC_IN_USE);
        expect(result.message).toContain('Microphone is being used');
      });

      it('should parse generic device in use', () => {
        const result = parseMediaError('DEVICE_IN_USE');
        expect(result.code).toBe(ErrorCode.CAMERA_IN_USE);
        expect(result.message).toContain('Camera or microphone is being used');
      });
    });

    describe('device not found errors', () => {
      it('should parse camera not found', () => {
        const result = parseMediaError('DEVICE_NOT_FOUND camera');
        expect(result.code).toBe(ErrorCode.MEDIA_DEVICE_NOT_FOUND);
        expect(result.message).toContain('No camera found');
      });

      it('should parse microphone not found', () => {
        const result = parseMediaError('DEVICE_NOT_FOUND microphone');
        expect(result.code).toBe(ErrorCode.MEDIA_DEVICE_NOT_FOUND);
        expect(result.message).toContain('No microphone found');
      });

      it('should parse generic device not found', () => {
        const result = parseMediaError('DEVICE_NOT_FOUND');
        expect(result.code).toBe(ErrorCode.MEDIA_DEVICE_NOT_FOUND);
        expect(result.message).toContain('Camera or microphone not found');
      });
    });

    describe('NotAllowed errors', () => {
      it('should parse video NotAllowed', () => {
        const result = parseMediaError('NotAllowed video');
        expect(result.code).toBe(ErrorCode.CAMERA_PERMISSION_DENIED);
        expect(result.message).toContain('Camera access denied');
      });

      it('should parse audio NotAllowed', () => {
        const result = parseMediaError('NotAllowed audio');
        expect(result.code).toBe(ErrorCode.MIC_PERMISSION_DENIED);
        expect(result.message).toContain('Microphone access denied');
      });
    });

    describe('NotFound errors', () => {
      it('should parse NotFound camera', () => {
        const result = parseMediaError('NotFound camera');
        expect(result.code).toBe(ErrorCode.MEDIA_DEVICE_NOT_FOUND);
        expect(result.message).toContain('No camera found');
      });

      it('should parse NotFound microphone', () => {
        const result = parseMediaError('NotFound microphone');
        expect(result.code).toBe(ErrorCode.MEDIA_DEVICE_NOT_FOUND);
        expect(result.message).toContain('No microphone found');
      });

      it('should parse NotFound generic', () => {
        const result = parseMediaError('NotFound');
        expect(result.code).toBe(ErrorCode.MEDIA_DEVICE_NOT_FOUND);
        expect(result.message).toContain('Camera or microphone not found');
      });
    });

    describe('NotReadable errors', () => {
      it('should parse NotReadable as device in use', () => {
        const result = parseMediaError('NotReadable');
        expect(result.code).toBe(ErrorCode.CAMERA_IN_USE);
        expect(result.message).toContain('being used by another application');
      });

      it('should parse "in use" as device in use', () => {
        const result = parseMediaError('Device in use');
        expect(result.code).toBe(ErrorCode.CAMERA_IN_USE);
      });
    });

    describe('timeout errors', () => {
      it('should parse timeout error', () => {
        const result = parseMediaError('Request timeout');
        expect(result.code).toBe(ErrorCode.CONNECTION_TIMEOUT);
        expect(result.message).toContain('timed out');
      });
    });

    describe('unknown errors', () => {
      it('should return generic error for unknown errors', () => {
        const result = parseMediaError('Some random error');
        expect(result.code).toBe(ErrorCode.MEDIA_DEVICE_NOT_FOUND);
        expect(result.message).toContain('Failed to access camera or microphone');
      });

      it('should handle Error objects', () => {
        const result = parseMediaError(new Error('Camera NotAllowed'));
        expect(result.code).toBe(ErrorCode.CAMERA_PERMISSION_DENIED);
      });
    });
  });

  describe('parseConnectionError', () => {
    describe('timeout errors', () => {
      it('should parse timeout error', () => {
        const result = parseConnectionError('Connection timeout');
        expect(result.code).toBe(ErrorCode.CONNECTION_TIMEOUT);
        expect(result.message).toContain('Connection timed out');
      });

      it('should parse timed out error', () => {
        const result = parseConnectionError('Request timed out');
        expect(result.code).toBe(ErrorCode.CONNECTION_TIMEOUT);
        expect(result.message).toContain('Connection timed out');
      });
    });

    describe('token errors', () => {
      it('should parse token error', () => {
        const result = parseConnectionError('Invalid token');
        expect(result.code).toBe(ErrorCode.AUTH_FAILED);
        expect(result.message).toContain('Session expired');
      });

      it('should parse token expired', () => {
        const result = parseConnectionError('Token expired');
        expect(result.code).toBe(ErrorCode.AUTH_FAILED);
      });
    });

    describe('backend errors', () => {
      it('should parse backend unavailable', () => {
        const result = parseConnectionError('Backend unavailable');
        expect(result.code).toBe(ErrorCode.BACKEND_UNAVAILABLE);
        expect(result.message).toContain('Service temporarily unavailable');
      });

      it('should parse service unavailable', () => {
        const result = parseConnectionError('Service unavailable');
        expect(result.code).toBe(ErrorCode.BACKEND_UNAVAILABLE);
      });
    });

    describe('network errors', () => {
      it('should parse network error', () => {
        const result = parseConnectionError('Network error');
        expect(result.code).toBe(ErrorCode.CONNECTION_LOST);
        expect(result.message).toContain('No internet connection');
      });

      it('should parse offline error', () => {
        const result = parseConnectionError('Browser is offline');
        expect(result.code).toBe(ErrorCode.CONNECTION_LOST);
        expect(result.message).toContain('No internet connection');
      });
    });

    describe('unknown errors', () => {
      it('should return generic connection error for unknown errors', () => {
        const result = parseConnectionError('Some random error');
        expect(result.code).toBe(ErrorCode.CONNECTION_LOST);
        expect(result.message).toContain('Connection failed');
      });

      it('should handle Error objects', () => {
        const result = parseConnectionError(new Error('Timeout occurred'));
        expect(result.code).toBe(ErrorCode.CONNECTION_TIMEOUT);
      });
    });
  });
});
