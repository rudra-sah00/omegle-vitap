/**
 * useUser Hook
 * Access user context state
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
