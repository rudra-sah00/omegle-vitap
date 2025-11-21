'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserContextType {
  name: string;
  gender: string;
  setName: (name: string) => void;
  setGender: (gender: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Male');

  return (
    <UserContext.Provider value={{ name, gender, setName, setGender }}>
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
