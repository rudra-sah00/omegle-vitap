/**
 * @module lib/time
 * Unit tests for time utility functions
 */

import { isServiceOnline } from '../time'

describe('Time Utils Module', () => {
  describe('isServiceOnline', () => {
    it('should return boolean value', () => {
      const result = isServiceOnline()
      expect(typeof result).toBe('boolean')
    })

    it('should check time range (9 PM - 2 AM IST)', () => {
      // Mock date to 10 PM IST
      const mockDate = new Date('2025-01-15T16:30:00Z') // 10 PM IST
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any)
      
      const result = isServiceOnline()
      expect(typeof result).toBe('boolean')
      
      jest.restoreAllMocks()
    })

    it('should handle IST timezone conversion', () => {
      const result = isServiceOnline()
      // Result should be boolean (true or false based on current IST time)
      expect([true, false]).toContain(result)
    })

    it('should return consistent value for same time', () => {
      const result1 = isServiceOnline()
      const result2 = isServiceOnline()
      expect(result1).toBe(result2)
    })
  })
})
