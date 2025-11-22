/**
 * Tests for Terms of Service Page
 * Tests terms page content, navigation, and key sections
 */

import { render, screen } from '@testing-library/react';
import TermsPage from '../page';

describe('Terms of Service Page', () => {
  it('should render terms of service page', () => {
    render(<TermsPage />);
    expect(screen.getByText('Terms of Service')).toBeTruthy();
  });

  it('should display navigation with back to home link', () => {
    render(<TermsPage />);
    expect(screen.getByText('Back to Home')).toBeTruthy();
    expect(screen.getByText('Omegle VITAP')).toBeTruthy();
  });

  it('should display last updated date', () => {
    render(<TermsPage />);
    expect(screen.getByText(/Last updated/i)).toBeTruthy();
  });

  it('should display acceptance of terms section', () => {
    render(<TermsPage />);
    expect(screen.getByText('1. Acceptance of Terms')).toBeTruthy();
  });

  it('should display eligibility section', () => {
    render(<TermsPage />);
    expect(screen.getByText('2. Eligibility')).toBeTruthy();
  });

  it('should display user conduct section', () => {
    render(<TermsPage />);
    expect(screen.getByText('3. User Conduct')).toBeTruthy();
  });

  it('should display safety disclaimer section', () => {
    render(<TermsPage />);
    expect(screen.getByText('4. Safety & Anonymity Disclaimer')).toBeTruthy();
  });

  it('should display disclaimer of warranties section', () => {
    render(<TermsPage />);
    expect(screen.getByText('4. Disclaimer of Warranties')).toBeTruthy();
  });

  it('should display limitation of liability section', () => {
    render(<TermsPage />);
    expect(screen.getByText('5. Limitation of Liability')).toBeTruthy();
  });

  it('should mention age requirement', () => {
    render(<TermsPage />);
    expect(screen.getByText(/18 years old/i)).toBeTruthy();
  });

  it('should mention VIT-AP University requirement', () => {
    render(<TermsPage />);
    expect(screen.getByText(/VIT-AP University/i)).toBeTruthy();
  });

  it('should mention nudity prohibition', () => {
    render(<TermsPage />);
    expect(screen.getByText(/Contains Nudity or Sexual Content/i)).toBeTruthy();
  });

  it('should warn about interactions with strangers', () => {
    render(<TermsPage />);
    expect(screen.getByText(/random strangers/i)).toBeTruthy();
  });

  it('should have sticky navigation', () => {
    const { container } = render(<TermsPage />);
    const nav = container.querySelector('nav');
    expect(nav?.className).toContain('sticky');
  });

  it('should render with proper max width container', () => {
    const { container } = render(<TermsPage />);
    const main = container.querySelector('main');
    expect(main?.className).toContain('max-w-3xl');
  });
});
