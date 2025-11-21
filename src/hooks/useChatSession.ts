/**
 * Hook to manage the complete chat session lifecycle
 * Integrates matchmaking, RTC, and RTM
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { useMatchmaking } from './useMatchmaking';
import { useAgoraRTC } from './useAgoraRTC';
import { useAgoraRTM } from './useAgoraRTM';
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
    leaveRTC,
  } = useAgoraRTC({
    onRemoteVideoReady: (userId) => {
      console.log('🎥 Remote video ready:', userId);
    },
    onRemoteUserLeft: (userId) => {
      console.log('👋 Remote user left:', userId);
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
    onMessageReceived: (message) => {
      console.log('💬 Message received:', message.text);
    },
    onTypingIndicator: (isTyping) => {
      console.log('✍️ Partner typing:', isTyping);
    },
  });

  /**
   * Handle successful match
   */
  async function handleMatched(matchData: MatchData) {
    console.log('🎉 Match found!', matchData);
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
        throw new Error('Failed to initialize video/audio (RTC)');
      }

      setIsInSession(true);
      console.log('✅ Session started (RTC working, RTM may be disabled)');
    } catch (error) {
      console.error('❌ Failed to initialize Agora:', error);
      // TODO: Show error to user
    }
  }

  /**
   * Handle partner leaving
   */
  async function handlePartnerLeft() {
    console.log('👋 Partner left the chat');
    await endSession();
  }

  /**
   * Handle matchmaking errors
   */
  function handleMatchmakingError(error: string) {
    console.error('❌ Matchmaking error:', error);
    // TODO: Show error to user
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

    console.log('🔍 Starting search with:', formattedData);
    await joinQueue(formattedData);
  }, [joinQueue]);

  /**
   * Stop searching (cancel while waiting)
   */
  const stopSearch = useCallback(async () => {
    console.log('⏹️ Stopping search');
    
    // Cancel search if we have a current UID and user data
    if (currentUidRef.current && userDataRef.current) {
      cancelSearch({
        uid: parseInt(currentUidRef.current),
        name: userDataRef.current.name,
        gender: userDataRef.current.gender,
      });
    } else {
      console.warn('⚠️ Cannot cancel search: missing UID or user data');
    }
  }, [cancelSearch]);

  /**
   * End current session and cleanup
   */
  const endSession = useCallback(async () => {
    console.log('🔚 Ending session');
    
    setIsInSession(false);
    currentMatchRef.current = null;

    // Cleanup Agora connections
    await Promise.all([
      leaveRTC(),
      leaveRTM(),
    ]);

    // Leave room but keep WebSocket connected for next match
    await leaveRoom();
    console.log('✅ Session ended, WebSocket still connected');
  }, [leaveRTC, leaveRTM, leaveRoom]);

  /**
   * Next - find new partner (keeps camera/mic state)
   */
  const findNext = useCallback(async () => {
    console.log('⏭️ Finding next partner');
    
    // End current session
    setIsInSession(false);
    currentMatchRef.current = null;

    // Cleanup Agora connections
    await Promise.all([
      leaveRTC(),
      leaveRTM(),
    ]);

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
    } else {
      console.error('❌ Cannot find next: missing user data');
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
    sendMessage,
    sendTypingIndicator,
  };
};
