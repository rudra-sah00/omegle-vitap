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
  shouldPublishAudio: boolean = true
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
      const uid = Math.floor(Math.random() * 100000);
      const token = await requestToken(channelName, uid);

      // Join channel
      await agoraService.joinChannel(channelName, token, uid);

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
      console.log('Joined video channel:', channelName, 'Video:', shouldPublishVideo, 'Audio:', shouldPublishAudio);
    } catch (error) {
      console.error('Failed to join video channel:', error);
    } finally {
      isJoiningRef.current = false;
    }
  }, [userId, channelName, enabled, isJoined, shouldPublishVideo, shouldPublishAudio]);

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
      console.log('Left video channel');
    } catch (error) {
      console.error('Failed to leave video channel:', error);
    }
  }, [localVideoTrack, localAudioTrack]);

  // Toggle microphone
  const toggleMic = useCallback(async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!isMicOn);
      setIsMicOn(!isMicOn);
    }
  }, [localAudioTrack, isMicOn]);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!isCameraOn);
      setIsCameraOn(!isCameraOn);
    }
  }, [localVideoTrack, isCameraOn]);

  // Auto join when enabled
  useEffect(() => {
    if (enabled && channelName && !isJoined) {
      joinChannel();
    } else if (!enabled && isJoined && clientRef.current) {
      // Only leave if client exists
      leaveChannel().catch(err => console.error('Error leaving channel:', err));
    }
  }, [enabled, channelName, isJoined, joinChannel, leaveChannel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only cleanup if client exists
      if (clientRef.current && isJoined) {
        leaveChannel().catch(err => console.error('Cleanup error:', err));
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
