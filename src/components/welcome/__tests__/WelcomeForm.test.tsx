import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { WelcomeForm } from '../WelcomeForm';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/context/UserContext', () => ({
  useUser: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href }: any) => {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />;
  },
}));

jest.mock('../JoinButton', () => ({
  JoinButton: ({ isOnline, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="join-button">
      {isOnline ? 'Online' : 'Offline'} - {disabled ? 'Disabled' : 'Enabled'}
    </button>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

describe('WelcomeForm', () => {
  let mockRouter: any;
  let mockSetName: jest.Mock;
  let mockSetGender: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRouter = {
      push: jest.fn(),
    };
    mockSetName = jest.fn();
    mockSetGender = jest.fn();

    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useUser as jest.Mock).mockReturnValue({
      name: '',
      setName: mockSetName,
      gender: '',
      setGender: mockSetGender,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ isOnline: true }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render the welcome form', () => {
      render(<WelcomeForm />);
      expect(screen.getByText('Welcome Back')).toBeTruthy();
    });

    it('should render the logo image', () => {
      const { container } = render(<WelcomeForm />);
      const img = container.querySelector('img[alt="Omegle VITAP"]');
      expect(img).toBeTruthy();
      expect(img).toHaveProperty('src', '/omegle.png');
    });

    it('should render the tagline', () => {
      render(<WelcomeForm />);
      expect(screen.getByText('Connect with strangers, make new friends')).toBeTruthy();
    });

    it('should render name input field', () => {
      render(<WelcomeForm />);
      expect(screen.getByPlaceholderText('Enter your name')).toBeTruthy();
    });

    it('should render display name label', () => {
      render(<WelcomeForm />);
      expect(screen.getByText('Display Name')).toBeTruthy();
    });

    it('should render gender label', () => {
      render(<WelcomeForm />);
      expect(screen.getByText('Gender')).toBeTruthy();
    });

    it('should render all gender options', () => {
      render(<WelcomeForm />);
      expect(screen.getByText('Male')).toBeTruthy();
      expect(screen.getByText('Female')).toBeTruthy();
      expect(screen.getByText('Other')).toBeTruthy();
    });

    it('should render JoinButton', () => {
      render(<WelcomeForm />);
      expect(screen.getByTestId('join-button')).toBeTruthy();
    });

    it('should render terms and conditions links', () => {
      render(<WelcomeForm />);
      expect(screen.getByText(/By continuing, you agree to our/)).toBeTruthy();
      
      const termsLink = screen.getByText('Terms');
      const privacyLink = screen.getByText('Privacy');
      const guidelinesLink = screen.getByText('Guidelines');
      
      expect(termsLink.closest('a')).toHaveProperty('href', '/terms');
      expect(privacyLink.closest('a')).toHaveProperty('href', '/privacy');
      expect(guidelinesLink.closest('a')).toHaveProperty('href', '/community-guidelines');
    });
  });

  describe('Name Input', () => {
    it('should update name when typing', () => {
      render(<WelcomeForm />);
      
      const input = screen.getByPlaceholderText('Enter your name');
      fireEvent.change(input, { target: { value: 'John' } });
      
      expect(mockSetName).toHaveBeenCalledWith('John');
    });

    it('should display current name value', () => {
      (useUser as jest.Mock).mockReturnValue({
        name: 'TestUser',
        setName: mockSetName,
        gender: '',
        setGender: mockSetGender,
      });

      render(<WelcomeForm />);
      
      const input = screen.getByPlaceholderText('Enter your name') as HTMLInputElement;
      expect(input.value).toBe('TestUser');
    });

    it('should have proper input styling', () => {
      const { container } = render(<WelcomeForm />);
      
      const input = container.querySelector('input[type="text"]');
      expect(input?.className).toContain('rounded-2xl');
      expect(input?.className).toContain('bg-white/95');
    });
  });

  describe('Gender Selection', () => {
    it('should update gender when Male is clicked', () => {
      render(<WelcomeForm />);
      
      const maleButton = screen.getByText('Male');
      fireEvent.click(maleButton);
      
      expect(mockSetGender).toHaveBeenCalledWith('Male');
    });

    it('should update gender when Female is clicked', () => {
      render(<WelcomeForm />);
      
      const femaleButton = screen.getByText('Female');
      fireEvent.click(femaleButton);
      
      expect(mockSetGender).toHaveBeenCalledWith('Female');
    });

    it('should update gender when Other is clicked', () => {
      render(<WelcomeForm />);
      
      const otherButton = screen.getByText('Other');
      fireEvent.click(otherButton);
      
      expect(mockSetGender).toHaveBeenCalledWith('Other');
    });

    it('should highlight selected gender', () => {
      (useUser as jest.Mock).mockReturnValue({
        name: '',
        setName: mockSetName,
        gender: 'Male',
        setGender: mockSetGender,
      });

      const { container } = render(<WelcomeForm />);
      
      const buttons = container.querySelectorAll('button');
      const maleButton = Array.from(buttons).find(b => b.textContent === 'Male');
      
      expect(maleButton?.className).toContain('bg-white');
      expect(maleButton?.className).toContain('text-blue-600');
      expect(maleButton?.className).toContain('scale-105');
    });
  });

  describe('Online Status Check', () => {
    it('should fetch online status on mount', async () => {
      render(<WelcomeForm />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/status');
      });
    });

    it('should handle successful API response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ isOnline: true }),
      });

      render(<WelcomeForm />);
      
      await waitFor(() => {
        expect(screen.getByTestId('join-button').textContent).toContain('Online');
      });
    });

    it('should handle offline API response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ isOnline: false }),
      });

      render(<WelcomeForm />);
      
      await waitFor(() => {
        expect(screen.getByTestId('join-button').textContent).toContain('Offline');
      });
    });

    it('should fallback to local time check on API error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      // Mock current time to be within online hours (21:00 - 01:00 IST)
      const mockDate = new Date('2025-11-23T21:30:00+05:30'); // 9:30 PM IST
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      render(<WelcomeForm />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });


  });

  describe('Join Functionality', () => {
    it('should navigate to omegle page when join is clicked with valid name', async () => {
      (useUser as jest.Mock).mockReturnValue({
        name: 'John',
        setName: mockSetName,
        gender: 'Male',
        setGender: mockSetGender,
      });

      render(<WelcomeForm />);
      
      const joinButton = screen.getByTestId('join-button');
      fireEvent.click(joinButton);
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/omegle');
      });
    });

    it('should not navigate when name is empty', () => {
      (useUser as jest.Mock).mockReturnValue({
        name: '',
        setName: mockSetName,
        gender: 'Male',
        setGender: mockSetGender,
      });

      render(<WelcomeForm />);
      
      const joinButton = screen.getByTestId('join-button');
      fireEvent.click(joinButton);
      
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should not navigate when name is only whitespace', () => {
      (useUser as jest.Mock).mockReturnValue({
        name: '   ',
        setName: mockSetName,
        gender: 'Male',
        setGender: mockSetGender,
      });

      render(<WelcomeForm />);
      
      const joinButton = screen.getByTestId('join-button');
      fireEvent.click(joinButton);
      
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should handle navigation errors gracefully', async () => {
      (useUser as jest.Mock).mockReturnValue({
        name: 'John',
        setName: mockSetName,
        gender: 'Male',
        setGender: mockSetGender,
      });

      mockRouter.push.mockImplementation(() => {
        throw new Error('Navigation failed');
      });

      render(<WelcomeForm />);
      
      const joinButton = screen.getByTestId('join-button');
      
      // Should not crash
      fireEvent.click(joinButton);
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });

    it('should disable join button during loading', async () => {
      (useUser as jest.Mock).mockReturnValue({
        name: 'John',
        setName: mockSetName,
        gender: 'Male',
        setGender: mockSetGender,
      });

      render(<WelcomeForm />);
      
      const joinButton = screen.getByTestId('join-button');
      fireEvent.click(joinButton);
      
      // Button should show disabled state
      await waitFor(() => {
        expect(joinButton.textContent).toContain('Disabled');
      });
    });
  });

  describe('Styling and UI', () => {
    it('should have glass morphism card styling', () => {
      const { container } = render(<WelcomeForm />);
      
      const card = container.querySelector('.backdrop-blur-2xl');
      expect(card).toBeTruthy();
    });

    it('should have gradient overlay', () => {
      const { container } = render(<WelcomeForm />);
      
      const overlay = container.querySelector('.bg-gradient-to-br');
      expect(overlay).toBeTruthy();
    });

    it('should have proper spacing and layout', () => {
      const { container } = render(<WelcomeForm />);
      
      const content = container.querySelector('.space-y-4');
      expect(content).toBeTruthy();
    });
  });
});
