/**
 * @module components/ui
 * Unit tests for UI components
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { EncryptedText } from '../encrypted-text'

describe('UI Components Module', () => {
  describe('EncryptedText', () => {
    it('should render text content', () => {
      render(<EncryptedText text="Hello World" />)
      
      // Check aria-label since text is encrypted during animation
      expect(screen.getByLabelText('Hello World')).toBeTruthy()
    })

    it('should accept className prop', () => {
      const { container } = render(
        <EncryptedText text="Test" className="custom-class" />
      )
      
      const element = container.querySelector('.custom-class')
      expect(element).toBeTruthy()
    })

    it('should handle empty text', () => {
      const { container } = render(<EncryptedText text="" />)
      expect(container.textContent).toBe('')
    })

    it('should handle long text', () => {
      const longText = 'A'.repeat(1000)
      render(<EncryptedText text={longText} />)
      
      // Component should handle long text without crashing
      expect(screen.getByLabelText(longText)).toBeTruthy()
    })

    it('should apply custom delay settings', () => {
      render(
        <EncryptedText 
          text="Test" 
          revealDelayMs={10}
          flipDelayMs={5}
        />
      )
      
      expect(screen.getByLabelText('Test')).toBeTruthy()
    })
  })
})
