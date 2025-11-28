/**
 * useLiveKit Hook
 * Manages LiveKit RTC (Video/Audio) state and operations
 * 
 * @description Provides a complete interface for managing LiveKit video/audio
 * connections including camera/microphone control, screen sharing, and
 * network quality monitoring.
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { showError, showWarning, showSuccess, parseMediaError, ErrorCode } from '@/lib/toast';
import { useMediaState } from './useMediaState';
import { analytics } from '@/services/firebase';
import { RTC_INIT_TIMEOUT, DEVICE_UPDATE_INTERVAL, DOM_IDS } from '@/constants';
import type { MatchDataMatched } from '@/types/matchmaking';
import { ConnectionQuality, type RemoteParticipant } from 'livekit-client';
import type { LiveKitService } from '@/services/livekit';
import type { NetworkQualityLevel } from '@/services/livekit';

/**
 * Convert ConnectionQuality enum to NetworkQualityLevel string
 * This is a local utility to avoid dynamic imports in callbacks
 */
function mapConnectionQuality(quality: ConnectionQuality): NetworkQualityLevel {
  switch (quality) {
    case ConnectionQuality.Excellent:
      return 'excellent';
    case ConnectionQuality.Good:
      return 'good';
    case ConnectionQuality.Poor:
      return 'poor';
    default:
      return 'unknown';
  }
}

interface UseLiveKitOptions {
  /** Callback when remote video becomes available */
  onRemoteVideoReady?: (participantId: string) => void;
  /** Callback when remote user leaves the room */
  onRemoteUserLeft?: (participantId: string) => void;
}

/**
 * Hook for managing LiveKit video/audio connections
 * 
 * @param options - Configuration options for callbacks
 * @returns Object containing media state and control functions
 * 
 * @example
 * ```tsx
 * const { isCameraOn, toggleCamera, initializeRTC } = useLiveKit({
 *   onRemoteVideoReady: (id) => console.log('Remote ready:', id),
 * });
 * ```
 */
export function useLiveKit(options: UseLiveKitOptions = {}) {
  const { onRemoteVideoReady, onRemoteUserLeft } = options;

  const rtcServiceRef = useRef<LiveKitService | null>(null);
  const isInitializingRef = useRef(false);
  
  const { isCameraOn, isMicOn, setCameraOn, setMicOn } = useMediaState();
  
  const [isRTCInitialized, setIsRTCInitialized] = useState(false);
  const [isRemoteCameraOn, setIsRemoteCameraOn] = useState(false);
  const [isRemoteMicOn, setIsRemoteMicOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRemoteScreenSharing, setIsRemoteScreenSharing] = useState(false);
  const hasPreviewRef = useRef(false);
  const [currentCameraId, setCurrentCameraId] = useState<string | undefined>(undefined);
  const [currentMicId, setCurrentMicId] = useState<string | undefined>(undefined);
  
  const [localNetworkQuality, setLocalNetworkQuality] = useState<NetworkQualityLevel>('unknown');
  const [remoteNetworkQuality, setRemoteNetworkQuality] = useState<NetworkQualityLevel>('unknown');

  const initializeRTC = useCallback(async (
    matchData: MatchDataMatched,
    uid: string | number,
    localVideoElementId: string,
    remoteVideoElementId: string
  ) => {
    const initTimeout = setTimeout(() => {
      showError('Connection timeout. Please check your network.', ErrorCode.CONNECTION_TIMEOUT);
      isInitializingRef.current = false;
    }, RTC_INIT_TIMEOUT);

    try {
      if (isRTCInitialized) {
        clearTimeout(initTimeout);
        return;
      }
      
      isInitializingRef.current = true;

      if (!matchData.livekitHost) {
        clearTimeout(initTimeout);
        showError('Video service configuration error. Please contact support.', ErrorCode.CHANNEL_JOIN_FAILED);
        throw new Error('Missing LiveKit host URL');
      }

      if (!matchData.rtcToken || matchData.rtcToken.trim().length === 0) {
        clearTimeout(initTimeout);
        showError('Invalid session token. Please try again.', ErrorCode.CHANNEL_JOIN_FAILED);
        throw new Error('Missing or invalid RTC token from match data');
      }

      if (!matchData.channelName) {
        clearTimeout(initTimeout);
        showError('Invalid session data. Please try again.', ErrorCode.CHANNEL_JOIN_FAILED);
        throw new Error('Missing room name from match data');
      }
      
      const rtcConnectionStart = Date.now();
      
      if (!rtcServiceRef.current) {
        const { LiveKitService } = await import('@/services/livekit');
        rtcServiceRef.current = new LiveKitService();
      }

      rtcServiceRef.current.setOnUserPublished((participant: RemoteParticipant, mediaType: 'audio' | 'video') => {
        if (mediaType === 'video') {
          setIsRemoteCameraOn(true);
          const remoteElement = document.getElementById(remoteVideoElementId);
          if (remoteElement) {
            rtcServiceRef.current?.playRemoteVideo(participant, remoteVideoElementId);
            onRemoteVideoReady?.(participant.identity);
          }
        } else if (mediaType === 'audio') {
          setIsRemoteMicOn(true);
        }
      });

      rtcServiceRef.current.setOnUserUnpublished((participant: RemoteParticipant, mediaType: 'audio' | 'video') => {
        if (mediaType === 'video') {
          setIsRemoteCameraOn(false);
        } else if (mediaType === 'audio') {
          setIsRemoteMicOn(false);
        }
      });

      rtcServiceRef.current.setOnUserLeft((participant: RemoteParticipant) => {
        setIsRemoteCameraOn(false);
        setIsRemoteMicOn(false);
        setRemoteNetworkQuality('unknown');
        onRemoteUserLeft?.(participant.identity);
      });

      rtcServiceRef.current.setOnConnectionQualityChanged((quality: ConnectionQuality, participant: RemoteParticipant | null) => {
        // Use the local mapping function
        const qualityLevel = mapConnectionQuality(quality);
        
        const localIdentity = rtcServiceRef.current?.getLocalParticipantIdentity();
        const isLocalParticipant = participant === null || 
          participant.identity === localIdentity;
        
        if (isLocalParticipant) {
          setLocalNetworkQuality(qualityLevel);
        } else {
          setRemoteNetworkQuality(qualityLevel);
        }
      });

      rtcServiceRef.current.setOnScreenShareSubscribed((participant: RemoteParticipant, isSharing: boolean) => {
        setIsRemoteScreenSharing(isSharing);
        
        if (isSharing) {
          setTimeout(() => {
            const screenElement = document.getElementById(DOM_IDS.REMOTE_SCREEN_SHARE);
            if (screenElement) {
              rtcServiceRef.current?.playRemoteScreenShare(participant, DOM_IDS.REMOTE_SCREEN_SHARE);
            }
            const pipElement = document.getElementById(DOM_IDS.REMOTE_VIDEO_PIP);
            if (pipElement) {
              rtcServiceRef.current?.playRemoteCameraToPip(participant, DOM_IDS.REMOTE_VIDEO_PIP);
            }
          }, 100);
        }
      });

      await rtcServiceRef.current.join({
        serverUrl: matchData.livekitHost,
        token: matchData.rtcToken,
        roomName: matchData.channelName,
      }, isCameraOn, isMicOn);

      if (!rtcServiceRef.current) {
        clearTimeout(initTimeout);
        throw new Error('RTC service was cleaned up during initialization');
      }
      
      const initialLocalQuality = rtcServiceRef.current.getLocalConnectionQuality();
      const initialRemoteQuality = rtcServiceRef.current.getRemoteConnectionQuality();
      setLocalNetworkQuality(initialLocalQuality);
      setRemoteNetworkQuality(initialRemoteQuality);
      
      const devices = rtcServiceRef.current.getCurrentDevices();
      if (devices.cameraId) setCurrentCameraId(devices.cameraId);
      if (devices.micId) setCurrentMicId(devices.micId);

      const connectionTime = Date.now() - rtcConnectionStart;
      analytics.trackRTCJoin();
      analytics.trackRTCConnectionTime(connectionTime);

      if (isCameraOn && rtcServiceRef.current) {
        const localElement = document.getElementById(localVideoElementId);
        if (localElement) {
          try {
            rtcServiceRef.current.playLocalVideo(localVideoElementId);
          } catch {
            // Video element may not exist yet or user navigated away - safe to ignore
          }
        }
      }

      setIsRTCInitialized(true);
      clearTimeout(initTimeout);
      isInitializingRef.current = false;
    } catch (error) {
      clearTimeout(initTimeout);
      setIsRTCInitialized(false);
      isInitializingRef.current = false;
      
      if (rtcServiceRef.current) {
        try {
          await rtcServiceRef.current.leave();
        } catch {
          // Cleanup errors are expected if connection was already closed - safe to ignore
        }
        rtcServiceRef.current = null;
      }
      
      const { message, code } = parseMediaError(error);
      showError(message, code);
      throw error;
    }
  }, [isRTCInitialized, isCameraOn, isMicOn, onRemoteVideoReady, onRemoteUserLeft]);

  const isTogglingCameraRef = useRef(false);
  
  const toggleCamera = useCallback(async () => {
    if (isTogglingCameraRef.current) {
      return;
    }
    
    isTogglingCameraRef.current = true;
    const newState = !isCameraOn;
    setCameraOn(newState);
    
    if (isRTCInitialized && rtcServiceRef.current) {
      try {
        await rtcServiceRef.current.toggleCamera(newState);
        const devices = rtcServiceRef.current.getCurrentDevices();
        if (devices.cameraId) setCurrentCameraId(devices.cameraId);
        analytics.trackCameraToggle(newState, 'call');
        showSuccess(newState ? 'Camera on' : 'Camera off');
      } catch (error) {
        const errorStr = String(error);
        if (errorStr.includes('NotAllowedError') || errorStr.includes('PermissionDenied')) {
          const { message } = parseMediaError(error);
          showError(message, ErrorCode.CAMERA_PERMISSION_DENIED);
          setTimeout(() => {
            showWarning('Please allow camera access in your browser settings and try again.');
          }, 1000);
        }
        setCameraOn(!newState);
      } finally {
        isTogglingCameraRef.current = false;
      }
    } else {
      if (newState) {
        try {
          if (!rtcServiceRef.current) {
            const { LiveKitService } = await import('@/services/livekit');
            rtcServiceRef.current = new LiveKitService();
          }
          
          await rtcServiceRef.current.createLocalPreview(true, isMicOn);
          hasPreviewRef.current = true;
          
          const devices = rtcServiceRef.current.getCurrentDevices();
          if (devices.cameraId) setCurrentCameraId(devices.cameraId);
          if (devices.micId) setCurrentMicId(devices.micId);
          
          analytics.trackCameraToggle(true, 'preview');
        } catch (error) {
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
  }, [isCameraOn, isMicOn, isRTCInitialized, setCameraOn]);

  const isTogglingMicRef = useRef(false);
  
  const toggleMicrophone = useCallback(async () => {
    if (isTogglingMicRef.current) {
      return;
    }
    
    isTogglingMicRef.current = true;
    const newState = !isMicOn;
    setMicOn(newState);
    
    if (isRTCInitialized && rtcServiceRef.current) {
      try {
        await rtcServiceRef.current.toggleMicrophone(newState);
        const devices = rtcServiceRef.current.getCurrentDevices();
        if (devices.micId) setCurrentMicId(devices.micId);
        analytics.trackMicrophoneToggle(newState, 'call');
        showSuccess(newState ? 'Microphone on' : 'Microphone off');
      } catch (error) {
        const errorStr = String(error);
        if (errorStr.includes('NotAllowedError') || errorStr.includes('PermissionDenied')) {
          const { message, code } = parseMediaError(error);
          showError(message, code);
        }
        setMicOn(!newState);
      } finally {
        isTogglingMicRef.current = false;
      }
    } else {
      if (newState || isCameraOn) {
        try {
          if (!rtcServiceRef.current) {
            const { LiveKitService } = await import('@/services/livekit');
            rtcServiceRef.current = new LiveKitService();
          }
          
          await rtcServiceRef.current.createLocalPreview(isCameraOn, newState);
          hasPreviewRef.current = true;
          
          const devices = rtcServiceRef.current.getCurrentDevices();
          if (devices.cameraId) setCurrentCameraId(devices.cameraId);
          if (devices.micId) setCurrentMicId(devices.micId);
          
          analytics.trackMicrophoneToggle(newState, 'preview');
        } catch {
          // Preview mic toggle failed - UI state already updated, no user action needed
        } finally {
          isTogglingMicRef.current = false;
        }
      } else {
        isTogglingMicRef.current = false;
      }
    }
  }, [isCameraOn, isMicOn, isRTCInitialized, setMicOn]);

  const leaveRTC = useCallback(async () => {
    if (isInitializingRef.current) {
      const maxWait = 3000;
      const startWait = Date.now();
      while (isInitializingRef.current && Date.now() - startWait < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    if (!rtcServiceRef.current) {
      return;
    }

    try {
      await rtcServiceRef.current.leave();
      hasPreviewRef.current = false;
      setIsRTCInitialized(false);
      setIsRemoteCameraOn(false);
      setIsRemoteMicOn(false);
      setIsScreenSharing(false);
      setIsRemoteScreenSharing(false);
      setLocalNetworkQuality('unknown');
      setRemoteNetworkQuality('unknown');
      
      setTimeout(() => {
        const service = rtcServiceRef.current;
        if (service) {
          rtcServiceRef.current = null;
        }
      }, 200);
    } catch {
      // Leave failed but we still need to reset state for consistent UI
      setIsRTCInitialized(false);
    }
  }, []);

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

  const switchMicrophone = useCallback(async (deviceId: string) => {
    if (!rtcServiceRef.current) return;
    
    try {
      await rtcServiceRef.current.switchMicrophone(deviceId);
      setCurrentMicId(deviceId);
    } catch {
      // Device switch failed - show user-friendly message without exposing technical details
      showError('Failed to switch microphone. Please try again.', ErrorCode.MIC_IN_USE);
    }
  }, []);

  const isTogglingScreenShareRef = useRef(false);
  
  const toggleScreenShare = useCallback(async () => {
    if (isTogglingScreenShareRef.current) {
      return;
    }
    
    if (!isRTCInitialized || !rtcServiceRef.current) {
      showWarning('You must be in a call to share your screen.');
      return;
    }

    isTogglingScreenShareRef.current = true;

    try {
      const newState = await rtcServiceRef.current.toggleScreenShare();
      setIsScreenSharing(newState);
      if (newState) {
        showSuccess('Screen sharing started');
      } else {
        showSuccess('Screen sharing stopped');
      }
    } catch (error) {
      const errorStr = String(error);
      if (errorStr.includes('Permission denied') || errorStr.includes('NotAllowedError')) {
        showWarning('Screen sharing was cancelled or permission was denied.');
      } else {
        showError('Failed to share screen. Please try again.', ErrorCode.CAMERA_PERMISSION_DENIED);
      }
      setIsScreenSharing(false);
    } finally {
      isTogglingScreenShareRef.current = false;
    }
  }, [isRTCInitialized]);

  const getCurrentDevices = useCallback(() => {
    return { cameraId: currentCameraId, micId: currentMicId };
  }, [currentCameraId, currentMicId]);

  /**
   * Reattach local video to the specified element
   * @param elementId - DOM element ID (defaults to local video element)
   */
  const reattachLocalVideo = useCallback((elementId: string = DOM_IDS.LOCAL_VIDEO) => {
    if (rtcServiceRef.current && isCameraOn) {
      rtcServiceRef.current.reattachLocalVideo(elementId);
    }
  }, [isCameraOn]);

  useEffect(() => {
    if (!rtcServiceRef.current || !isRTCInitialized) return;

    const updateDeviceIds = () => {
      const devices = rtcServiceRef.current?.getCurrentDevices();
      if (devices) {
        setCurrentCameraId(devices.cameraId);
        setCurrentMicId(devices.micId);
      }
    };

    updateDeviceIds();
    const interval = setInterval(updateDeviceIds, DEVICE_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [isRTCInitialized]);

  useEffect(() => {
    const handleDeviceChange = async () => {
      if (isCameraOn || isMicOn) {
        showWarning('Device change detected. Your camera or microphone may have changed.');
      }
    };

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
  }, [isCameraOn, isMicOn]);

  return {
    isCameraOn,
    isMicOn,
    isRTCInitialized,
    isRemoteCameraOn,
    isRemoteMicOn,
    isScreenSharing,
    isRemoteScreenSharing,
    localNetworkQuality,
    remoteNetworkQuality,
    initializeRTC,
    toggleCamera,
    toggleMicrophone,
    toggleScreenShare,
    switchCamera,
    switchMicrophone,
    getCurrentDevices,
    reattachLocalVideo,
    leaveRTC,
  };
}
