'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserContextType {
  name: string;
  gender: string;
  uid: number;
  setName: (name: string) => void;
  setGender: (gender: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Generate UID once per session
const generateUID = () => Math.floor(Math.random() * 1000000);

export function UserProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Male');
  const [uid] = useState(generateUID()); // Generate once, never changes

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
