/**
 * Hook to manage Agora RTC (Video/Audio) state and operations
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { showError, showWarning, parseMediaError, ErrorCode } from '@/lib/toast';
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
  const hasPreviewRef = useRef(false); // Track if preview is active

  /**
   * Initialize RTC with match data
   */
  const initializeRTC = useCallback(async (
    matchData: MatchData,
    uid: string | number,
    localVideoElementId: string,
    remoteVideoElementId: string
  ) => {
    const initTimeout = setTimeout(() => {
      showError('Connection timeout. Please check your network.', ErrorCode.CONNECTION_TIMEOUT);
    }, 15000); // 15 second timeout

    try {
      // Prevent duplicate initialization when already in a call
      if (isRTCInitialized) {
        clearTimeout(initTimeout);
        return;
      }

      // Validate required environment variables
      if (!process.env.NEXT_PUBLIC_AGORA_APP_ID) {
        clearTimeout(initTimeout);
        showError('Video service configuration error. Please contact support.', ErrorCode.CHANNEL_JOIN_FAILED);
        throw new Error('Missing Agora App ID');
      }

      // Initialize service if not exists or was cleaned up
      if (!rtcServiceRef.current) {
        const { AgoraRTCService } = await import('@/lib/agora-rtc');
        rtcServiceRef.current = new AgoraRTCService();
      }

      // Setup event handlers
      rtcServiceRef.current.setOnUserPublished(async (user: any, mediaType: 'audio' | 'video') => {
        if (mediaType === 'video') {
          const remoteElement = document.getElementById(remoteVideoElementId);
          if (remoteElement) {
            rtcServiceRef.current?.playRemoteVideo(user, remoteVideoElementId);
            onRemoteVideoReady?.(user.uid);
          }
        }
      });

      rtcServiceRef.current.setOnUserLeft((user: any) => {
        onRemoteUserLeft?.(user.uid);
      });

      // Join channel with initial camera/mic state
      await rtcServiceRef.current.join({
        appId: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
        channelName: matchData.channelName,
        token: matchData.rtcToken,
        uid: typeof uid === 'number' ? uid.toString() : uid,
      }, isCameraOn, isMicOn);

      // Play local video if camera is on
      if (isCameraOn && rtcServiceRef.current) {
        const localElement = document.getElementById(localVideoElementId);
        if (localElement) {
          try {
            rtcServiceRef.current.playLocalVideo(localVideoElementId);
          } catch (err) {
          }
        }
      }

      setIsRTCInitialized(true);
      clearTimeout(initTimeout);
    } catch (error) {
      clearTimeout(initTimeout);
      setIsRTCInitialized(false);
      
      // Clean up on error
      if (rtcServiceRef.current) {
        try {
          await rtcServiceRef.current.leave();
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        rtcServiceRef.current = null;
      }
      
      const { message, code } = parseMediaError(error);
      showError(message, code);
      throw error;
    }
  }, [isRTCInitialized, isCameraOn, isMicOn, onRemoteVideoReady, onRemoteUserLeft]);

  /**
   * Toggle camera on/off
   */
  const toggleCamera = useCallback(async () => {
    const newState = !isCameraOn;
    setIsCameraOn(newState);
    
    // If already in a call, toggle the track and publish/unpublish
    if (isRTCInitialized && rtcServiceRef.current) {
      try {
        await rtcServiceRef.current.toggleCamera(newState);
        
        // If turning on camera, publish the track
        if (newState) {
          await rtcServiceRef.current.publishVideoTrack();
        } else {
          // If turning off camera, unpublish the track
          await rtcServiceRef.current.unpublishVideoTrack();
        }
      } catch (error) {
        const { message, code } = parseMediaError(error);
        showError(message, code);
        setIsCameraOn(!newState); // Revert on error
        
        // If permission was denied, show recovery instructions
        if (message.includes('denied') || message.includes('permission')) {
          setTimeout(() => {
            showWarning('Please allow camera access in your browser settings and try again.');
          }, 1000);
        }
      }
    } else {
      // Not in a call, create/update preview only if turning ON
      if (newState) {
        try {
          // Initialize RTC service for preview if needed
          if (!rtcServiceRef.current) {
            const { AgoraRTCService } = await import('@/lib/agora-rtc');
            rtcServiceRef.current = new AgoraRTCService();
          }
          
          await rtcServiceRef.current.createLocalPreview(true, isMicOn);
          hasPreviewRef.current = true;
        } catch (error) {
          const { message, code } = parseMediaError(error);
          showError(message, code);
          setIsCameraOn(false);
        }
      }
    }
  }, [isCameraOn, isMicOn, isRTCInitialized]);

  /**
   * Toggle microphone on/off
   */
  const toggleMicrophone = useCallback(async () => {
    const newState = !isMicOn;
    setIsMicOn(newState);
    
    // If already in a call, toggle the track and publish/unpublish
    if (isRTCInitialized && rtcServiceRef.current) {
      try {
        await rtcServiceRef.current.toggleMicrophone(newState);
        
        // If turning on mic, publish the track
        if (newState) {
          await rtcServiceRef.current.publishAudioTrack();
        } else {
          // If turning off mic, unpublish the track
          await rtcServiceRef.current.unpublishAudioTrack();
        }
      } catch (error) {
        setIsCameraOn(!newState); // Revert on error
      }
    } else {
      // Not in a call, create/update preview only if needed
      if (newState || isCameraOn) {
        try {
          // Initialize RTC service for preview if needed
          if (!rtcServiceRef.current) {
            const { AgoraRTCService } = await import('@/lib/agora-rtc');
            rtcServiceRef.current = new AgoraRTCService();
          }
          
          await rtcServiceRef.current.createLocalPreview(isCameraOn, newState);
          hasPreviewRef.current = true;
        } catch (error) {
        }
      }
    }
  }, [isCameraOn, isMicOn, isRTCInitialized]);

  /**
   * Leave RTC channel and cleanup
   */
  const leaveRTC = useCallback(async () => {
    if (!rtcServiceRef.current) return;

    try {
      await rtcServiceRef.current.leave();
      rtcServiceRef.current = null; // Reset service to allow reinitialization
      hasPreviewRef.current = false;
      setIsRTCInitialized(false);
      
      // Reset UI state for next session
      setIsCameraOn(false);
      setIsMicOn(false);
    } catch (error) {
    }
  }, []);

  /**
   * Switch camera device
   */
  const switchCamera = useCallback(async (deviceId: string) => {
    if (!rtcServiceRef.current) return;
    
    try {
      await rtcServiceRef.current.switchCamera(deviceId);
    } catch (error) {
      const { message, code } = parseMediaError(error);
      showError(message, code);
    }
  }, []);

  /**
   * Switch microphone device
   */
  const switchMicrophone = useCallback(async (deviceId: string) => {
    if (!rtcServiceRef.current) return;
    
    try {
      await rtcServiceRef.current.switchMicrophone(deviceId);
    } catch (error) {
      showError('Failed to switch microphone. Please try again.', ErrorCode.MIC_IN_USE);
    }
  }, []);

  /**
   * Get current device IDs
   */
  const getCurrentDevices = useCallback(() => {
    if (!rtcServiceRef.current) return { cameraId: undefined, micId: undefined };
    return rtcServiceRef.current.getCurrentDevices();
  }, []);

  /**
   * Monitor device changes (plug/unplug)
   */
  const [deviceChangeDetected, setDeviceChangeDetected] = useState(false);

  useEffect(() => {
    const handleDeviceChange = async () => {
      // Only notify if devices are currently in use
      if (isCameraOn || isMicOn) {
        setDeviceChangeDetected(true);
        showWarning('Device change detected. Your camera or microphone may have changed.');
        
        // Auto-recover after 2 seconds
        setTimeout(() => {
          setDeviceChangeDetected(false);
        }, 2000);
      }
    };

    // Listen for device changes
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
  }, [isCameraOn, isMicOn]);

  return {
    // State
    isCameraOn,
    isMicOn,
    isRTCInitialized,

    // Methods
    initializeRTC,
    toggleCamera,
    toggleMicrophone,
    switchCamera,
    switchMicrophone,
    getCurrentDevices,
    leaveRTC,
  };
};
