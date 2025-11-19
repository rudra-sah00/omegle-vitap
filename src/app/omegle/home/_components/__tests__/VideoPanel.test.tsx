import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VideoPanel from '../VideoPanel';

describe('VideoPanel', () => {
    const mockVideoRef = { current: document.createElement('div') };

    it('renders video container', () => {
        render(
            <VideoPanel
                videoRef={mockVideoRef}
                isConnected={false}
                isSearching={false}
            />
        );
        // The video container is the div with ref. We can't easily select by ref in test,
        // but we can check if the container exists.
        // The component renders a div with class 'w-full h-full' inside the main container.
        // Let's check if the main container renders.
        const container = screen.getByText('Your camera').closest('.relative');
        expect(container).toBeInTheDocument();
    });

    it('renders Stranger placeholder when isRemote is true and not connected', () => {
        render(
            <VideoPanel
                videoRef={mockVideoRef}
                isRemote={true}
                isConnected={false}
                isSearching={false}
            />
        );
        expect(screen.getByText('Stranger')).toBeInTheDocument();
    });

    it('renders Stranger camera off when isRemote is true, connected, but no remote users', () => {
        render(
            <VideoPanel
                videoRef={mockVideoRef}
                isRemote={true}
                isConnected={true}
                isSearching={false}
                remoteUsers={[]}
            />
        );
        expect(screen.getByText("Stranger's camera is off")).toBeInTheDocument();
    });

    it('renders searching animation when not remote and isSearching is true', () => {
        render(
            <VideoPanel
                videoRef={mockVideoRef}
                isRemote={false}
                isConnected={false}
                isSearching={true}
            />
        );
        expect(screen.getByText('Looking for someone you can chat with...')).toBeInTheDocument();
    });

    it('renders Camera is off when not remote, connected, but camera/video off', () => {
        render(
            <VideoPanel
                videoRef={mockVideoRef}
                isRemote={false}
                isConnected={true}
                isSearching={false}
                isCameraOn={false}
            />
        );
        expect(screen.getByText('Camera is off')).toBeInTheDocument();
    });

    it('renders Your camera when not remote, not connected, not searching, and camera off', () => {
        render(
            <VideoPanel
                videoRef={mockVideoRef}
                isRemote={false}
                isConnected={false}
                isSearching={false}
                isCameraOn={false}
            />
        );
        expect(screen.getByText('Your camera')).toBeInTheDocument();
    });

    it('calls onToggleControls when clicked', () => {
        const handleToggle = jest.fn();
        render(
            <VideoPanel
                videoRef={mockVideoRef}
                isConnected={false}
                isSearching={false}
                onToggleControls={handleToggle}
            />
        );

        const container = screen.getByText('Your camera').closest('.relative');
        if (container) {
            fireEvent.click(container);
        }
        expect(handleToggle).toHaveBeenCalledTimes(1);
    });
});
