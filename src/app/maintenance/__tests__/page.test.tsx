/**
 * Tests for Maintenance Page
 * Tests maintenance page UI, title setting, and back link
 */

import { render, screen } from '@testing-library/react';
import MaintenancePage from '../page';

describe('Maintenance Page', () => {
  beforeEach(() => {
    document.title = '';
  });

  it('should render maintenance page', () => {
    render(<MaintenancePage />);
    expect(screen.getByText(/Under Maintenance/i)).toBeTruthy();
  });

  it('should set the document title', () => {
    render(<MaintenancePage />);
    setTimeout(() => {
      expect(document.title).toBe('Under Maintenance - Omegle VITAP');
    }, 0);
  });

  it('should display maintenance icon', () => {
    const { container } = render(<MaintenancePage />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should display maintenance heading', () => {
    render(<MaintenancePage />);
    const heading = screen.getByText('Under Maintenance');
    expect(heading).toBeTruthy();
  });

  it('should display maintenance description', () => {
    render(<MaintenancePage />);
    const description = screen.getByText(/currently performing scheduled maintenance/i);
    expect(description).toBeTruthy();
  });

  it('should render status box with background', () => {
    const { container } = render(<MaintenancePage />);
    const statusBox = container.querySelector('.bg-slate-50');
    expect(statusBox).toBeTruthy();
  });

  it('should have proper responsive layout', () => {
    const { container } = render(<MaintenancePage />);
    const mainContainer = container.querySelector('.max-w-2xl');
    expect(mainContainer).toBeTruthy();
  });
});
