"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { agoraService } from '@/services/agoraService';
import type { ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';

interface MediaControlsContextType {
  // State
  isMicOn: boolean;
  isCameraOn: boolean;
  previewVideoTrack: ICameraVideoTrack | null;
  previewAudioTrack: IMicrophoneAudioTrack | null;
  
  // Actions
  setIsMicOn: (value: boolean) => void;
  setIsCameraOn: (value: boolean) => void;
  setPreviewVideoTrack: (track: ICameraVideoTrack | null) => void;
  setPreviewAudioTrack: (track: IMicrophoneAudioTrack | null) => void;
  
  // Methods
  togglePreviewMic: () => Promise<void>;
  togglePreviewCamera: () => Promise<void>;
  cleanupPreviewTracks: () => Promise<void>;
}

const MediaControlsContext = createContext<MediaControlsContextType | undefined>(undefined);

export function MediaControlsProvider({ children }: { children: ReactNode }) {
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [previewVideoTrack, setPreviewVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [previewAudioTrack, setPreviewAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);

  const togglePreviewMic = useCallback(async () => {
    if (!isMicOn) {
      // Turn ON microphone
      if (!previewAudioTrack) {
        const tracks = await agoraService.createLocalTracks(false, true);
        if (tracks.audioTrack) {
          setPreviewAudioTrack(tracks.audioTrack);
          setIsMicOn(true);
        }
      } else {
        await previewAudioTrack.setEnabled(true);
        setIsMicOn(true);
      }
    } else {
      // Turn OFF microphone
      if (previewAudioTrack) {
        await previewAudioTrack.setEnabled(false);
      }
      setIsMicOn(false);
    }
  }, [isMicOn, previewAudioTrack]);

  const togglePreviewCamera = useCallback(async () => {
    if (!isCameraOn) {
      // Turn ON camera
      if (!previewVideoTrack) {
        const tracks = await agoraService.createLocalTracks(true, false);
        if (tracks.videoTrack) {
          setPreviewVideoTrack(tracks.videoTrack);
          setIsCameraOn(true);
        }
      } else {
        await previewVideoTrack.setEnabled(true);
        setIsCameraOn(true);
      }
    } else {
      // Turn OFF camera
      if (previewVideoTrack) {
        await previewVideoTrack.setEnabled(false);
      }
      setIsCameraOn(false);
    }
  }, [isCameraOn, previewVideoTrack]);

  const cleanupPreviewTracks = useCallback(async () => {
    if (previewVideoTrack) {
      previewVideoTrack.stop();
      previewVideoTrack.close();
      setPreviewVideoTrack(null);
    }
    if (previewAudioTrack) {
      previewAudioTrack.stop();
      previewAudioTrack.close();
      setPreviewAudioTrack(null);
    }
  }, [previewVideoTrack, previewAudioTrack]);

  const value = {
    isMicOn,
    isCameraOn,
    previewVideoTrack,
    previewAudioTrack,
    setIsMicOn,
    setIsCameraOn,
    setPreviewVideoTrack,
    setPreviewAudioTrack,
    togglePreviewMic,
    togglePreviewCamera,
    cleanupPreviewTracks,
  };

  return (
    <MediaControlsContext.Provider value={value}>
      {children}
    </MediaControlsContext.Provider>
  );
}

export function useMediaControls() {
  const context = useContext(MediaControlsContext);
  if (context === undefined) {
    throw new Error('useMediaControls must be used within a MediaControlsProvider');
  }
  return context;
}
