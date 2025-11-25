/**
 * Hook to manage Agora RTC (Video/Audio) state and operations
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { showError, showWarning, parseMediaError, ErrorCode } from '@/lib/toast';
import { useMediaState } from '@/context/MediaStateContext';
import type { MatchData } from '@/types/matchmaking';
import { analytics } from '@/lib/firebase/analytics';

interface UseAgoraRTCOptions {
  onRemoteVideoReady?: (userId: string) => void;
  onRemoteUserLeft?: (userId: string) => void;
}

export const useAgoraRTC = (options: UseAgoraRTCOptions = {}) => {
  const { onRemoteVideoReady, onRemoteUserLeft } = options;

  const rtcServiceRef = useRef<any>(null);
  
  // Use MediaStateContext for camera/mic state
  // - On page load/reload: Always starts OFF (context resets)
  // - Between matches: State persists (context stays alive)
  const { isCameraOn, isMicOn, setCameraOn, setMicOn } = useMediaState();
  
  const [isRTCInitialized, setIsRTCInitialized] = useState(false);
  const [isRemoteCameraOn, setIsRemoteCameraOn] = useState(false); // Track remote user's camera (start false, update when detected)
  const [isRemoteMicOn, setIsRemoteMicOn] = useState(false); // Track remote user's mic (start false, update when detected)
  const hasPreviewRef = useRef(false); // Track if preview is active
  const [currentCameraId, setCurrentCameraId] = useState<string | undefined>(undefined);
  const [currentMicId, setCurrentMicId] = useState<string | undefined>(undefined);

  /**
   * Initialize RTC with match data
   */
  const initializeRTC = useCallback(async (
    matchData: import('@/types/matchmaking').MatchDataMatched,
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

      // Validate match data contains required Agora tokens
      if (!matchData.rtcToken || matchData.rtcToken.trim().length === 0) {
        clearTimeout(initTimeout);
        showError('Invalid session token. Please try again.', ErrorCode.CHANNEL_JOIN_FAILED);
        throw new Error('Missing or invalid RTC token from match data');
      }

      if (!matchData.channelName) {
        clearTimeout(initTimeout);
        showError('Invalid session data. Please try again.', ErrorCode.CHANNEL_JOIN_FAILED);
        throw new Error('Missing channel name from match data');
      }

      // Track RTC connection start time
      const rtcConnectionStart = Date.now();
      
      // Initialize service if not exists or was cleaned up
      if (!rtcServiceRef.current) {
        const { AgoraRTCService } = await import('@/lib/agora/agora-rtc');
        rtcServiceRef.current = new AgoraRTCService();
      }

      // Setup event handlers
      rtcServiceRef.current.setOnUserPublished(async (user: any, mediaType: 'audio' | 'video') => {
        if (mediaType === 'video') {
          setIsRemoteCameraOn(true);
          const remoteElement = document.getElementById(remoteVideoElementId);
          if (remoteElement) {
            rtcServiceRef.current?.playRemoteVideo(user, remoteVideoElementId);
            onRemoteVideoReady?.(user.uid);
          }
        } else if (mediaType === 'audio') {
          setIsRemoteMicOn(true);
        }
      });

      rtcServiceRef.current.setOnUserUnpublished((user: any, mediaType: 'audio' | 'video') => {
        if (mediaType === 'video') {
          setIsRemoteCameraOn(false);
        } else if (mediaType === 'audio') {
          setIsRemoteMicOn(false);
        }
      });

      rtcServiceRef.current.setOnUserLeft((user: any) => {
        setIsRemoteCameraOn(false); // Reset to default (no camera until detected)
        setIsRemoteMicOn(false); // Reset to default (no mic until detected)
        onRemoteUserLeft?.(user.uid);
      });

      // Join channel with initial camera/mic state
      await rtcServiceRef.current.join({
        appId: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
        channelName: matchData.channelName,
        token: matchData.rtcToken,
        uid: typeof uid === 'number' ? uid.toString() : uid,
      }, isCameraOn, isMicOn);

      // Update device IDs after joining
      const devices = rtcServiceRef.current.getCurrentDevices();
      if (devices.cameraId) setCurrentCameraId(devices.cameraId);
      if (devices.micId) setCurrentMicId(devices.micId);

      // Track RTC join and connection time
      const connectionTime = Date.now() - rtcConnectionStart;
      analytics.trackRTCJoin();
      analytics.trackRTCConnectionTime(connectionTime);

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
  const isTogglingCameraRef = useRef(false);
  
  const toggleCamera = useCallback(async () => {
    // Prevent concurrent toggle operations
    if (isTogglingCameraRef.current) return;
    
    isTogglingCameraRef.current = true;
    const newState = !isCameraOn;
    setCameraOn(newState);
    
    // If already in a call, toggle the track (it handles publish/unpublish internally)
    if (isRTCInitialized && rtcServiceRef.current) {
      try {
        await rtcServiceRef.current.toggleCamera(newState);
        // Update device IDs after toggling
        const devices = rtcServiceRef.current.getCurrentDevices();
        if (devices.cameraId) setCurrentCameraId(devices.cameraId);
        
        // Track analytics
        analytics.trackCameraToggle(newState, 'call');
      } catch (error) {
        // Silent failure - user toggled off or device unavailable
        // Only show error if explicitly denied by user
        const errorStr = String(error);
        if (errorStr.includes('NotAllowedError') || errorStr.includes('PermissionDenied')) {
          const { message } = parseMediaError(error);
          showError(message, ErrorCode.CAMERA_PERMISSION_DENIED);
          setTimeout(() => {
            showWarning('Please allow camera access in your browser settings and try again.');
          }, 1000);
        }
        setCameraOn(!newState); // Revert on error
      } finally {
        isTogglingCameraRef.current = false;
      }
    } else {
      // Not in a call, create/update preview only if turning ON
      if (newState) {
        try {
          // Initialize RTC service for preview if needed
          if (!rtcServiceRef.current) {
            const { AgoraRTCService } = await import('@/lib/agora/agora-rtc');
            rtcServiceRef.current = new AgoraRTCService();
          }
          
          await rtcServiceRef.current.createLocalPreview(true, isMicOn);
          hasPreviewRef.current = true;
          
          // Update device IDs after preview is created
          const devices = rtcServiceRef.current.getCurrentDevices();
          if (devices.cameraId) setCurrentCameraId(devices.cameraId);
          if (devices.micId) setCurrentMicId(devices.micId);
          
          // Track analytics
          analytics.trackCameraToggle(true, 'preview');
        } catch (error) {
          // Silent failure - only show error for explicit permission denial
          const errorStr = String(error);
          if (errorStr.includes('NotAllowedError') || errorStr.includes('PermissionDenied')) {
            const { message } = parseMediaError(error);
            showError(message, ErrorCode.CAMERA_PERMISSION_DENIED);
          }
          setCameraOn(false);
        } finally {
          isTogglingCameraRef.current = false;
        }
      } else {
        isTogglingCameraRef.current = false;
      }
    }
  }, [isCameraOn, isMicOn, isRTCInitialized]);

  /**
   * Toggle microphone on/off
   */
  const isTogglingMicRef = useRef(false);
  
  const toggleMicrophone = useCallback(async () => {
    // Prevent concurrent toggle operations
    if (isTogglingMicRef.current) return;
    
    isTogglingMicRef.current = true;
    const newState = !isMicOn;
    setMicOn(newState);
    
    // If already in a call, toggle the track (it handles publish/unpublish internally)
    if (isRTCInitialized && rtcServiceRef.current) {
      try {
        await rtcServiceRef.current.toggleMicrophone(newState);
        // Update device IDs after toggling
        const devices = rtcServiceRef.current.getCurrentDevices();
        if (devices.micId) setCurrentMicId(devices.micId);
        
        // Track analytics
        analytics.trackMicrophoneToggle(newState, 'call');
      } catch (error) {
        // Silent failure - only show error for explicit permission denial
        const errorStr = String(error);
        if (errorStr.includes('NotAllowedError') || errorStr.includes('PermissionDenied')) {
          const { message, code } = parseMediaError(error);
          showError(message, code);
        }
        setMicOn(!newState); // Revert on error
      } finally {
        isTogglingMicRef.current = false;
      }
    } else {
      // Not in a call, create/update preview only if needed
      if (newState || isCameraOn) {
        try {
          // Initialize RTC service for preview if needed
          if (!rtcServiceRef.current) {
            const { AgoraRTCService } = await import('@/lib/agora/agora-rtc');
            rtcServiceRef.current = new AgoraRTCService();
          }
          
          await rtcServiceRef.current.createLocalPreview(isCameraOn, newState);
          hasPreviewRef.current = true;
          
          // Update device IDs after preview is created
          const devices = rtcServiceRef.current.getCurrentDevices();
          if (devices.cameraId) setCurrentCameraId(devices.cameraId);
          if (devices.micId) setCurrentMicId(devices.micId);
          
          // Track analytics
          analytics.trackMicrophoneToggle(newState, 'preview');
        } catch (error) {
          // Silent error
        } finally {
          isTogglingMicRef.current = false;
        }
      } else {
        isTogglingMicRef.current = false;
      }
    }
  }, [isCameraOn, isMicOn, isRTCInitialized]);

  /**
   * Leave RTC channel and cleanup
   * IMPORTANT: Camera/Mic states are preserved across sessions
   */
  const leaveRTC = useCallback(async () => {
    if (!rtcServiceRef.current) return;

    try {
      // Properly leave and cleanup tracks
      await rtcServiceRef.current.leave();
      hasPreviewRef.current = false;
      setIsRTCInitialized(false);
      setIsRemoteCameraOn(false);
      setIsRemoteMicOn(false);
      
      // Force cleanup after delay to ensure tracks are released
      setTimeout(() => {
        const service = rtcServiceRef.current;
        if (service) {
          rtcServiceRef.current = null;
        }
      }, 200);
      
      // DO NOT reset camera/mic states - they persist across sessions
      // User's preference (on/off) remains the same for next match
    } catch (error) {
      // Reset only initialization state on error, keep camera/mic preferences
      setIsRTCInitialized(false);
    }
  }, []);

  /**
   * Switch camera device
   */
  const switchCamera = useCallback(async (deviceId: string) => {
    if (!rtcServiceRef.current) return;
    
    try {
      await rtcServiceRef.current.switchCamera(deviceId);
      setCurrentCameraId(deviceId);
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
      setCurrentMicId(deviceId);
    } catch (error) {
      showError('Failed to switch microphone. Please try again.', ErrorCode.MIC_IN_USE);
    }
  }, []);

  /**
   * Get current device IDs (returns stable state values to prevent re-renders)
   */
  const getCurrentDevices = useCallback(() => {
    return { cameraId: currentCameraId, micId: currentMicId };
  }, [currentCameraId, currentMicId]);

  /**
   * Update device IDs when RTC service changes them
   */
  useEffect(() => {
    if (!rtcServiceRef.current || !isRTCInitialized) return;

    const updateDeviceIds = () => {
      const devices = rtcServiceRef.current?.getCurrentDevices();
      if (devices) {
        setCurrentCameraId(devices.cameraId);
        setCurrentMicId(devices.micId);
      }
    };

    // Update immediately
    updateDeviceIds();

    // Poll for device changes during session
    const interval = setInterval(updateDeviceIds, 2000);

    return () => clearInterval(interval);
  }, [isRTCInitialized]);

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
    isRemoteCameraOn,
    isRemoteMicOn,

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
