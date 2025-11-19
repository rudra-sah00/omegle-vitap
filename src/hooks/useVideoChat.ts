'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { agoraService } from '@/services/agoraService';
import { requestToken } from '@/services/agoraTokenService';
import type {
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser
} from 'agora-rtc-sdk-ng';

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
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'poor' | 'bad'>('good');

  const clientRef = useRef<any>(null);
  const isJoiningRef = useRef(false);

  // Initialize and join channel
  const joinChannel = useCallback(async () => {
    if (!userId || !channelName || !enabled || isJoiningRef.current || isJoined) return;

    isJoiningRef.current = true;

    try {
      // Create client if not exists
      if (!clientRef.current) {
        clientRef.current = await agoraService.initClient('rtc');

        // Setup event listeners
        clientRef.current.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
          await clientRef.current.subscribe(user, mediaType);
          setRemoteUsers(prev => {
            const exists = prev.find(u => u.uid === user.uid);
            if (exists) return prev;
            return [...prev, user];
          });
        });

        clientRef.current.on('user-unpublished', (user: IAgoraRTCRemoteUser) => {
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });

        clientRef.current.on('user-left', (user: IAgoraRTCRemoteUser) => {
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });

        // Network quality monitoring
        clientRef.current.on('network-quality', (quality: any) => {
          // quality.uplinkNetworkQuality: 0-6 (0=unknown, 1=excellent, 2=good, 3=poor, 4=bad, 5=vbad, 6=down)
          if (quality.uplinkNetworkQuality <= 1) {
            setNetworkQuality('excellent');
          } else if (quality.uplinkNetworkQuality === 2) {
            setNetworkQuality('good');
          } else if (quality.uplinkNetworkQuality === 3) {
            setNetworkQuality('poor');
          } else {
            setNetworkQuality('bad');
          }
        });
      }

      // Get RTC token
      const uid = Math.floor(Math.random() * 100000) + 1; // Range: 1-100000 (never 0)
      let token: string;
      
      try {
        token = await requestToken(channelName, uid);
      } catch (tokenError) {
        isJoiningRef.current = false;
        // Rethrow with clear error message
        throw new Error('Unable to connect to video service. Please try again.');
      }

      // Validate token before joining
      if (!token || token.trim() === '') {
        isJoiningRef.current = false;
        throw new Error('Unable to connect to video service. Please try again.');
      }

      // Join channel
      try {
        await agoraService.joinChannel(channelName, token, uid);
      } catch (joinError) {
        isJoiningRef.current = false;
        throw new Error('Unable to join video call. Please try again.');
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
    } catch (error) {
      isJoiningRef.current = false;
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
      if (onError && error instanceof Error) {
        onError(error.message);
      }
      // Rethrow error to be handled by caller
      throw error;
    } finally {
      isJoiningRef.current = false;
    }
  }, [userId, channelName, enabled, isJoined, shouldPublishVideo, shouldPublishAudio, onError]);

  // Leave channel
  const leaveChannel = useCallback(async () => {
    try {
      if (localVideoTrack) {
        localVideoTrack.close();
        setLocalVideoTrack(null);
      }
      if (localAudioTrack) {
        localAudioTrack.close();
        setLocalAudioTrack(null);
      }

      await agoraService.leaveChannel();
      setRemoteUsers([]);
      setIsJoined(false);
      isJoiningRef.current = false;
    } catch (error) {
      // Reset flags even on error
      isJoiningRef.current = false;
      setIsJoined(false);
    }
  }, [localVideoTrack, localAudioTrack]);

  // Toggle microphone
  const toggleMic = useCallback(async () => {
    if (!localAudioTrack) {
      // Create audio track if it doesn't exist
      try {
        const tracks = await agoraService.createLocalTracks(false, true);
        if (tracks.audioTrack) {
          setLocalAudioTrack(tracks.audioTrack);
          setIsMicOn(true);
          // Publish the new track
          if (isJoined && clientRef.current) {
            await clientRef.current.publish([tracks.audioTrack]);
          }
        }
      } catch (error) {
        throw error;
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
        const tracks = await agoraService.createLocalTracks(true, false);
        if (tracks.videoTrack) {
          setLocalVideoTrack(tracks.videoTrack);
          setIsCameraOn(true);
          // Publish the new track
          if (isJoined && clientRef.current) {
            await clientRef.current.publish([tracks.videoTrack]);
          }
        }
      } catch (error) {
        throw error;
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
      joinChannel();
    } else if (!enabled && isJoined && clientRef.current) {
      // Only leave if client exists
      leaveChannel().catch(err => { });
    }
  }, [enabled, channelName, isJoined, joinChannel, leaveChannel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only cleanup if client exists
      if (clientRef.current && isJoined) {
        leaveChannel().catch(err => { });
      }
    };
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
