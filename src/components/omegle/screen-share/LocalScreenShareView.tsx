'use client';

import type { FC } from 'react';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { RoomControls } from '../controls/RoomControls';

interface LocalScreenShareViewProps {
  isCameraOn: boolean;
  isMicOn: boolean;
  isMatched: boolean;
  isSearching: boolean;
  isScreenSharing: boolean;
  currentCameraId?: string;
  currentMicId?: string;
  onStart: () => void;
  onStop: () => void;
  onNext: () => void;
  onToggleCamera: () => void;
  onToggleMicrophone: () => void;
  onToggleScreenShare: () => void;
  onSwitchCamera: (deviceId: string) => void;
  onSwitchMicrophone: (deviceId: string) => void;
  onLeave: () => void;
}

/**
 * View displayed when the local user is sharing their screen
 * Shows a sharing indicator with camera PiP and controls
 */
export const LocalScreenShareView: FC<LocalScreenShareViewProps> = ({
  isCameraOn,
  isMicOn,
  isMatched,
  isSearching,
  isScreenSharing,
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
}) => {
  return (
    <div className="h-full w-full relative overflow-hidden rounded-lg bg-video-blue-bg">
      {/* Flickering Grid Background */}
      <FlickeringGrid
        className="absolute inset-0 w-full h-full"
        squareSize={4}
        gridGap={6}
        color="rgb(0, 132, 209)"
        maxOpacity={0.4}
        flickerChance={0.3}
      />

      {/* Screen share info centered - pointer-events-none to allow clicks on buttons */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 flex flex-col items-center shadow-lg pointer-events-auto">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-green-700 font-semibold text-lg">Sharing your screen</p>
          <p className="text-gray-500 text-sm mt-1">Your partner can see your screen</p>
        </div>
      </div>

      {/* Camera PiP when screen sharing - always render element, hide if camera off */}
      <div
        className={`absolute bottom-24 right-4 w-36 h-28 rounded-lg overflow-hidden border-2 border-white shadow-xl z-20 transition-opacity bg-video-blue-icon-bg ${
          isCameraOn ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div id="local-video" className="w-full h-full" />
      </div>

      {/* Control Buttons - z-30 to appear above PiP and centered info */}
      <RoomControls
        isMatched={isMatched}
        isSearching={isSearching}
        isCameraOn={isCameraOn}
        isMicOn={isMicOn}
        isScreenSharing={isScreenSharing}
        currentCameraId={currentCameraId}
        currentMicId={currentMicId}
        onStart={onStart}
        onStop={onStop}
        onNext={onNext}
        onToggleCamera={onToggleCamera}
        onToggleMicrophone={onToggleMicrophone}
        onToggleScreenShare={onToggleScreenShare}
        onSwitchCamera={onSwitchCamera}
        onSwitchMicrophone={onSwitchMicrophone}
        onLeave={onLeave}
      />
    </div>
  );
};
