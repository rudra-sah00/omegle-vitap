/**
 * Media State Context and Provider
 * Manages camera and microphone state across the application
 * 
 * @description Provides global media state management for camera and microphone
 * settings. Uses memoization to prevent unnecessary re-renders.
 * 
 * @example
 * ```tsx
 * // In a component
 * const { isCameraOn, setCameraOn } = useMediaState();
 * ```
 */

'use client';

import React, { createContext, useState, useMemo, type ReactNode } from 'react';

export interface MediaStateContextType {
  /** Whether the camera is currently on */
  isCameraOn: boolean;
  /** Whether the microphone is currently on */
  isMicOn: boolean;
  /** Set camera on/off state */
  setCameraOn: (isOn: boolean) => void;
  /** Set microphone on/off state */
  setMicOn: (isOn: boolean) => void;
}

export const MediaStateContext = createContext<MediaStateContextType | undefined>(undefined);

interface MediaStateProviderProps {
  children: ReactNode;
}

export function MediaStateProvider({ children }: MediaStateProviderProps) {
  const [isCameraOn, setCameraOn] = useState(false);
  const [isMicOn, setMicOn] = useState(false);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isCameraOn,
    isMicOn,
    setCameraOn,
    setMicOn,
  }), [isCameraOn, isMicOn]);

  return (
    <MediaStateContext.Provider value={contextValue}>
      {children}
    </MediaStateContext.Provider>
  );
}
