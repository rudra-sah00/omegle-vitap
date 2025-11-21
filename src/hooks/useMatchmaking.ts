/**
 * React Hook for Matchmaking WebSocket
 * Manages connection state and matchmaking flow
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { getWebSocketService, destroyWebSocketService } from '@/lib/websocket';
import type {
  ConnectionState,
  MatchData,
  UserData,
  ServerMessage,
} from '@/types/matchmaking';

interface UseMatchmakingOptions {
  autoConnect?: boolean;
  onMatched?: (matchData: MatchData) => void;
  onPartnerLeft?: () => void;
  onError?: (error: string) => void;
}

interface UseMatchmakingReturn {
  connectionState: ConnectionState;
  matchData: MatchData | null;
  error: string | null;
  isConnected: boolean;
  isWaiting: boolean;
  isMatched: boolean;
  joinQueue: (userData: UserData) => void;
  leaveRoom: () => void;
  cancelSearch: (userData: UserData) => void;
  disconnect: () => void;
}

export const useMatchmaking = (options: UseMatchmakingOptions = {}): UseMatchmakingReturn => {
  const {
    autoConnect = false,
    onMatched,
    onPartnerLeft,
    onError,
  } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef(getWebSocketService());
  const isJoiningRef = useRef(false);

  /**
   * Handle incoming WebSocket messages
   */
  const handleMessage = useCallback((message: ServerMessage) => {
    const { data } = message;

    switch (data.status) {
      case 'waiting':
        console.log('[Matchmaking] Waiting for match...');
        setConnectionState('waiting');
        setError(null);
        break;

      case 'matched':
        console.log('[Matchmaking] Match found!', data);
        setConnectionState('matched');
        setMatchData(data);
        setError(null);
        isJoiningRef.current = false;
        onMatched?.(data);
        break;

      case 'left':
        console.log('[Matchmaking] Left room successfully');
        setConnectionState('connected');
        setMatchData(null);
        setError(null);
        break;

      case 'partner_left':
        console.log('[Matchmaking] Partner left the room');
        setConnectionState('connected');
        setMatchData(null);
        setError(null);
        onPartnerLeft?.();
        break;

      case 'cancelled':
        console.log('[Matchmaking] Search cancelled successfully');
        setConnectionState('connected');
        setMatchData(null);
        setError(null);
        isJoiningRef.current = false;
        break;

      case 'error':
        console.error('[Matchmaking] Error:', data.message);
        setConnectionState('error');
        setError(data.message);
        isJoiningRef.current = false;
        onError?.(data.message);
        break;

      case 'pong':
        // Heartbeat response, no action needed
        break;

      default:
        console.warn('[Matchmaking] Unknown status:', data);
    }
  }, [onMatched, onPartnerLeft, onError]);

  /**
   * Handle WebSocket open event
   */
  const handleOpen = useCallback(() => {
    console.log('[Matchmaking] WebSocket connected');
    setConnectionState('connected');
    setError(null);
  }, []);

  /**
   * Handle WebSocket close event
   */
  const handleClose = useCallback((event: CloseEvent) => {
    console.log('[Matchmaking] WebSocket closed:', event.code);
    setConnectionState('disconnected');
    setMatchData(null);

    // Don't set error for normal closure
    if (event.code !== 1000) {
      setError('Connection lost. Reconnecting...');
    }
  }, []);

  /**
   * Handle WebSocket error
   */
  const handleError = useCallback((error: Event | Error) => {
    console.error('[Matchmaking] WebSocket error:', error);
    setConnectionState('error');
    setError('Connection error. Please check your network.');
    onError?.('Connection error');
  }, [onError]);

  /**
   * Join matchmaking queue
   */
  const joinQueue = useCallback((userData: UserData) => {
    const ws = wsRef.current;

    console.log('[Matchmaking] WebSocket ready state:', ws.getReadyState());
    console.log('[Matchmaking] WebSocket connected:', ws.isConnected());

    if (!ws.isConnected()) {
      console.error('[Matchmaking] Cannot join: not connected');
      setError('Not connected to server. Please wait and try again.');
      return;
    }

    if (isJoiningRef.current) {
      console.warn('[Matchmaking] Already joining queue');
      return;
    }

    isJoiningRef.current = true;
    setConnectionState('waiting');
    setError(null);

    console.log('[Matchmaking] Sending join request with data:', JSON.stringify(userData, null, 2));

    const success = ws.send({
      type: 'join',
      data: userData,
    });

    if (!success) {
      setError('Failed to join queue');
      setConnectionState('error');
      isJoiningRef.current = false;
    }
  }, []);

  /**
   * Leave current room
   */
  const leaveRoom = useCallback(() => {
    const ws = wsRef.current;

    if (!matchData) {
      // Silent return - no active room to leave (normal during initialization)
      return;
    }

    const success = ws.send({
      type: 'leave',
      data: {},
    });

    if (success) {
      setConnectionState('connected');
      setMatchData(null);
    } else {
      setError('Failed to leave room');
    }
  }, [matchData]);

  /**
   * Manually disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    const ws = wsRef.current;
    ws.disconnect();
    setConnectionState('disconnected');
    setMatchData(null);
    setError(null);
  }, []);

  /**
   * Setup WebSocket event listeners
   */
  useEffect(() => {
    const ws = wsRef.current;

    const unsubscribeMessage = ws.onMessage(handleMessage);
    const unsubscribeOpen = ws.onOpen(handleOpen);
    const unsubscribeClose = ws.onClose(handleClose);
    const unsubscribeError = ws.onError(handleError);

    // Auto-connect if enabled
    if (autoConnect && !ws.isConnected()) {
      setConnectionState('connecting');
      ws.connect();
    }

    // Cleanup on unmount
    return () => {
      unsubscribeMessage();
      unsubscribeOpen();
      unsubscribeClose();
      unsubscribeError();
    };
  }, [autoConnect, handleMessage, handleOpen, handleClose, handleError]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Only disconnect if we're leaving the app entirely
      // Keep connection alive for navigation within the app
    };
  }, []);

  /**
   * Cancel search while waiting in queue
   */
  const cancelSearch = useCallback((userData: UserData) => {
    const ws = wsRef.current;

    if (!ws || connectionState !== 'waiting') {
      console.log('[Matchmaking] Cannot cancel: not waiting');
      return;
    }

    console.log('[Matchmaking] Cancelling search');
    ws.send({
      type: 'cancel',
      data: userData,
    });

    setConnectionState('connected');
    setMatchData(null);
    isJoiningRef.current = false; // Reset joining flag
  }, [connectionState]);

  return {
    connectionState,
    matchData,
    error,
    isConnected: connectionState === 'connected' || connectionState === 'waiting' || connectionState === 'matched',
    isWaiting: connectionState === 'waiting',
    isMatched: connectionState === 'matched',
    joinQueue,
    leaveRoom,
    cancelSearch,
    disconnect,
  };
};

/**
 * Hook to cleanup WebSocket on app unmount
 */
export const useWebSocketCleanup = () => {
  useEffect(() => {
    return () => {
      destroyWebSocketService();
    };
  }, []);
};
