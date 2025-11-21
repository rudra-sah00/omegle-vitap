/**
 * React Hook for Matchmaking WebSocket
 * Manages connection state and matchmaking flow
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { getWebSocketService, destroyWebSocketService, WebSocketService } from '@/lib/websocket';
import { showError, ErrorCode } from '@/lib/toast';
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

  const wsRef = useRef<WebSocketService | null>(null);
  const isJoiningRef = useRef(false);

  // Initialize WebSocket service only when needed
  const getWs = useCallback(() => {
    if (!wsRef.current) {
      wsRef.current = getWebSocketService();
    }
    return wsRef.current;
  }, []);

  /**
   * Handle incoming WebSocket messages
   */
  const handleMessage = useCallback((message: ServerMessage) => {
    const { data } = message;

    switch (data.status) {
      case 'waiting':
        setConnectionState('waiting');
        setError(null);
        break;

      case 'matched':
        setConnectionState('matched');
        setMatchData(data);
        setError(null);
        isJoiningRef.current = false;
        onMatched?.(data);
        break;

      case 'left':
        setConnectionState('connected');
        setMatchData(null);
        setError(null);
        break;

      case 'partner_left':
      case 'partner_disconnected':
        setConnectionState('connected');
        setMatchData(null);
        setError(null);
        onPartnerLeft?.();
        break;

      case 'cancelled':
        setConnectionState('connected');
        setMatchData(null);
        setError(null);
        isJoiningRef.current = false;
        break;

      case 'error':
        setConnectionState('error');
        setError(data.message);
        isJoiningRef.current = false;
        onError?.(data.message);
        break;

      case 'pong':
        // Heartbeat response, no action needed
        break;

      default:
    }
  }, [onMatched, onPartnerLeft, onError]);

  /**
   * Handle WebSocket open event
   */
  const handleOpen = useCallback(() => {
    setConnectionState('connected');
    setError(null);
  }, []);

  /**
   * Handle WebSocket close event
   */
  const handleClose = useCallback((event: CloseEvent) => {
    setConnectionState('disconnected');
    setMatchData(null);

    // Don't set error for normal closure
    if (event.code !== 1000) {
      if (event.code === 1006 || event.code >= 1011) {
        // Backend server is down or unavailable
        const errorMsg = 'Service temporarily unavailable. Reconnecting...';
        setError(errorMsg);
        showError(errorMsg, ErrorCode.BACKEND_UNAVAILABLE);
      } else {
        const errorMsg = 'Connection lost. Reconnecting...';
        setError(errorMsg);
        showError(errorMsg, ErrorCode.CONNECTION_LOST);
      }
    }
  }, []);

  /**
   * Handle WebSocket error
   */
  const handleError = useCallback((error: Event | Error) => {
    setConnectionState('error');
    
    // Provide user-friendly error messages
    let errorMessage = 'Connection error. Please check your network.';
    let errorCode = ErrorCode.CONNECTION_LOST;
    
    if (error instanceof Error) {
      if (error.message.includes('Backend server') || error.message.includes('not responding')) {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
        errorCode = ErrorCode.BACKEND_UNAVAILABLE;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Connection timeout. Please check your internet.';
        errorCode = ErrorCode.CONNECTION_TIMEOUT;
      }
    }
    
    setError(errorMessage);
    showError(errorMessage, errorCode);
    onError?.('Connection error');
  }, [onError]);

  /**
   * Join matchmaking queue
   */
  const joinQueue = useCallback((userData: UserData) => {
    const ws = getWs();

    if (!ws.isConnected()) {
      const errorMsg = 'Not connected to server. Please wait and try again.';
      setError(errorMsg);
      showError(errorMsg, ErrorCode.CONNECTION_LOST);
      return;
    }

    if (isJoiningRef.current) {
      return;
    }

    isJoiningRef.current = true;
    setConnectionState('waiting');
    setError(null);

    const success = ws.send({
      type: 'join',
      data: userData,
    });

    if (!success) {
      setError('Failed to join queue');
      setConnectionState('error');
      isJoiningRef.current = false;
    }
  }, [getWs]);

  /**
   * Leave current room
   */
  const leaveRoom = useCallback(() => {
    const ws = getWs();

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
  }, [matchData, getWs]);

  /**
   * Manually disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (!wsRef.current) return;
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
    // Only initialize WebSocket if autoConnect is enabled
    if (!autoConnect) {
      return;
    }

    const ws = getWs();

    const unsubscribeMessage = ws.onMessage(handleMessage);
    const unsubscribeOpen = ws.onOpen(handleOpen);
    const unsubscribeClose = ws.onClose(handleClose);
    const unsubscribeError = ws.onError(handleError);

    // Connect if not already connected
    if (!ws.isConnected()) {
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
  }, [autoConnect, handleMessage, handleOpen, handleClose, handleError, getWs]);

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
    if (!wsRef.current || connectionState !== 'waiting') {
      return;
    }

    const ws = wsRef.current;
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
