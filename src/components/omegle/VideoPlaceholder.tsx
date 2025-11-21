'use client';

import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';

interface VideoPlaceholderProps {
  label: string;
  showControls?: boolean;
  onStart?: () => void;
  onLeave?: () => void;
  partnerName?: string;
  isWaiting?: boolean;
  isMatched?: boolean;
}

export const VideoPlaceholder = ({ 
  label, 
  showControls = false, 
  onStart, 
  onLeave,
  partnerName,
  isWaiting = false,
  isMatched = false,
}: VideoPlaceholderProps) => {
  return (
    <div className="flex-1 relative overflow-hidden rounded-lg" style={{ backgroundColor: '#c8e6f5', minHeight: '300px' }}>
      <DottedGlowBackground
        className="absolute inset-0"
        gap={15}
        radius={2}
        color="rgba(0, 132, 209, 0.4)"
        glowColor="rgba(0, 132, 209, 0.9)"
        opacity={0.7}
        speedMin={0.5}
        speedMax={1.2}
        backgroundOpacity={0.05}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#a8d8f0' }}>
          <svg className="w-10 h-10" style={{ color: '#0084d1' }} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: '#0084d1' }}>
          {partnerName || label}
        </p>
        {isWaiting && !isMatched && (
          <p className="text-xs text-slate-500 mt-1 animate-pulse">Searching for match...</p>
        )}
        {isMatched && partnerName && (
          <div className="flex items-center gap-1 mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-xs text-green-600 font-medium">Connected</p>
          </div>
        )}
      </div>

      {showControls && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4">
          <button 
            className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
            title="Toggle Camera"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth={2} />
            </svg>
          </button>
          <button 
            className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
            title="Toggle Microphone"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth={2} />
            </svg>
          </button>
          {isMatched ? (
            <button 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors bg-red-500 hover:bg-red-600"
              title="Leave Room"
              onClick={onLeave}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          ) : (
            <button 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#0084d1' }}
              title={isWaiting ? 'Searching...' : 'Start Matching'}
              onClick={onStart}
              disabled={isWaiting}
            >
              {isWaiting ? (
                <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
