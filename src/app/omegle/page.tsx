'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useChatSession } from '@/hooks/useChatSession';
import { ChatWindow } from '@/components/omegle/ChatWindow';
import { MobileChat } from '@/components/omegle/MobileChat';
import { VideoControls } from '@/components/omegle/VideoControls';
import { VideoDisplay } from '@/components/omegle/VideoDisplay';
import { LoadingState } from '@/components/omegle/LoadingState';
import { ErrorState } from '@/components/omegle/ErrorState';

export default function OmeglePage() {
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
    messages,
    isPartnerTyping,
    startSearch,
    stopSearch,
    endSession,
    findNext,
    toggleCamera,
    toggleMicrophone,
    sendMessage,
    sendTypingIndicator,
  } = useChatSession({
    localVideoElementId: 'local-video',
    remoteVideoElementId: 'remote-video',
  });

  /**
   * Check user status on mount
   */
  useEffect(() => {
    if (!name) {
      router.push('/welcome');
    } else {
      setCheckingStatus(false);
    }
  }, [name, router]);

  /**
   * Handle start button click
   */
  const handleStart = async () => {
    if (!name || !gender) {
      alert('Please set your name and gender first');
      router.push('/welcome');
      return;
    }

    await startSearch({
      name,
      gender,
      targetGender: undefined,
    });
  };

  /**
   * Handle stop searching
   */
  const handleStop = async () => {
    await stopSearch();
  };

  /**
   * Handle next button (find new partner)
   */
  const handleNext = async () => {
    await findNext();
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
            label={matchData?.partner?.name || 'Stranger'}
            isConnected={isMatched}
            isSearching={isSearching}
            showConnectionIndicator={true}
          />

          {/* Your Video */}
          <VideoDisplay
            id="local-video"
            label="Your camera"
            isConnected={isMatched}
            isSearching={false}
            showConnectionIndicator={false}
          >
            {/* Control Buttons */}
            <VideoControls
              isMatched={isMatched}
              isSearching={isSearching}
              isCameraOn={isCameraOn}
              isMicOn={isMicOn}
              onStart={handleStart}
              onStop={handleStop}
              onNext={handleNext}
              onToggleCamera={toggleCamera}
              onToggleMicrophone={toggleMicrophone}
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
        />

        {/* Mobile Chat */}
        <MobileChat 
          isConnected={isMatched} 
          isStrangerTyping={isPartnerTyping}
          onSendMessage={sendMessage}
          onTyping={handleTyping}
          connectionState={connectionState}
          messages={messages}
        />
      </div>
    </div>
  );
}
