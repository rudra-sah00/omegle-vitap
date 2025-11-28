/**
 * User Context and Provider
 * Manages user identity state for the session
 */

'use client';

import React, { createContext, useState, useEffect, type ReactNode } from 'react';

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
 */
function generateUID(): number {
  const timestamp = Date.now() % 1000000;
  const random = Math.floor(Math.random() * 1000);
  return timestamp * 1000 + random;
}

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Male');
  const [uid, setUid] = useState(() => generateUID());

  useEffect(() => {
    setUid(generateUID());
  }, []);

  return (
    <UserContext.Provider value={{ name, gender, uid, setName, setGender }}>
      {children}
    </UserContext.Provider>
  );
}
