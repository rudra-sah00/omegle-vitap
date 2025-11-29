/**
 * Central Type Exports
 *
 * Re-exports all types from the types folder for cleaner imports
 */

// Matchmaking & WebSocket types
export * from './matchmaking';

// Legacy basic types (kept for backward compatibility)
export interface User {
  id: string;
  username?: string;
}

// Note: ChatMessage is defined in matchmaking.ts as a client message type
// For the hook's internal message format, use MessageData from useChat
