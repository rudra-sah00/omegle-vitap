/**
 * Matchmaking State Machine
 *
 * Manages the complete matchmaking lifecycle using XState for predictable
 * state transitions and clear state visualization.
 *
 * State Flow:
 * ┌────────────────────────────────────────────────────────────────────┐
 * │                                                                    │
 * │  disconnected ──► connecting ──► connected ──► waiting ──► matched │
 * │       ▲              │              │            │           │     │
 * │       │              ▼              ▼            ▼           │     │
 * │       └────────── error ◄──────────┴────────────┘            │     │
 * │                      │                                       │     │
 * │                      └───────────────────────────────────────┘     │
 * │                                                                    │
 * │  From matched: partner_left/leave_room → connected                 │
 * │  From any: disconnect → disconnected                               │
 * └────────────────────────────────────────────────────────────────────┘
 *
 * Events:
 * - CONNECT: Initiate connection to server
 * - CONNECTED: Socket connection established
 * - JOIN: Join matchmaking queue with user data
 * - AUTHENTICATED: Server confirmed queue entry
 * - MATCHED: Server found a match
 * - PARTNER_LEFT: Partner disconnected
 * - LEAVE_ROOM: User leaves current chat
 * - CANCEL_SEARCH: User cancels matchmaking
 * - DISCONNECT: Disconnect from server
 * - ERROR: Error occurred
 * - CONNECTION_LOST: Socket disconnected unexpectedly
 */

import { setup, assign } from 'xstate';
import type { MatchDataMatched, UserData } from '@/types/matchmaking';

// ============================================
// CONTEXT TYPE
// ============================================

export interface MatchmakingContext {
  /** Match data when matched (null otherwise) */
  matchData: MatchDataMatched | null;
  /** Current error message (null if no error) */
  error: string | null;
  /** User data for joining queue */
  userData: UserData | null;
  /** Search start time for timeout tracking */
  searchStartTime: number | null;
  /** Number of reconnection attempts */
  reconnectAttempts: number;
}

// ============================================
// EVENT TYPES
// ============================================

export type MatchmakingEvent =
  | { type: 'CONNECT' }
  | { type: 'CONNECTED' }
  | { type: 'JOIN'; userData: UserData }
  | { type: 'AUTHENTICATED' }
  | { type: 'MATCHED'; matchData: MatchDataMatched }
  | { type: 'PARTNER_LEFT' }
  | { type: 'LEAVE_ROOM' }
  | { type: 'CANCEL_SEARCH' }
  | { type: 'DISCONNECT' }
  | { type: 'ERROR'; error: string }
  | { type: 'CONNECTION_LOST' }
  | { type: 'SEARCH_TIMEOUT' }
  | { type: 'RETRY_CONNECT' };

// ============================================
// STATE MACHINE DEFINITION
// ============================================

export const matchmakingMachine = setup({
  types: {
    context: {} as MatchmakingContext,
    events: {} as MatchmakingEvent,
  },

  actions: {
    /** Clear match data on disconnect/leave */
    clearMatchData: assign({
      matchData: null,
    }),

    /** Clear error state */
    clearError: assign({
      error: null,
    }),

    /** Set error message */
    setError: assign({
      error: (_, params: { error: string }) => params.error,
    }),

    /** Store match data from server */
    setMatchData: assign({
      matchData: (_, params: { matchData: MatchDataMatched }) => params.matchData,
    }),

    /** Store user data for joining */
    setUserData: assign({
      userData: (_, params: { userData: UserData }) => params.userData,
    }),

    /** Record search start time */
    startSearchTimer: assign({
      searchStartTime: () => Date.now(),
    }),

    /** Clear search timer */
    clearSearchTimer: assign({
      searchStartTime: null,
    }),

    /** Increment reconnection attempts */
    incrementReconnectAttempts: assign({
      reconnectAttempts: ({ context }) => context.reconnectAttempts + 1,
    }),

    /** Reset reconnection attempts */
    resetReconnectAttempts: assign({
      reconnectAttempts: 0,
    }),

    /** Full context reset on disconnect */
    resetContext: assign({
      matchData: null,
      error: null,
      userData: null,
      searchStartTime: null,
      reconnectAttempts: 0,
    }),
  },

  guards: {
    /** Check if we should show connection lost error */
    wasInActiveState: ({ context }) => {
      // Show error if user was waiting or matched
      return context.searchStartTime !== null || context.matchData !== null;
    },

    /** Check if max reconnection attempts reached */
    maxReconnectAttemptsReached: ({ context }) => {
      return context.reconnectAttempts >= 3;
    },
  },
}).createMachine({
  id: 'matchmaking',

  context: {
    matchData: null,
    error: null,
    userData: null,
    searchStartTime: null,
    reconnectAttempts: 0,
  },

  initial: 'disconnected',

  states: {
    /**
     * DISCONNECTED
     * Initial state - not connected to server
     * Transitions: CONNECT → connecting
     */
    disconnected: {
      entry: ['resetContext'],
      on: {
        CONNECT: {
          target: 'connecting',
          actions: ['clearError'],
        },
      },
    },

    /**
     * CONNECTING
     * Attempting to connect to WebSocket server
     * Transitions: CONNECTED → connected, ERROR → error
     */
    connecting: {
      on: {
        CONNECTED: {
          target: 'connected',
          actions: ['resetReconnectAttempts'],
        },
        ERROR: {
          target: 'error',
          actions: [
            {
              type: 'setError',
              params: ({ event }) => ({ error: event.error }),
            },
          ],
        },
        DISCONNECT: {
          target: 'disconnected',
        },
      },
    },

    /**
     * CONNECTED
     * Connected to server, ready to join queue
     * Transitions: JOIN → waiting, DISCONNECT → disconnected
     */
    connected: {
      entry: ['clearMatchData', 'clearSearchTimer'],
      on: {
        JOIN: {
          target: 'waiting',
          actions: [
            {
              type: 'setUserData',
              params: ({ event }) => ({ userData: event.userData }),
            },
            'startSearchTimer',
          ],
        },
        DISCONNECT: {
          target: 'disconnected',
        },
        CONNECTION_LOST: {
          target: 'disconnected',
        },
        ERROR: {
          target: 'error',
          actions: [
            {
              type: 'setError',
              params: ({ event }) => ({ error: event.error }),
            },
          ],
        },
      },
    },

    /**
     * WAITING
     * In matchmaking queue, waiting for match
     * Transitions: MATCHED → matched, CANCEL_SEARCH → connected,
     *              SEARCH_TIMEOUT → connected (with error)
     */
    waiting: {
      on: {
        MATCHED: {
          target: 'matched',
          actions: [
            {
              type: 'setMatchData',
              params: ({ event }) => ({ matchData: event.matchData }),
            },
            'clearSearchTimer',
          ],
        },
        CANCEL_SEARCH: {
          target: 'connected',
          actions: ['clearSearchTimer'],
        },
        SEARCH_TIMEOUT: {
          target: 'connected',
          actions: [
            'clearSearchTimer',
            {
              type: 'setError',
              params: { error: 'No match found. Please try again.' },
            },
          ],
        },
        DISCONNECT: {
          target: 'disconnected',
        },
        CONNECTION_LOST: {
          target: 'disconnected',
          actions: [
            {
              type: 'setError',
              params: { error: 'Connection lost. Please try again.' },
            },
          ],
        },
        ERROR: {
          target: 'error',
          actions: [
            {
              type: 'setError',
              params: ({ event }) => ({ error: event.error }),
            },
          ],
        },
      },
    },

    /**
     * MATCHED
     * Successfully matched with partner
     * Transitions: LEAVE_ROOM → connected, PARTNER_LEFT → connected
     */
    matched: {
      on: {
        LEAVE_ROOM: {
          target: 'connected',
          actions: ['clearMatchData'],
        },
        PARTNER_LEFT: {
          target: 'connected',
          actions: ['clearMatchData'],
        },
        DISCONNECT: {
          target: 'disconnected',
        },
        CONNECTION_LOST: {
          target: 'disconnected',
          actions: [
            {
              type: 'setError',
              params: { error: 'Connection lost. Please try again.' },
            },
          ],
        },
        ERROR: {
          target: 'error',
          actions: [
            {
              type: 'setError',
              params: ({ event }) => ({ error: event.error }),
            },
          ],
        },
      },
    },

    /**
     * ERROR
     * Error state - recoverable by retrying
     * Transitions: RETRY_CONNECT → connecting, DISCONNECT → disconnected
     */
    error: {
      on: {
        RETRY_CONNECT: {
          target: 'connecting',
          actions: ['incrementReconnectAttempts'],
        },
        CONNECT: {
          target: 'connecting',
          actions: ['clearError'],
        },
        DISCONNECT: {
          target: 'disconnected',
        },
      },
    },
  },
});

// ============================================
// TYPE EXPORTS
// ============================================

export type MatchmakingState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'waiting'
  | 'matched'
  | 'error';
