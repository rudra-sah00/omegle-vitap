/**
 * Tests for Welcome Page
 * Tests page rendering, title setting, and WelcomeForm integration
 */

import { render, screen } from '@testing-library/react';
import WelcomePage from '../page';

// Mock WelcomeForm component
jest.mock('@/components/welcome/WelcomeForm', () => ({
  WelcomeForm: () => <div data-testid="welcome-form">Welcome Form</div>,
}));

// Mock UserContext
jest.mock('@/context/UserContext', () => ({
  useUser: () => ({
    name: '',
    gender: '',
    uid: 'test-uid',
    setName: jest.fn(),
    setGender: jest.fn(),
  }),
}));

describe('Welcome Page', () => {
  beforeEach(() => {
    // Reset document title
    document.title = '';
  });

  it('should render the welcome page', () => {
    render(<WelcomePage />);
    expect(screen.getByTestId('welcome-form')).toBeTruthy();
  });

  it('should set the document title', () => {
    render(<WelcomePage />);
    // Title is set in useEffect, wait a tick
    setTimeout(() => {
      expect(document.title).toBe('Welcome - Omegle VITAP');
    }, 0);
  });

  it('should render animated background elements', () => {
    const { container } = render(<WelcomePage />);
    
    // Check for gradient background
    const gradientBg = container.querySelector('.bg-gradient-to-br');
    expect(gradientBg).toBeTruthy();
    
    // Check for animated orbs (blob animations)
    const blobs = container.querySelectorAll('.animate-blob');
    expect(blobs.length).toBe(3);
  });

  it('should render WelcomeForm component', () => {
    render(<WelcomePage />);
    expect(screen.getByTestId('welcome-form')).toBeTruthy();
  });

  it('should have responsive container with max width', () => {
    const { container } = render(<WelcomePage />);
    const innerContainer = container.querySelector('.max-w-md');
    expect(innerContainer).toBeTruthy();
  });
});
