/**
 * Room Controls
 * Complete control bar for video chat room
 */

'use client';

import { useRef, useState, memo } from 'react';
import { MediaControlWithSelector } from './MediaButtons';
import {
  StartButton,
  StopButton,
  NextButton,
  LeaveButton,
  ScreenShareButton,
} from './ActionButtons';

interface RoomControlsProps {
  isMatched: boolean;
  isSearching: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
  isScreenSharing?: boolean;
  currentCameraId?: string;
  currentMicId?: string;
  onStart: () => void;
  onStop: () => void;
  onNext: () => void;
  onToggleCamera: () => void;
  onToggleMicrophone: () => void;
  onToggleScreenShare?: () => void;
  onSwitchCamera?: (deviceId: string) => void;
  onSwitchMicrophone?: (deviceId: string) => void;
  onLeave: () => void;
}

/**
 * Complete room control bar with all media and action controls
 */
export const RoomControls = memo(
  ({
    isMatched,
    isSearching,
    isCameraOn,
    isMicOn,
    isScreenSharing = false,
    currentCameraId,
    currentMicId,
    onStart,
    onStop,
    onNext,
    onToggleCamera,
    onToggleMicrophone,
    onToggleScreenShare,
    onSwitchCamera,
    onSwitchMicrophone,
    onLeave,
  }: RoomControlsProps) => {
    const [showCameraMenu, setShowCameraMenu] = useState(false);
    const [showMicMenu, setShowMicMenu] = useState(false);
    const cameraButtonRef = useRef<HTMLDivElement>(null);
    const micButtonRef = useRef<HTMLDivElement>(null);

    const handleCameraMenuToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowMicMenu(false);
      setShowCameraMenu(!showCameraMenu);
    };

    const handleMicMenuToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowCameraMenu(false);
      setShowMicMenu(!showMicMenu);
    };

    return (
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4 z-30">
        {/* Camera Control */}
        <MediaControlWithSelector
          type="camera"
          isOn={isCameraOn}
          currentDeviceId={currentCameraId}
          showMenu={showCameraMenu}
          buttonRef={cameraButtonRef}
          onToggle={onToggleCamera}
          onToggleMenu={handleCameraMenuToggle}
          onCloseMenu={() => setShowCameraMenu(false)}
          onSwitchDevice={onSwitchCamera}
        />

        {/* Microphone Control */}
        <MediaControlWithSelector
          type="microphone"
          isOn={isMicOn}
          currentDeviceId={currentMicId}
          showMenu={showMicMenu}
          buttonRef={micButtonRef}
          onToggle={onToggleMicrophone}
          onToggleMenu={handleMicMenuToggle}
          onCloseMenu={() => setShowMicMenu(false)}
          onSwitchDevice={onSwitchMicrophone}
        />

        {/* Screen Share - only when matched */}
        {isMatched && onToggleScreenShare && (
          <ScreenShareButton onClick={onToggleScreenShare} isSharing={isScreenSharing} />
        )}

        {/* Action Buttons */}
        {isMatched ? (
          <>
            <NextButton onClick={onNext} />
            <LeaveButton onClick={onLeave} />
          </>
        ) : isSearching ? (
          <StopButton onClick={onStop} />
        ) : (
          <StartButton onClick={onStart} />
        )}
      </div>
    );
  }
);
RoomControls.displayName = 'RoomControls';
