/**
 * Hook to manage Agora RTC (Video/Audio) state and operations
 */

import { useRef, useState, useCallback } from 'react';
import type { MatchData } from '@/types/matchmaking';

interface UseAgoraRTCOptions {
  onRemoteVideoReady?: (userId: string) => void;
  onRemoteUserLeft?: (userId: string) => void;
}

export const useAgoraRTC = (options: UseAgoraRTCOptions = {}) => {
  const { onRemoteVideoReady, onRemoteUserLeft } = options;

  const rtcServiceRef = useRef<any>(null);
  const [isCameraOn, setIsCameraOn] = useState(false); // Start with camera OFF
  const [isMicOn, setIsMicOn] = useState(false); // Start with mic OFF
  const [isRTCInitialized, setIsRTCInitialized] = useState(false);

  /**
   * Initialize RTC with match data
   */
  const initializeRTC = useCallback(async (
    matchData: MatchData,
    uid: string | number,
    localVideoElementId: string,
    remoteVideoElementId: string
  ) => {
    try {
      // Prevent duplicate initialization
      if (rtcServiceRef.current) {
        console.log('[Agora RTC] Already initialized, skipping');
        return;
      }

      // Dynamically import Agora RTC (client-side only)
      const { AgoraRTCService } = await import('@/lib/agora-rtc');

      console.log('[Agora RTC] Initializing with camera:', isCameraOn, 'mic:', isMicOn);

      // Initialize service
      rtcServiceRef.current = new AgoraRTCService();

      // Setup event handlers
      rtcServiceRef.current.setOnUserPublished(async (user: any, mediaType: 'audio' | 'video') => {
        console.log('[Agora RTC] Partner published:', mediaType);
        if (mediaType === 'video') {
          const remoteElement = document.getElementById(remoteVideoElementId);
          if (remoteElement) {
            rtcServiceRef.current?.playRemoteVideo(user, remoteVideoElementId);
            onRemoteVideoReady?.(user.uid);
          }
        }
      });

      rtcServiceRef.current.setOnUserLeft((user: any) => {
        console.log('[Agora RTC] Partner left');
        onRemoteUserLeft?.(user.uid);
      });

      // Join channel
      await rtcServiceRef.current.join({
        appId: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
        channelName: matchData.channelName,
        token: matchData.rtcToken,
        uid: typeof uid === 'number' ? uid.toString() : uid,
      });

      // Play local video
      const localElement = document.getElementById(localVideoElementId);
      if (localElement) {
        rtcServiceRef.current.playLocalVideo(localVideoElementId);
      }

      // Apply saved camera/mic state
      await rtcServiceRef.current.toggleCamera(isCameraOn);
      await rtcServiceRef.current.toggleMicrophone(isMicOn);

      setIsRTCInitialized(true);
      console.log('✅ RTC initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize RTC:', error);
      throw error;
    }
  }, [isCameraOn, isMicOn, onRemoteVideoReady, onRemoteUserLeft]);

  /**
   * Toggle camera on/off
   */
  const toggleCamera = useCallback(async () => {
    if (!rtcServiceRef.current) return;

    const newState = !isCameraOn;
    await rtcServiceRef.current.toggleCamera(newState);
    setIsCameraOn(newState);
    console.log('[Agora RTC] Camera:', newState ? 'ON' : 'OFF');
  }, [isCameraOn]);

  /**
   * Toggle microphone on/off
   */
  const toggleMicrophone = useCallback(async () => {
    if (!rtcServiceRef.current) return;

    const newState = !isMicOn;
    await rtcServiceRef.current.toggleMicrophone(newState);
    setIsMicOn(newState);
    console.log('[Agora RTC] Microphone:', newState ? 'ON' : 'OFF');
  }, [isMicOn]);

  /**
   * Leave RTC channel and cleanup
   */
  const leaveRTC = useCallback(async () => {
    if (!rtcServiceRef.current) return;

    try {
      await rtcServiceRef.current.leave();
      setIsRTCInitialized(false);
      console.log('✅ RTC cleaned up');
    } catch (error) {
      console.error('❌ Error leaving RTC:', error);
    }
  }, []);

  return {
    // State
    isCameraOn,
    isMicOn,
    isRTCInitialized,

    // Methods
    initializeRTC,
    toggleCamera,
    toggleMicrophone,
    leaveRTC,
  };
};
