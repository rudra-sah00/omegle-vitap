/**
 * @module lib/toast
 * Unit tests for toast notification system
 */

import { 
  showError, 
  showInfo, 
  showWarning, 
  showSuccess, 
  ErrorCode,
  parseMediaError,
  parseConnectionError
} from '../toast'
import toast from 'react-hot-toast'

// Mock react-hot-toast
jest.mock('react-hot-toast')

describe('Toast Module', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('showError', () => {
    it('should display error message', () => {
      const message = 'Connection failed'
      const errorCode = ErrorCode.CONNECTION_LOST
      
      showError(message, errorCode)
      
      expect(toast.error).toHaveBeenCalled()
    })

    it('should prevent duplicate errors within debounce time', () => {
      const message = 'Same error'
      const errorCode = ErrorCode.CONNECTION_LOST
      
      showError(message, errorCode)
      showError(message, errorCode)
      
      // Should only be called once due to debounce
      expect(toast.error).toHaveBeenCalledTimes(1)
    })

    it('should allow same error after debounce time', () => {
      const message = 'Same error'
      const errorCode = ErrorCode.CONNECTION_LOST
      
      showError(message, errorCode)
      const firstCallCount = (toast.error as jest.Mock).mock.calls.length
      
      // Advance time past the 3-second debounce
      jest.advanceTimersByTime(3001)
      
      showError(message, errorCode)
      const secondCallCount = (toast.error as jest.Mock).mock.calls.length
      
      // Should have been called twice total (once initially, once after debounce)
      expect(secondCallCount).toBe(firstCallCount + 1)
    })
  })

  describe('showInfo', () => {
    it('should display info message', () => {
      const message = 'Partner connected'
      
      showInfo(message)
      
      expect(toast).toHaveBeenCalled()
    })
  })

  describe('showWarning', () => {
    it('should display warning message', () => {
      const message = 'Slow connection detected'
      
      showWarning(message)
      
      expect(toast).toHaveBeenCalled()
    })
  })

  describe('showSuccess', () => {
    it('should display success message', () => {
      const message = 'Connected successfully'
      
      showSuccess(message)
      
      expect(toast.success).toHaveBeenCalled()
    })
  })

  describe('showInfo debounce', () => {
    it('should prevent duplicate info messages within debounce time', () => {
      const message = 'Partner is typing'
      
      showInfo(message)
      showInfo(message)
      
      expect(toast).toHaveBeenCalledTimes(1)
    })

    it('should allow same info message after debounce time', () => {
      const message = 'Partner is typing'
      
      showInfo(message)
      const firstCallCount = (toast as unknown as jest.Mock).mock.calls.length
      
      jest.advanceTimersByTime(3001)
      showInfo(message)
      const secondCallCount = (toast as unknown as jest.Mock).mock.calls.length
      
      expect(secondCallCount).toBe(firstCallCount + 1)
    })
  })

  describe('showWarning debounce', () => {
    it('should prevent duplicate warning messages within debounce time', () => {
      const message = 'Slow connection'
      
      showWarning(message)
      showWarning(message)
      
      expect(toast).toHaveBeenCalledTimes(1)
    })

    it('should allow same warning message after debounce time', () => {
      const message = 'Slow connection'
      
      showWarning(message)
      const firstCallCount = (toast as unknown as jest.Mock).mock.calls.length
      
      jest.advanceTimersByTime(3001)
      showWarning(message)
      const secondCallCount = (toast as unknown as jest.Mock).mock.calls.length
      
      expect(secondCallCount).toBe(firstCallCount + 1)
    })
  })

  describe('showSuccess debounce', () => {
    it('should prevent duplicate success messages within debounce time', () => {
      const message = 'Connected'
      
      showSuccess(message)
      showSuccess(message)
      
      expect(toast.success).toHaveBeenCalledTimes(1)
    })

    it('should allow same success message after debounce time', () => {
      const message = 'Connected'
      
      showSuccess(message)
      const firstCallCount = (toast.success as jest.Mock).mock.calls.length
      
      jest.advanceTimersByTime(3001)
      showSuccess(message)
      const secondCallCount = (toast.success as jest.Mock).mock.calls.length
      
      expect(secondCallCount).toBe(firstCallCount + 1)
    })
  })

  describe('parseMediaError', () => {
    it('should parse camera permission denied error', () => {
      const error = new Error('Permission denied for video camera')
      const result = parseMediaError(error)
      
      expect(result.message).toContain('Camera access denied')
      expect(result.code).toBe(ErrorCode.CAMERA_PERMISSION_DENIED)
    })

    it('should parse microphone permission denied error', () => {
      const error = new Error('Permission NotAllowed for audio')
      const result = parseMediaError(error)
      
      expect(result.message).toContain('Microphone access denied')
      expect(result.code).toBe(ErrorCode.MIC_PERMISSION_DENIED)
    })

    it('should parse camera not found error', () => {
      const error = new Error('No camera device found')
      const result = parseMediaError(error)
      
      expect(result.message).toContain('No camera found')
      expect(result.code).toBe(ErrorCode.MEDIA_DEVICE_NOT_FOUND)
    })

    it('should parse microphone not found error', () => {
      const error = new Error('No microphone device found')
      const result = parseMediaError(error)
      
      expect(result.message).toContain('No microphone found')
      expect(result.code).toBe(ErrorCode.MEDIA_DEVICE_NOT_FOUND)
    })

    it('should parse generic device not found error', () => {
      const error = new Error('device_not_found')
      const result = parseMediaError(error)
      
      expect(result.message).toContain('Camera or microphone not found')
      expect(result.code).toBe(ErrorCode.MEDIA_DEVICE_NOT_FOUND)
    })

    it('should parse NotFound error', () => {
      const error = new Error('NotFoundError: Requested device not found')
      const result = parseMediaError(error)
      
      expect(result.message).toContain('Camera or microphone not found')
      expect(result.code).toBe(ErrorCode.MEDIA_DEVICE_NOT_FOUND)
    })

    it('should parse device in use error', () => {
      const error = new Error('Device in use by another application')
      const result = parseMediaError(error)
      
      expect(result.message).toContain('being used by another application')
      expect(result.code).toBe(ErrorCode.CAMERA_IN_USE)
    })

    it('should parse NotReadableError', () => {
      const error = new Error('NotReadableError: Could not start video source')
      const result = parseMediaError(error)
      
      expect(result.message).toContain('being used by another application')
      expect(result.code).toBe(ErrorCode.CAMERA_IN_USE)
    })

    it('should parse unknown media error', () => {
      const error = new Error('Unknown media error')
      const result = parseMediaError(error)
      
      expect(result.message).toContain('Failed to access')
      expect(result.code).toBe(ErrorCode.MEDIA_DEVICE_NOT_FOUND)
    })
  })

  describe('parseConnectionError', () => {
    it('should parse timeout error', () => {
      const error = new Error('Connection timeout')
      const result = parseConnectionError(error)
      
      expect(result.message).toContain('timed out')
      expect(result.code).toBe(ErrorCode.CONNECTION_TIMEOUT)
    })

    it('should parse backend unavailable error', () => {
      const error = new Error('Backend service unavailable')
      const result = parseConnectionError(error)
      
      expect(result.message).toContain('temporarily unavailable')
      expect(result.code).toBe(ErrorCode.BACKEND_UNAVAILABLE)
    })

    it('should parse generic connection error', () => {
      const error = new Error('Network error')
      const result = parseConnectionError(error)
      
      expect(result.message).toContain('Connection failed')
      expect(result.code).toBe(ErrorCode.CONNECTION_LOST)
    })
  })

  describe('ErrorCode enum', () => {
    it('should have all required error codes', () => {
      expect(ErrorCode.BACKEND_UNAVAILABLE).toBeDefined()
      expect(ErrorCode.CONNECTION_TIMEOUT).toBeDefined()
      expect(ErrorCode.CONNECTION_LOST).toBeDefined()
      expect(ErrorCode.AUTH_FAILED).toBeDefined()
      expect(ErrorCode.MEDIA_DEVICE_NOT_FOUND).toBeDefined()
      expect(ErrorCode.CHANNEL_JOIN_FAILED).toBeDefined()
    })

    it('should have unique error codes', () => {
      const codes = Object.values(ErrorCode)
      const uniqueCodes = new Set(codes)
      expect(codes.length).toBe(uniqueCodes.size)
    })
  })

  describe('toast dismissal and cleanup', () => {
    it('should dismiss existing toasts before showing new error', () => {
      showError('First error')
      
      expect(toast.dismiss).toHaveBeenCalled()
    })

    it('should dismiss existing toasts before showing new success', () => {
      showSuccess('Success')
      
      expect(toast.dismiss).toHaveBeenCalled()
    })

    it('should dismiss existing toasts before showing new info', () => {
      showInfo('Info')
      
      expect(toast.dismiss).toHaveBeenCalled()
    })

    it('should dismiss existing toasts before showing new warning', () => {
      showWarning('Warning')
      
      expect(toast.dismiss).toHaveBeenCalled()
    })

    it('should cleanup error toast after duration', () => {
      ;(toast.error as jest.Mock).mockReturnValue('toast-id-123')
      
      showError('Error message')
      
      // Fast-forward past the 4 second cleanup timeout
      jest.advanceTimersByTime(4000)
      
      // The setTimeout callback should have been called (it's automatically tracked by jest.useFakeTimers)
      expect(jest.getTimerCount()).toBe(0) // All timers should have fired
    })
  })
})
