import { useEffect, useState, useCallback, useRef } from "react";
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import { agoraService } from "@/services/agoraService";
import { requestToken } from "@/services/agoraTokenService";

/**
 * Configuration options for useAgora hook
 */
export interface UseAgoraOptions {
  /** Channel name to join */
  channel: string;
  /** User ID (0 for auto-generated) */
  uid?: number;
  /** Enable video on join */
  enableVideo?: boolean;
  /** Enable audio on join */
  enableAudio?: boolean;
  /** Auto-join channel on mount */
  autoJoin?: boolean;
}

/**
 * Return type for useAgora hook
 */
export interface UseAgoraReturn {
  /** Whether user has joined the channel */
  isJoined: boolean;
  /** Whether local tracks are published */
  isPublished: boolean;
  /** Local video track */
  localVideoTrack: ICameraVideoTrack | null;
  /** Local audio track */
  localAudioTrack: IMicrophoneAudioTrack | null;
  /** Array of remote users in the channel */
  remoteUsers: IAgoraRTCRemoteUser[];
  /** Whether local video is enabled */
  isVideoEnabled: boolean;
  /** Whether local audio is enabled */
  isAudioEnabled: boolean;
  /** Current connection state */
  connectionState: string;
  /** Error message if any */
  error: string | null;
  /** Join the Agora channel */
  joinChannel: () => Promise<void>;
  /** Leave the Agora channel */
  leaveChannel: () => Promise<void>;
  /** Toggle video on/off */
  toggleVideo: () => Promise<void>;
  /** Toggle audio on/off */
  toggleAudio: () => Promise<void>;
  /** Publish local tracks */
  publish: () => Promise<void>;
  /** Unpublish local tracks */
  unpublish: () => Promise<void>;
}

/**
 * Hook for managing Agora RTC connections and media tracks
 * @param options - Configuration options
 * @returns Agora state and control functions
 */
export function useAgora({
  channel,
  uid = 0,
  enableVideo = true,
  enableAudio = true,
  autoJoin = false,
}: UseAgoraOptions): UseAgoraReturn {
  const [isJoined, setIsJoined] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(enableVideo);
  const [isAudioEnabled, setIsAudioEnabled] = useState(enableAudio);
  const [connectionState, setConnectionState] = useState("DISCONNECTED");
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<IAgoraRTCClient | null>(null);

  // Initialize client and setup event listeners
  useEffect(() => {
    const initializeClient = async () => {
      try {
        const client = await agoraService.initClient();
        clientRef.current = client;

        // Event listeners
        client.on("user-published", async (_user, _mediaType) => {
          try {
            if (_mediaType === "video" || _mediaType === "audio") {
              await agoraService.subscribeToUser(_user, _mediaType);

              if (_mediaType === "audio") {
                _user.audioTrack?.play();
              }

              setRemoteUsers([...agoraService.getRemoteUsers()]);
            }
          } catch (_err) {}
        });

        client.on("user-unpublished", () => {
          setRemoteUsers([...agoraService.getRemoteUsers()]);
        });

        client.on("user-joined", () => {
          setRemoteUsers([...agoraService.getRemoteUsers()]);
        });

        client.on("user-left", () => {
          setRemoteUsers([...agoraService.getRemoteUsers()]);
        });

        client.on("connection-state-change", (curState) => {
          setConnectionState(curState);
        });

        client.on("token-privilege-will-expire", async () => {
          try {
            const token = await requestToken(channel, uid);
            await client.renewToken(token);
          } catch (_err) {}
        });
      } catch (_err) {
        setError("Failed to initialize video client");
      }
    };

    initializeClient();

    return () => {
      // Cleanup
      agoraService.destroy();
    };
  }, [channel, uid]);

  // Join channel
  const joinChannel = useCallback(async () => {
    try {
      setError(null);

      // Request token
      const token = await requestToken(channel, uid);

      // Create local tracks
      const tracks = await agoraService.createLocalTracks(enableVideo, enableAudio);
      setLocalVideoTrack(tracks.videoTrack);
      setLocalAudioTrack(tracks.audioTrack);

      // Join channel
      await agoraService.joinChannel(channel, token, uid);
      setIsJoined(true);
      setConnectionState(agoraService.getConnectionState());
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to join channel");
      throw err;
    }
  }, [channel, uid, enableVideo, enableAudio]);

  // Leave channel
  const leaveChannel = useCallback(async () => {
    try {
      setError(null);
      await agoraService.leaveChannel();
      setIsJoined(false);
      setIsPublished(false);
      setLocalVideoTrack(null);
      setLocalAudioTrack(null);
      setRemoteUsers([]);
      setConnectionState("DISCONNECTED");
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to leave channel");
      throw err;
    }
  }, []);

  // Publish tracks
  const publish = useCallback(async () => {
    try {
      setError(null);
      await agoraService.publishTracks();
      setIsPublished(true);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to publish");
      throw err;
    }
  }, []);

  // Unpublish tracks
  const unpublish = useCallback(async () => {
    try {
      setError(null);
      await agoraService.unpublishTracks();
      setIsPublished(false);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to unpublish");
      throw err;
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    try {
      setError(null);
      const newState = !isVideoEnabled;
      await agoraService.toggleVideo(newState);
      setIsVideoEnabled(newState);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to toggle video");
      throw err;
    }
  }, [isVideoEnabled]);

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    try {
      setError(null);
      const newState = !isAudioEnabled;
      await agoraService.toggleAudio(newState);
      setIsAudioEnabled(newState);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to toggle audio");
      throw err;
    }
  }, [isAudioEnabled]);

  // Auto join if enabled
  useEffect(() => {
    if (autoJoin && !isJoined) {
      joinChannel();
    }
  }, [autoJoin, isJoined, joinChannel]);

  return {
    isJoined,
    isPublished,
    localVideoTrack,
    localAudioTrack,
    remoteUsers,
    isVideoEnabled,
    isAudioEnabled,
    connectionState,
    error,
    joinChannel,
    leaveChannel,
    toggleVideo,
    toggleAudio,
    publish,
    unpublish,
  };
}
