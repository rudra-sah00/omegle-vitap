'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface UserContextType {
  name: string;
  gender: string;
  uid: number;
  setName: (name: string) => void;
  setGender: (gender: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Generate unique UID per tab/session (timestamp + random ensures uniqueness)
const generateUID = () => {
  const timestamp = Date.now() % 1000000; // Last 6 digits of timestamp
  const random = Math.floor(Math.random() * 1000); // Random 0-999
  return timestamp * 1000 + random; // Combine for unique ID
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Male');
  const [uid, setUid] = useState(() => generateUID()); // Initialize with function to ensure fresh generation

  // Force new UID generation on mount (ensures new UID on every page reload)
  // This prevents backend from detecting a previous session and auto-reconnecting
  // Each page reload = new UID = fresh start = no auto-matching
  useEffect(() => {
    setUid(generateUID());
  }, []);

  return (
    <UserContext.Provider value={{ name, gender, uid, setName, setGender }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
