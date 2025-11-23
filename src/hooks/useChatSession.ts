/**
 * Hook to manage the complete chat session lifecycle
 * Integrates matchmaking, RTC, and WebSocket chat
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { useMatchmaking } from './useMatchmaking';
import { useAgoraRTC } from './useAgoraRTC';
import { useWebSocketChat } from './useWebSocketChat';
import { getWebSocketService } from '@/lib/websocket';
import { showError, showInfo, ErrorCode } from '@/lib/toast';
import { useUser } from '@/context/UserContext';
import type { MatchData, MatchDataMatched } from '@/types/matchmaking';

interface UseChatSessionOptions {
  localVideoElementId: string;
  remoteVideoElementId: string;
}

export const useChatSession = (options: UseChatSessionOptions) => {
  const { localVideoElementId, remoteVideoElementId } = options;
  
  // Get persistent UID from context (generated once per session)
  const { uid: contextUID } = useUser();

  // Refs
  const currentUidRef = useRef<string>(contextUID.toString());
  const currentMatchRef = useRef<MatchData | null>(null);
  const userDataRef = useRef<{ name: string; gender: 'male' | 'female' | 'other' } | null>(null);
  const isLeavingRef = useRef(false);
  const pendingSearchGenderRef = useRef<'male' | 'female' | 'other' | 'any' | null>(null);
  const handlePartnerLeftRef = useRef<(() => Promise<void>) | null>(null);

  // State
  const [isInSession, setIsInSession] = useState(false);

  // Matchmaking
  const {
    connectionState,
    matchData,
    error: matchmakingError,
    isMatched,
    isAuthenticated,
    join,
    leaveRoom,
    cancelSearch,
    disconnect,
  } = useMatchmaking({
    autoConnect: true,
    onMatched: handleMatched as any, // Type cast needed due to union type
    onPartnerLeft: () => {
      handlePartnerLeftRef.current?.();
    },
    onError: handleMatchmakingError,
  });

  // Agora RTC (Video/Audio)
  const {
    isCameraOn,
    isMicOn,
    isRTCInitialized,
    isRemoteCameraOn,
    isRemoteMicOn,
    initializeRTC,
    toggleCamera,
    toggleMicrophone,
    switchCamera,
    switchMicrophone,
    getCurrentDevices,
    leaveRTC,
  } = useAgoraRTC({
    onRemoteVideoReady: () => {
      // Remote video ready
    },
    onRemoteUserLeft: () => {
      // Remote user left - trigger partner left handler
      handlePartnerLeftRef.current?.();
    },
  });

  // WebSocket Chat (replaces Agora RTM)
  const {
    messages,
    isPartnerTyping,
    sendMessage,
    sendTypingIndicator,
    clearMessages,
  } = useWebSocketChat({
    ws: getWebSocketService(),
    isInSession,
    onMessageReceived: () => {
      // Message received
    },
    onTypingIndicator: () => {
      // Partner typing indicator
    },
  });

  /**
   * Handle successful match
   */
  async function handleMatched(matchData: MatchDataMatched) {
    if (isLeavingRef.current || isInSession || isRTCInitialized) {
      return;
    }
    
    currentMatchRef.current = matchData;

    // Retry logic with exponential backoff
    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Initialize RTC only (chat uses existing WebSocket connection)
        const uid = currentUidRef.current;
        
        await initializeRTC(matchData, uid, localVideoElementId, remoteVideoElementId);

        setIsInSession(true);
        return; // Success!
      } catch (error) {
        lastError = error;
        
        // Don't retry if leaving
        if (isLeavingRef.current) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    // All retries failed
    const errorMsg = lastError?.message || 'Unknown error';
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
    await endSession();
  }

  /**
   * Handle matchmaking errors
   */
  function handleMatchmakingError(error: string) {
    if (error.toLowerCase().includes('backend') || error.toLowerCase().includes('unavailable')) {
      showError('Service temporarily unavailable. Please try again.', ErrorCode.BACKEND_UNAVAILABLE);
    } else {
      showError('Connection error. Please check your internet.', ErrorCode.CONNECTION_LOST);
    }
  }

  /**
   * Start searching for a match
   */
  const beginSearch = useCallback(async (userData: {
    name: string;
    gender: string;
    targetGender?: string;
  }) => {
    // Validate user data
    if (!userData.name || userData.name.trim().length === 0) {
      showError('Please enter your name', ErrorCode.AUTH_FAILED);
      return;
    }

    if (!userData.gender) {
      showError('Please select your gender', ErrorCode.AUTH_FAILED);
      return;
    }

    // Use UID from context (already set when entering from welcome page)
    const uid = parseInt(currentUidRef.current, 10);

    // Format user data for backend
    const authData = {
      uid, // Use context UID (same for all searches until page reload)
      name: userData.name.trim(),
      gender: userData.gender.toLowerCase() as 'male' | 'female' | 'other',
    };

    // Store user data for later use (cancel, findNext)
    userDataRef.current = {
      name: authData.name,
      gender: authData.gender,
    };

    // Join matchmaking queue (single call, no separate search)
    join(authData);
  }, [join]);

  /**
   * Stop searching (cancel while waiting)
   */
  const stopSearch = useCallback(async () => {
    // Cancel search - new API doesn't require user data
    cancelSearch();
  }, [cancelSearch]);

  /**
   * End current session and cleanup - ensure both users leave channel
   */
  const endSession = useCallback(async () => {
    if (isLeavingRef.current) {
      return;
    }
    
    isLeavingRef.current = true;
    
    setIsInSession(false);
    currentMatchRef.current = null;

    // Clear chat messages
    clearMessages();

    // Wait 100ms to ensure any in-flight messages are delivered to backend
    await new Promise(resolve => setTimeout(resolve, 100));

    // Cleanup RTC connection
    await leaveRTC();

    // Notify server we're leaving the room
    await leaveRoom();
    
    isLeavingRef.current = false;
  }, [leaveRTC, leaveRoom, clearMessages]);

  /**
   * Handle partner leaving - force cleanup for both users
   */
  const handlePartnerLeft = useCallback(async () => {
    if (isLeavingRef.current) return;
    
    // Get partner name from current match data
    const partnerName = currentMatchRef.current && 'partnerName' in currentMatchRef.current 
      ? currentMatchRef.current.partnerName 
      : 'Your partner';
    
    showInfo(`${partnerName} left`);
    await endSession();
  }, [endSession]);

  // Update ref whenever handlePartnerLeft changes
  useEffect(() => {
    handlePartnerLeftRef.current = handlePartnerLeft;
  }, [handlePartnerLeft]);

  /**
   * Next - find new partner (keeps camera/mic state)
   */
  const findNext = useCallback(async () => {
    if (isLeavingRef.current) {
      return;
    }
    
    isLeavingRef.current = true;
    
    try {
      // End current session
      setIsInSession(false);
      currentMatchRef.current = null;

      // Clear chat messages
      clearMessages();

      // Wait 100ms to ensure any in-flight messages are delivered to backend
      await new Promise(resolve => setTimeout(resolve, 100));

      // Sequential cleanup to prevent race conditions
      // Step 1: Leave backend room and wait for confirmation
      await leaveRoom();
      
      // Step 2: Ensure backend cleanup is complete (small delay)
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 3: Cleanup RTC connection
      await leaveRTC();
      
      // Step 4: Wait for RTC cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      // Use same UID from context (no new UID generation)
      const uid = parseInt(currentUidRef.current, 10);

      // Rejoin queue (camera/mic state is preserved in useAgoraRTC hook)
      if (userDataRef.current) {
        const authData = {
          uid, // Same UID for all searches until page reload
          name: userDataRef.current.name,
          gender: userDataRef.current.gender,
        };
        
        // Join matchmaking queue (same UID, new search)
        join(authData);
      }
    } catch (error) {
      // Log error and notify user if it's a critical issue
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorLower = errorMsg.toLowerCase();
      
      if (errorLower.includes('permission') || errorLower.includes('denied')) {
        showError('Camera/microphone permission denied. Please allow access in your browser settings.', ErrorCode.CAMERA_PERMISSION_DENIED);
      } else if (errorLower.includes('device') || errorLower.includes('not found')) {
        showError('Camera or microphone not found. Please check your devices.', ErrorCode.MEDIA_DEVICE_NOT_FOUND);
      } else if (errorLower.includes('timeout')) {
        showError('Connection timeout. Please check your network and try again.', ErrorCode.CONNECTION_TIMEOUT);
      } else {
        // For other errors, allow retry
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
    }
  }, [leaveRoom, leaveRTC, join, clearMessages]);

  // Cleanup on unmount only (not on endSession changes)
  useEffect(() => {
    const cleanupRef = { cancelled: false };
    
    return () => {
      cleanupRef.cancelled = true;
      
      // Proper async cleanup with error handling
      (async () => {
        try {
          clearMessages();
          await leaveRTC();
          if (!cleanupRef.cancelled) {
            await leaveRoom();
          }
        } catch (error) {
          // Silently handle cleanup errors
        }
      })();
    };
  }, []); // Empty deps - only run on mount/unmount

  return {
    // Connection state
    connectionState,
    matchData,
    isMatched,
    isInSession,
    matchmakingError,

    // Media state
    isCameraOn,
    isMicOn,
    isRTCInitialized,
    isRemoteCameraOn,
    isRemoteMicOn,

    // Messages
    messages,
    isPartnerTyping,

    // Actions
    startSearch: beginSearch, // Expose beginSearch as startSearch
    stopSearch,
    endSession,
    findNext,
    toggleCamera,
    toggleMicrophone,
    switchCamera,
    switchMicrophone,
    getCurrentDevices,
    sendMessage,
    sendTypingIndicator,
  };
};
