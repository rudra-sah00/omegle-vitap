/**
 * Screen Share Indicator
 * Shows when user is sharing their screen
 */

'use client';

import { memo } from 'react';
import { ScreenShareIcon } from './Icons';
import { StopShareButton } from './ActionButtons';

interface ScreenShareIndicatorProps {
  isSharing: boolean;
  onStop: () => void;
}

export const ScreenShareIndicator = memo(({ isSharing, onStop }: ScreenShareIndicatorProps) => {
  if (!isSharing) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-green-500/95 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-3 shadow-lg border border-green-400/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-white">
            <ScreenShareIcon />
          </span>
          <span className="text-white text-sm font-medium">Sharing screen</span>
        </div>
        <StopShareButton onClick={onStop} />
      </div>
    </div>
  );
});
ScreenShareIndicator.displayName = 'ScreenShareIndicator';
