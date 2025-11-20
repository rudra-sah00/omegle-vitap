"use client";

import { Video, VideoOff, Mic, MicOff, Square, SkipForward } from "lucide-react";

interface VideoControlsProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  networkQuality: "excellent" | "good" | "poor" | "bad";
  onMicToggle: () => void;
  onCameraToggle: () => void;
  onNext: () => void;
  onStop: () => void;
  showControls: boolean;
}

export default function VideoControls({
  isMicOn,
  isCameraOn,
  networkQuality: _networkQuality,
  onMicToggle,
  onCameraToggle,
  onNext,
  onStop,
  showControls,
}: VideoControlsProps) {
  if (!showControls) return null;

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

      {/* Stop */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onStop();
        }}
        className="p-3 rounded-full shadow-lg bg-red-600 text-white hover:bg-red-700 transition-all"
        title="Stop and disconnect"
      >
        <Square className="w-6 h-6" fill="currentColor" />
      </button>

      {/* Next */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        className="p-3 rounded-full shadow-lg bg-orange-600 text-white hover:bg-orange-700 transition-all"
        title="Skip to next stranger"
      >
        <SkipForward className="w-6 h-6" />
      </button>
    </div>
  );
}
