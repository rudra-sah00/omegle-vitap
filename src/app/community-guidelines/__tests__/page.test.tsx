/**
 * Tests for Community Guidelines Page
 * Tests guidelines page content, navigation, and do's/don'ts sections
 */

import { render, screen } from '@testing-library/react';
import CommunityGuidelinesPage from '../page';

describe('Community Guidelines Page', () => {
  it('should render community guidelines page', () => {
    render(<CommunityGuidelinesPage />);
    expect(screen.getByText('Community Guidelines')).toBeTruthy();
  });

  it('should display navigation with back to home link', () => {
    render(<CommunityGuidelinesPage />);
    expect(screen.getByText('Back to Home')).toBeTruthy();
    expect(screen.getByText('Omegle VITAP')).toBeTruthy();
  });

  it('should display page description', () => {
    render(<CommunityGuidelinesPage />);
    expect(screen.getByText(/safe and enjoyable for everyone/i)).toBeTruthy();
  });

  it('should display dos section', () => {
    render(<CommunityGuidelinesPage />);
    expect(screen.getByText(/Do's/i)).toBeTruthy();
  });

  it('should display donts section', () => {
    render(<CommunityGuidelinesPage />);
    expect(screen.getByText(/Don'ts/i)).toBeTruthy();
  });

  it('should list respectful behavior in dos', () => {
    render(<CommunityGuidelinesPage />);
    expect(screen.getByText(/Be respectful and kind/i)).toBeTruthy();
  });

  it('should list reporting inappropriate behavior in dos', () => {
    render(<CommunityGuidelinesPage />);
    expect(screen.getByText(/Report inappropriate behavior/i)).toBeTruthy();
  });

  it('should list protecting personal information in dos', () => {
    render(<CommunityGuidelinesPage />);
    expect(screen.getByText(/Protect your personal information/i)).toBeTruthy();
  });

  it('should emphasize no nudity rule in donts', () => {
    render(<CommunityGuidelinesPage />);
    expect(screen.getByText(/NO NUDITY or Sexual Content/i)).toBeTruthy();
  });

  it('should list harassment prohibition in donts', () => {
    render(<CommunityGuidelinesPage />);
    expect(screen.getByText(/Bully, harass, or threaten/i)).toBeTruthy();
  });

  it('should list spam prohibition in donts', () => {
    render(<CommunityGuidelinesPage />);
    expect(screen.getByText(/Spam or advertise/i)).toBeTruthy();
  });

  it('should list impersonation prohibition in donts', () => {
    render(<CommunityGuidelinesPage />);
    expect(screen.getByText(/Impersonate staff/i)).toBeTruthy();
  });

  it('should have green styling for dos section', () => {
    const { container } = render(<CommunityGuidelinesPage />);
    const dosHeading = screen.getByText(/Do's/i);
    expect(dosHeading.className).toContain('text-green-600');
  });

  it('should have red styling for donts section', () => {
    const { container } = render(<CommunityGuidelinesPage />);
    const dontsHeading = screen.getByText(/Don'ts/i);
    expect(dontsHeading.className).toContain('text-red-600');
  });

  it('should have grid layout for dos and donts', () => {
    const { container } = render(<CommunityGuidelinesPage />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeTruthy();
    expect(grid?.className).toContain('md:grid-cols-2');
  });

  it('should have sticky navigation', () => {
    const { container } = render(<CommunityGuidelinesPage />);
    const nav = container.querySelector('nav');
    expect(nav?.className).toContain('sticky');
  });

  it('should render with proper max width container', () => {
    const { container } = render(<CommunityGuidelinesPage />);
    const main = container.querySelector('main');
    expect(main?.className).toContain('max-w-3xl');
  });
});
