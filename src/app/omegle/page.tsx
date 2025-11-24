'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useChatSession } from '@/hooks/useChatSession';
import { ChatWindow } from '@/components/omegle/ChatWindow';
import { MobileChat } from '@/components/omegle/MobileChat';
import { VideoControls } from '@/components/omegle/VideoControls';
import { VideoDisplay } from '@/components/omegle/VideoDisplay';
import { LoadingState } from '@/components/omegle/LoadingState';
import { ErrorState } from '@/components/omegle/ErrorState';
import { OmegleErrorBoundary } from '@/components/omegle/OmegleErrorBoundary';
import { showError, showWarning, ErrorCode } from '@/lib/toast';
import { isBrowserSupported } from '@/lib/browser-polyfill';

function OmeglePageContent() {
  const { name, gender } = useUser();
  const router = useRouter();
  const [checkingStatus, setCheckingStatus] = useState(true);
  
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY - Rules of Hooks
  // Chat session hook (handles matchmaking, RTC, and RTM)
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
    messages,
    isPartnerTyping,
    startSearch,
    stopSearch,
    endSession,
    findNext,
    toggleCamera,
    toggleMicrophone,
    switchCamera,
    switchMicrophone,
    getCurrentDevices,
    sendMessage,
    sendTypingIndicator,
  } = useChatSession({
    localVideoElementId: 'local-video',
    remoteVideoElementId: 'remote-video',
  });
  
  // Get devices - now returns stable state values
  const devices = getCurrentDevices();

  /**
   * Check browser compatibility - only run once on mount
   */
  useEffect(() => {
    try {
      // Check if browser is supported
      if (!isBrowserSupported()) {
        showError('Your browser does not support video/audio. Please use Chrome, Firefox, or Safari 11+.', ErrorCode.MEDIA_DEVICE_NOT_FOUND);
        setTimeout(() => router.push('/welcome'), 3000);
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

  // Show loading while checking status or connecting
  if (!name || checkingStatus || connectionState === 'connecting') {
    return <LoadingState state={connectionState} />;
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
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Video Areas - Fill screen on mobile, 55% on desktop */}
        <div className="w-full lg:w-[55%] flex flex-col p-2 gap-2 lg:p-4 lg:gap-4 h-full">
          {/* Stranger Video - Takes 50% height on mobile */}
          <div className="flex-1">
            <VideoDisplay
              id="remote-video"
              label={matchData?.partnerName || "Stranger"}
              isConnected={isMatched}
              isSearching={isSearching}
              showConnectionIndicator={true}
              isCameraOn={isRemoteCameraOn}
              isMicOn={isRemoteMicOn}
            />
          </div>

          {/* Your Video - Takes 50% height on mobile */}
          <div className="flex-1">
            <VideoDisplay
              id="local-video"
              label="Your camera"
              isConnected={isMatched}
              isCameraOn={isCameraOn}
              isMicOn={isMicOn}
              isSearching={false}
              showConnectionIndicator={false}
            >
              {/* Control Buttons */}
              <VideoControls
                isMatched={isMatched}
                isSearching={isSearching}
                isCameraOn={isCameraOn}
                isMicOn={isMicOn}
                currentCameraId={devices.cameraId}
                currentMicId={devices.micId}
                onStart={handleStart}
                onStop={handleStop}
                onNext={handleNext}
                onToggleCamera={toggleCamera}
                onToggleMicrophone={toggleMicrophone}
                onSwitchCamera={switchCamera}
                onSwitchMicrophone={switchMicrophone}
                onLeave={endSession}
              />
            </VideoDisplay>
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
