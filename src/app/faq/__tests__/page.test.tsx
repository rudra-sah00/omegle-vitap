import { render, screen } from '@testing-library/react';
import FAQPage from '../page';

describe('FAQPage', () => {
  it('should render the FAQ page', () => {
    render(<FAQPage />);
    expect(screen.getByText(/Frequently Asked Questions/i)).toBeDefined();
  });

  it('should render the page title', () => {
    render(<FAQPage />);
    expect(screen.getByText(/Frequently Asked Questions/i)).toBeDefined();
  });

  it('should render Getting Started category', () => {
    render(<FAQPage />);
    expect(screen.getByText(/Getting Started/i)).toBeDefined();
  });

  it('should render Pricing & Features category', () => {
    render(<FAQPage />);
    expect(screen.getByText(/Pricing & Features/i)).toBeDefined();
  });

  it('should render Safety & Privacy category', () => {
    render(<FAQPage />);
    expect(screen.getByText(/Safety & Privacy/i)).toBeDefined();
  });

  it('should render first FAQ question', () => {
    render(<FAQPage />);
    expect(screen.getByText(/What is Omegle VITAP/i)).toBeDefined();
  });

  it('should render free pricing question', () => {
    render(<FAQPage />);
    expect(screen.getByText(/Is Omegle VITAP free/i)).toBeDefined();
  });

  it('should render registration question', () => {
    render(<FAQPage />);
    expect(screen.getByText(/Do I need to register/i)).toBeDefined();
  });

  it('should render video chat explanation', () => {
    render(<FAQPage />);
    expect(screen.getByText(/How does random video chat work/i)).toBeDefined();
  });

  it('should render text chat option question', () => {
    render(<FAQPage />);
    expect(screen.getByText(/Can I use text chat instead of video/i)).toBeDefined();
  });

  it('should render navigation to welcome page', () => {
    render(<FAQPage />);
    const links = screen.getAllByText(/Omegle VITAP|Start Chat/i);
    expect(links.length).toBeGreaterThan(0);
  });

  it('should render multiple FAQ categories', () => {
    render(<FAQPage />);
    // Check for specific category headings
    expect(screen.getByText(/Getting Started/i)).toBeDefined();
    expect(screen.getByText(/Technical Support/i)).toBeDefined();
  });

  it('should render FAQ answers', () => {
    render(<FAQPage />);
    expect(screen.getByText(/completely free to use/i)).toBeDefined();
  });

  it('should have proper page structure', () => {
    const { container } = render(<FAQPage />);
    expect(container.querySelector('main')).toBeTruthy();
  });
});
