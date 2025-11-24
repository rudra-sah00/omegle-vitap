import { ReactNode, memo } from 'react';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';

interface VideoDisplayProps {
  id: string;
  label: string;
  isConnected: boolean;
  isSearching: boolean;
  showConnectionIndicator?: boolean;
  isCameraOn?: boolean;
  isMicOn?: boolean;
  children?: ReactNode;
}

const VideoDisplayComponent = ({ 
  id, 
  label, 
  isConnected, 
  isSearching,
  showConnectionIndicator = false,
  isCameraOn = true,
  isMicOn = true,
  children 
}: VideoDisplayProps) => {
  // For local video: show placeholder only when camera is off
  // For remote video: show placeholder when not connected OR when partner's camera is off
  const showPlaceholder = id === 'local-video' ? !isCameraOn : (!isConnected || !isCameraOn);
  
  return (
    <div className="h-full w-full relative overflow-hidden rounded-lg" style={{ backgroundColor: '#c8e6f5', minHeight: '200px' }}>
      {/* Dotted Glow Background - always visible */}
      <DottedGlowBackground
        className="absolute inset-0 w-full h-full"
        gap={20}
        radius={1.5}
        color="rgba(0, 132, 209, 0.5)"
        glowColor="rgba(0, 132, 209, 0.8)"
        opacity={0.8}
        speedMin={0.3}
        speedMax={0.8}
        speedScale={1}
      />
      
      {/* Video Element */}
      <div
        id={id}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: showPlaceholder ? 0 : 1, transition: 'opacity 0.3s' }}
      />

      {/* Placeholder when not connected or camera off */}
      {showPlaceholder && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ pointerEvents: 'none' }}>
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mb-3" 
            style={{ backgroundColor: '#a8d8f0' }}
          >
            <svg className="w-10 h-10" style={{ color: '#0084d1' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: '#0084d1' }}>
            {id === 'local-video' && !isCameraOn ? 'Camera is off' : label}
          </p>
          {id === 'local-video' && !isCameraOn && (
            <p className="text-xs text-slate-500 mt-1 text-center px-4">
              Click the camera button below to enable
            </p>
          )}
          {isSearching && (
            <p className="text-xs text-slate-500 mt-1 animate-pulse">Searching for match...</p>
          )}
        </div>
      )}

      {/* Searching Overlay - Full screen popup */}
      {isSearching && id === 'remote-video' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-10">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl px-8 py-6 shadow-2xl flex flex-col items-center">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
            </div>
            <p className="text-lg font-semibold text-gray-800 mb-1">Searching for a match...</p>
            <p className="text-sm text-gray-500">This may take a few moments</p>
          </div>
        </div>
      )}

      {/* Connection Indicator */}
      {isConnected && showConnectionIndicator && (
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 z-20">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-white text-sm font-medium">{label}</p>
        </div>
      )}

      {/* Camera/Mic Muted Indicators */}
      {!showPlaceholder && (
        <div className="absolute top-4 right-4 flex gap-2 z-20">
          {!isCameraOn && (
            <div className="bg-red-500/90 backdrop-blur-sm p-2 rounded-full" title="Camera is off">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0017 13.5V7a2 2 0 00-3.53-1.235L10.94 8.293 3.707 2.293zM13.5 16.443l-2.121-2.121c.167.03.338.05.514.05.828 0 1.5-.448 1.5-1s-.672-1-1.5-1a1.863 1.863 0 00-.857.205L9.536 11.08C10.127 10.423 10.828 10 11.893 10c1.657 0 3 1.119 3 2.5v3.943zM4 7a2 2 0 012-2h.172l2 2H6v6a2 2 0 002 2h6.172l2 2H8a4 4 0 01-4-4V7z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          {!isMicOn && (
            <div className="bg-red-500/90 backdrop-blur-sm p-2 rounded-full" title="Microphone is off">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Children (e.g., controls) */}
      {children}
    </div>
  );
};

export const VideoDisplay = memo(VideoDisplayComponent);
