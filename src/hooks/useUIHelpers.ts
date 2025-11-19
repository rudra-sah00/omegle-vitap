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
    if (!videoTrack || !videoRef.current || !enabled) return;

    try {
      videoTrack.play(videoRef.current);
    } catch (error) {
    }

    return () => {
      try {
        videoTrack.stop();
      } catch (error) {
      }
    };
  }, [videoTrack, videoRef, enabled]);
}
