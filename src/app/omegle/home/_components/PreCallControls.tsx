"use client";

import { useState, useEffect, useRef } from "react";
import { Video, VideoOff, Mic, MicOff, Play, Square, ChevronUp } from "lucide-react";

interface PreCallControlsProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  onMicToggle: () => void;
  onCameraToggle: () => void;
  onStart: () => void;
  onStop?: () => void;
  isSearching?: boolean;
  showControls: boolean;
  // Device selection props
  cameras?: MediaDeviceInfo[];
  microphones?: MediaDeviceInfo[];
  selectedCameraId?: string;
  selectedMicrophoneId?: string;
  onSelectCamera?: (deviceId: string) => void;
  onSelectMicrophone?: (deviceId: string) => void;
}

export default function PreCallControls({
  isMicOn,
  isCameraOn,
  onMicToggle,
  onCameraToggle,
  onStart,
  onStop,
  isSearching = false,
  showControls,
  cameras = [],
  microphones = [],
  selectedCameraId = "",
  selectedMicrophoneId = "",
  onSelectCamera,
  onSelectMicrophone,
}: PreCallControlsProps) {
  const [isSafari, setIsSafari] = useState(false);
  const [showCameraDropdown, setShowCameraDropdown] = useState(false);
  const [showMicDropdown, setShowMicDropdown] = useState(false);
  const cameraButtonRef = useRef<HTMLDivElement>(null);
  const micButtonRef = useRef<HTMLDivElement>(null);
  const cameraDropdownRef = useRef<HTMLDivElement>(null);
  const micDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Detect Safari or iOS
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua);
    const safari = /^((?!chrome|android).)*safari/i.test(ua);
    setIsSafari(iOS || safari);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is outside camera button and dropdown
      if (
        cameraButtonRef.current &&
        !cameraButtonRef.current.contains(target) &&
        cameraDropdownRef.current &&
        !cameraDropdownRef.current.contains(target)
      ) {
        setShowCameraDropdown(false);
      }

      // Check if click is outside mic button and dropdown
      if (
        micButtonRef.current &&
        !micButtonRef.current.contains(target) &&
        micDropdownRef.current &&
        !micDropdownRef.current.contains(target)
      ) {
        setShowMicDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't render if showControls is false
  if (!showControls) {
    return null;
  }

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-3 z-10">
      {/* Safari/iOS Permission Hint - Show only on Safari/iOS when permissions are off and not searching */}
      {isSafari && !isSearching && (!isCameraOn || !isMicOn) && (
        <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-lg mb-1 max-w-xs text-center">
          Tap camera/mic buttons to enable. Safari will ask for permission.
        </div>
      )}

      {/* Device Selectors - Show before starting */}
      <div className="flex gap-3">
        {/* Camera Button with Dropdown */}
        <div className="relative" ref={cameraButtonRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCameraToggle();
            }}
            className={`p-3 rounded-full shadow-lg transition-all ${
              isCameraOn
                ? "bg-white text-gray-900 hover:bg-gray-100"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
            title={isCameraOn ? "Turn off camera" : "Turn on camera"}
          >
            {isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>

          {/* Arrow button - always visible when conditions met */}
          {!isSearching && cameras.length > 1 && onSelectCamera && isCameraOn && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCameraDropdown(!showCameraDropdown);
              }}
              className="absolute -top-1 -right-1 bg-gray-800 text-white rounded-full p-1.5 shadow-lg hover:bg-gray-700 z-10 hover:scale-110 transition-transform"
              title="Select camera"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          )}

          {/* Camera Dropdown */}
          {showCameraDropdown && isCameraOn && (
            <div
              ref={cameraDropdownRef}
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-[250px] bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50"
            >
              <div className="max-h-[200px] overflow-y-auto">
                {cameras.map((device) => {
                  const isSelected = device.deviceId === selectedCameraId;
                  return (
                    <button
                      key={device.deviceId}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCamera?.(device.deviceId);
                        setShowCameraDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-gray-800 transition-colors ${
                        isSelected ? "bg-gray-800 text-blue-400" : "text-white"
                      }`}
                    >
                      <span className="truncate flex-1">
                        {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                      </span>
                      {isSelected && <Video className="w-4 h-4 ml-2 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Microphone Button with Dropdown */}
        <div className="relative" ref={micButtonRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMicToggle();
            }}
            className={`p-3 rounded-full shadow-lg transition-all ${
              isMicOn
                ? "bg-white text-gray-900 hover:bg-gray-100"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
            title={isMicOn ? "Mute microphone" : "Unmute microphone"}
          >
            {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          {/* Arrow button - always visible when conditions met */}
          {!isSearching && microphones.length > 1 && onSelectMicrophone && isMicOn && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMicDropdown(!showMicDropdown);
              }}
              className="absolute -top-1 -right-1 bg-gray-800 text-white rounded-full p-1.5 shadow-lg hover:bg-gray-700 z-10 hover:scale-110 transition-transform"
              title="Select microphone"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          )}

          {/* Microphone Dropdown */}
          {showMicDropdown && isMicOn && (
            <div
              ref={micDropdownRef}
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-[250px] bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50"
            >
              <div className="max-h-[200px] overflow-y-auto">
                {microphones.map((device) => {
                  const isSelected = device.deviceId === selectedMicrophoneId;
                  return (
                    <button
                      key={device.deviceId}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMicrophone?.(device.deviceId);
                        setShowMicDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-gray-800 transition-colors ${
                        isSelected ? "bg-gray-800 text-blue-400" : "text-white"
                      }`}
                    >
                      <span className="truncate flex-1">
                        {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                      </span>
                      {isSelected && <Mic className="w-4 h-4 ml-2 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Start/Stop */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isSearching && onStop) {
              onStop();
            } else {
              onStart();
            }
          }}
          className={`p-3 rounded-full shadow-lg transition-all ${
            isSearching
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
          title={isSearching ? "Stop searching" : "Start matching"}
        >
          {isSearching ? (
            <Square className="w-6 h-6" fill="currentColor" />
          ) : (
            <Play className="w-6 h-6" fill="currentColor" />
          )}
        </button>
      </div>
    </div>
  );
}
