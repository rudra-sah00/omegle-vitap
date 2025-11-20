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

  // Validate user info on mount - redirect to form if incomplete
  useEffect(() => {
    try {
      const userInfoStr = localStorage.getItem("userInfo");
      if (!userInfoStr) {
        router.push("/omegle");
        return;
      }
      const userInfo = JSON.parse(userInfoStr);
      if (!userInfo.name || userInfo.name.trim() === "" || !userInfo.year || !userInfo.gender) {
        // Invalid userInfo, redirect to form
        localStorage.removeItem("userInfo");
        router.push("/omegle");
      }
    } catch (_error) {
      // Invalid JSON, redirect to form
      localStorage.removeItem("userInfo");
      router.push("/omegle");
    }
  }, [router]);

  // UI State
  const [showControls, setShowControls] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showPreCallControls, setShowPreCallControls] = useState(true); // Always true when not connected

  // Device management state
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState<string>("");

  // Centralized media tracks management
  const {
    videoTrack: previewVideoTrack,
    audioTrack: _previewAudioTrack,
    isCameraOn,
    isMicOn,
    toggleCamera,
    toggleMic,
    ensureTracksForCall,
    cleanupTracks,
    switchCamera,
    switchMicrophone,
    lastError: mediaError,
    clearError: clearMediaError,
  } = useMediaTracks();

  // Refs
  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRef = useRef<HTMLDivElement | null>(null);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Agora client only
  useMediaDevices();

  // Enumerate available devices
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const { agoraService } = await import("@/services/agoraService");
        const [cams, mics] = await Promise.all([
          agoraService.getCameras(),
          agoraService.getMicrophones(),
        ]);
        setCameras(cams);
        setMicrophones(mics);

        // Set default devices
        if (cams.length > 0 && !selectedCameraId) {
          setSelectedCameraId(cams[0].deviceId);
        }
        if (mics.length > 0 && !selectedMicrophoneId) {
          setSelectedMicrophoneId(mics[0].deviceId);
        }
      } catch (_error) {
        // Failed to enumerate devices
      }
    };

    // Load devices after a short delay to ensure permissions might be granted
    const timer = setTimeout(loadDevices, 500);
    return () => clearTimeout(timer);
  }, [selectedCameraId, selectedMicrophoneId]);

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
  } = useVideoChat(
    userId,
    channelName,
    isConnected,
    isCameraOn,
    isMicOn,
    (errorMsg: string) => {
      // Show error but don't disconnect - allow text-only chat
      showError(errorMsg);
    },
    () => {
      // Partner left the Agora channel (browser closed/reloaded)
      // Trigger proper disconnect flow
      if (isConnected) {
        handleStop();
      }
    }
  );

  // Show media errors (only once per error)
  const lastShownErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (mediaError && mediaError !== lastShownErrorRef.current) {
      showError(mediaError);
      lastShownErrorRef.current = mediaError;

      // Clear the error after showing it to prevent loops
      // Use a timeout to ensure the toast is created first
      const clearTimer = setTimeout(() => {
        clearMediaError();
      }, 100);

      return () => clearTimeout(clearTimer);
    }
  }, [mediaError, showError, clearMediaError]);

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

      // When disconnected, ensure preview tracks are restored for preview mode
      // This runs after leaveChannel has been called which re-enables tracks
      const restorePreviewTracks = async () => {
        try {
          // Get the latest tracks from agoraService (they were restored by leaveChannel)
          const { agoraService: agora } = await import("@/services/agoraService");
          const currentTracks = agora.getLocalTracks();

          // If camera should be on and track exists, ensure it's playing in preview
          if (isCameraOn && currentTracks.videoTrack) {
            // CRITICAL: Stop and restart the track to clear dual-stream mode
            await currentTracks.videoTrack.setEnabled(false);
            await new Promise((resolve) => setTimeout(resolve, 100));
            await currentTracks.videoTrack.setEnabled(true);

            // CRITICAL FIX: Force replay in the video element to fix blank screen
            if (localVideoRef.current) {
              localVideoRef.current.innerHTML = "";
              localVideoRef.current.removeAttribute("data-track-id");
              try {
                currentTracks.videoTrack.play(localVideoRef.current);
              } catch (_playError) {
                // Ignore play errors
              }
            }
          }

          // If mic should be on and track exists, ensure it's enabled
          if (isMicOn && currentTracks.audioTrack) {
            await currentTracks.audioTrack.setEnabled(true);
          }
        } catch (_error) {
          // Error restoring preview tracks - safe to ignore
        }
      };

      // Delay restoration to ensure cleanup is complete
      setTimeout(() => {
        restorePreviewTracks();
      }, 400);
    }
  }, [isConnected, isCameraOn, isMicOn, messages.length, clearMessages]);

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

    // Determine which track to show
    let trackToShow: typeof previewVideoTrack | typeof localVideoTrack = null;
    let shouldShow = false;

    if (!isConnected) {
      // Preview mode - show preview track if camera is on
      trackToShow = previewVideoTrack;
      shouldShow = isCameraOn && !!previewVideoTrack;
    } else {
      // Connected mode - show connected track if camera is on
      trackToShow = localVideoTrack;
      shouldShow = connectedCameraOn && !!localVideoTrack;
    }

    if (shouldShow && trackToShow) {
      // Only clear and replay if the track actually changed
      const currentTrackId = videoElement.getAttribute("data-track-id");
      const newTrackId = (trackToShow as { _ID?: string })._ID || "";

      if (currentTrackId !== newTrackId) {
        clearVideo();
        videoElement.setAttribute("data-track-id", newTrackId);
        try {
          trackToShow.play(videoElement);
        } catch {
          // Ignore sync errors
        }
      } else if (currentTrackId === newTrackId && videoElement.innerHTML === "") {
        // Track ID matches but video element is empty - replay it
        try {
          trackToShow.play(videoElement);
        } catch {
          // Ignore sync errors
        }
      }
    } else if (!shouldShow) {
      // Clear video if camera is off OR if we just disconnected (force re-render)
      if (!isCameraOn || (!isConnected && !previewVideoTrack)) {
        clearVideo();
        videoElement.removeAttribute("data-track-id");
      }
    }

    // Cleanup function to handle transition from connected to preview mode
    return () => {
      // When transitioning from connected to disconnected, clear track ID to force re-render
      if (videoElement) {
        const currentId = videoElement.getAttribute("data-track-id");
        // Only clear if we have a track ID (prevents unnecessary clears)
        if (currentId) {
          videoElement.removeAttribute("data-track-id");
        }
      }
    };
  }, [previewVideoTrack, localVideoTrack, isConnected, isSearching, isCameraOn, connectedCameraOn]);

  // Render remote video
  useVideoRenderer(
    remoteVideoRef,
    remoteUsers.length > 0 && remoteUsers[0].videoTrack ? remoteUsers[0].videoTrack : null,
    true
  );

  // Note: We don't cleanup preview tracks when connecting anymore
  // useVideoChat will publish the existing tracks from agoraService

  // Keep pre-call controls always visible when not connected
  useEffect(() => {
    if (!isConnected && !isSearching) {
      // Always show pre-call controls when not connected
      setShowPreCallControls(true);
    }
  }, [isConnected, isSearching]);

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
      if (isConnected) {
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
      // When not connected, controls are always visible - no action needed
    }
  };

  // Keyboard shortcuts (ESC to skip)
  useKeyboardShortcuts(isConnected, handleNext);

  // Handlers for preview (before connecting) - use centralized media tracks
  const handlePreviewMicToggle = useCallback(async () => {
    try {
      await toggleMic();
      // Reload devices after toggling
      const { agoraService } = await import("@/services/agoraService");
      const mics = await agoraService.getMicrophones();
      setMicrophones(mics);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      showError(message);
    }
  }, [toggleMic, showError]);

  const handlePreviewCameraToggle = useCallback(async () => {
    try {
      await toggleCamera();
      // Reload devices after toggling
      const { agoraService } = await import("@/services/agoraService");
      const cams = await agoraService.getCameras();
      setCameras(cams);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      showError(message);
    }
  }, [toggleCamera, showError]);

  // Device selection handlers
  const handleSelectCamera = useCallback(
    async (deviceId: string) => {
      try {
        await switchCamera(deviceId);
        setSelectedCameraId(deviceId);
      } catch (error: unknown) {
        const message = getErrorMessage(error);
        showError(message);
      }
    },
    [switchCamera, showError]
  );

  const handleSelectMicrophone = useCallback(
    async (deviceId: string) => {
      try {
        await switchMicrophone(deviceId);
        setSelectedMicrophoneId(deviceId);
      } catch (error: unknown) {
        const message = getErrorMessage(error);
        showError(message);
      }
    },
    [switchMicrophone, showError]
  );

  // Handlers for connected state (use videoChat toggles which manage agoraService tracks)
  const handleConnectedMicToggle = useCallback(async () => {
    try {
      // Only use the videoChat toggle - it manages the centralized track
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
      // Only use the videoChat toggle - it manages the centralized track
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
              cameras={cameras}
              microphones={microphones}
              selectedCameraId={selectedCameraId}
              selectedMicrophoneId={selectedMicrophoneId}
              onSelectCamera={handleSelectCamera}
              onSelectMicrophone={handleSelectMicrophone}
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
              cameras={cameras}
              microphones={microphones}
              selectedCameraId={selectedCameraId}
              selectedMicrophoneId={selectedMicrophoneId}
              onSelectCamera={handleSelectCamera}
              onSelectMicrophone={handleSelectMicrophone}
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
