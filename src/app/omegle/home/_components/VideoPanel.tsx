"use client";

import { RefObject } from "react";
import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";
import { useTheme } from "@/contexts/ThemeContext";

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
  const { theme } = useTheme();

  const renderPlaceholder = () => {
    // IMPORTANT: Don't show placeholder when camera is ON (for local video)
    if (!isRemote && isCameraOn) {
      return null;
    }

    if (isRemote) {
      // Stranger's video placeholders
      if (!isConnected) {
        return (
          <div
            className={`absolute inset-0 flex items-center justify-center ${
              theme === "dark" ? "bg-black" : "bg-gradient-to-br from-purple-100 to-indigo-100"
            }`}
            style={{ zIndex: 0 }}
          >
            <div className="absolute inset-0 pointer-events-none">
              <DottedGlowBackground
                gap={18}
                radius={2.5}
                color="rgba(255, 255, 255, 0.9)"
                glowColor="rgba(59, 130, 246, 1)"
                opacity={0.9}
                backgroundOpacity={0}
                speedMin={0.6}
                speedMax={1.4}
                speedScale={1.5}
              />
            </div>
            <div className="text-center relative z-10">
              <div className="relative w-24 h-24 md:w-28 md:h-28 mx-auto mb-4">
                {/* Rotating border circle - only show when searching */}
                {isSearching && (
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 animate-spin"></div>
                )}
                {/* Icon - always same size and position */}
                <div
                  className={`rounded-full flex items-center justify-center shadow-xl w-full h-full ${
                    isSearching ? "p-1" : ""
                  } ${
                    theme === "dark"
                      ? "bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700"
                      : "bg-gradient-to-br from-purple-200 to-indigo-200 border-2 border-purple-300"
                  }`}
                >
                  <svg
                    className={`w-12 h-12 md:w-14 md:h-14 ${
                      theme === "dark" ? "text-gray-400" : "text-purple-600"
                    }`}
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
              </div>
              <p
                className={`text-sm md:text-base font-medium tracking-wide ${
                  theme === "dark" ? "text-gray-300" : "text-purple-700"
                }`}
              >
                Stranger
              </p>
            </div>
          </div>
        );
      }

      // Show placeholder if connected but no video track (camera off)
      if (isConnected && (remoteUsers.length === 0 || !hasVideoTrack)) {
        return (
          <div
            className={`absolute inset-0 flex items-center justify-center ${
              theme === "dark" ? "bg-black" : "bg-gradient-to-br from-purple-100 to-indigo-100"
            }`}
            style={{ zIndex: 10 }}
          >
            <div className="absolute inset-0 pointer-events-none">
              <DottedGlowBackground
                gap={18}
                radius={2.5}
                color="rgba(255, 255, 255, 0.9)"
                glowColor="rgba(59, 130, 246, 1)"
                opacity={0.9}
                backgroundOpacity={0}
                speedMin={0.6}
                speedMax={1.4}
                speedScale={1.5}
              />
            </div>
            <div className="text-center relative z-10">
              <div
                className={`w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl ${
                  theme === "dark"
                    ? "bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700"
                    : "bg-gradient-to-br from-purple-200 to-indigo-200 border-2 border-purple-300"
                }`}
              >
                <svg
                  className={`w-12 h-12 md:w-14 md:h-14 ${
                    theme === "dark" ? "text-gray-400" : "text-purple-600"
                  }`}
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
              <p
                className={`text-sm md:text-base font-medium ${
                  theme === "dark" ? "text-gray-300" : "text-purple-700"
                }`}
              >
                Stranger's camera is off
              </p>
            </div>
          </div>
        );
      }
    } else {
      // Local video placeholder
      if (isSearching) {
        // Show background animation while searching if camera is off
        if (!isCameraOn) {
          return (
            <div
              className={`absolute inset-0 flex items-center justify-center ${
                theme === "dark" ? "bg-black" : "bg-gradient-to-br from-purple-100 to-indigo-100"
              }`}
              style={{ zIndex: 0 }}
            >
              <div className="absolute inset-0 pointer-events-none">
                <DottedGlowBackground
                  gap={18}
                  radius={2.5}
                  color="rgba(255, 255, 255, 0.9)"
                  glowColor="rgba(59, 130, 246, 1)"
                  opacity={0.9}
                  backgroundOpacity={0}
                  speedMin={0.6}
                  speedMax={1.4}
                  speedScale={1.5}
                />
              </div>
            </div>
          );
        }
        return null;
      }

      if (isConnected) {
        // Show "Connecting..." when connected but video not ready yet
        if (!isCameraOn) {
          return (
            <div
              className={`absolute inset-0 flex items-center justify-center ${
                theme === "dark" ? "bg-black" : "bg-gradient-to-br from-purple-100 to-indigo-100"
              }`}
              style={{ zIndex: 0 }}
            >
              <div className="absolute inset-0 pointer-events-none">
                <DottedGlowBackground
                  gap={18}
                  radius={2.5}
                  color="rgba(255, 255, 255, 0.9)"
                  glowColor="rgba(59, 130, 246, 1)"
                  opacity={0.9}
                  backgroundOpacity={0}
                  speedMin={0.6}
                  speedMax={1.4}
                  speedScale={1.5}
                />
              </div>
              <div className="text-center relative z-10">
                <div
                  className={`w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl ${
                    theme === "dark"
                      ? "bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700"
                      : "bg-gradient-to-br from-purple-200 to-indigo-200 border-2 border-purple-300"
                  }`}
                >
                  <svg
                    className={`w-12 h-12 md:w-14 md:h-14 ${
                      theme === "dark" ? "text-gray-400" : "text-purple-600"
                    }`}
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
                <p
                  className={`text-sm md:text-base font-medium ${
                    theme === "dark" ? "text-gray-300" : "text-purple-700"
                  }`}
                >
                  Camera is off
                </p>
              </div>
            </div>
          );
        }
      } else {
        // Not connected and not searching - idle state
        if (!isCameraOn) {
          return (
            <div
              className={`absolute inset-0 flex items-center justify-center ${
                theme === "dark" ? "bg-black" : "bg-gradient-to-br from-purple-100 to-indigo-100"
              }`}
              style={{ zIndex: 0 }}
            >
              <div className="absolute inset-0 pointer-events-none">
                <DottedGlowBackground
                  gap={18}
                  radius={2.5}
                  color="rgba(255, 255, 255, 0.9)"
                  glowColor="rgba(59, 130, 246, 1)"
                  opacity={0.9}
                  backgroundOpacity={0}
                  speedMin={0.6}
                  speedMax={1.4}
                  speedScale={1.5}
                />
              </div>
              <div className="text-center relative z-10">
                <div
                  className={`w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl ${
                    theme === "dark"
                      ? "bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700"
                      : "bg-gradient-to-br from-purple-200 to-indigo-200 border-2 border-purple-300"
                  }`}
                >
                  <svg
                    className={`w-12 h-12 md:w-14 md:h-14 ${
                      theme === "dark" ? "text-gray-400" : "text-purple-600"
                    }`}
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
                <p
                  className={`text-sm md:text-base font-medium ${
                    theme === "dark" ? "text-gray-300" : "text-purple-700"
                  }`}
                >
                  Your camera
                </p>
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
      className={`flex-1 min-h-0 relative rounded-xl overflow-hidden shadow-2xl transition-colors duration-300 ${
        theme === "dark"
          ? "bg-black border border-purple-900/50"
          : "bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200"
      }`}
      onClick={onToggleControls}
    >
      {/* Show placeholder when camera is off or not connected */}
      {renderPlaceholder()}
      {/* Always render video div - but hide it when camera is off or no video track */}
      <div
        ref={videoRef}
        className="w-full h-full absolute inset-0"
        style={{
          zIndex: (isCameraOn && !isRemote) || (isRemote && hasVideoTrack) ? 1 : -1,
          visibility:
            (!isRemote && !isCameraOn) || (isRemote && !hasVideoTrack) ? "hidden" : "visible",
        }}
      ></div>
      {children}
    </div>
  );
}
