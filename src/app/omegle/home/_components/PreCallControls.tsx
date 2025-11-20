"use client";

import { Video, VideoOff, Mic, MicOff, Play, Square } from "lucide-react";

interface PreCallControlsProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  onMicToggle: () => void;
  onCameraToggle: () => void;
  onStart: () => void;
  onStop?: () => void;
  isSearching?: boolean;
  showControls: boolean;
}

export default function PreCallControls({
  isMicOn,
  isCameraOn,
  onMicToggle,
  onCameraToggle,
  onStart,
  onStop,
  isSearching = false,
  showControls: _showControls,
}: PreCallControlsProps) {
  // When not connected (isSearching or idle), always show controls
  // Remove the early return check so controls are always visible before connection

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 z-10">
      {/* Camera */}
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

      {/* Microphone */}
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
  );
}
