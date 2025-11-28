import { ReactNode, memo, useMemo } from 'react';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';
import { NetworkQualityIndicator, type NetworkQuality } from './NetworkQualityIndicator';

interface VideoDisplayProps {
  id: string;
  label: string;
  isConnected: boolean;
  isSearching: boolean;
  showConnectionIndicator?: boolean;
  isCameraOn?: boolean;
  isMicOn?: boolean;
  partnerGender?: 'male' | 'female' | 'other';
  networkQuality?: NetworkQuality;
  children?: ReactNode;
}

// Color schemes for different genders
const getColorScheme = (gender?: 'male' | 'female' | 'other', isConnected?: boolean) => {
  // Only apply gender-based colors when connected
  if (!isConnected || !gender) {
    // Default blue theme
    return {
      background: '#c8e6f5',
      glowColor: 'rgba(0, 132, 209, 0.8)',
      dotColor: 'rgba(0, 132, 209, 0.5)',
      iconBg: '#a8d8f0',
      iconColor: '#0084d1',
      textColor: '#0084d1',
    };
  }

  if (gender === 'female') {
    // Pink theme for female
    return {
      background: '#fce7f3',
      glowColor: 'rgba(236, 72, 153, 0.8)',
      dotColor: 'rgba(236, 72, 153, 0.5)',
      iconBg: '#fbcfe8',
      iconColor: '#db2777',
      textColor: '#db2777',
    };
  }

  // Default blue theme for male/other
  return {
    background: '#c8e6f5',
    glowColor: 'rgba(0, 132, 209, 0.8)',
    dotColor: 'rgba(0, 132, 209, 0.5)',
    iconBg: '#a8d8f0',
    iconColor: '#0084d1',
    textColor: '#0084d1',
  };
};

const VideoDisplayComponent = ({ 
  id, 
  label, 
  isConnected, 
  isSearching,
  showConnectionIndicator = false,
  isCameraOn = true,
  isMicOn = true,
  partnerGender,
  networkQuality,
  children 
}: VideoDisplayProps) => {
  // Get color scheme based on gender and connection state
  const colorScheme = useMemo(() => 
    getColorScheme(partnerGender, isConnected), 
    [partnerGender, isConnected]
  );

  // For local video: show placeholder only when camera is off
  // For remote video: show placeholder when not connected OR when partner's camera is off
  const showPlaceholder = id === 'local-video' ? !isCameraOn : (!isConnected || !isCameraOn);
  
  return (
    <div 
      className="h-full w-full relative overflow-hidden rounded-lg transition-colors duration-500" 
      style={{ backgroundColor: colorScheme.background, minHeight: '200px' }}
      role="region"
      aria-label={id === 'local-video' ? 'Your video feed' : 'Partner video feed'}
    >
      {/* Dotted Glow Background - always visible */}
      <DottedGlowBackground
        className="absolute inset-0 w-full h-full"
        gap={20}
        radius={1.5}
        color={colorScheme.dotColor}
        glowColor={colorScheme.glowColor}
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
        aria-label={label}
      />

      {/* Placeholder when not connected or camera off */}
      {showPlaceholder && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ pointerEvents: 'none' }}>
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mb-3 transition-colors duration-500" 
            style={{ backgroundColor: colorScheme.iconBg }}
          >
            <svg className="w-10 h-10 transition-colors duration-500" style={{ color: colorScheme.iconColor }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm font-medium transition-colors duration-500" style={{ color: colorScheme.textColor }}>
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

      {/* Searching Overlay - Enhanced aesthetic animation */}
      {isSearching && id === 'remote-video' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-black/30 via-blue-900/20 to-black/30 backdrop-blur-md z-10">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl px-10 py-8 shadow-[0_20px_60px_rgba(0,132,209,0.3)] flex flex-col items-center relative overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-cyan-50 animate-pulse opacity-50"></div>
            
            {/* Multi-ring spinner with staggered animations */}
            <div className="relative w-20 h-20 mb-6 z-10">
              {/* Outer ring - slow rotation */}
              <div 
                className="absolute inset-0 rounded-full border-[3px] border-transparent opacity-30"
                style={{
                  borderTopColor: '#0084d1',
                  borderRightColor: '#0084d1',
                  animation: 'spin 3s linear infinite'
                }}
              ></div>
              
              {/* Middle ring - medium rotation opposite direction */}
              <div 
                className="absolute inset-2 rounded-full border-[3px] border-transparent opacity-50"
                style={{
                  borderTopColor: '#00a8e8',
                  borderBottomColor: '#00a8e8',
                  animation: 'spin 2s linear infinite reverse'
                }}
              ></div>
              
              {/* Inner ring - fast rotation */}
              <div 
                className="absolute inset-4 rounded-full border-[3px] border-transparent"
                style={{
                  borderTopColor: '#0084d1',
                  borderLeftColor: '#0084d1',
                  animation: 'spin 1.5s linear infinite'
                }}
              ></div>
              
              {/* Center pulsing dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: '#0084d1',
                    boxShadow: '0 0 20px rgba(0, 132, 209, 0.6)',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}
                ></div>
              </div>
            </div>
            
            {/* Text content with animations */}
            <div className="text-center z-10">
              <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                Searching for a match
                <span className="inline-block animate-pulse">...</span>
              </p>
              <p className="text-sm text-gray-600 font-medium">Finding someone interesting for you</p>
            </div>
            
            {/* Animated dots indicator */}
            <div className="flex gap-2 mt-4 z-10">
              <div 
                className="w-2 h-2 rounded-full bg-blue-500"
                style={{ animation: 'bounce 1.4s infinite ease-in-out' }}
              ></div>
              <div 
                className="w-2 h-2 rounded-full bg-blue-500"
                style={{ animation: 'bounce 1.4s infinite ease-in-out 0.2s' }}
              ></div>
              <div 
                className="w-2 h-2 rounded-full bg-blue-500"
                style={{ animation: 'bounce 1.4s infinite ease-in-out 0.4s' }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Indicator with Network Quality */}
      {isConnected && showConnectionIndicator && (
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 z-20">
          <p className="text-white text-sm font-medium">{label}</p>
          <NetworkQualityIndicator quality={networkQuality || 'unknown'} />
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
