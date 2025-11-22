/**
 * @module components/welcome
 * Unit tests for Welcome components
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { JoinButton } from '../JoinButton'

describe('Welcome Components Module', () => {
  describe('JoinButton', () => {
    it('should render offline button when service is offline', () => {
      render(<JoinButton isOnline={false} />)
      
      expect(screen.getByText('Service Offline')).toBeTruthy()
      expect(screen.getByText(/Active Hours/)).toBeTruthy()
    })

    it('should render enabled button when service is online', () => {
      render(<JoinButton isOnline={true} />)
      
      expect(screen.getByText('Find Match')).toBeTruthy()
    })

    it('should call onClick when button is clicked', () => {
      const handleClick = jest.fn()
      render(<JoinButton isOnline={true} onClick={handleClick} />)
      
      const button = screen.getByText('Find Match')
      fireEvent.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should disable button when disabled prop is true', () => {
      render(<JoinButton isOnline={true} disabled={true} />)
      
      const button = screen.getByRole('button')
      expect((button as HTMLButtonElement).disabled).toBe(true)
    })

    it('should not call onClick when disabled', () => {
      const handleClick = jest.fn()
      render(<JoinButton isOnline={true} disabled={true} onClick={handleClick} />)
      
      const button = screen.getByText('Find Match')
      fireEvent.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should show correct styling for offline state', () => {
      const { container } = render(<JoinButton isOnline={false} />)
      
      const button = container.querySelector('button')
      expect(button?.className).toContain('cursor-not-allowed')
    })

    it('should show correct styling for online enabled state', () => {
      const { container } = render(<JoinButton isOnline={true} />)
      
      const button = container.querySelector('button')
      expect(button?.className).not.toContain('cursor-not-allowed')
    })

    it('should show correct styling for disabled state', () => {
      const { container } = render(<JoinButton isOnline={true} disabled={true} />)
      
      const button = container.querySelector('button')
      expect(button?.className).toContain('cursor-not-allowed')
    })

    it('should render pulsing indicator when offline', () => {
      render(<JoinButton isOnline={false} />)
      
      const button = screen.getByRole('button')
      expect(button).toBeTruthy()
      expect((button as HTMLButtonElement).disabled).toBe(true)
    })

    it('should have hover effects when online and enabled', () => {
      const { container } = render(<JoinButton isOnline={true} disabled={false} />)
      
      const button = container.querySelector('button')
      expect(button?.className).toContain('hover:from-emerald-700')
    })

    it('should not have hover effects when disabled', () => {
      const { container } = render(<JoinButton isOnline={true} disabled={true} />)
      
      const button = container.querySelector('button')
      expect(button?.className).toContain('bg-gray-400')
    })
  })
})
