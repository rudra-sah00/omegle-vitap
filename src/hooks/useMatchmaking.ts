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
  MatchDataMatched,
  UserData,
  ServerMessage,
} from '@/types/matchmaking';

interface UseMatchmakingOptions {
  autoConnect?: boolean;
  userData?: UserData; // User data for authentication
  onAuthenticated?: () => void;
  onMatched?: (matchData: MatchData) => void;
  onPartnerLeft?: () => void;
  onError?: (error: string) => void;
}

interface UseMatchmakingReturn {
  connectionState: ConnectionState;
  matchData: MatchDataMatched | null;
  error: string | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  isWaiting: boolean;
  isMatched: boolean;
  join: (userData: UserData) => void;
  leaveRoom: () => void;
  cancelSearch: () => void;
  disconnect: () => void;
}

export const useMatchmaking = (options: UseMatchmakingOptions = {}): UseMatchmakingReturn => {
  const {
    autoConnect = false,
    userData,
    onAuthenticated,
    onMatched,
    onPartnerLeft,
    onError,
  } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [matchData, setMatchData] = useState<MatchDataMatched | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const wsRef = useRef<WebSocketService | null>(null);
  const isJoiningRef = useRef(false);
  const isLeavingRef = useRef(false);
  const lastErrorTimeRef = useRef<number>(0);
  const lastErrorMessageRef = useRef<string>('');

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
    switch (message.type) {
      case 'match':
        if (message.data.status === 'waiting') {
          // Still searching for match
          setIsAuthenticated(true);
          setConnectionState('waiting');
          setError(null);
          onAuthenticated?.();
        } else if (message.data.status === 'matched') {
          // Match found!
          setConnectionState('matched');
          setMatchData(message.data);
          setError(null);
          isJoiningRef.current = false;
          onMatched?.(message.data);
        }
        break;

      case 'reconnected':
        // Reconnected to existing session
        setConnectionState('matched');
        // Convert reconnected data to match data format
        setMatchData({
          status: 'matched',
          roomId: message.data.roomId,
          channelName: message.data.channelName,
          partnerUid: message.data.partnerUid,
          rtcToken: '', // Will need to refresh
          rtmToken: '',
          partnerName: '',
          expiresAt: 0,
        } as MatchDataMatched);
        setError(null);
        break;

      case 'session_expired':
        setConnectionState('connected');
        setMatchData(null);
        setError('Session expired. Please join again.');
        break;

      case 'partner_left':
        setConnectionState('connected');
        setMatchData(null);
        setError(null);
        onPartnerLeft?.();
        break;

      case 'error':
        console.error('❌ Server error:', message.data);
        setConnectionState('error');
        setError(message.data.message);
        isJoiningRef.current = false;
        onError?.(message.data.message);
        showError(message.data.message, ErrorCode.CONNECTION_LOST);
        break;

      case 'pong':
        // Heartbeat response, no action needed
        break;

      // Ignore message and signal types - handled by other hooks
      case 'message':
      case 'signal':
        break;

      default:
        console.warn('Unknown message type:', (message as any).type);
    }
  }, [onAuthenticated, onMatched, onPartnerLeft, onError]);

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
      let errorMsg = '';
      let errorCode = ErrorCode.CONNECTION_LOST;
      
      if (event.code === 1006 || event.code >= 1011) {
        // Backend server is down or unavailable
        errorMsg = 'Service temporarily unavailable. Reconnecting...';
        errorCode = ErrorCode.BACKEND_UNAVAILABLE;
      } else {
        errorMsg = 'Connection lost. Reconnecting...';
      }
      
      // Throttle error messages - only show if different or 5 seconds have passed
      const now = Date.now();
      const timeSinceLastError = now - lastErrorTimeRef.current;
      const isDifferentError = errorMsg !== lastErrorMessageRef.current;
      
      if (isDifferentError || timeSinceLastError > 5000) {
        setError(errorMsg);
        showError(errorMsg, errorCode);
        lastErrorTimeRef.current = now;
        lastErrorMessageRef.current = errorMsg;
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
      if (error.message.includes('Backend server') || error.message.includes('not responding') || error.message.includes('unavailable')) {
        errorMessage = error.message;
        errorCode = ErrorCode.BACKEND_UNAVAILABLE;
      } else if (error.message.includes('Authentication')) {
        errorMessage = error.message;
        errorCode = ErrorCode.AUTH_FAILED;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Connection timeout. Please check your internet.';
        errorCode = ErrorCode.CONNECTION_TIMEOUT;
      } else if (error.message.includes('Cannot connect')) {
        errorMessage = error.message;
        errorCode = ErrorCode.BACKEND_UNAVAILABLE;
      }
    }
    
    // Throttle error messages - only show if different or 5 seconds have passed
    const now = Date.now();
    const timeSinceLastError = now - lastErrorTimeRef.current;
    const isDifferentError = errorMessage !== lastErrorMessageRef.current;
    
    if (isDifferentError || timeSinceLastError > 5000) {
      setError(errorMessage);
      showError(errorMessage, errorCode);
      lastErrorTimeRef.current = now;
      lastErrorMessageRef.current = errorMessage;
      onError?.(errorMessage);
    }
  }, [onError]);

  /**
   * Join matchmaking queue
   */
  const join = useCallback((userData: UserData) => {
    const ws = getWs();

    if (!ws.isConnected()) {
      const errorMsg = 'Not connected to server. Please wait and try again.';
      setError(errorMsg);
      showError(errorMsg, ErrorCode.CONNECTION_LOST);
      return;
    }

    if (isJoiningRef.current) {
      console.log('Already joining, skipping duplicate request');
      return;
    }

    console.log('📤 Sending join message:', { type: 'join', data: userData });

    const success = ws.send({
      type: 'join',
      data: userData,
    });

    if (success) {
      isJoiningRef.current = true;
      setConnectionState('waiting');
    } else {
      setError('Failed to join queue');
      setConnectionState('error');
    }
  }, [getWs]);

  /**
   * Leave current room
   */
  const leaveRoom = useCallback(() => {
    // Prevent duplicate leave calls
    if (isLeavingRef.current) {
      console.log('⚠️ Leave already in progress, skipping');
      return;
    }

    const ws = getWs();

    if (!matchData) {
      // Silent return - no active room to leave (normal during initialization)
      return;
    }

    isLeavingRef.current = true;
    console.log('📤 Sending leave message to server');
    
    const success = ws.send({
      type: 'leave',
      data: {},
    });

    if (success) {
      setConnectionState('connected');
      setMatchData(null);
      // Reset flag after a short delay to allow for next operation
      setTimeout(() => {
        isLeavingRef.current = false;
      }, 500);
    } else {
      setError('Failed to leave room');
      isLeavingRef.current = false;
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
   * Auto-join when connected if userData is provided
   */
  useEffect(() => {
    if (connectionState === 'connected' && !isAuthenticated && userData) {
      join(userData);
    }
  }, [connectionState, isAuthenticated, userData, join]);

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
  const cancelSearch = useCallback(() => {
    if (!wsRef.current || connectionState !== 'waiting') {
      return;
    }

    const ws = wsRef.current;
    ws.send({
      type: 'cancel',
      data: {},
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
    isAuthenticated,
    isWaiting: connectionState === 'waiting',
    isMatched: connectionState === 'matched',
    join,
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
