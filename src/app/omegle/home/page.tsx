"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ChatWindow from "./_components/ChatWindow";
import VideoPanel from "./_components/VideoPanel";
import VideoControls from "./_components/VideoControls";
import PreCallControls from "./_components/PreCallControls";
import MobileChat from "./_components/MobileChat";
import MobileChatButton from "./_components/MobileChatButton";
import { useChat } from "@/hooks/useChat";
import { useVideoChat } from "@/hooks/useVideoChat";
import { useMatching } from "@/hooks/useMatching";
import { useKeyboardShortcuts, useVideoRenderer } from "@/hooks/useUIHelpers";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { agoraService } from "@/services/agoraService";
import { userQueueService } from "@/services/userQueueService";
import { Toast } from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/utils/errorHandler";

export default function HomePage() {
  const router = useRouter();
  const { toasts, removeToast, error: showError, warning } = useToast();

  // UI State
  const [isMicOn, setIsMicOn] = useState(false); // Start disabled
  const [isCameraOn, setIsCameraOn] = useState(false); // Start disabled
  const [showControls, setShowControls] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showPreCallControls, setShowPreCallControls] = useState(true);
  
  // Preview tracks (before connecting)
  const [previewVideoTrack, setPreviewVideoTrack] = useState<any>(null);
  const [previewAudioTrack, setPreviewAudioTrack] = useState<any>(null);
  
  // Refs
  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRef = useRef<HTMLDivElement | null>(null);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Agora client only
  useMediaDevices();

  // Matching hook with chat callbacks (initialize first to get userId and channelName)
  const matching = useMatching(
    (msg: string) => {}, // Temporary, will be replaced
    () => {} // Temporary, will be replaced
  );
  const {
    userId,
    channelName,
    isSearching,
    isConnected,
    searchForPartner,
    handleNext,
    handleStop,
  } = matching;

  // Chat hook with actual userId and channelName from matching
  const chat = useChat(userId, channelName);
  const {
    messages,
    partnerTyping,
    sendMessage,
    sendSystemMessage,
    setTypingIndicator,
    clearMessages,
  } = chat;

  // Video chat hook (pass preview state for track publishing)
  const {
    localVideoTrack,
    remoteUsers,
    isJoined,
    networkQuality,
    isMicOn: connectedMicOn,
    isCameraOn: connectedCameraOn,
    toggleMic,
    toggleCamera,
    leaveChannel,
  } = useVideoChat(userId, channelName, isConnected, isCameraOn, isMicOn);

  // Sync preview state with connected state when connected
  useEffect(() => {
    if (isConnected && isJoined) {
      setIsMicOn(connectedMicOn);
      setIsCameraOn(connectedCameraOn);
    }
  }, [isConnected, isJoined, connectedMicOn, connectedCameraOn]);

  // Check if user has submitted their info
  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) {
      // Redirect to landing page if no user info
      router.push("/omegle");
      return;
    }
  }, [router]);

  // Cleanup on tab close or page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (userId) {
        // Use navigator.sendBeacon for reliable cleanup on page unload
        userQueueService.removeFromQueue(userId).catch(() => {});
        userQueueService.cleanup(userId).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userId]);

  // Render local video (either preview or connected)
  useEffect(() => {
    const videoElement = localVideoRef.current;
    if (!videoElement) return;

    if (!isConnected && previewVideoTrack) {
      // Show preview before connecting
      previewVideoTrack.play(videoElement);
      return () => {
        previewVideoTrack.stop();
      };
    } else if (isConnected && localVideoTrack) {
      // Show connected video
      localVideoTrack.play(videoElement);
      return () => {
        localVideoTrack.stop();
      };
    }
  }, [previewVideoTrack, localVideoTrack, isConnected]);

  // Render remote video
  useVideoRenderer(
    remoteVideoRef, 
    remoteUsers.length > 0 && remoteUsers[0].videoTrack ? remoteUsers[0].videoTrack : null,
    true
  );

  // Cleanup preview tracks when connecting
  useEffect(() => {
    if (isConnected && (previewVideoTrack || previewAudioTrack)) {
      if (previewVideoTrack) {
        previewVideoTrack.stop();
        previewVideoTrack.close();
        setPreviewVideoTrack(null);
      }
      if (previewAudioTrack) {
        previewAudioTrack.stop();
        previewAudioTrack.close();
        setPreviewAudioTrack(null);
      }
    }
  }, [isConnected, previewVideoTrack, previewAudioTrack]);

  // Auto-hide pre-call controls after 3 seconds
  useEffect(() => {
    if (!isConnected && !isSearching && showPreCallControls) {
      // Clear existing timer
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
      
      // Set new timer to hide controls after 3 seconds
      hideControlsTimerRef.current = setTimeout(() => {
        setShowPreCallControls(false);
      }, 3000);

      return () => {
        if (hideControlsTimerRef.current) {
          clearTimeout(hideControlsTimerRef.current);
        }
      };
    }
  }, [isConnected, isSearching, showPreCallControls]);

  // Comprehensive cleanup on unmount or route change
  useEffect(() => {
    return () => {
      // Cleanup preview tracks
      if (previewVideoTrack) {
        previewVideoTrack.stop();
        previewVideoTrack.close();
      }
      if (previewAudioTrack) {
        previewAudioTrack.stop();
        previewAudioTrack.close();
      }
      
      // Cleanup timers
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [previewVideoTrack, previewAudioTrack]);

  // Show controls on video click - TOGGLE functionality
  const handleLocalVideoClick = () => {
    if (!isSearching) {
      if (!isConnected) {
        setShowPreCallControls(prev => !prev);
      } else {
        setShowControls(prev => !prev);
      }
    }
  };

  // Keyboard shortcuts (ESC to skip)
  useKeyboardShortcuts(isConnected, handleNext);

  // Handlers for preview (before connecting)
  const handlePreviewMicToggle = useCallback(async () => {
    try {
      if (!isMicOn) {
        // Turn ON microphone
        if (!previewAudioTrack) {
          // Create new audio track
          const tracks = await agoraService.createLocalTracks(false, true);
          if (tracks.audioTrack) {
            setPreviewAudioTrack(tracks.audioTrack);
            setIsMicOn(true);
          }
        } else {
          // Re-enable existing track
          await previewAudioTrack.setEnabled(true);
          setIsMicOn(true);
        }
      } else {
        // Turn OFF microphone
        if (previewAudioTrack) {
          await previewAudioTrack.setEnabled(false);
        }
        setIsMicOn(false);
      }
    } catch (error: any) {
      const message = getErrorMessage(error);
      if (error?.code === 'PERMISSION_DENIED' || error?.name === 'NotAllowedError') {
        warning(message);
      } else {
        showError(message);
      }
    }
  }, [isMicOn, previewAudioTrack, warning, showError]);

  const handlePreviewCameraToggle = useCallback(async () => {
    try {
      if (!isCameraOn) {
        // Turn ON camera
        if (!previewVideoTrack) {
          // Create new video track
          const tracks = await agoraService.createLocalTracks(true, false);
          if (tracks.videoTrack) {
            setPreviewVideoTrack(tracks.videoTrack);
            setIsCameraOn(true);
          }
        } else {
          // Re-enable existing track
          await previewVideoTrack.setEnabled(true);
          setIsCameraOn(true);
        }
      } else {
        // Turn OFF camera
        if (previewVideoTrack) {
          await previewVideoTrack.setEnabled(false);
        }
        setIsCameraOn(false);
      }
    } catch (error: any) {
      const message = getErrorMessage(error);
      if (error?.code === 'PERMISSION_DENIED' || error?.name === 'NotAllowedError') {
        warning(message);
      } else {
        showError(message);
      }
    }
  }, [isCameraOn, previewVideoTrack, warning, showError]);

  // Handlers for connected state (use videoChat toggles)
  const handleConnectedMicToggle = useCallback(async () => {
    try {
      await toggleMic();
      // State is automatically updated in useVideoChat hook
    } catch (error) {
      showError('Unable to toggle microphone');
    }
  }, [toggleMic, showError]);

  const handleConnectedCameraToggle = useCallback(async () => {
    try {
      await toggleCamera();
      // State is automatically updated in useVideoChat hook
    } catch (error) {
      showError('Unable to toggle camera');
    }
  }, [toggleCamera, showError]);

  const handleSendMessage = (message: string) => {
    sendMessage(message);
  };

  const handleTyping = () => {
    setTypingIndicator();
  };

  const handleStartWithPermissions = async () => {
    // Start searching with current camera/mic state (don't force them on)
    try {
      // Only create tracks if user has them enabled
      if (isCameraOn && !previewVideoTrack) {
        const videoTracks = await agoraService.createLocalTracks(true, false);
        if (videoTracks.videoTrack) {
          setPreviewVideoTrack(videoTracks.videoTrack);
        }
      }
      
      if (isMicOn && !previewAudioTrack) {
        const audioTracks = await agoraService.createLocalTracks(false, true);
        if (audioTracks.audioTrack) {
          setPreviewAudioTrack(audioTracks.audioTrack);
        }
      }
      
      // Now start searching with current state
      searchForPartner();
    } catch (error: any) {
      const message = getErrorMessage(error);
      if (error?.code === 'PERMISSION_DENIED' || error?.name === 'NotAllowedError') {
        warning(message);
      } else {
        showError(message);
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white overflow-hidden">
      {/* Video panels - full height on mobile, 65% width on desktop */}
      <div className="flex flex-col gap-2 md:gap-4 p-2 md:p-4 w-full md:w-[65%] h-full">
        {/* Stranger's video */}
        <VideoPanel
          videoRef={remoteVideoRef}
          isRemote={true}
          isConnected={isConnected}
          isSearching={isSearching}
          remoteUsers={remoteUsers}
        />
        
        {/* Your video */}
        <VideoPanel
          videoRef={localVideoRef}
          isRemote={false}
          isConnected={isConnected}
          isSearching={isSearching}
          isCameraOn={isCameraOn}
          hasVideoTrack={!!(previewVideoTrack || localVideoTrack)}
          onToggleControls={handleLocalVideoClick}
        >
          {/* Pre-call controls - show before connecting */}
          {!isConnected && !isSearching && (
            <PreCallControls
              isMicOn={isMicOn}
              isCameraOn={isCameraOn}
              onMicToggle={handlePreviewMicToggle}
              onCameraToggle={handlePreviewCameraToggle}
              onStart={handleStartWithPermissions}
              onStop={handleStop}
              isSearching={false}
              showControls={showPreCallControls}
            />
          )}

          {/* Searching controls */}
          {isSearching && (
            <PreCallControls
              isMicOn={isMicOn}
              isCameraOn={isCameraOn}
              onMicToggle={handlePreviewMicToggle}
              onCameraToggle={handlePreviewCameraToggle}
              onStart={handleStartWithPermissions}
              onStop={handleStop}
              isSearching={true}
              showControls={showPreCallControls}
            />
          )}

          {/* In-call controls - show during connection */}
          {isConnected && (
            <VideoControls
              isMicOn={isMicOn}
              isCameraOn={isCameraOn}
              networkQuality={networkQuality}
              onMicToggle={handleConnectedMicToggle}
              onCameraToggle={handleConnectedCameraToggle}
              onNext={handleNext}
              onStop={handleStop}
              showControls={showControls}
            />
          )}
        </VideoPanel>
      </div>

      {/* Desktop Chat - Hidden on mobile, 35% width on desktop */}
      <div className="hidden md:block w-[35%] border-l border-gray-200 h-full">
        <ChatWindow 
          messages={messages}
          partnerTyping={partnerTyping}
          partnerOnline={isConnected}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          isConnected={isConnected}
          userId={userId}
        />
      </div>

      {/* Mobile Chat Button */}
      <MobileChatButton
        messageCount={messages.length}
        onClick={() => setShowMobileChat(true)}
      />

      {/* Mobile Chat Popup */}
      <MobileChat
        messages={messages}
        partnerTyping={partnerTyping}
        isConnected={isConnected}
        showMobileChat={showMobileChat}
        onClose={() => setShowMobileChat(false)}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        userId={userId}
      />

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
