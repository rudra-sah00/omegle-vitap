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
    const element = videoRef.current;
    if (!element) return;

    // Clear any existing video content if no track
    if (!videoTrack || !enabled) {
      // Remove all video/canvas elements to clear last frame
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
      return;
    }

    // Clear existing content before playing new track
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }

    try {
      videoTrack.play(element);
    } catch (_error) {
      // Error playing track
    }

    return () => {
      try {
        videoTrack.stop();
      } catch (_error) {
        // Track already stopped
      }
    };
  }, [videoTrack, videoRef, enabled]);
}
