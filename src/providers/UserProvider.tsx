/**
 * User Context and Provider
 * Manages user identity state for the session
 * 
 * @description Provides user information (name, gender, unique ID) across
 * the application. The UID is generated client-side to avoid hydration
 * mismatches between server and client rendering.
 */

'use client';

import React, { createContext, useState, useMemo, type ReactNode } from 'react';

export interface UserContextType {
  /** User's display name */
  name: string;
  /** User's selected gender */
  gender: string;
  /** Unique identifier for this session */
  uid: number;
  /** Set the user's display name */
  setName: (name: string) => void;
  /** Set the user's gender */
  setGender: (gender: string) => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * Generate unique UID per tab/session
 * Uses crypto API for better randomness when available
 * 
 * @returns A unique numeric identifier
 */
function generateUID(): number {
  // Only generate on client side
  if (typeof window === 'undefined') return 0;
  
  const timestamp = Date.now() % 1000000;
  let random: number;
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    random = array[0] % 1000;
  } else {
    random = Math.floor(Math.random() * 1000);
  }
  
  return timestamp * 1000 + random;
}

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Male');
  
  // Generate UID once using lazy initialization
  // Returns 0 during SSR, actual value on client (handled by generateUID)
  const [uid] = useState(generateUID);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    name,
    gender,
    uid,
    setName,
    setGender,
  }), [name, gender, uid]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}
