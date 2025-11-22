/**
 * @module components/omegle
 * Unit tests for Omegle chat components
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { TypingIndicator } from '../TypingIndicator'
import { LoadingState } from '../LoadingState'
import { ErrorState } from '../ErrorState'

describe('Omegle Components Module', () => {
  describe('TypingIndicator', () => {
    it('should render typing indicator', () => {
      const { container } = render(<TypingIndicator />)
      
      // Should have animated dots
      const dots = container.querySelectorAll('[class*="animate"]')
      expect(dots.length).toBeGreaterThan(0)
    })

    it('should render without crashing', () => {
      expect(() => render(<TypingIndicator />)).not.toThrow()
    })
  })

  describe('LoadingState', () => {
    it('should render loading message for connecting state', () => {
      render(<LoadingState state="connecting" />)
      
      expect(screen.getByText('Connecting to server...')).toBeTruthy()
    })

    it('should render default loading message', () => {
      render(<LoadingState state="loading" />)
      
      expect(screen.getByText('Loading...')).toBeTruthy()
    })

    it('should show loading spinner', () => {
      const { container } = render(<LoadingState state="loading" />)
      
      // Should have spinning element
      const spinner = container.querySelector('[class*="animate-spin"]')
      expect(spinner).toBeTruthy()
    })
  })

  describe('ErrorState', () => {
    it('should render error message', () => {
      const handleGoBack = jest.fn()
      render(<ErrorState error="Connection failed" onGoBack={handleGoBack} />)
      
      expect(screen.getByText('Connection failed')).toBeTruthy()
    })

    it('should call onRetry when retry button clicked', () => {
      const handleRetry = jest.fn()
      const handleGoBack = jest.fn()
      render(<ErrorState error="Error" onGoBack={handleGoBack} onRetry={handleRetry} />)
      
      const retryButton = screen.getByText(/retry/i)
      retryButton.click()
      
      expect(handleRetry).toHaveBeenCalledTimes(1)
    })

    it('should call onGoBack when back button clicked', () => {
      const handleGoBack = jest.fn()
      render(<ErrorState error="Error" onGoBack={handleGoBack} />)
      
      const backButton = screen.getByText(/go back/i)
      backButton.click()
      
      expect(handleGoBack).toHaveBeenCalledTimes(1)
    })

    it('should render with error icon', () => {
      const handleGoBack = jest.fn()
      const { container } = render(<ErrorState error="Error" onGoBack={handleGoBack} />)
      
      // Should have error icon
      const icon = container.querySelector('svg')
      expect(icon).toBeTruthy()
    })

    it('should detect backend errors', () => {
      const handleGoBack = jest.fn()
      render(<ErrorState error="Backend server unavailable" onGoBack={handleGoBack} />)
      
      expect(screen.getByText('Server Unavailable')).toBeTruthy()
    })
  })
})
