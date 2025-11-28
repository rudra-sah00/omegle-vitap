/**
 * useMatchmakingMachine Hook
 * 
 * XState-powered matchmaking hook that provides predictable state management
 * for the WebSocket connection and matchmaking flow.
 * 
 * Benefits over manual state management:
 * - Visualizable state machine (use XState Visualizer)
 * - Impossible invalid states (e.g., can't be matched without connecting first)
 * - Clear state transition documentation
 * - Built-in action/guard system
 * 
 * @example
 * ```tsx
 * function MatchmakingComponent() {
 *   const {
 *     state,
 *     matchData,
 *     error,
 *     isWaiting,
 *     isMatched,
 *     join,
 *     leaveRoom,
 *     cancelSearch,
 *   } = useMatchmakingMachine({
 *     onMatched: (match) => console.log('Matched!', match),
 *     onPartnerLeft: () => console.log('Partner left'),
 *   });
 *   
 *   return <div>State: {state}</div>;
 * }
 * ```
 */

import { useEffect, useCallback, useRef } from 'react';
import { useMachine } from '@xstate/react';
import { matchmakingMachine, type MatchmakingState } from '@/machines';
import { getSocketIOService, destroySocketIOService, type SocketIOService } from '@/services/socket';
import { showError, ErrorCode } from '@/lib/toast';
import { analytics } from '@/services/firebase';
import { SEARCH_TIMEOUT, ERROR_DEDUPE_WINDOW, LEAVE_DEBOUNCE_DELAY } from '@/constants';
import type { MatchDataMatched, UserData, ServerMessage } from '@/types/matchmaking';

// ============================================
// HOOK OPTIONS
// ============================================

interface UseMatchmakingMachineOptions {
  /** Whether to connect immediately on mount */
  autoConnect?: boolean;
  /** Pre-filled user data for auto-joining */
  userData?: UserData;
  /** Callback when user is authenticated and in queue */
  onAuthenticated?: () => void;
  /** Callback when matched with another user */
  onMatched?: (matchData: MatchDataMatched) => void;
  /** Callback when chat partner leaves */
  onPartnerLeft?: () => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
}

// ============================================
// HOOK RETURN TYPE
// ============================================

interface UseMatchmakingMachineReturn {
  /** Current state name */
  state: MatchmakingState;
  /** Match data when matched (null otherwise) */
  matchData: MatchDataMatched | null;
  /** Current error message (null if no error) */
  error: string | null;
  /** Whether socket is connected */
  isConnected: boolean;
  /** Whether user is authenticated with server */
  isAuthenticated: boolean;
  /** Whether user is waiting for a match */
  isWaiting: boolean;
  /** Whether user is currently matched */
  isMatched: boolean;
  /** Function to join the matchmaking queue */
  join: (userData: UserData) => void;
  /** Function to leave current chat room */
  leaveRoom: () => void;
  /** Function to cancel matchmaking search */
  cancelSearch: () => void;
  /** Function to disconnect from server */
  disconnect: () => void;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useMatchmakingMachine(
  options: UseMatchmakingMachineOptions = {}
): UseMatchmakingMachineReturn {
  const {
    userData: initialUserData,
    onAuthenticated,
    onMatched,
    onPartnerLeft,
    onError,
  } = options;

  // XState machine instance
  const [snapshot, send] = useMachine(matchmakingMachine);

  // Refs for stable references
  const wsRef = useRef<SocketIOService | null>(null);
  const isLeavingRef = useRef(false);
  const lastErrorTimeRef = useRef<number>(0);
  const lastErrorMessageRef = useRef<string>('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingJoinRef = useRef<UserData | null>(null);

  // Get or create WebSocket service
  const getWs = useCallback(() => {
    if (!wsRef.current) {
      wsRef.current = getSocketIOService();
    }
    return wsRef.current;
  }, []);

  // ============================================
  // MESSAGE HANDLER
  // ============================================

  const handleMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'match':
        if (message.data.status === 'waiting') {
          // Server confirmed we're in queue
          onAuthenticated?.();
        } else if (message.data.status === 'matched') {
          // Clear search timeout
          if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
          }
          
          // Track match in analytics
          analytics.trackMatchFound();
          
          // Transition to matched state
          send({ type: 'MATCHED', matchData: message.data });
          onMatched?.(message.data);
        }
        break;

      case 'reconnected':
        // Server acknowledged reconnection
        send({ type: 'CONNECTED' });
        break;

      case 'session_expired':
        send({ type: 'ERROR', error: 'Session expired. Please join again.' });
        break;

      case 'partner_left':
        send({ type: 'PARTNER_LEFT' });
        onPartnerLeft?.();
        break;

      case 'kicked':
        showError(message.data.message || 'You have been removed from the chat', ErrorCode.AUTH_FAILED);
        send({ type: 'PARTNER_LEFT' });
        onPartnerLeft?.();
        break;

      case 'room_closed':
        showError(message.data.message || 'Chat room was closed', ErrorCode.CONNECTION_LOST);
        send({ type: 'PARTNER_LEFT' });
        onPartnerLeft?.();
        break;

      case 'error':
        const errorMsg = message.data.message.toLowerCase();
        
        // Ignore non-critical errors
        if (errorMsg.includes('unknown message type') || errorMsg.includes('typing')) {
          break;
        }
        
        // Handle "not in active chat" as partner left
        if (errorMsg.includes('not in active chat') || errorMsg.includes('not in a room')) {
          send({ type: 'PARTNER_LEFT' });
          onPartnerLeft?.();
          break;
        }
        
        // Handle as real error
        send({ type: 'ERROR', error: message.data.message });
        showError(message.data.message, ErrorCode.CONNECTION_LOST);
        onError?.(message.data.message);
        break;

      case 'pong':
      case 'message':
      case 'signal':
        // Handled elsewhere or ignored
        break;
    }
  }, [send, onAuthenticated, onMatched, onPartnerLeft, onError]);

  // ============================================
  // CONNECTION HANDLERS
  // ============================================

  const handleOpen = useCallback(() => {
    send({ type: 'CONNECTED' });
  }, [send]);

  const handleClose = useCallback(() => {
    const wasActive = snapshot.value === 'waiting' || snapshot.value === 'matched';
    
    send({ type: 'CONNECTION_LOST' });

    if (wasActive) {
      const errorMsg = 'Connection lost. Please try again.';
      const now = Date.now();
      const timeSinceLastError = now - lastErrorTimeRef.current;
      const isDifferentError = errorMsg !== lastErrorMessageRef.current;
      
      if (isDifferentError || timeSinceLastError > ERROR_DEDUPE_WINDOW) {
        showError(errorMsg, ErrorCode.CONNECTION_LOST);
        lastErrorTimeRef.current = now;
        lastErrorMessageRef.current = errorMsg;
      }
    }
  }, [send, snapshot.value]);

  const handleError = useCallback((error: Event | Error) => {
    let errorMessage = 'Connection error. Please check your network.';
    let errorCode = ErrorCode.CONNECTION_LOST;
    
    if (error instanceof Error) {
      if (error.message.includes('Backend server') || 
          error.message.includes('not responding') || 
          error.message.includes('unavailable')) {
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
    
    const now = Date.now();
    const timeSinceLastError = now - lastErrorTimeRef.current;
    const isDifferentError = errorMessage !== lastErrorMessageRef.current;
    
    if (isDifferentError || timeSinceLastError > ERROR_DEDUPE_WINDOW) {
      send({ type: 'ERROR', error: errorMessage });
      showError(errorMessage, errorCode);
      lastErrorTimeRef.current = now;
      lastErrorMessageRef.current = errorMessage;
      onError?.(errorMessage);
    }
  }, [send, onError]);

  // ============================================
  // ACTION HANDLERS
  // ============================================

  const join = useCallback((userData: UserData) => {
    const ws = getWs();

    // If not connected, queue the join and connect first
    if (!ws.isConnected()) {
      pendingJoinRef.current = userData;
      send({ type: 'CONNECT' });
      ws.connect();
      return;
    }

    pendingJoinRef.current = null;

    // Clear any existing search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    // Send join request
    const success = ws.send({
      type: 'join',
      data: userData,
    });

    if (success) {
      send({ type: 'JOIN', userData });

      // Set search timeout
      const searchStartTime = Date.now();
      searchTimeoutRef.current = setTimeout(() => {
        const waitTime = Date.now() - searchStartTime;
        analytics.trackSearchTimeout(waitTime);
        
        // Cancel on server
        ws.send({ type: 'cancel', data: {} });
        
        // Update state machine
        send({ type: 'SEARCH_TIMEOUT' });
        showError('No match found. Please try again.', ErrorCode.CONNECTION_TIMEOUT);
        
        searchTimeoutRef.current = null;
      }, SEARCH_TIMEOUT);
    } else {
      send({ type: 'ERROR', error: 'Failed to join queue' });
    }
  }, [getWs, send]);

  const leaveRoom = useCallback(() => {
    if (isLeavingRef.current) return;
    
    const ws = getWs();
    
    if (snapshot.value !== 'matched') return;

    isLeavingRef.current = true;
    
    const success = ws.send({ type: 'leave', data: {} });

    if (success) {
      send({ type: 'LEAVE_ROOM' });
      setTimeout(() => {
        isLeavingRef.current = false;
      }, LEAVE_DEBOUNCE_DELAY);
    } else {
      send({ type: 'ERROR', error: 'Failed to leave room' });
      isLeavingRef.current = false;
    }
  }, [getWs, send, snapshot.value]);

  const cancelSearch = useCallback(() => {
    if (!wsRef.current) return;

    // Clear timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    pendingJoinRef.current = null;

    // Cancel on server
    wsRef.current.send({ type: 'cancel', data: {} });
    
    // Update state
    send({ type: 'CANCEL_SEARCH' });
  }, [send]);

  const disconnect = useCallback(() => {
    // Clear timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    pendingJoinRef.current = null;

    if (!wsRef.current) return;
    
    wsRef.current.disconnect();
    send({ type: 'DISCONNECT' });
  }, [send]);

  // ============================================
  // SETUP EFFECTS
  // ============================================

  // Setup socket event listeners
  useEffect(() => {
    const ws = getWs();

    const unsubscribeMessage = ws.onMessage(handleMessage);
    const unsubscribeOpen = ws.onOpen(handleOpen);
    const unsubscribeClose = ws.onClose(handleClose);
    const unsubscribeError = ws.onError(handleError);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }

      unsubscribeMessage();
      unsubscribeOpen();
      unsubscribeClose();
      unsubscribeError();
    };
  }, [getWs, handleMessage, handleOpen, handleClose, handleError]);

  // Handle pending join after connection
  useEffect(() => {
    if (snapshot.value === 'connected' && pendingJoinRef.current) {
      const userData = pendingJoinRef.current;
      pendingJoinRef.current = null;
      setTimeout(() => join(userData), 100);
    }
  }, [snapshot.value, join]);

  // Auto-join with initial user data
  useEffect(() => {
    if (snapshot.value === 'connected' && initialUserData) {
      queueMicrotask(() => {
        if (snapshot.value === 'connected') {
          join(initialUserData);
        }
      });
    }
  }, [snapshot.value, initialUserData, join]);

  // ============================================
  // RETURN VALUES
  // ============================================

  const currentState = snapshot.value as MatchmakingState;
  
  return {
    state: currentState,
    matchData: snapshot.context.matchData,
    error: snapshot.context.error,
    isConnected: ['connected', 'waiting', 'matched'].includes(currentState),
    isAuthenticated: currentState === 'waiting' || currentState === 'matched',
    isWaiting: currentState === 'waiting',
    isMatched: currentState === 'matched',
    join,
    leaveRoom,
    cancelSearch,
    disconnect,
  };
}

// ============================================
// CLEANUP HOOK
// ============================================

/**
 * Hook to cleanup WebSocket connection on app unmount
 */
export function useWebSocketCleanup() {
  useEffect(() => {
    return () => {
      destroySocketIOService();
    };
  }, []);
}
