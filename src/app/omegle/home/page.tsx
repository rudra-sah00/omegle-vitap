"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
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
import { useMediaTracks } from "@/hooks/useMediaTracks";
import { userQueueService } from "@/services/userQueueService";
import { analyticsService } from "@/services/analyticsService";
import { getErrorMessage } from "@/utils/errorHandler";
import { Toast } from "@/components/ui";
import { useToast } from "@/hooks/useToast";

export default function HomePage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { toasts, removeToast, error: showError, warning: _warning } = useToast();

  // UI State
  const [showControls, setShowControls] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showPreCallControls, setShowPreCallControls] = useState(true); // Always true when not connected

  // Centralized media tracks management
  const {
    videoTrack: previewVideoTrack,
    audioTrack: previewAudioTrack,
    isCameraOn,
    isMicOn,
    toggleCamera,
    toggleMic,
    ensureTracksForCall,
    cleanupTracks,
    lastError: mediaError,
  } = useMediaTracks();

  // Refs
  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRef = useRef<HTMLDivElement | null>(null);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Agora client only
  useMediaDevices();

  // Matching hook with chat callbacks (initialize first to get userId and channelName)
  const matching = useMatching(
    (_msg: string) => {}, // Temporary system message callback
    () => clearMessages(), // Clear messages callback (will be set after chat hook)
    (errorMsg: string) => {
      // Only show error toast for video connection failures
      showError(errorMsg);
    }
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
  const { messages, partnerTyping, sendMessage, setTypingIndicator, clearMessages } = chat;

  // Video chat hook (pass preview state for track publishing)
  const {
    localVideoTrack,
    remoteUsers,
    isJoined: _isJoined,
    networkQuality,
    isMicOn: connectedMicOn,
    isCameraOn: connectedCameraOn,
    toggleMic: toggleConnectedMic,
    toggleCamera: toggleConnectedCamera,
  } = useVideoChat(userId, channelName, isConnected, isCameraOn, isMicOn, (errorMsg: string) => {
    // Show error toast only for video connection failures
    showError(errorMsg);
    // Optionally disconnect the match if video fails
    if (isConnected) {
      handleStop();
    }
  });

  // Show media errors
  useEffect(() => {
    if (mediaError) {
      showError(mediaError);
    }
  }, [mediaError, showError]);

  // Show controls when connection is established, then auto-hide
  useEffect(() => {
    if (isConnected) {
      setShowControls(true);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    } else {
      // When disconnected, clear chat messages from frontend
      if (messages.length > 0) {
        clearMessages();
      }

      // When disconnected, restore preview tracks if camera/mic were on
      const restorePreviewTracks = async () => {
        try {
          if (isCameraOn && !previewVideoTrack) {
            await toggleCamera();
          }
          if (isMicOn && !previewAudioTrack) {
            await toggleMic();
          }
        } catch (_error) {
          // Error restoring preview tracks
        }
      };
      restorePreviewTracks();
    }
  }, [
    isConnected,
    isCameraOn,
    isMicOn,
    previewVideoTrack,
    previewAudioTrack,
    toggleCamera,
    toggleMic,
    messages.length,
    clearMessages,
  ]);

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

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [userId]);

  // Render local video (either preview or connected)
  useEffect(() => {
    const videoElement = localVideoRef.current;
    if (!videoElement) return;

    // Clear previous content first
    const clearVideo = () => {
      videoElement.innerHTML = "";
    };

    // Only play when we have a track and camera is on
    if (!isConnected && previewVideoTrack && isCameraOn) {
      // Preview mode (idle OR searching) - play the preview track
      clearVideo();
      try {
        previewVideoTrack.play(videoElement);
      } catch {
        // Ignore sync errors
      }
    } else if (isConnected && localVideoTrack && connectedCameraOn) {
      // Connected mode - play the connected track when camera is ON
      clearVideo();
      try {
        localVideoTrack.play(videoElement);
      } catch {
        // Ignore sync errors
      }
    } else {
      // Clear video element when camera is off or no tracks available
      clearVideo();
    }

    // No cleanup - tracks are managed by useMediaTracks hook
  }, [previewVideoTrack, localVideoTrack, isConnected, isSearching, isCameraOn, connectedCameraOn]);

  // Render remote video
  useVideoRenderer(
    remoteVideoRef,
    remoteUsers.length > 0 && remoteUsers[0].videoTrack ? remoteUsers[0].videoTrack : null,
    true
  );

  // Note: We don't cleanup preview tracks when connecting anymore
  // useVideoChat will publish the existing tracks from agoraService

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
      // Cleanup all media tracks
      cleanupTracks();

      // Cleanup timers
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount/unmount

  // Show controls on video click - TOGGLE functionality
  const handleLocalVideoClick = () => {
    if (!isSearching) {
      if (!isConnected) {
        // When not connected, controls always stay visible (don't toggle)
        setShowPreCallControls(true);
      } else {
        // When connected, toggle with auto-hide
        const newShowControls = !showControls;
        setShowControls(newShowControls);

        // Auto-hide after 3 seconds when controls are shown
        if (newShowControls) {
          if (hideControlsTimerRef.current) {
            clearTimeout(hideControlsTimerRef.current);
          }
          hideControlsTimerRef.current = setTimeout(() => {
            setShowControls(false);
          }, 3000);
        }
      }
    }
  };

  // Keyboard shortcuts (ESC to skip)
  useKeyboardShortcuts(isConnected, handleNext);

  // Handlers for preview (before connecting) - use centralized media tracks
  const handlePreviewMicToggle = useCallback(async () => {
    try {
      await toggleMic();
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      showError(message);
    }
  }, [toggleMic, showError]);

  const handlePreviewCameraToggle = useCallback(async () => {
    try {
      await toggleCamera();
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      showError(message);
    }
  }, [toggleCamera, showError]);

  // Handlers for connected state (use videoChat toggles)
  const handleConnectedMicToggle = useCallback(async () => {
    try {
      await toggleConnectedMic();
      // Show controls and reset auto-hide timer
      setShowControls(true);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    } catch (_error) {
      showError("Unable to toggle microphone");
    }
  }, [toggleConnectedMic, showError]);

  const handleConnectedCameraToggle = useCallback(async () => {
    try {
      await toggleConnectedCamera();
      // Show controls and reset auto-hide timer
      setShowControls(true);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    } catch (_error) {
      showError("Unable to toggle camera");
    }
  }, [toggleConnectedCamera, showError]);

  const handleSendMessage = (message: string) => {
    sendMessage(message);
    analyticsService.trackMessageSent();
  };

  const handleTyping = () => {
    setTypingIndicator();
  };

  const handleStartWithPermissions = async () => {
    // Ensure tracks are created and enabled based on current state
    try {
      await ensureTracksForCall();

      // Track analytics - chat started
      analyticsService.trackChatStarted(isCameraOn, isMicOn);

      // Now start searching with current state
      searchForPartner();
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      showError(message);
    }
  };

  return (
    <div
      className={`flex flex-col md:flex-row h-screen overflow-hidden transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
          : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      }`}
    >
      {/* Video panels - full height on mobile, 65% width on desktop */}
      <div
        className={`flex flex-col gap-3 md:gap-4 p-3 md:p-6 w-full md:w-[65%] h-full transition-colors duration-300 ${
          theme === "dark" ? "bg-slate-900/50" : "bg-white/30 backdrop-blur-sm"
        }`}
      >
        {/* Stranger's video */}
        <VideoPanel
          videoRef={remoteVideoRef}
          isRemote={true}
          isConnected={isConnected}
          isSearching={isSearching}
          remoteUsers={remoteUsers}
          hasVideoTrack={!!(remoteUsers.length > 0 && remoteUsers[0].videoTrack)}
        />

        {/* Your video */}
        <VideoPanel
          videoRef={localVideoRef}
          isRemote={false}
          isConnected={isConnected}
          isSearching={isSearching}
          isCameraOn={isConnected ? connectedCameraOn : isCameraOn}
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
              isMicOn={connectedMicOn}
              isCameraOn={connectedCameraOn}
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
      <div
        className={`hidden md:block w-[35%] h-full shadow-xl transition-colors duration-300 ${
          theme === "dark"
            ? "bg-black border-l border-purple-900/50"
            : "bg-white border-l border-purple-200"
        }`}
      >
        <ChatWindow
          messages={messages}
          partnerTyping={partnerTyping}
          partnerOnline={isConnected}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          isConnected={isConnected}
          userId={userId}
          onToggleTheme={toggleTheme}
        />
      </div>

      {/* Mobile Chat Button */}
      <MobileChatButton messageCount={messages.length} onClick={() => setShowMobileChat(true)} />

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
        onToggleTheme={toggleTheme}
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
