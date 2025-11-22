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

// Generate unique UID per tab/session (timestamp + random ensures uniqueness)
const generateUID = () => {
  const timestamp = Date.now() % 1000000; // Last 6 digits of timestamp
  const random = Math.floor(Math.random() * 1000); // Random 0-999
  return timestamp * 1000 + random; // Combine for unique ID
};

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
