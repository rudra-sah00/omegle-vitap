"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { agoraService } from "@/services/agoraService";
import { requestToken } from "@/services/agoraTokenService";
import { analyticsService } from "@/services/analyticsService";
import type {
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
  IAgoraRTCClient,
} from "agora-rtc-sdk-ng";

// Dynamic import for AgoraRTC
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let AgoraRTC: any = null;
if (typeof window !== "undefined") {
  import("agora-rtc-sdk-ng").then((module) => {
    AgoraRTC = module.default;
  });
}

/**
 * Hook for managing video chat sessions with Agora RTC
 * @param userId - Current user's ID
 * @param channelName - Agora channel name
 * @param enabled - Whether video chat is enabled
 * @param shouldPublishVideo - Whether to publish video track
 * @param shouldPublishAudio - Whether to publish audio track
 * @param onError - Optional error callback
 * @returns Video chat state and control functions
 */
export function useVideoChat(
  userId: string,
  channelName: string,
  enabled: boolean,
  shouldPublishVideo: boolean = true,
  shouldPublishAudio: boolean = true,
  onError?: (message: string) => void
) {
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [networkQuality, setNetworkQuality] = useState<"excellent" | "good" | "poor" | "bad">(
    "good"
  );

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const isJoiningRef = useRef(false);

  // Initialize and join channel
  const joinChannel = useCallback(async () => {
    if (!userId || !channelName || !enabled || isJoiningRef.current || isJoined) return;

    isJoiningRef.current = true;

    try {
      // Create client if not exists
      if (!clientRef.current) {
        clientRef.current = await agoraService.initClient("rtc");

        // Setup event listeners
        clientRef.current.on(
          "user-published",
          async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
            if (clientRef.current) {
              await clientRef.current.subscribe(user, mediaType);
              setRemoteUsers((prev) => {
                const exists = prev.find((u) => u.uid === user.uid);
                if (exists) return prev;
                return [...prev, user];
              });
            }
          }
        );

        clientRef.current.on("user-unpublished", (user: IAgoraRTCRemoteUser) => {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        });

        clientRef.current.on("user-left", (user: IAgoraRTCRemoteUser) => {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        });

        // Network quality monitoring
        clientRef.current.on(
          "network-quality",
          (quality: { uplinkNetworkQuality: number; downlinkNetworkQuality: number }) => {
            // quality.uplinkNetworkQuality: 0-6 (0=unknown, 1=excellent, 2=good, 3=poor, 4=bad, 5=vbad, 6=down)
            let networkQualityValue: "excellent" | "good" | "poor" | "bad";
            if (quality.uplinkNetworkQuality <= 1) {
              networkQualityValue = "excellent";
            } else if (quality.uplinkNetworkQuality === 2) {
              networkQualityValue = "good";
            } else if (quality.uplinkNetworkQuality === 3) {
              networkQualityValue = "poor";
            } else {
              networkQualityValue = "bad";
            }
            setNetworkQuality(networkQualityValue);
            analyticsService.trackNetworkQuality(networkQualityValue);
          }
        );
      }

      // Get RTC token
      const uid = Math.floor(Math.random() * 100000) + 1; // Range: 1-100000 (never 0)
      let token: string;

      try {
        token = await requestToken(channelName, uid);
      } catch (_tokenError) {
        isJoiningRef.current = false;
        // Rethrow with clear error message
        throw new Error("Unable to connect to video service. Please try again.");
      }

      // Validate token before joining
      if (!token || token.trim() === "") {
        isJoiningRef.current = false;
        throw new Error("Unable to connect to video service. Please try again.");
      }

      // Join channel
      try {
        await agoraService.joinChannel(channelName, token, uid);
      } catch (_joinError) {
        isJoiningRef.current = false;
        throw new Error("Unable to join video call. Please try again.");
      }

      // Create and publish local tracks based on preview state
      const tracks = await agoraService.createLocalTracks(shouldPublishVideo, shouldPublishAudio);

      if (shouldPublishVideo && tracks.videoTrack) {
        setLocalVideoTrack(tracks.videoTrack);
        setIsCameraOn(true);
      } else {
        setIsCameraOn(false);
      }

      if (shouldPublishAudio && tracks.audioTrack) {
        setLocalAudioTrack(tracks.audioTrack);
        setIsMicOn(true);
      } else {
        setIsMicOn(false);
      }

      await agoraService.publishTracks();

      // Enable dual stream for adaptive quality
      if (shouldPublishVideo) {
        await agoraService.enableDualStream();
      }

      setIsJoined(true);
    } catch (_error) {
      isJoiningRef.current = false;

      // Track connection error
      if (_error instanceof Error) {
        analyticsService.trackConnectionError(
          "video_chat_join",
          _error.message,
          (_error as Error & { code?: string })?.code
        );
      }

      // Cleanup any created tracks on error
      if (localVideoTrack) {
        localVideoTrack.close();
        setLocalVideoTrack(null);
      }
      if (localAudioTrack) {
        localAudioTrack.close();
        setLocalAudioTrack(null);
      }
      // Call error callback if provided
      if (onError && _error instanceof Error) {
        onError(_error.message);
      }
      // Rethrow error to be handled by caller
      throw _error;
    } finally {
      isJoiningRef.current = false;
    }
  }, [
    userId,
    channelName,
    enabled,
    isJoined,
    shouldPublishVideo,
    shouldPublishAudio,
    onError,
    localVideoTrack,
    localAudioTrack,
  ]);

  // Leave channel
  const leaveChannel = useCallback(async () => {
    // Prevent multiple simultaneous leave calls
    if (!isJoined && !isJoiningRef.current) {
      return;
    }

    try {
      // Immediately mark as not joined to prevent race conditions
      setIsJoined(false);
      isJoiningRef.current = false;

      // Stop and close local tracks
      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
        setLocalVideoTrack(null);
      }
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        setLocalAudioTrack(null);
      }

      // Clear remote users immediately
      setRemoteUsers([]);

      // Leave Agora channel
      if (clientRef.current) {
        await agoraService.leaveChannel();
      }
    } catch (_error) {
      // Ensure state is reset even on error
      setIsJoined(false);
      isJoiningRef.current = false;
      setRemoteUsers([]);
    }
  }, [localVideoTrack, localAudioTrack, isJoined]);

  // Toggle microphone
  const toggleMic = useCallback(async () => {
    if (!localAudioTrack) {
      // Create audio track if it doesn't exist
      try {
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        setLocalAudioTrack(audioTrack);
        setIsMicOn(true);
        // Publish the new track
        if (isJoined && clientRef.current) {
          await clientRef.current.publish([audioTrack]);
        }
      } catch (_error) {
        throw _error;
      }
    } else {
      // Toggle existing track
      const newState = !isMicOn;
      await localAudioTrack.setEnabled(newState);
      setIsMicOn(newState);
    }
  }, [localAudioTrack, isMicOn, isJoined]);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (!localVideoTrack) {
      // Create video track if it doesn't exist
      try {
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        setLocalVideoTrack(videoTrack);
        setIsCameraOn(true);
        // Publish the new track
        if (isJoined && clientRef.current) {
          await clientRef.current.publish([videoTrack]);
        }
      } catch (_error) {
        throw _error;
      }
    } else {
      // Toggle existing track
      const newState = !isCameraOn;
      await localVideoTrack.setEnabled(newState);
      setIsCameraOn(newState);
    }
  }, [localVideoTrack, isCameraOn, isJoined]);

  // Auto join when enabled
  useEffect(() => {
    if (enabled && channelName && !isJoined) {
      joinChannel().catch((_err) => {
        // Error already handled in joinChannel, just prevent unhandled rejection
      });
    } else if (!enabled && isJoined && clientRef.current) {
      // Only leave if client exists
      leaveChannel().catch((_err) => {});
    }
  }, [enabled, channelName, isJoined, joinChannel, leaveChannel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only cleanup if client exists
      if (clientRef.current && isJoined) {
        leaveChannel().catch((_err) => {});
      }
    };
  }, [isJoined, leaveChannel]);

  return {
    localVideoTrack,
    localAudioTrack,
    remoteUsers,
    isJoined,
    isMicOn,
    isCameraOn,
    networkQuality,
    toggleMic,
    toggleCamera,
    joinChannel,
    leaveChannel,
  };
}
