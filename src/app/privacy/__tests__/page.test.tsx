/**
 * Tests for Privacy Policy Page
 * Tests privacy page content, navigation, and key sections
 */

import { render, screen } from '@testing-library/react';
import PrivacyPage from '../page';

describe('Privacy Policy Page', () => {
  it('should render privacy policy page', () => {
    render(<PrivacyPage />);
    expect(screen.getByText('Privacy Policy')).toBeTruthy();
  });

  it('should display navigation with back to home link', () => {
    render(<PrivacyPage />);
    expect(screen.getByText('Back to Home')).toBeTruthy();
    expect(screen.getByText('Omegle VITAP')).toBeTruthy();
  });

  it('should display last updated date', () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/Last updated/i)).toBeTruthy();
  });

  it('should display information collection section', () => {
    render(<PrivacyPage />);
    expect(screen.getByText('1. Information We Collect')).toBeTruthy();
  });

  it('should display law enforcement cooperation section', () => {
    render(<PrivacyPage />);
    expect(screen.getByText('2. Law Enforcement Cooperation')).toBeTruthy();
  });

  it('should display information usage section', () => {
    render(<PrivacyPage />);
    expect(screen.getByText('3. How We Use Information')).toBeTruthy();
  });

  it('should display cookies section', () => {
    render(<PrivacyPage />);
    expect(screen.getByText('3. Cookies')).toBeTruthy();
  });

  it('should display data security section', () => {
    render(<PrivacyPage />);
    expect(screen.getByText('4. Data Security')).toBeTruthy();
  });

  it('should display third-party links section', () => {
    render(<PrivacyPage />);
    expect(screen.getByText('5. Third-Party Links')).toBeTruthy();
  });

  it('should mention IP address collection', () => {
    render(<PrivacyPage />);
    const ipAddressElements = screen.getAllByText(/IP address/i);
    expect(ipAddressElements.length).toBeGreaterThan(0);
  });

  it('should mention chat data policy', () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/Chat Data/i)).toBeTruthy();
  });

  it('should have sticky navigation', () => {
    const { container } = render(<PrivacyPage />);
    const nav = container.querySelector('nav');
    expect(nav?.className).toContain('sticky');
  });

  it('should render with proper max width container', () => {
    const { container } = render(<PrivacyPage />);
    const main = container.querySelector('main');
    expect(main?.className).toContain('max-w-3xl');
  });
});
