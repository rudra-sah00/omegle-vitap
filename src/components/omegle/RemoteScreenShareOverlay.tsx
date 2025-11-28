'use client';

import type { FC } from 'react';

interface RemoteScreenShareOverlayProps {
  partnerName?: string;
  isRemoteCameraOn: boolean;
}

/**
 * Overlay displayed when a remote user is sharing their screen
 * Shows the screen share and optionally a PiP of their camera
 */
export const RemoteScreenShareOverlay: FC<RemoteScreenShareOverlayProps> = ({
  partnerName,
  isRemoteCameraOn,
}) => {
  return (
    <div
      className="absolute inset-0 z-30 rounded-lg overflow-hidden bg-slate-900"
    >
      <div id="remote-screen-share" className="w-full h-full" />
      
      <div className="absolute top-2 left-2 bg-green-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 shadow-md">
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <svg
          className="w-4 h-4 text-white"
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
        <span className="text-white text-sm font-medium">
          {partnerName || 'Stranger'} is sharing
        </span>
      </div>
      
      {/* Small video preview of partner's camera in corner */}
      {isRemoteCameraOn && (
        <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-white/70 shadow-xl">
          <div
            id="remote-video-pip"
            className="w-full h-full bg-slate-800"
          />
        </div>
      )}
    </div>
  );
};
