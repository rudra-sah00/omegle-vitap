"use client";

import { useEffect, RefObject } from "react";

export function useKeyboardShortcuts(
  isConnected: boolean,
  onNext: () => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isConnected) {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConnected, onNext]);
}

export function useVideoRenderer(
  videoRef: RefObject<HTMLDivElement | null>,
  videoTrack: any,
  enabled: boolean = true
) {
  useEffect(() => {
    if (videoTrack && videoRef.current && enabled) {
      videoTrack.play(videoRef.current);
    }
    return () => {
      if (videoTrack && enabled) {
        videoTrack.stop();
      }
    };
  }, [videoTrack, enabled]);
}
