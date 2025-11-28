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
  RemoteScreenShareOverlay,
  LocalScreenShareView,
} from '@/components/omegle';
import { showError, showWarning, ErrorCode } from '@/lib';
import { isBrowserSupported } from '@/lib/browser-polyfill';
import { analytics } from '@/services/firebase';
import type { MatchDataMatched } from '@/types/matchmaking';

/**
 * OmeglePageContent - Main video chat experience
 */
function OmeglePageContent() {
  const { name, gender } = useUser();
  const router = useRouter();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [showMatchConfetti, setShowMatchConfetti] = useState(false);

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

  const devices = getCurrentDevices();

  const partnerGender = useMemo(() => {
    if (matchData && 'partnerGender' in matchData) {
      return (matchData as MatchDataMatched).partnerGender;
    }
    return undefined;
  }, [matchData]);

  const isSearching = useMemo(
    () => connectionState === 'waiting' && !isMatched,
    [connectionState, isMatched]
  );

  // Show confetti when matched
  useEffect(() => {
    setShowMatchConfetti(isMatched);
  }, [isMatched]);

  // Re-attach local video when screen sharing mode changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isCameraOn) reattachLocalVideo('local-video');
    }, 150);
    return () => clearTimeout(timer);
  }, [isScreenSharing, isCameraOn, reattachLocalVideo]);

  // Browser compatibility check
  useEffect(() => {
    if (!isBrowserSupported()) {
      showError('Your browser does not support video/audio. Please use Chrome, Firefox, or Safari 11+.', ErrorCode.MEDIA_DEVICE_NOT_FOUND);
      setTimeout(() => router.push('/welcome'), REDIRECT_DELAY);
    }
  }, [router]);

  // Redirect if no name
  useEffect(() => {
    if (!name) {
      router.push('/welcome');
    } else {
      setCheckingStatus(false);
    }
  }, [name, router]);

  // Network status monitoring
  useEffect(() => {
    const handleOffline = () => {
      showError('Lost internet connection. Please check your network.', ErrorCode.CONNECTION_LOST);
      if (isInSession) endSession();
    };
    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, [isInSession, endSession]);

  // Prevent accidental page close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isInSession) {
        e.preventDefault();
        e.returnValue = 'You are in an active chat. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isInSession]);

  const handleStart = useCallback(async () => {
    if (!name || !gender) {
      showError('Please set your name and gender first', ErrorCode.CONNECTION_LOST);
      router.push('/welcome');
      return;
    }
    if (isInSession) {
      showWarning('Already in an active chat session');
      return;
    }
    if (!navigator.onLine) {
      showError('No internet connection. Please check your network.', ErrorCode.CONNECTION_LOST);
      return;
    }
    analytics.trackMatchStart({ camera: isCameraOn, microphone: isMicOn });
    await startSearch({ name, gender, targetGender: undefined });
  }, [name, gender, isInSession, isCameraOn, isMicOn, startSearch, router]);

  const handleStop = useCallback(async () => {
    analytics.trackMatchEnded('user_stop');
    await stopSearch();
  }, [stopSearch]);

  const handleNext = useCallback(async () => {
    if (!navigator.onLine) {
      showError('No internet connection. Please check your network.', ErrorCode.CONNECTION_LOST);
      return;
    }
    analytics.trackMatchEnded('user_skip');
    await findNext();
  }, [findNext]);

  const handleTyping = useCallback((isTyping: boolean) => {
    if (isInSession) sendTypingIndicator(isTyping);
  }, [isInSession, sendTypingIndicator]);

  if (!name || checkingStatus) {
    return <LoadingState state="loading" />;
  }

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
    <div className="h-screen flex bg-page-bg">
      {/* Match Confetti Overlay */}
      <MatchConfetti isActive={showMatchConfetti} />
      
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
              <RemoteScreenShareOverlay
                partnerName={matchData?.partnerName}
                isRemoteCameraOn={isRemoteCameraOn}
              />
            )}
          </div>

          {/* Your Video - Takes 50% height on mobile */}
          <div className="flex-1 relative">
            {isScreenSharing ? (
              <LocalScreenShareView
                isCameraOn={isCameraOn}
                isMicOn={isMicOn}
                isMatched={isMatched}
                isSearching={isSearching}
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
          isStrangerTyping={isPartnerTyping ?? false}
          onSendMessage={sendMessage}
          onTyping={handleTyping}
          connectionState={connectionState}
          messages={messages}
          partnerName={matchData?.partnerName}
        />

        {/* Mobile Chat */}
        <MobileChat 
          isConnected={isMatched} 
          isStrangerTyping={isPartnerTyping ?? false}
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

/**
 * OmeglePage - Entry point wrapped with error boundary
 */
export default function OmeglePage() {
  return (
    <OmegleErrorBoundary>
      <OmeglePageContent />
    </OmegleErrorBoundary>
  );
}
