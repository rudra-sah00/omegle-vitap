import React from 'react';
import { render, screen } from '@testing-library/react';
import VideoPlaceholder from '../VideoPlaceholder';

describe('VideoPlaceholder', () => {
    it('renders label correctly', () => {
        render(<VideoPlaceholder label="Waiting for partner..." />);
        expect(screen.getByText('Waiting for partner...')).toBeInTheDocument();
    });

    it('renders correct text for user', () => {
        render(<VideoPlaceholder label="Test" isUser={true} />);
        expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('renders correct text for stranger', () => {
        render(<VideoPlaceholder label="Test" isUser={false} />);
        expect(screen.getByText('Stranger')).toBeInTheDocument();
    });

    it('applies full height class when fullHeight is true', () => {
        render(<VideoPlaceholder label="Test" fullHeight={true} />);
        // We need to find the container. The text "Test" is inside it.
        const container = screen.getByText('Test').closest('.relative');
        expect(container).toHaveClass('h-full');
    });

    it('applies correct height class when isUser is true', () => {
        render(<VideoPlaceholder label="Test" isUser={true} />);
        const container = screen.getByText('Test').closest('.relative');
        expect(container).toHaveClass('h-48');
    });

    it('applies correct height class when isUser is false', () => {
        render(<VideoPlaceholder label="Test" isUser={false} />);
        const container = screen.getByText('Test').closest('.relative');
        expect(container).toHaveClass('h-64');
    });
});
