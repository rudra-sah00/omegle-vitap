/**
 * Hook to manage the complete chat session lifecycle
 * Integrates matchmaking, RTC, and RTM
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { useMatchmaking } from './useMatchmaking';
import { useAgoraRTC } from './useAgoraRTC';
import { useAgoraRTM } from './useAgoraRTM';
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
    onAuthenticated: () => {
      console.log('✅ Joined matchmaking queue, waiting for match...');
    },
    onMatched: handleMatched,
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
  async function handleMatched(matchData: MatchDataMatched) {
    console.log('🎯 handleMatched called', { isLeavingRef: isLeavingRef.current, isInSession, isRTCInitialized });
    
    if (isLeavingRef.current || isInSession || isRTCInitialized) {
      console.log('⚠️ Skipping match - already in session or leaving');
      return;
    }
    
    currentMatchRef.current = matchData;

    try {
      // Initialize both RTC and RTM with the same UID
      const uid = currentUidRef.current;
      
      console.log('🚀 Starting RTC and RTM initialization...');
      // Initialize RTC (required) and RTM (optional - may fail if not enabled)
      const [rtcResult, rtmResult] = await Promise.allSettled([
        initializeRTC(matchData, uid, localVideoElementId, remoteVideoElementId),
        initializeRTM(matchData, uid),
      ]);

      console.log('📊 Initialization results:', {
        rtc: rtcResult.status,
        rtm: rtmResult.status
      });

      // Check if RTC initialized successfully (RTM is optional)
      if (rtcResult.status === 'rejected') {
        console.error('❌ RTC failed:', rtcResult.reason);
        throw new Error('Failed to initialize video/audio');
      }

      console.log('✅ Setting isInSession = true');
      setIsInSession(true);
    } catch (error) {
      console.error('❌ handleMatched error:', error);
      showError('Failed to join video call. Please try again.', ErrorCode.CHANNEL_JOIN_FAILED);
      await endSession();
    }
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

    // Debug logging
    console.log('🔐 Joining with data:', authData);

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
   * Handle partner leaving - force cleanup for both users
   */
  const handlePartnerLeft = useCallback(async () => {
    if (isLeavingRef.current) return;
    
    showInfo('Your chat partner has disconnected.');
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

    // Use same UID from context (no new UID generation)
    const uid = parseInt(currentUidRef.current, 10);

    // Rejoin queue (camera/mic state is preserved in useAgoraRTC hook)
    if (userDataRef.current) {
      const authData = {
        uid, // Same UID for all searches until page reload
        name: userDataRef.current.name,
        gender: userDataRef.current.gender,
      };
      
      // Join matchmaking queue with new UID
      join(authData);
      isLeavingRef.current = false;
    } else {
      isLeavingRef.current = false;
    }
  }, [leaveRTC, leaveRTM, join]);

  // Cleanup on unmount
  // Cleanup on unmount only (not on endSession changes)
  useEffect(() => {
    return () => {
      // Call cleanup directly to avoid dependency issues
      Promise.all([
        leaveRTC(),
        leaveRTM(),
      ]).then(() => {
        leaveRoom();
      });
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
    isRTMInitialized,

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
