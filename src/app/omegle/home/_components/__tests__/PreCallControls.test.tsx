import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PreCallControls from '../PreCallControls';

describe('PreCallControls', () => {
    const defaultProps = {
        isMicOn: true,
        isCameraOn: true,
        onMicToggle: jest.fn(),
        onCameraToggle: jest.fn(),
        onStart: jest.fn(),
        onStop: jest.fn(),
        isSearching: false,
        showControls: true,
    };

    it('does not render when showControls is false', () => {
        render(<PreCallControls {...defaultProps} showControls={false} />);
        expect(screen.queryByTitle('Turn off camera')).not.toBeInTheDocument();
    });

    it('renders all controls when showControls is true', () => {
        render(<PreCallControls {...defaultProps} />);
        expect(screen.getByTitle('Turn off camera')).toBeInTheDocument();
        expect(screen.getByTitle('Mute microphone')).toBeInTheDocument();
        expect(screen.getByTitle('Start matching')).toBeInTheDocument();
    });

    it('calls onCameraToggle when camera button is clicked', () => {
        render(<PreCallControls {...defaultProps} />);
        fireEvent.click(screen.getByTitle('Turn off camera'));
        expect(defaultProps.onCameraToggle).toHaveBeenCalledTimes(1);
    });

    it('calls onMicToggle when mic button is clicked', () => {
        render(<PreCallControls {...defaultProps} />);
        fireEvent.click(screen.getByTitle('Mute microphone'));
        expect(defaultProps.onMicToggle).toHaveBeenCalledTimes(1);
    });

    it('calls onStart when start button is clicked and not searching', () => {
        render(<PreCallControls {...defaultProps} isSearching={false} />);
        fireEvent.click(screen.getByTitle('Start matching'));
        expect(defaultProps.onStart).toHaveBeenCalledTimes(1);
    });

    it('calls onStop when stop button is clicked and searching', () => {
        render(<PreCallControls {...defaultProps} isSearching={true} />);
        fireEvent.click(screen.getByTitle('Stop searching'));
        expect(defaultProps.onStop).toHaveBeenCalledTimes(1);
    });

    it('shows correct state for camera off', () => {
        render(<PreCallControls {...defaultProps} isCameraOn={false} />);
        expect(screen.getByTitle('Turn on camera')).toBeInTheDocument();
        expect(screen.getByTitle('Turn on camera')).toHaveClass('bg-red-600');
    });

    it('shows correct state for mic off', () => {
        render(<PreCallControls {...defaultProps} isMicOn={false} />);
        expect(screen.getByTitle('Unmute microphone')).toBeInTheDocument();
        expect(screen.getByTitle('Unmute microphone')).toHaveClass('bg-red-600');
    });
});
