/**
 * User Context and Provider
 * Manages user identity state for the session
 */

'use client';

import React, { createContext, useState, useEffect, useMemo, type ReactNode } from 'react';

export interface UserContextType {
  name: string;
  gender: string;
  uid: number;
  setName: (name: string) => void;
  setGender: (gender: string) => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * Generate unique UID per tab/session
 * Uses crypto API for better randomness when available
 */
function generateUID(): number {
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
  // Initialize with 0 to avoid hydration mismatch, set real value on client
  const [uid, setUid] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  // Generate UID only on client side to prevent hydration mismatch
  useEffect(() => {
    setUid(generateUID());
    setIsHydrated(true);
  }, []);

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
