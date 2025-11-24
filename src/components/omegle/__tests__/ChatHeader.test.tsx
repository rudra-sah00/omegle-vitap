import { render, screen } from '@testing-library/react';
import { ChatHeader } from '../ChatHeader';

describe('ChatHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the header', () => {
    render(<ChatHeader isConnected={false} />);
    expect(screen.getByText(/not connected/i)).toBeDefined();
  });

  it('should show not connected status when disconnected', () => {
    render(<ChatHeader isConnected={false} />);
    expect(screen.getByText(/not connected/i)).toBeDefined();
  });

  it('should show connected status when matched', () => {
    render(<ChatHeader isConnected={true} />);
    expect(screen.getByText(/connected/i)).toBeDefined();
  });

  it('should render Home link', () => {
    render(<ChatHeader isConnected={false} />);
    expect(screen.getByText('Home')).toBeDefined();
  });

  it('should show red indicator when not connected', () => {
    const { container } = render(<ChatHeader isConnected={false} />);
    const redIndicator = container.querySelector('.bg-red-500');
    expect(redIndicator).toBeTruthy();
  });

  it('should show green indicator when connected', () => {
    const { container } = render(<ChatHeader isConnected={true} />);
    const greenIndicator = container.querySelector('.bg-green-500');
    expect(greenIndicator).toBeTruthy();
  });
});
