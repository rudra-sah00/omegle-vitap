"use client";

import { useState } from "react";

export default function MediaControls() {
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);

  return (
    <div className="flex gap-2 justify-center">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsCameraOn(!isCameraOn);
        }}
        className={`p-2 rounded-full transition-all ${
          isCameraOn 
            ? 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white' 
            : 'bg-red-500 hover:bg-red-600 text-white'
        }`}
        title={isCameraOn ? "Turn camera off" : "Turn camera on"}
      >
        {isCameraOn ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        )}
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsMicOn(!isMicOn);
        }}
        className={`p-2 rounded-full transition-all ${
          isMicOn 
            ? 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white' 
            : 'bg-red-500 hover:bg-red-600 text-white'
        }`}
        title={isMicOn ? "Mute microphone" : "Unmute microphone"}
      >
        {isMicOn ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        )}
      </button>

      <button
        onClick={(e) => e.stopPropagation()}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-medium transition-all"
        title="End chat"
      >
        Stop
      </button>

      <button
        onClick={(e) => e.stopPropagation()}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition-all"
        title="Find new stranger"
      >
        New
      </button>
    </div>
  );
}
