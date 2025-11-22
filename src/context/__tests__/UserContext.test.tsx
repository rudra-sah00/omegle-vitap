/**
 * @module context/UserContext
 * Unit tests for User Context
 */

import React from 'react'
import { render, renderHook, act } from '@testing-library/react'
import { UserProvider, useUser } from '../UserContext'

describe('UserContext Module', () => {
  describe('UserProvider', () => {
    it('should provide user context to children', () => {
      const { result } = renderHook(() => useUser(), {
        wrapper: UserProvider,
      })

      expect(result.current).toBeDefined()
      expect(result.current.name).toBe('')
      expect(result.current.gender).toBe('Male')
      expect(result.current.uid).toBeGreaterThan(0)
    })

    it('should generate unique UID on mount', () => {
      const { result: result1 } = renderHook(() => useUser(), {
        wrapper: UserProvider,
      })

      const { result: result2 } = renderHook(() => useUser(), {
        wrapper: UserProvider,
      })

      // Different provider instances should have different UIDs
      expect(result1.current.uid).not.toBe(result2.current.uid)
    })

    it('should maintain same UID across re-renders', () => {
      const { result, rerender } = renderHook(() => useUser(), {
        wrapper: UserProvider,
      })

      const initialUID = result.current.uid
      
      rerender()
      
      expect(result.current.uid).toBe(initialUID)
    })
  })

  describe('useUser hook', () => {
    it('should allow setting name', () => {
      const { result } = renderHook(() => useUser(), {
        wrapper: UserProvider,
      })

      act(() => {
        result.current.setName('John Doe')
      })

      expect(result.current.name).toBe('John Doe')
    })

    it('should allow setting gender', () => {
      const { result } = renderHook(() => useUser(), {
        wrapper: UserProvider,
      })

      act(() => {
        result.current.setGender('Female')
      })

      expect(result.current.gender).toBe('Female')
    })

    it('should update name multiple times', () => {
      const { result } = renderHook(() => useUser(), {
        wrapper: UserProvider,
      })

      act(() => {
        result.current.setName('Alice')
      })
      expect(result.current.name).toBe('Alice')

      act(() => {
        result.current.setName('Bob')
      })
      expect(result.current.name).toBe('Bob')
    })

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = jest.fn()

      expect(() => {
        renderHook(() => useUser())
      }).toThrow('useUser must be used within a UserProvider')

      console.error = originalError
    })
  })

  describe('UID Generation', () => {
    it('should generate UID within valid range', () => {
      const { result } = renderHook(() => useUser(), {
        wrapper: UserProvider,
      })

      expect(result.current.uid).toBeGreaterThan(0)
      expect(result.current.uid).toBeLessThan(1000000000) // Max UID
    })

    it('should generate unique UIDs', () => {
      const uids = new Set()
      
      for (let i = 0; i < 10; i++) {
        const { result } = renderHook(() => useUser(), {
          wrapper: UserProvider,
        })
        uids.add(result.current.uid)
      }

      // All UIDs should be unique
      expect(uids.size).toBe(10)
    })
  })
})
