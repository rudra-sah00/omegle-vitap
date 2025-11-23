/**
 * React Hook for Matchmaking WebSocket
 * Manages connection state and matchmaking flow
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocketIOService, destroySocketIOService, type SocketIOService } from '@/lib/socketio';
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

  const wsRef = useRef<SocketIOService | null>(null);
  const isJoiningRef = useRef(false);
  const isLeavingRef = useRef(false);
  const lastErrorTimeRef = useRef<number>(0);
  const lastErrorMessageRef = useRef<string>('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingJoinRef = useRef<UserData | null>(null);

  // Initialize WebSocket service only when needed
  const getWs = useCallback(() => {
    if (!wsRef.current) {
      wsRef.current = getSocketIOService();
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
          // Match found! Clear timeout
          if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
          }
          
          setConnectionState('matched');
          setMatchData(message.data);
          setError(null);
          isJoiningRef.current = false;
          onMatched?.(message.data);
        }
        break;

      case 'reconnected':
        // IMPORTANT: Ignore reconnected messages - require explicit user action to rejoin
        // 
        // Why? When User B reloads the page while in a session with User A:
        // 1. Backend detects User B had an active session (via UID)
        // 2. Backend sends 'reconnected' message to auto-rejoin the old room
        // 3. We ignore it to prevent auto-matching without user clicking "Start"
        // 4. User A sees "Partner left" as expected
        // 5. User B must explicitly click "Start" to find a new match
        //
        // Note: New UID is generated on each page reload (see UserContext.tsx)
        // which helps prevent stale session issues
        setConnectionState('connected');
        setMatchData(null);
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
        // Silently ignore typing-related errors (backend doesn't support it yet on production)
        const errorMsg = message.data.message.toLowerCase();
        if (errorMsg.includes('unknown message type') || errorMsg.includes('typing')) {
          break; // Silently ignore
        }
        
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
        break;
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
   * Handle Socket.IO disconnect event
   */
  const handleClose = useCallback(() => {
    setConnectionState('disconnected');
    setMatchData(null);

    // Show connection lost message
    const errorMsg = 'Connection lost. Reconnecting...';
    const errorCode = ErrorCode.CONNECTION_LOST;
    
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
      // Queue the join request for when connection is established
      pendingJoinRef.current = userData;
      setConnectionState('connecting');
      setError(null);
      return;
    }

    // Clear pending join since we're processing it now
    pendingJoinRef.current = null;

    // If already joining, allow retry after clearing the flag
    if (isJoiningRef.current) {
      // Reset flag to allow retry - handles edge case where join was stuck
      isJoiningRef.current = false;
    }

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    const success = ws.send({
      type: 'join',
      data: userData,
    });

    if (success) {
      isJoiningRef.current = true;
      setConnectionState('waiting');
      setError(null); // Clear any previous errors

      // Set 30-second timeout for search
      searchTimeoutRef.current = setTimeout(() => {
        // Check if still joining (not matched yet)
        if (isJoiningRef.current) {
          // Auto-cancel search after timeout
          const currentWs = wsRef.current;
          if (currentWs) {
            currentWs.send({
              type: 'cancel',
              data: {},
            });
          }

          setConnectionState('connected');
          setMatchData(null);
          isJoiningRef.current = false;
          
          const timeoutMsg = 'No match found. Please try again.';
          setError(timeoutMsg);
          showError(timeoutMsg, ErrorCode.CONNECTION_TIMEOUT);
        }
        searchTimeoutRef.current = null;
      }, 30000); // 30 seconds
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
      return;
    }

    const ws = getWs();

    if (!matchData) {
      // Silent return - no active room to leave (normal during initialization)
      return;
    }

    isLeavingRef.current = true;
    
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
    // Clear timeout on disconnect
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    // Clear any pending join request
    pendingJoinRef.current = null;

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
      // Clear search timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }

      unsubscribeMessage();
      unsubscribeOpen();
      unsubscribeClose();
      unsubscribeError();
    };
  }, [autoConnect, handleMessage, handleOpen, handleClose, handleError, getWs]);

  /**
   * Process pending join requests when connection becomes ready
   */
  useEffect(() => {
    if (connectionState === 'connected' && pendingJoinRef.current) {
      const userData = pendingJoinRef.current;
      pendingJoinRef.current = null;
      // Use setTimeout to ensure connection is fully ready
      setTimeout(() => {
        join(userData);
      }, 100);
    }
  }, [connectionState, join]);

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
    if (!wsRef.current) {
      return;
    }

    // Clear timeout if exists
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    // Clear any pending join request
    pendingJoinRef.current = null;

    // Allow cancel even if not in 'waiting' state to handle edge cases
    const ws = wsRef.current;
    ws.send({
      type: 'cancel',
      data: {},
    });

    // Reset all search-related state
    setConnectionState('connected');
    setMatchData(null);
    setError(null);
    isJoiningRef.current = false; // Reset joining flag
  }, []);

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
      destroySocketIOService();
    };
  }, []);
};
