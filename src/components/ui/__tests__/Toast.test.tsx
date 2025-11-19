import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Toast } from '../Toast';

describe('Toast', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('renders message correctly', () => {
        render(<Toast message="Test Message" onClose={() => { }} />);
        expect(screen.getByText('Test Message')).toBeInTheDocument();
    });

    it('applies correct styles based on type', () => {
        const { rerender } = render(<Toast message="Success" type="success" onClose={() => { }} />);
        expect(screen.getByText('Success').closest('div')).toHaveClass('bg-green-500');

        rerender(<Toast message="Error" type="error" onClose={() => { }} />);
        expect(screen.getByText('Error').closest('div')).toHaveClass('bg-red-500');
    });

    it('calls onClose after duration', () => {
        const handleClose = jest.fn();
        render(<Toast message="Test" duration={3000} onClose={handleClose} />);

        act(() => {
            jest.advanceTimersByTime(3000);
        });

        // Wait for fade out animation (300ms)
        act(() => {
            jest.advanceTimersByTime(300);
        });

        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close button is clicked', () => {
        const handleClose = jest.fn();
        render(<Toast message="Test" onClose={handleClose} />);

        const closeButton = screen.getByRole('button');
        fireEvent.click(closeButton);

        // Wait for fade out animation (300ms)
        act(() => {
            jest.advanceTimersByTime(300);
        });

        expect(handleClose).toHaveBeenCalledTimes(1);
    });
});
