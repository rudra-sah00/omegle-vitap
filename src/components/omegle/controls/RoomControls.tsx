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
  ChatButton,
} from './ActionButtons';

interface RoomControlsProps {
  isMatched: boolean;
  isSearching: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
  isScreenSharing?: boolean;
  currentCameraId?: string;
  currentMicId?: string;
  isMobile?: boolean;
  unreadChatCount?: number;
  onStart: () => void;
  onStop: () => void;
  onNext: () => void;
  onToggleCamera: () => void;
  onToggleMicrophone: () => void;
  onToggleScreenShare?: () => void;
  onSwitchCamera?: (deviceId: string) => void;
  onSwitchMicrophone?: (deviceId: string) => void;
  onLeave: () => void;
  onToggleMobileChat?: () => void;
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
    isMobile = false,
    unreadChatCount = 0,
    onStart,
    onStop,
    onNext,
    onToggleCamera,
    onToggleMicrophone,
    onToggleScreenShare,
    onSwitchCamera,
    onSwitchMicrophone,
    onLeave,
    onToggleMobileChat,
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
      <div className="absolute bottom-4 lg:bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 lg:gap-4 z-30 px-2">
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

        {/* Chat Button - only for mobile when matched */}
        {isMobile && isMatched && onToggleMobileChat && (
          <ChatButton onClick={onToggleMobileChat} unreadCount={unreadChatCount} />
        )}

        {/* Screen Share - only when matched and NOT on mobile */}
        {!isMobile && isMatched && onToggleScreenShare && (
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
