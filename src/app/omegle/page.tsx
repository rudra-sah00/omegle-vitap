'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useVideoChat } from '@/hooks';
import { REDIRECT_DELAY } from '@/constants';
import { 
  ChatWindow,
  MobileChat,
  VideoDisplay,
  LoadingState,
  ErrorState,
  OmegleErrorBoundary,
  MatchConfetti,
  RoomControls,
  ScreenShareIndicator,
} from '@/components/omegle';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';
import { showError, showWarning, ErrorCode } from '@/lib';
import { isBrowserSupported } from '@/lib/browser-polyfill';
import { analytics } from '@/services/firebase';
import type { MatchDataMatched } from '@/types/matchmaking';

function OmeglePageContent() {
  const { name, gender } = useUser();
  const router = useRouter();
  const [checkingStatus, setCheckingStatus] = useState(true);
  
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY - Rules of Hooks
  // Video chat hook (handles matchmaking, RTC, and messaging)
  const {
    connectionState,
    matchData,
    isMatched,
    isInSession,
    matchmakingError,
    isCameraOn,
    isMicOn,
    isRemoteCameraOn,
    isRemoteMicOn,
    isScreenSharing,
    isRemoteScreenSharing,
    localNetworkQuality,
    remoteNetworkQuality,
    messages,
    isPartnerTyping,
    startSearch,
    stopSearch,
    endSession,
    findNext,
    toggleCamera,
    toggleMicrophone,
    toggleScreenShare,
    switchCamera,
    switchMicrophone,
    getCurrentDevices,
    reattachLocalVideo,
    sendMessage,
    sendTypingIndicator,
  } = useVideoChat({
    localVideoElementId: 'local-video',
    remoteVideoElementId: 'remote-video',
  });
  
  // Get devices - now returns stable state values
  const devices = getCurrentDevices();

  // Track match confetti state - reset when disconnected so it can trigger again
  const [showMatchConfetti, setShowMatchConfetti] = useState(false);
  
  // Get partner gender from match data
  const partnerGender = useMemo(() => {
    if (matchData && 'partnerGender' in matchData) {
      return (matchData as MatchDataMatched).partnerGender;
    }
    return undefined;
  }, [matchData]);

  // Show confetti when matched, reset when disconnected
  useEffect(() => {
    if (isMatched) {
      // Just matched! Show confetti
      setShowMatchConfetti(true);
    } else {
      // Disconnected - reset confetti state so it can trigger on next match
      setShowMatchConfetti(false);
    }
  }, [isMatched]);

  // Re-attach local video when screen sharing mode changes
  useEffect(() => {
    // Small delay to ensure DOM has updated
    const timer = setTimeout(() => {
      if (isCameraOn) {
        reattachLocalVideo('local-video');
      }
    }, 150);
    
    return () => clearTimeout(timer);
  }, [isScreenSharing, isCameraOn, reattachLocalVideo]);

  /**
   * Check browser compatibility - only run once on mount
   */
  useEffect(() => {
    try {
      // Check if browser is supported
      if (!isBrowserSupported()) {
        showError('Your browser does not support video/audio. Please use Chrome, Firefox, or Safari 11+.', ErrorCode.MEDIA_DEVICE_NOT_FOUND);
        setTimeout(() => router.push('/welcome'), REDIRECT_DELAY);
        return;
      }
    } catch (error) {
      // Silently handle browser check errors
    }
  }, []); // Only run on mount

  /**
   * Check user status on mount and when name changes
   */
  useEffect(() => {
    try {
      if (!name) {
        router.push('/welcome');
      } else {
        setCheckingStatus(false);
      }
    } catch (error) {
      // Silently handle navigation errors
      setCheckingStatus(false);
    }
  }, [name, router]);

  /**
   * Monitor network status
   */
  useEffect(() => {
    const handleOnline = () => {
      // Connection restored - no toast needed
    };

    const handleOffline = () => {
      showError('Lost internet connection. Please check your network.', ErrorCode.CONNECTION_LOST);
      if (isInSession) {
        endSession();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isInSession, endSession]);

  /**
   * Handle page visibility changes (tab switching)
   */
  useEffect(() => {
    let wasHidden = false;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasHidden = true;
      } else if (wasHidden && isInSession) {
        // User came back to tab during active session - no toast needed
        wasHidden = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isInSession]);

  /**
   * Prevent accidental page close during active session
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isInSession) {
        e.preventDefault();
        e.returnValue = 'You are in an active chat. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isInSession]);

  /**
   * Handle start button click
   */
  const handleStart = useCallback(async () => {
    try {
      // Validate user data
      if (!name || !gender) {
        showError('Please set your name and gender first', ErrorCode.CONNECTION_LOST);
        router.push('/welcome');
        return;
      }

      // Only block if actually in an active session (matched with partner)
      // Allow search even if connectionState is 'waiting' since user might have cancelled
      if (isInSession) {
        showWarning('Already in an active chat session');
        return;
      }

      // Check network connectivity
      if (!navigator.onLine) {
        showError('No internet connection. Please check your network.', ErrorCode.CONNECTION_LOST);
        return;
      }

      // Track match start
      analytics.trackMatchStart({
        camera: isCameraOn,
        microphone: isMicOn
      });

      await startSearch({
        name,
        gender,
        targetGender: undefined,
      });
    } catch (error) {
      showError('Failed to start search. Please try again.', ErrorCode.CONNECTION_LOST);
    }
  }, [name, gender, isInSession, startSearch]);

  /**
   * Handle stop searching
   */
  const handleStop = useCallback(async () => {
    try {
      // Track match ended
      analytics.trackMatchEnded('user_stop');
      
      await stopSearch();
    } catch (error) {
      // Silently handle cancel errors - no need to reload page
      // The cancelSearch function already handles cleanup
    }
  }, [stopSearch]);

  /**
   * Handle next button (find new partner)
   */
  const handleNext = useCallback(async () => {
    try {
      if (!navigator.onLine) {
        showError('No internet connection. Please check your network.', ErrorCode.CONNECTION_LOST);
        return;
      }
      // Track skip event
      analytics.trackMatchEnded('user_skip');
      
      await findNext();
    } catch (error) {
      showError('Failed to find next partner. Please try again.', ErrorCode.CONNECTION_LOST);
    }
  }, [findNext]);

  /**
   * Handle message input typing
   */
  const handleTyping = useCallback((isTyping: boolean) => {
    if (isInSession) {
      sendTypingIndicator(isTyping);
    }
  }, [isInSession, sendTypingIndicator]);

  // Calculate isSearching BEFORE any conditional returns
  const isSearching = useMemo(() => connectionState === 'waiting' && !isMatched, [connectionState, isMatched]);

  // Show loading only while checking initial status - NOT for websocket connecting
  if (!name || checkingStatus) {
    return <LoadingState state="loading" />;
  }

  // Show error state
  if (matchmakingError && connectionState === 'error') {
    return (
      <ErrorState
        error={matchmakingError}
        onGoBack={() => router.push('/welcome')}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="h-screen flex" style={{ backgroundColor: '#e8f4f8' }}>
      {/* Match Confetti Overlay */}
      <MatchConfetti isActive={showMatchConfetti} duration={1500} />
      
      {/* Screen Share Indicator */}
      <ScreenShareIndicator isSharing={isScreenSharing} onStop={toggleScreenShare} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Video Areas - Fill screen on mobile, 55% on desktop */}
        <div className="w-full lg:w-[55%] flex flex-col p-2 gap-2 lg:p-4 lg:gap-4 h-full">
          {/* Stranger Video - Takes 50% height on mobile */}
          <div className="flex-1 relative">
            <VideoDisplay
              id="remote-video"
              label={matchData?.partnerName || "Stranger"}
              isConnected={isMatched}
              isSearching={isSearching}
              showConnectionIndicator={true}
              isCameraOn={isRemoteCameraOn}
              isMicOn={isRemoteMicOn}
              partnerGender={partnerGender}
              networkQuality={remoteNetworkQuality}
            />
            
            {/* Remote Screen Share Overlay */}
            {isRemoteScreenSharing && (
              <div className="absolute inset-0 z-30 rounded-lg overflow-hidden" style={{ backgroundColor: '#1a1a2e' }}>
                <div 
                  id="remote-screen-share" 
                  className="w-full h-full"
                />
                <div className="absolute top-2 left-2 bg-green-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 shadow-md">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-white text-sm font-medium">
                    {matchData?.partnerName || 'Stranger'} is sharing
                  </span>
                </div>
                {/* Small video preview of partner's camera in corner */}
                {isRemoteCameraOn && (
                  <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-white/70 shadow-xl">
                    <div 
                      id="remote-video-pip" 
                      className="w-full h-full"
                      style={{ backgroundColor: '#1e293b' }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Your Video - Takes 50% height on mobile */}
          <div className="flex-1 relative">
            {/* When screen sharing, show screen share info as main content */}
            {isScreenSharing ? (
              <div className="h-full w-full relative overflow-hidden rounded-lg" style={{ backgroundColor: '#c8e6f5' }}>
                {/* Animated Dotted Glow Background - same as VideoDisplay */}
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
                
                {/* Screen share info centered */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 flex flex-col items-center shadow-lg">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-green-700 font-semibold text-lg">Sharing your screen</p>
                    <p className="text-gray-500 text-sm mt-1">Your partner can see your screen</p>
                  </div>
                </div>
                
                {/* Camera PiP when screen sharing - always render element, hide if camera off */}
                <div 
                  className={`absolute bottom-20 right-4 w-36 h-28 rounded-lg overflow-hidden border-2 border-white shadow-xl z-20 transition-opacity ${isCameraOn ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                  style={{ backgroundColor: '#a8d8f0' }}
                >
                  <div 
                    id="local-video" 
                    className="w-full h-full"
                  />
                </div>
                
                {/* Control Buttons */}
                <RoomControls
                  isMatched={isMatched}
                  isSearching={isSearching}
                  isCameraOn={isCameraOn}
                  isMicOn={isMicOn}
                  isScreenSharing={isScreenSharing}
                  currentCameraId={devices.cameraId}
                  currentMicId={devices.micId}
                  onStart={handleStart}
                  onStop={handleStop}
                  onNext={handleNext}
                  onToggleCamera={toggleCamera}
                  onToggleMicrophone={toggleMicrophone}
                  onToggleScreenShare={toggleScreenShare}
                  onSwitchCamera={switchCamera}
                  onSwitchMicrophone={switchMicrophone}
                  onLeave={endSession}
                />
              </div>
            ) : (
              <VideoDisplay
                id="local-video"
                label="Your camera"
                isConnected={isMatched}
                isCameraOn={isCameraOn}
                isMicOn={isMicOn}
                isSearching={false}
                showConnectionIndicator={false}
                networkQuality={localNetworkQuality}
              >
                {/* Control Buttons */}
                <RoomControls
                  isMatched={isMatched}
                  isSearching={isSearching}
                  isCameraOn={isCameraOn}
                  isMicOn={isMicOn}
                  isScreenSharing={isScreenSharing}
                  currentCameraId={devices.cameraId}
                  currentMicId={devices.micId}
                  onStart={handleStart}
                  onStop={handleStop}
                  onNext={handleNext}
                  onToggleCamera={toggleCamera}
                  onToggleMicrophone={toggleMicrophone}
                  onToggleScreenShare={toggleScreenShare}
                  onSwitchCamera={switchCamera}
                  onSwitchMicrophone={switchMicrophone}
                  onLeave={endSession}
                />
              </VideoDisplay>
            )}
          </div>
        </div>

        {/* Right Side - Desktop Chat Window */}
        <ChatWindow 
          isConnected={isMatched} 
          isStrangerTyping={isPartnerTyping}
          onSendMessage={sendMessage}
          onTyping={handleTyping}
          connectionState={connectionState}
          messages={messages}
          partnerName={matchData?.partnerName}
        />

        {/* Mobile Chat */}
        <MobileChat 
          isConnected={isMatched} 
          isStrangerTyping={isPartnerTyping}
          onSendMessage={sendMessage}
          onTyping={handleTyping}
          connectionState={connectionState}
          messages={messages}
          partnerName={matchData?.partnerName}
        />
      </div>
    </div>
  );
}

export default function OmeglePage() {
  return (
    <OmegleErrorBoundary>
      <OmeglePageContent />
    </OmegleErrorBoundary>
  );
}
