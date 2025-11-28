/**
 * Media State Context and Provider
 * Manages camera and microphone state across the application
 */

'use client';

import React, { createContext, useState, type ReactNode } from 'react';

export interface MediaStateContextType {
  isCameraOn: boolean;
  isMicOn: boolean;
  setCameraOn: (isOn: boolean) => void;
  setMicOn: (isOn: boolean) => void;
}

export const MediaStateContext = createContext<MediaStateContextType | undefined>(undefined);

interface MediaStateProviderProps {
  children: ReactNode;
}

export function MediaStateProvider({ children }: MediaStateProviderProps) {
  const [isCameraOn, setCameraOn] = useState(false);
  const [isMicOn, setMicOn] = useState(false);

  return (
    <MediaStateContext.Provider value={{ isCameraOn, isMicOn, setCameraOn, setMicOn }}>
      {children}
    </MediaStateContext.Provider>
  );
}
