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
let _AgoraRTC: any = null;
if (typeof window !== "undefined") {
  import("agora-rtc-sdk-ng").then((module) => {
    _AgoraRTC = module.default;
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
  // Initialize states based on shouldPublish props to reflect actual preview state
  const [isMicOn, setIsMicOn] = useState(shouldPublishAudio);
  const [isCameraOn, setIsCameraOn] = useState(shouldPublishVideo);
  const [networkQuality, setNetworkQuality] = useState<"excellent" | "good" | "poor" | "bad">(
    "good"
  );

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const isJoiningRef = useRef(false);
  const isCameraTogglingRef = useRef(false);
  const isMicTogglingRef = useRef(false);

  // Sync state with shouldPublish props when they change (before joining)
  useEffect(() => {
    if (!isJoined) {
      setIsMicOn(shouldPublishAudio);
      setIsCameraOn(shouldPublishVideo);
    }
  }, [shouldPublishAudio, shouldPublishVideo, isJoined]);

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

      // Get existing tracks from agoraService (they were created in preview by useMediaTracks)
      const existingTracks = agoraService.getLocalTracks();

      // Prepare tracks for publishing based on desired state
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

        // Ensure tracks are enabled before publishing
        if (videoToPublish) {
          await videoToPublish.setEnabled(true);
          setLocalVideoTrack(videoToPublish);
        }
        if (audioToPublish) {
          await audioToPublish.setEnabled(true);
          setLocalAudioTrack(audioToPublish);
        }

        // CRITICAL: Update agoraService.localTracks to ensure publishTracks uses correct tracks
        agoraService.setLocalTracks({
          videoTrack: videoToPublish,
          audioTrack: audioToPublish,
        });

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

    // Mark as leaving to prevent race conditions with auto-join effect
    isJoiningRef.current = true;

    try {
      // Unpublish tracks first before leaving channel
      if (clientRef.current) {
        try {
          await agoraService.unpublishTracks();
        } catch (_unpubError) {
          // Continue even if unpublish fails
        }
      }

      // Leave Agora channel
      if (clientRef.current) {
        await agoraService.leaveChannel();
      }

      // Restore tracks for preview mode (re-enable them)
      await agoraService.restoreTracksForPreview();

      // Clear the local references in this hook
      setLocalVideoTrack(null);
      setLocalAudioTrack(null);

      // Clear remote users
      setRemoteUsers([]);

      // Restore states from shouldPublish props (user's preview preference)
      // This ensures UI reflects the actual preview state
      setIsCameraOn(shouldPublishVideo);
      setIsMicOn(shouldPublishAudio);

      // Update joined state at the END after all cleanup is complete
      // This matches the pattern in joinChannel and prevents race conditions
      setIsJoined(false);
    } catch (_error) {
      // Ensure state is reset even on error
      setIsJoined(false);
      setRemoteUsers([]);
      setLocalVideoTrack(null);
      setLocalAudioTrack(null);
      // Preserve user's preview preference
      setIsCameraOn(shouldPublishVideo);
      setIsMicOn(shouldPublishAudio);
    } finally {
      // Reset the joining ref AFTER state update to prevent auto-rejoin race
      isJoiningRef.current = false;
    }
  }, [isJoined, shouldPublishVideo, shouldPublishAudio]);

  // Toggle microphone
  const toggleMic = useCallback(async () => {
    // Prevent concurrent toggle operations
    if (isMicTogglingRef.current) {
      return;
    }
    isMicTogglingRef.current = true;

    // Capture current state before any changes
    const originalState = isMicOn;

    try {
      // Get the centralized audio track from agoraService
      const currentTrack = agoraService.getLocalAudioTrack();

      if (!currentTrack) {
        // No track exists - this can happen if user hasn't granted permissions
        // Don't change state, just show error
        if (onError) {
          onError("Microphone track not available. Please enable microphone before joining.");
        }
        isMicTogglingRef.current = false;
        return;
      }

      // Toggle the enabled state of the existing track
      const newState = !originalState;
      await currentTrack.setEnabled(newState);

      // If turning on and in a call, ensure track is published
      // Note: setEnabled(true) should make the track audible to remote users if already published
      // But we'll explicitly publish to be safe
      if (newState && isJoined && clientRef.current) {
        try {
          // Publish will be skipped by Agora if track is already published
          await clientRef.current.publish([currentTrack]);
        } catch (_publishError) {
          // If publish fails (might already be published), just continue
          // The track is enabled so it should work if already published
        }
      }

      // Update local state
      setLocalAudioTrack(currentTrack);
      setIsMicOn(newState);

      // Track analytics
      analyticsService.trackAudioToggle(newState);
    } catch (_error) {
      // Revert to original state on error
      setIsMicOn(originalState);
      if (onError) {
        onError("Failed to toggle microphone. Please try again.");
      }
    } finally {
      isMicTogglingRef.current = false;
    }
  }, [isMicOn, isJoined, onError]);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    // Prevent concurrent toggle operations
    if (isCameraTogglingRef.current) {
      return;
    }
    isCameraTogglingRef.current = true;

    // Capture current state before any changes
    const originalState = isCameraOn;

    try {
      // Get the centralized video track from agoraService
      const currentTrack = agoraService.getLocalVideoTrack();

      if (!currentTrack) {
        // No track exists - this can happen if user hasn't granted permissions
        // Don't change state, just show error
        if (onError) {
          onError("Camera track not available. Please enable camera before joining.");
        }
        isCameraTogglingRef.current = false;
        return;
      }

      // Toggle the enabled state of the existing track
      const newState = !originalState;
      await currentTrack.setEnabled(newState);

      // If turning on and in a call, ensure track is published
      // Note: setEnabled(true) should make the track visible to remote users if already published
      // But we'll explicitly publish to be safe
      if (newState && isJoined && clientRef.current) {
        try {
          // Publish will be skipped by Agora if track is already published
          await clientRef.current.publish([currentTrack]);
        } catch (_publishError) {
          // If publish fails (might already be published), just continue
          // The track is enabled so it should work if already published
        }
      }

      // Update local state
      setLocalVideoTrack(currentTrack);
      setIsCameraOn(newState);

      // Track analytics
      analyticsService.trackVideoToggle(newState);
    } catch (_error) {
      // Revert to original state on error
      setIsCameraOn(originalState);
      if (onError) {
        onError("Failed to toggle camera. Please try again.");
      }
    } finally {
      isCameraTogglingRef.current = false;
    }
  }, [isCameraOn, isJoined, onError]);

  // Auto join when enabled
  useEffect(() => {
    // Skip auto join/leave during toggle operations or ongoing join/leave
    if (isCameraTogglingRef.current || isMicTogglingRef.current || isJoiningRef.current) {
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
      // Only cleanup if client exists and still joined
      if (clientRef.current && isJoiningRef.current === false) {
        // Call leaveChannel directly without depending on the callback
        const cleanup = async () => {
          try {
            if (clientRef.current) {
              await agoraService.unpublishTracks();
              await agoraService.leaveChannel();
            }
          } catch (_err) {
            // Ignore cleanup errors
          }
        };
        cleanup();
      }
    };
    // Empty deps - only run on mount/unmount
  }, []);

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
