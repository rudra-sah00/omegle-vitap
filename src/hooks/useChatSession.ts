/**
 * Hook to manage the complete chat session lifecycle
 * Integrates matchmaking, RTC, and RTM
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { useMatchmaking } from './useMatchmaking';
import { useAgoraRTC } from './useAgoraRTC';
import { useAgoraRTM } from './useAgoraRTM';
import { showError, showInfo, ErrorCode } from '@/lib/toast';
import type { MatchData } from '@/types/matchmaking';

interface UseChatSessionOptions {
  localVideoElementId: string;
  remoteVideoElementId: string;
}

export const useChatSession = (options: UseChatSessionOptions) => {
  const { localVideoElementId, remoteVideoElementId } = options;

  // Refs
  const currentUidRef = useRef<string>('');
  const currentMatchRef = useRef<MatchData | null>(null);
  const userDataRef = useRef<{ name: string; gender: 'male' | 'female' | 'other' } | null>(null);
  const isLeavingRef = useRef(false);

  // State
  const [isInSession, setIsInSession] = useState(false);

  // Matchmaking
  const {
    connectionState,
    matchData,
    error: matchmakingError,
    isMatched,
    joinQueue,
    leaveRoom,
    cancelSearch,
    disconnect,
  } = useMatchmaking({
    autoConnect: true,
    onMatched: handleMatched,
    onPartnerLeft: handlePartnerLeft,
    onError: handleMatchmakingError,
  });

  // Agora RTC (Video/Audio)
  const {
    isCameraOn,
    isMicOn,
    isRTCInitialized,
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
      // Remote user left
    },
  });

  // Agora RTM (Messaging)
  const {
    isRTMInitialized,
    messages,
    isPartnerTyping,
    initializeRTM,
    sendMessage,
    sendTypingIndicator,
    leaveRTM,
  } = useAgoraRTM({
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
  async function handleMatched(matchData: MatchData) {
    if (isLeavingRef.current || isInSession) {
      return;
    }
    
    currentMatchRef.current = matchData;

    try {
      // Initialize both RTC and RTM with the same UID
      const uid = currentUidRef.current;
      
      // Initialize RTC (required) and RTM (optional - may fail if not enabled)
      const [rtcResult] = await Promise.allSettled([
        initializeRTC(matchData, uid, localVideoElementId, remoteVideoElementId),
        initializeRTM(matchData, uid),
      ]);

      // Check if RTC initialized successfully (RTM is optional)
      if (rtcResult.status === 'rejected') {
        throw new Error('Failed to initialize video/audio');
      }

      setIsInSession(true);
      showInfo('Connected! Say hi to your new chat partner.');
    } catch (error) {
      showError('Failed to join video call. Please try again.', ErrorCode.CHANNEL_JOIN_FAILED);
      await endSession();
    }
  }

  /**
   * Handle partner leaving - force cleanup for both users
   */
  async function handlePartnerLeft() {
    if (isLeavingRef.current) return;
    
    showInfo('Your chat partner has disconnected.');
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
  const startSearch = useCallback(async (userData: {
    name: string;
    gender: string;
    targetGender?: string;
  }) => {
    // Generate unique UID for this session (uint32 for Agora)
    const uid = Math.floor(Math.random() * 1000000);
    currentUidRef.current = uid.toString();

    // Format user data for backend
    const formattedData = {
      uid, // Send as number for backend
      name: userData.name.trim(),
      gender: userData.gender.toLowerCase() as 'male' | 'female' | 'other',
      targetGender: userData.targetGender?.toLowerCase() as 'male' | 'female' | 'other' | undefined,
    };

    // Store user data for later use (cancel, findNext)
    userDataRef.current = {
      name: formattedData.name,
      gender: formattedData.gender,
    };

    await joinQueue(formattedData);
  }, [joinQueue]);

  /**
   * Stop searching (cancel while waiting)
   */
  const stopSearch = useCallback(async () => {
    // Cancel search if we have a current UID and user data
    if (currentUidRef.current && userDataRef.current) {
      cancelSearch({
        uid: parseInt(currentUidRef.current),
        name: userDataRef.current.name,
        gender: userDataRef.current.gender,
      });
    }
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

    // Cleanup Agora connections - this forces channel leave
    await Promise.all([
      leaveRTC(),
      leaveRTM(),
    ]);

    // Notify server we're leaving the room
    await leaveRoom();
    
    isLeavingRef.current = false;
  }, [leaveRTC, leaveRTM, leaveRoom]);

  /**
   * Next - find new partner (keeps camera/mic state)
   */
  const findNext = useCallback(async () => {
    if (isLeavingRef.current) {
      return;
    }
    
    isLeavingRef.current = true;
    
    // End current session
    setIsInSession(false);
    currentMatchRef.current = null;

    // Cleanup Agora connections
    await Promise.all([
      leaveRTC(),
      leaveRTM(),
    ]);
    
    // Wait a moment for Agora to fully disconnect
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate new UID for next session
    const uid = Math.floor(Math.random() * 1000000);
    currentUidRef.current = uid.toString();

    // Rejoin queue (camera/mic state is preserved in useAgoraRTC hook)
    if (userDataRef.current) {
      const lastUserData = {
        uid, // Send as number
        name: userDataRef.current.name,
        gender: userDataRef.current.gender,
      };
      
      await joinQueue(lastUserData);
      isLeavingRef.current = false;
    } else {
      isLeavingRef.current = false;
    }
  }, [leaveRTC, leaveRTM, joinQueue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endSession();
    };
  }, [endSession]);

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
    isRTMInitialized,

    // Messages
    messages,
    isPartnerTyping,

    // Actions
    startSearch,
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
