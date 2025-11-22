/**
 * @module lib/utils
 * Unit tests for utility functions
 */

import { cn } from '../utils'

describe('Utils Module', () => {
  describe('cn (classNames utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('text-red-500', 'bg-blue-500')
      expect(result).toContain('text-red-500')
      expect(result).toContain('bg-blue-500')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toContain('base-class')
      expect(result).toContain('active-class')
    })

    it('should handle falsy values', () => {
      const result = cn('base-class', false, null, undefined, 'valid-class')
      expect(result).toContain('base-class')
      expect(result).toContain('valid-class')
      expect(result).not.toContain('false')
      expect(result).not.toContain('null')
    })

    it('should merge conflicting Tailwind classes', () => {
      const result = cn('px-2', 'px-4')
      // Should keep only one px class (tailwind-merge behavior)
      expect(result).toBe('px-4')
    })

    it('should handle empty input', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle array of classes', () => {
      const classes = ['text-sm', 'font-bold', 'text-blue-500']
      const result = cn(classes)
      expect(result).toContain('text-sm')
      expect(result).toContain('font-bold')
      expect(result).toContain('text-blue-500')
    })
  })
})
