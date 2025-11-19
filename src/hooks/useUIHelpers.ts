"use client";

import { useEffect, RefObject } from "react";
import type { ICameraVideoTrack, IRemoteVideoTrack } from "agora-rtc-sdk-ng";

/**
 * Hook to handle keyboard shortcuts for chat navigation
 * @param isConnected - Whether user is currently connected to a partner
 * @param onNext - Callback to trigger when Escape key is pressed
 */
export function useKeyboardShortcuts(isConnected: boolean, onNext: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isConnected) {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConnected, onNext]);
}

/**
 * Hook to render video track to a DOM element
 * @param videoRef - Reference to the DOM element where video should render
 * @param videoTrack - Agora video track to render
 * @param enabled - Whether video rendering is enabled
 */
export function useVideoRenderer(
  videoRef: RefObject<HTMLDivElement | null>,
  videoTrack: ICameraVideoTrack | IRemoteVideoTrack | null,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!videoTrack || !videoRef.current || !enabled) return;

    try {
      videoTrack.play(videoRef.current);
    } catch (_error) {}

    return () => {
      try {
        videoTrack.stop();
      } catch (_error) {}
    };
  }, [videoTrack, videoRef, enabled]);
}
