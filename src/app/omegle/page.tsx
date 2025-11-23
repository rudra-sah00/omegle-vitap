'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
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
  
  // Memoize devices to prevent re-renders on every component update
  const devices = useMemo(() => getCurrentDevices(), [getCurrentDevices]);

  /**
   * Check browser compatibility
   * Note: Browser polyfills are already initialized in root layout
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
  }, [router]);

  /**
   * Check user status on mount
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
  const handleStart = async () => {
    try {
      // Validate user data
      if (!name || !gender) {
        showError('Please set your name and gender first', ErrorCode.CONNECTION_LOST);
        router.push('/welcome');
        return;
      }

      // Check if already searching or in session
      if (connectionState === 'waiting' || isInSession) {
        showWarning('Already searching or in a session');
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
  };

  /**
   * Handle stop searching
   */
  const handleStop = async () => {
    try {
      await stopSearch();
    } catch (error) {
      showError('Failed to stop search. Refreshing...', ErrorCode.CONNECTION_LOST);
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  /**
   * Handle next button (find new partner)
   */
  const handleNext = async () => {
    try {
      if (!navigator.onLine) {
        showError('No internet connection. Please check your network.', ErrorCode.CONNECTION_LOST);
        return;
      }
      await findNext();
    } catch (error) {
      showError('Failed to find next partner. Please try again.', ErrorCode.CONNECTION_LOST);
    }
  };

  /**
   * Handle message input typing
   */
  const handleTyping = (isTyping: boolean) => {
    if (isInSession) {
      sendTypingIndicator(isTyping);
    }
  };

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

  const isSearching = connectionState === 'waiting' && !isMatched;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#e8f4f8' }}>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Side - Video Areas */}
        <div className="flex-1 flex flex-col p-4 gap-4">
          {/* Stranger Video */}
          <VideoDisplay
            id="remote-video"
            label={matchData?.partnerName || "Stranger"}
            isConnected={isMatched}
            isSearching={isSearching}
            showConnectionIndicator={true}
            isCameraOn={isRemoteCameraOn}
            isMicOn={isRemoteMicOn}
          />

          {/* Your Video */}
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
