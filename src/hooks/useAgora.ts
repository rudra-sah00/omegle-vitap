import { useEffect, useState, useCallback, useRef } from "react";
import {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import { agoraService } from "@/services/agoraService";
import { requestToken } from "@/services/agoraTokenService";

export interface UseAgoraOptions {
  channel: string;
  uid?: number;
  enableVideo?: boolean;
  enableAudio?: boolean;
  autoJoin?: boolean;
}

export interface UseAgoraReturn {
  // State
  isJoined: boolean;
  isPublished: boolean;
  localVideoTrack: ICameraVideoTrack | null;
  localAudioTrack: IMicrophoneAudioTrack | null;
  remoteUsers: IAgoraRTCRemoteUser[];
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  connectionState: string;
  error: string | null;

  // Actions
  joinChannel: () => Promise<void>;
  leaveChannel: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  toggleAudio: () => Promise<void>;
  publish: () => Promise<void>;
  unpublish: () => Promise<void>;
}

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
    const client = agoraService.initClient();
    clientRef.current = client;

    // Event listeners
    client.on("user-published", async (user, mediaType) => {
      try {
        if (mediaType === "video" || mediaType === "audio") {
          await agoraService.subscribeToUser(user, mediaType);
          
          if (mediaType === "video") {
            console.log("Remote user video published:", user.uid);
          }
          if (mediaType === "audio") {
            console.log("Remote user audio published:", user.uid);
            user.audioTrack?.play();
          }
          
          setRemoteUsers([...agoraService.getRemoteUsers()]);
        }
      } catch (err) {
        console.error("Error subscribing to user:", err);
      }
    });

    client.on("user-unpublished", (user, mediaType) => {
      console.log("User unpublished:", user.uid, mediaType);
      setRemoteUsers([...agoraService.getRemoteUsers()]);
    });

    client.on("user-joined", (user) => {
      console.log("User joined:", user.uid);
      setRemoteUsers([...agoraService.getRemoteUsers()]);
    });

    client.on("user-left", (user) => {
      console.log("User left:", user.uid);
      setRemoteUsers([...agoraService.getRemoteUsers()]);
    });

    client.on("connection-state-change", (curState, prevState, reason) => {
      console.log("Connection state changed:", curState, "from:", prevState, "reason:", reason);
      setConnectionState(curState);
    });

    client.on("token-privilege-will-expire", async () => {
      try {
        console.log("Token expiring, renewing...");
        const token = await requestToken(channel, uid);
        await client.renewToken(token);
      } catch (err) {
        console.error("Error renewing token:", err);
      }
    });

    return () => {
      // Cleanup
      agoraService.destroy();
    };
  }, []);

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

      console.log("Successfully joined channel:", channel);
    } catch (err: any) {
      console.error("Failed to join channel:", err);
      setError(err.message || "Failed to join channel");
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
      console.log("Left channel");
    } catch (err: any) {
      console.error("Failed to leave channel:", err);
      setError(err.message || "Failed to leave channel");
      throw err;
    }
  }, []);

  // Publish tracks
  const publish = useCallback(async () => {
    try {
      setError(null);
      await agoraService.publishTracks();
      setIsPublished(true);
      console.log("Published tracks");
    } catch (err: any) {
      console.error("Failed to publish:", err);
      setError(err.message || "Failed to publish");
      throw err;
    }
  }, []);

  // Unpublish tracks
  const unpublish = useCallback(async () => {
    try {
      setError(null);
      await agoraService.unpublishTracks();
      setIsPublished(false);
      console.log("Unpublished tracks");
    } catch (err: any) {
      console.error("Failed to unpublish:", err);
      setError(err.message || "Failed to unpublish");
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
    } catch (err: any) {
      console.error("Failed to toggle video:", err);
      setError(err.message || "Failed to toggle video");
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
    } catch (err: any) {
      console.error("Failed to toggle audio:", err);
      setError(err.message || "Failed to toggle audio");
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
