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
 * @param onPartnerLeft - Optional callback when partner leaves the Agora channel
 * @returns Video chat state and control functions
 */
export function useVideoChat(
  userId: string,
  channelName: string,
  enabled: boolean,
  shouldPublishVideo: boolean = true,
  shouldPublishAudio: boolean = true,
  onError?: (message: string) => void,
  onPartnerLeft?: () => void
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
  const isCameraTogglingRef = useRef(false);
  const isMicTogglingRef = useRef(false);

  // Initialize and join channel
  const joinChannel = useCallback(async () => {
    // Skip if toggle operations are in progress
    if (isCameraTogglingRef.current || isMicTogglingRef.current) {
      return;
    }

    if (!userId || !channelName || !enabled || isJoiningRef.current || isJoined) {
      return;
    }

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
                if (exists) {
                  // Update the user with new track info
                  return prev.map((u) => (u.uid === user.uid ? user : u));
                }
                return [...prev, user];
              });
            }
          }
        );

        clientRef.current.on(
          "user-unpublished",
          (user: IAgoraRTCRemoteUser, _mediaType: "audio" | "video") => {
            // Update the user in the array to reflect track changes
            setRemoteUsers((prev) => {
              const exists = prev.find((u) => u.uid === user.uid);
              if (!exists) return prev;

              // Only remove user if they have no tracks at all
              if (!user.videoTrack && !user.audioTrack) {
                return prev.filter((u) => u.uid !== user.uid);
              } else {
                return prev.map((u) => (u.uid === user.uid ? user : u));
              }
            });
          }
        );

        clientRef.current.on("user-left", (user: IAgoraRTCRemoteUser) => {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));

          // Notify that partner left the video channel
          if (onPartnerLeft) {
            onPartnerLeft();
          }
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

      // Set camera and mic state immediately based on what we're trying to publish
      setIsCameraOn(shouldPublishVideo);
      setIsMicOn(shouldPublishAudio);

      // Get existing tracks from agoraService (they were created in preview)
      const existingTracks = agoraService.getLocalTracks();

      // Create or use existing tracks
      if (shouldPublishVideo || shouldPublishAudio) {
        let videoToPublish = shouldPublishVideo ? existingTracks.videoTrack : null;
        let audioToPublish = shouldPublishAudio ? existingTracks.audioTrack : null;

        // Create tracks if they don't exist but are needed
        if (shouldPublishVideo && !videoToPublish) {
          const tracks = await agoraService.createLocalTracks(true, false);
          videoToPublish = tracks.videoTrack;
        }
        if (shouldPublishAudio && !audioToPublish) {
          const tracks = await agoraService.createLocalTracks(false, true);
          audioToPublish = tracks.audioTrack;
        }

        // Set local track state
        if (videoToPublish) {
          setLocalVideoTrack(videoToPublish);
        }
        if (audioToPublish) {
          setLocalAudioTrack(audioToPublish);
        }

        // Publish tracks to channel
        if (videoToPublish || audioToPublish) {
          await agoraService.publishTracks();
        }
      }

      // Enable dual stream for adaptive quality (only if video is enabled)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userId,
    channelName,
    enabled,
    isJoined,
    onError,
    // Note: shouldPublishVideo and shouldPublishAudio intentionally excluded
    // They should only affect initial join, not cause rejoins
  ]);

  // Leave channel
  const leaveChannel = useCallback(async () => {
    // Skip if toggle operations are in progress
    if (isCameraTogglingRef.current || isMicTogglingRef.current) {
      return;
    }

    // Prevent multiple simultaneous leave calls
    if (!isJoined && !isJoiningRef.current) {
      return;
    }

    try {
      // Immediately mark as not joined to prevent race conditions
      setIsJoined(false);
      isJoiningRef.current = false;

      // Leave Agora channel first (unpublishes tracks)
      if (clientRef.current) {
        await agoraService.leaveChannel();
      }

      // DON'T close the tracks - keep them alive in agoraService for preview mode
      // The tracks remain in agoraService.localTracks and will be picked up by useMediaTracks

      // Just clear the local references in this hook
      setLocalVideoTrack(null);
      setLocalAudioTrack(null);

      // DON'T reset camera/mic states - they should maintain their state for preview
      // setIsCameraOn and setIsMicOn are internal to this hook and don't affect useMediaTracks

      // Clear remote users immediately
      setRemoteUsers([]);
    } catch (_error) {
      // Ensure state is reset even on error
      setIsJoined(false);
      isJoiningRef.current = false;
      setRemoteUsers([]);
      setLocalVideoTrack(null);
      setLocalAudioTrack(null);
      setIsCameraOn(false);
      setIsMicOn(false);
    }
  }, [isJoined]);

  // Toggle microphone
  const toggleMic = useCallback(async () => {
    // Prevent concurrent toggle operations
    if (isMicTogglingRef.current) {
      return;
    }
    isMicTogglingRef.current = true;

    try {
      // If track is null but state says mic is on, fix the state mismatch
      if (!localAudioTrack && isMicOn) {
        setIsMicOn(false);
      }

      if (!localAudioTrack) {
        // Create audio track if it doesn't exist
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        setLocalAudioTrack(audioTrack);

        await audioTrack.setEnabled(true);

        // Publish the new track if in a call
        if (isJoined && clientRef.current) {
          try {
            await clientRef.current.publish([audioTrack]);
          } catch (_publishError) {
            audioTrack.close();
            setLocalAudioTrack(null);
            setIsMicOn(false);
            isMicTogglingRef.current = false;
            return;
          }
        }

        setIsMicOn(true);
      } else {
        // Toggle existing track
        const newState = !isMicOn;

        // Just use setEnabled - keep track published so remote users stay connected
        await localAudioTrack.setEnabled(newState);

        setIsMicOn(newState);
      }
    } catch (_error) {
      setIsMicOn(false);
      if (onError) {
        onError("Failed to toggle microphone. Please try again.");
      }
    } finally {
      setTimeout(() => {
        isMicTogglingRef.current = false;
      }, 300);
    }
  }, [localAudioTrack, isMicOn, isJoined, onError]);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    // Prevent concurrent toggle operations
    if (isCameraTogglingRef.current) {
      return;
    }
    isCameraTogglingRef.current = true;

    try {
      // If track is null but state says camera is on, fix the state mismatch
      if (!localVideoTrack && isCameraOn) {
        setIsCameraOn(false);
      }

      if (!localVideoTrack) {
        // Create video track if it doesn't exist
        let videoTrack: ICameraVideoTrack;

        try {
          videoTrack = await AgoraRTC.createCameraVideoTrack({
            optimizationMode: "detail",
            encoderConfig: "480p_1",
          });
        } catch (_createError) {
          if (onError) {
            onError("Failed to access camera. Please check permissions.");
          }
          return;
        }

        // Set track and enable it
        setLocalVideoTrack(videoTrack);
        await videoTrack.setEnabled(true);
        setIsCameraOn(true);

        // Publish the new track if in a call
        if (isJoined && clientRef.current) {
          try {
            await clientRef.current.publish([videoTrack]);
          } catch (_publishError) {
            // Don't turn off camera, just log the error
            // The track is still active locally even if publish failed
          }
        }
      } else {
        const newState = !isCameraOn;

        try {
          // Just use setEnabled - keep track published so remote users stay connected
          await localVideoTrack.setEnabled(newState);

          setIsCameraOn(newState);
        } catch (_toggleError) {
          // Don't change the state if toggle failed
          if (onError) {
            onError("Failed to toggle camera. Please try again.");
          }
        }
      }
    } finally {
      // Add small delay before allowing next toggle
      setTimeout(() => {
        isCameraTogglingRef.current = false;
      }, 300);
    }
  }, [localVideoTrack, isCameraOn, isJoined, onError]);

  // Auto join when enabled
  useEffect(() => {
    // Skip auto join/leave during toggle operations
    if (isCameraTogglingRef.current || isMicTogglingRef.current) {
      return;
    }

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
