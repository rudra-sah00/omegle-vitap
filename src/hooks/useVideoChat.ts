/**
 * useVideoChat Hook
 * Manages the complete video chat session including matchmaking, RTC, and messaging
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { useMatchmaking } from './useMatchmaking';
import { useLiveKit } from './useLiveKit';
import { useChat } from './useChat';
import { getSocketIOService } from '@/services/socket';
import { showError, showInfo, ErrorCode } from '@/lib';
import { useUser } from './useUser';
import { RETRY_BASE_DELAY, FIND_NEXT_DEBOUNCE_DELAY } from '@/constants';
import type { MatchDataMatched } from '@/types/matchmaking';

interface UseVideoChatOptions {
  localVideoElementId: string;
  remoteVideoElementId: string;
}

export function useVideoChat(options: UseVideoChatOptions) {
  const { localVideoElementId, remoteVideoElementId } = options;
  
  const { uid: contextUID } = useUser();

  const currentUidRef = useRef<string>(contextUID.toString());
  const currentMatchRef = useRef<MatchDataMatched | null>(null);
  const userDataRef = useRef<{ name: string; gender: 'male' | 'female' | 'other' } | null>(null);
  const isLeavingRef = useRef(false);
  const handlePartnerLeftRef = useRef<(() => Promise<void>) | null>(null);
  const endSessionRef = useRef<(() => Promise<void>) | null>(null);

  const [isInSession, setIsInSession] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const isFindingNextRef = useRef(false);

  const {
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
  } = useLiveKit({
    onRemoteVideoReady: () => {},
    onRemoteUserLeft: () => {
      handlePartnerLeftRef.current?.();
    },
  });

  const handleMatched = useCallback(async (matchData: MatchDataMatched) => {
    if (isLeavingRef.current || isInSession || isRTCInitialized) {
      return;
    }
    
    setIsSearching(false);
    currentMatchRef.current = matchData;

    const maxRetries = 2;
    let lastError: unknown = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const uid = currentUidRef.current;
        
        await initializeRTC(matchData, uid, localVideoElementId, remoteVideoElementId);

        setIsInSession(true);
        return;
      } catch (error) {
        lastError = error;
        
        if (isLeavingRef.current) {
          break;
        }

        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_BASE_DELAY * (attempt + 1)));
        }
      }
    }

    const errorMsg = lastError instanceof Error ? lastError.message : 'Unknown error';
    const errorLower = errorMsg.toLowerCase();
    
    if (errorMsg.includes('PERMISSION_DENIED') || errorLower.includes('permission') || errorLower.includes('denied')) {
      showError('Camera/microphone permission denied. Please allow access in your browser settings and refresh the page.', ErrorCode.CAMERA_PERMISSION_DENIED);
    } else if (errorMsg.includes('DEVICE_NOT_FOUND') || errorLower.includes('not found')) {
      showError('Camera or microphone not found. Please connect a device and try again.', ErrorCode.MEDIA_DEVICE_NOT_FOUND);
    } else if (errorMsg.includes('DEVICE_IN_USE') || errorLower.includes('in use') || errorLower.includes('being used')) {
      showError('Camera or microphone is being used by another app. Please close other apps and try again.', ErrorCode.CAMERA_IN_USE);
    } else if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
      showError('Connection timeout. This may be due to slow device or network. Please try again.', ErrorCode.CONNECTION_TIMEOUT);
    } else if (errorLower.includes('token') || errorLower.includes('invalid')) {
      showError('Session token expired. Please try again.', ErrorCode.AUTH_FAILED);
    } else if (errorLower.includes('network') || errorLower.includes('offline')) {
      showError('No internet connection. Please check your network and try again.', ErrorCode.CONNECTION_LOST);
    } else {
      showError('Failed to connect. Please try again.', ErrorCode.CHANNEL_JOIN_FAILED);
    }
    await endSessionRef.current?.();
  }, [isInSession, isRTCInitialized, initializeRTC, localVideoElementId, remoteVideoElementId]);

  const handleMatchmakingError = useCallback((error: string) => {
    if (error.toLowerCase().includes('backend') || error.toLowerCase().includes('unavailable')) {
      showError('Service temporarily unavailable. Please try again.', ErrorCode.BACKEND_UNAVAILABLE);
    } else {
      showError('Connection error. Please check your internet.', ErrorCode.CONNECTION_LOST);
    }
  }, []);

  const {
    connectionState,
    matchData,
    error: matchmakingError,
    isMatched,
    join,
    leaveRoom,
    cancelSearch,
  } = useMatchmaking({
    autoConnect: false,
    onMatched: handleMatched,
    onPartnerLeft: () => {
      handlePartnerLeftRef.current?.();
    },
    onError: handleMatchmakingError,
  });

  const {
    messages,
    isPartnerTyping,
    sendMessage,
    sendTypingIndicator,
    clearMessages,
  } = useChat({
    ws: getSocketIOService(),
    isInSession,
    onMessageReceived: () => {},
    onTypingIndicator: () => {},
  });

  const beginSearch = useCallback(async (userData: {
    name: string;
    gender: string;
    targetGender?: string;
  }) => {
    if (!userData.name || userData.name.trim().length === 0) {
      showError('Please enter your name', ErrorCode.AUTH_FAILED);
      return;
    }

    if (!userData.gender) {
      showError('Please select your gender', ErrorCode.AUTH_FAILED);
      return;
    }

    const uid = parseInt(currentUidRef.current, 10);

    const authData = {
      uid,
      name: userData.name.trim(),
      gender: userData.gender.toLowerCase() as 'male' | 'female' | 'other',
    };

    userDataRef.current = {
      name: authData.name,
      gender: authData.gender,
    };

    join(authData);
  }, [join]);

  const stopSearch = useCallback(async () => {
    setIsSearching(false);
    cancelSearch();
  }, [cancelSearch]);

  const endSessionFinal = useCallback(async () => {
    if (isLeavingRef.current) {
      return;
    }
    
    isLeavingRef.current = true;
    
    setIsInSession(false);
    setIsSearching(false);
    currentMatchRef.current = null;

    clearMessages();

    await new Promise(resolve => setTimeout(resolve, 100));

    await leaveRTC();

    await leaveRoom();
    
    isLeavingRef.current = false;
  }, [leaveRTC, leaveRoom, clearMessages]);

  useEffect(() => {
    endSessionRef.current = endSessionFinal;
  }, [endSessionFinal]);

  const handlePartnerLeft = useCallback(async () => {
    if (isLeavingRef.current || isFindingNextRef.current) {
      return;
    }
    
    if (!isRTCInitialized && currentMatchRef.current && !isInSession) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const partnerName = currentMatchRef.current && 'partnerName' in currentMatchRef.current 
      ? currentMatchRef.current.partnerName 
      : 'Your partner';
    
    showInfo(`${partnerName} left`);
    await endSessionFinal();
  }, [endSessionFinal, isInSession, isRTCInitialized]);

  useEffect(() => {
    handlePartnerLeftRef.current = handlePartnerLeft;
  }, [handlePartnerLeft]);

  const findNext = useCallback(async () => {
    if (isLeavingRef.current || isFindingNextRef.current) {
      return;
    }
    
    isLeavingRef.current = true;
    isFindingNextRef.current = true;
    
    try {
      setIsInSession(false);
      currentMatchRef.current = null;

      clearMessages();

      await new Promise(resolve => setTimeout(resolve, 100));

      await leaveRoom();
      
      await new Promise(resolve => setTimeout(resolve, 300));

      await leaveRTC();
      
      await new Promise(resolve => setTimeout(resolve, 200));

      const uid = parseInt(currentUidRef.current, 10);

      if (userDataRef.current) {
        const authData = {
          uid,
          name: userDataRef.current.name,
          gender: userDataRef.current.gender,
        };
        
        join(authData);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorLower = errorMsg.toLowerCase();
      
      if (errorLower.includes('permission') || errorLower.includes('denied')) {
        showError('Camera/microphone permission denied. Please allow access in your browser settings.', ErrorCode.CAMERA_PERMISSION_DENIED);
      } else if (errorLower.includes('device') || errorLower.includes('not found')) {
        showError('Camera or microphone not found. Please check your devices.', ErrorCode.MEDIA_DEVICE_NOT_FOUND);
      } else if (errorLower.includes('timeout')) {
        showError('Connection timeout. Please check your network and try again.', ErrorCode.CONNECTION_TIMEOUT);
      } else {
        showInfo('Retrying search...');
        if (userDataRef.current) {
          const uid = parseInt(currentUidRef.current, 10);
          const authData = {
            uid,
            name: userDataRef.current.name,
            gender: userDataRef.current.gender,
          };
          join(authData);
        }
      }
    } finally {
      isLeavingRef.current = false;
      setTimeout(() => {
        isFindingNextRef.current = false;
      }, FIND_NEXT_DEBOUNCE_DELAY);
    }
  }, [leaveRoom, leaveRTC, join, clearMessages]);

  useEffect(() => {
    const cleanupRef = { cancelled: false };
    
    return () => {
      cleanupRef.cancelled = true;
      
      (async () => {
        try {
          clearMessages();
          await leaveRTC();
          if (!cleanupRef.cancelled) {
            await leaveRoom();
          }
        } catch {
          // Silently handle cleanup errors
        }
      })();
    };
  }, []);

  return {
    connectionState,
    matchData,
    isMatched,
    isInSession,
    isSearching,
    matchmakingError,
    isCameraOn,
    isMicOn,
    isRTCInitialized,
    isRemoteCameraOn,
    isRemoteMicOn,
    isScreenSharing,
    isRemoteScreenSharing,
    localNetworkQuality,
    remoteNetworkQuality,
    messages,
    isPartnerTyping,
    startSearch: beginSearch,
    stopSearch,
    endSession: endSessionFinal,
    findNext,
    toggleCamera,
    toggleMicrophone,
    toggleScreenShare,
    switchCamera,
    switchMicrophone,
    getCurrentDevices,
    reattachLocalVideo,
    sendMessage,
    sendTypingIndicator,
  };
}
