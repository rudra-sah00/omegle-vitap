"use client";

import { RefObject } from "react";
import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";

interface VideoPanelProps {
  videoRef: RefObject<HTMLDivElement | null>;
  isRemote?: boolean;
  isConnected: boolean;
  isSearching: boolean;
  isCameraOn?: boolean;
  hasVideoTrack?: boolean;
  remoteUsers?: IAgoraRTCRemoteUser[];
  showControls?: boolean;
  onToggleControls?: () => void;
  children?: React.ReactNode;
}

export default function VideoPanel({
  videoRef,
  isRemote = false,
  isConnected,
  isSearching,
  isCameraOn = true,
  hasVideoTrack = false,
  remoteUsers = [],
  showControls: _showControls = false,
  onToggleControls,
  children,
}: VideoPanelProps) {
  const renderPlaceholder = () => {
    if (isRemote) {
      // Stranger's video placeholders - NO SEARCHING ANIMATION
      if (!isConnected) {
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 md:w-12 md:h-12 text-gray-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-gray-400 text-sm md:text-base">Stranger</p>
            </div>
          </div>
        );
      }

      if (isConnected && remoteUsers.length === 0) {
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 md:w-12 md:h-12 text-gray-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-gray-400 text-sm md:text-base">Stranger's camera is off</p>
            </div>
          </div>
        );
      }
    } else {
      // Local video placeholder - SHOW SEARCHING ANIMATION HERE
      if (isSearching) {
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
              <div className="space-y-2">
                <p className="text-white text-lg font-semibold">
                  Looking for someone you can chat with...
                </p>
                <p className="text-gray-400 text-sm">Hang on!</p>
              </div>
            </div>
          </div>
        );
      }

      if (isConnected) {
        // Show "Connecting..." when connected but video not ready yet
        if (!hasVideoTrack || !isCameraOn) {
          return (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-10 h-10 md:w-12 md:h-12 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm md:text-base">Camera is off</p>
              </div>
            </div>
          );
        }
      } else {
        // Not connected and not searching - idle state
        if (!hasVideoTrack || !isCameraOn) {
          return (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-10 h-10 md:w-12 md:h-12 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm md:text-base">Your camera</p>
              </div>
            </div>
          );
        }
      }
    }

    return null;
  };

  return (
    <div
      className="flex-1 min-h-0 relative bg-gray-900 rounded-lg overflow-hidden"
      onClick={onToggleControls}
    >
      <div ref={videoRef} className="w-full h-full"></div>
      {renderPlaceholder()}
      {children}
    </div>
  );
}
