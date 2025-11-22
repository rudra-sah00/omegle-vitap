/**
 * @module components/welcome
 * Unit tests for Welcome components
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { JoinButton } from '../JoinButton'

describe('Welcome Components Module', () => {
  describe('JoinButton', () => {
    it('should render offline button when service is offline', () => {
      render(<JoinButton isOnline={false} />)
      
      expect(screen.getByText('Service Offline')).toBeInTheDocument()
      expect(screen.getByText(/Active Hours/)).toBeInTheDocument()
    })

    it('should render enabled button when service is online', () => {
      render(<JoinButton isOnline={true} />)
      
      expect(screen.getByText('Find Match')).toBeInTheDocument()
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
      expect(button).toBeDisabled()
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
      expect(button).toHaveClass('cursor-not-allowed')
    })

    it('should show correct styling for online enabled state', () => {
      const { container } = render(<JoinButton isOnline={true} />)
      
      const button = container.querySelector('button')
      expect(button).not.toHaveClass('cursor-not-allowed')
    })

    it('should show correct styling for disabled state', () => {
      const { container } = render(<JoinButton isOnline={true} disabled={true} />)
      
      const button = container.querySelector('button')
      expect(button).toHaveClass('cursor-not-allowed')
    })
  })
})
