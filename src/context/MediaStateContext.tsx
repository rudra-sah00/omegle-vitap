'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MediaStateContextType {
  isCameraOn: boolean;
  isMicOn: boolean;
  setCameraOn: (isOn: boolean) => void;
  setMicOn: (isOn: boolean) => void;
}

const MediaStateContext = createContext<MediaStateContextType | undefined>(undefined);

export function MediaStateProvider({ children }: { children: ReactNode }) {
  // Always start with camera and mic OFF on page load/reload
  // State persists only during active session (between matches)
  const [isCameraOn, setCameraOn] = useState(false);
  const [isMicOn, setMicOn] = useState(false);

  return (
    <MediaStateContext.Provider value={{ isCameraOn, isMicOn, setCameraOn, setMicOn }}>
      {children}
    </MediaStateContext.Provider>
  );
}

export function useMediaState() {
  const context = useContext(MediaStateContext);
  if (context === undefined) {
    throw new Error('useMediaState must be used within a MediaStateProvider');
  }
  return context;
}
