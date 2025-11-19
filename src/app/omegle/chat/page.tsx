"use client";

import { useState, useRef, useEffect } from "react";
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

export default function HomePage() {
  const router = useRouter();

  // Check if user has submitted their info
  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) {
      // Redirect to landing page if no user info
      router.push("/omegle");
      return;
    }
  }, [router]);

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
    toggleMic,
    toggleCamera,
    leaveChannel,
  } = useVideoChat(userId, channelName, isConnected, isCameraOn, isMicOn);

  // Render local video (either preview or connected)
  useEffect(() => {
    if (!isConnected && previewVideoTrack && localVideoRef.current) {
      // Show preview before connecting
      previewVideoTrack.play(localVideoRef.current);
      console.log('Playing preview video');
    } else if (isConnected && localVideoTrack && localVideoRef.current) {
      // Show connected video
      localVideoTrack.play(localVideoRef.current);
      console.log('Playing connected video');
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
      console.log('Cleaning up preview tracks...');
      if (previewVideoTrack) {
        previewVideoTrack.close();
        setPreviewVideoTrack(null);
      }
      if (previewAudioTrack) {
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

  // Show controls on video click
  const handleLocalVideoClick = () => {
    if (!isConnected && !isSearching) {
      setShowPreCallControls(true);
    } else if (isConnected) {
      setShowControls(!showControls);
    }
  };

  // Keyboard shortcuts (ESC to skip)
  useKeyboardShortcuts(isConnected, handleNext);

  // Handlers for preview (before connecting)
  const handlePreviewMicToggle = async () => {
    if (!isMicOn) {
      // Turn ON microphone
      try {
        if (!previewAudioTrack) {
          // Create new audio track
          const tracks = await agoraService.createLocalTracks(false, true);
          if (tracks.audioTrack) {
            setPreviewAudioTrack(tracks.audioTrack);
            console.log('Microphone enabled');
          }
        } else {
          // Re-enable existing track
          await previewAudioTrack.setEnabled(true);
          console.log('Microphone re-enabled');
        }
        setIsMicOn(true);
      } catch (error: any) {
        console.error('Failed to enable microphone:', error);
        if (error?.code === 'PERMISSION_DENIED' || error?.name === 'NotAllowedError') {
          alert('Please allow microphone access');
        }
      }
    } else {
      // Turn OFF microphone
      if (previewAudioTrack) {
        await previewAudioTrack.setEnabled(false);
        console.log('Microphone disabled');
      }
      setIsMicOn(false);
    }
  };

  const handlePreviewCameraToggle = async () => {
    if (!isCameraOn) {
      // Turn ON camera
      try {
        if (!previewVideoTrack) {
          // Create new video track
          const tracks = await agoraService.createLocalTracks(true, false);
          if (tracks.videoTrack) {
            setPreviewVideoTrack(tracks.videoTrack);
            console.log('Camera enabled');
          }
        } else {
          // Re-enable existing track
          await previewVideoTrack.setEnabled(true);
          console.log('Camera re-enabled');
        }
        setIsCameraOn(true);
      } catch (error: any) {
        console.error('Failed to enable camera:', error);
        if (error?.code === 'PERMISSION_DENIED' || error?.name === 'NotAllowedError') {
          alert('Please allow camera access');
        }
      }
    } else {
      // Turn OFF camera
      if (previewVideoTrack) {
        await previewVideoTrack.setEnabled(false);
        console.log('Camera disabled');
      }
      setIsCameraOn(false);
    }
  };

  // Handlers for connected state (use videoChat toggles and sync state)
  const handleConnectedMicToggle = async () => {
    await toggleMic();
    // Sync state from useVideoChat
    setIsMicOn(prev => !prev);
  };

  const handleConnectedCameraToggle = async () => {
    await toggleCamera();
    // Sync state from useVideoChat
    setIsCameraOn(prev => !prev);
  };

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
      console.error('Failed to get permissions:', error);
      if (error?.code === 'PERMISSION_DENIED' || error?.name === 'NotAllowedError') {
        alert('Please allow camera and microphone access to start chatting.');
      } else {
        alert('Failed to access camera/microphone. Please check your devices.');
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
          {/* Pre-call controls (camera/mic above Start button) */}
          {!isConnected && showPreCallControls && (
            <PreCallControls
              isMicOn={isMicOn}
              isCameraOn={isCameraOn}
              onMicToggle={handlePreviewMicToggle}
              onCameraToggle={handlePreviewCameraToggle}
              onStart={handleStartWithPermissions}
              onStop={handleStop}
              isSearching={isSearching}
            />
          )}

          {/* Start button - always visible when not connected/searching */}
          {!isConnected && !isSearching && !showPreCallControls && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStartWithPermissions();
              }}
              className="absolute bottom-6 left-1/2 transform -translate-x-1/2 px-12 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg text-lg z-10"
            >
              Start
            </button>
          )}

          {/* Stop searching button */}
          {isSearching && !showPreCallControls && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStop();
              }}
              className="absolute bottom-6 left-1/2 transform -translate-x-1/2 px-8 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-lg z-10"
            >
              Stop Searching
            </button>
          )}

          {/* In-call controls - always visible during connection */}
          {isConnected && (
            <VideoControls
              isMicOn={isMicOn}
              isCameraOn={isCameraOn}
              networkQuality={networkQuality}
              onMicToggle={handleConnectedMicToggle}
              onCameraToggle={handleConnectedCameraToggle}
              onNext={handleNext}
              onStop={handleStop}
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
    </div>
  );
}
