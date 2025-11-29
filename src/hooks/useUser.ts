/**
 * useUser Hook
 * Access user context state and unique identifier
 *
 * @description Provides access to the user's unique identifier (UID)
 * which is generated and persisted in session storage. This hook must
 * be used within a UserProvider component.
 *
 * The UID is used for:
 * - Identifying the user in chat sessions
 * - Analytics tracking
 * - Socket.IO authentication
 *
 * @returns {UserContextType} User context with uid property
 * @throws {Error} If used outside of UserProvider
 *
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const { uid } = useUser();
 *
 *   const joinChat = () => {
 *     socket.emit('join', { uid });
 *   };
 *
 *   return <button onClick={joinChat}>Join</button>;
 * }
 * ```
 */

import { useContext } from 'react';
import { UserContext, type UserContextType } from '@/providers/UserProvider';

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
