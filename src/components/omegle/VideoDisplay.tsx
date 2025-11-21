import { ReactNode } from 'react';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';

interface VideoDisplayProps {
  id: string;
  label: string;
  isConnected: boolean;
  isSearching: boolean;
  showConnectionIndicator?: boolean;
  isCameraOn?: boolean;
  children?: ReactNode;
}

export function VideoDisplay({ 
  id, 
  label, 
  isConnected, 
  isSearching,
  showConnectionIndicator = false,
  isCameraOn = true,
  children 
}: VideoDisplayProps) {
  // For local video: show placeholder only when camera is off
  // For remote video: show placeholder when not connected
  const showPlaceholder = id === 'local-video' ? !isCameraOn : !isConnected;
  
  return (
    <div className="flex-1 relative overflow-hidden rounded-lg" style={{ backgroundColor: '#c8e6f5', minHeight: '300px' }}>
      {/* Dotted Glow Background - always visible */}
      <DottedGlowBackground
        className="absolute inset-0"
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

      {/* Children (e.g., controls) */}
      {children}
    </div>
  );
}
