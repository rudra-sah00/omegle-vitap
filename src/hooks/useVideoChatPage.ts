'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useVideoChat } from '@/hooks';
import { REDIRECT_DELAY } from '@/constants';
import { showError, showWarning, ErrorCode } from '@/lib';
import { isBrowserSupported } from '@/lib/browser-polyfill';
import { analytics } from '@/services/firebase';
import type { MatchDataMatched } from '@/types/matchmaking';

/**
 * Custom hook that encapsulates all video chat page business logic
 * This hook manages matchmaking, video chat, and UI state
 */
export function useVideoChatPage() {
  const { name, gender } = useUser();
  const router = useRouter();

  // Derive checkingStatus from name - no need for separate state
  const checkingStatus = !name;

  // Video chat hook (handles matchmaking, RTC, and messaging)
  const videoChat = useVideoChat({
    localVideoElementId: 'local-video',
    remoteVideoElementId: 'remote-video',
  });

  const {
    connectionState,
    matchData,
    isMatched,
    isInSession,
    isCameraOn,
    isMicOn,
    isScreenSharing,
    startSearch,
    stopSearch,
    endSession,
    findNext,
    reattachLocalVideo,
    sendTypingIndicator,
    getCurrentDevices,
  } = videoChat;

  // Get devices - now returns stable state values
  const devices = getCurrentDevices();

  // Get partner gender from match data
  const partnerGender = useMemo(() => {
    if (matchData && 'partnerGender' in matchData) {
      return (matchData as MatchDataMatched).partnerGender;
    }
    return undefined;
  }, [matchData]);

  // isSearchingForUI - page-level calculated value (different from videoChat.isSearching)
  const isSearchingForUI = useMemo(
    () => connectionState === 'waiting' && !isMatched,
    [connectionState, isMatched]
  );

  // Derive showMatchConfetti directly from isMatched - no need for separate state
  const showMatchConfetti = isMatched;

  // Re-attach local video when screen sharing mode changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isCameraOn) {
        reattachLocalVideo('local-video');
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [isScreenSharing, isCameraOn, reattachLocalVideo]);

  // Check browser compatibility - only run once on mount
  useEffect(() => {
    try {
      if (!isBrowserSupported()) {
        showError(
          'Your browser does not support video/audio. Please use Chrome, Firefox, or Safari 11+.',
          ErrorCode.MEDIA_DEVICE_NOT_FOUND
        );
        setTimeout(() => router.push('/welcome'), REDIRECT_DELAY);
      }
    } catch {
      // Browser compatibility check failed - allow fallback to default behavior
    }
  }, [router]);

  // Redirect to welcome if no name - effect handles the navigation side effect
  useEffect(() => {
    if (!name) {
      router.push('/welcome');
    }
  }, [name, router]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      // Connection restored - no toast needed
    };

    const handleOffline = () => {
      showError('Lost internet connection. Please check your network.', ErrorCode.CONNECTION_LOST);
      if (isInSession) {
        endSession();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isInSession, endSession]);

  // Handle page visibility changes (tab switching)
  useEffect(() => {
    let wasHidden = false;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasHidden = true;
      } else if (wasHidden && isInSession) {
        wasHidden = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isInSession]);

  // Prevent accidental page close during active session
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isInSession) {
        e.preventDefault();
        e.returnValue = 'You are in an active chat. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isInSession]);

  // Handle start button click
  const handleStart = useCallback(async () => {
    try {
      if (!name || !gender) {
        showError('Please set your name and gender first', ErrorCode.CONNECTION_LOST);
        router.push('/welcome');
        return;
      }

      if (isInSession) {
        showWarning('Already in an active chat session');
        return;
      }

      if (!navigator.onLine) {
        showError('No internet connection. Please check your network.', ErrorCode.CONNECTION_LOST);
        return;
      }

      analytics.trackMatchStart({
        camera: isCameraOn,
        microphone: isMicOn,
      });

      await startSearch({
        name,
        gender,
        targetGender: undefined,
      });
    } catch {
      // Search initialization failed - show generic error since specific error is unknown
      showError('Failed to start search. Please try again.', ErrorCode.CONNECTION_LOST);
    }
  }, [name, gender, isInSession, isCameraOn, isMicOn, startSearch, router]);

  // Handle stop searching
  const handleStop = useCallback(async () => {
    try {
      analytics.trackMatchEnded('user_stop');
      await stopSearch();
    } catch {
      // Cancel request failed - likely already cancelled or disconnected, safe to ignore
    }
  }, [stopSearch]);

  // Handle next button (find new partner)
  const handleNext = useCallback(async () => {
    try {
      if (!navigator.onLine) {
        showError('No internet connection. Please check your network.', ErrorCode.CONNECTION_LOST);
        return;
      }
      analytics.trackMatchEnded('user_skip');
      await findNext();
    } catch {
      // Find next failed - show generic error since specific error is unknown
      showError('Failed to find next partner. Please try again.', ErrorCode.CONNECTION_LOST);
    }
  }, [findNext]);

  // Handle message input typing
  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (isInSession) {
        sendTypingIndicator(isTyping);
      }
    },
    [isInSession, sendTypingIndicator]
  );

  // Navigate to welcome page
  const goToWelcome = useCallback(() => {
    router.push('/welcome');
  }, [router]);

  // Reload page
  const reloadPage = useCallback(() => {
    window.location.reload();
  }, []);

  return {
    // User state
    name,
    checkingStatus,

    // Match state - derived or augmented values
    isSearchingForUI,
    partnerGender,
    showMatchConfetti,

    // Video chat state (includes matchData, isMatched, connectionState, matchmakingError, etc.)
    ...videoChat,
    devices,

    // Page-level actions
    handleStart,
    handleStop,
    handleNext,
    handleTyping,
    goToWelcome,
    reloadPage,
  };
}
