"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ICameraVideoTrack, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";
import { agoraService } from "@/services/agoraService";
import { analyticsService } from "@/services/analyticsService";
import { getErrorMessage } from "@/utils/errorHandler";

interface MediaTracksState {
  videoTrack: ICameraVideoTrack | null;
  audioTrack: IMicrophoneAudioTrack | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  isCreatingVideo: boolean;
  isCreatingAudio: boolean;
}

interface UseMediaTracksReturn {
  // State
  videoTrack: ICameraVideoTrack | null;
  audioTrack: IMicrophoneAudioTrack | null;
  isCameraOn: boolean;
  isMicOn: boolean;

  // Actions
  toggleCamera: () => Promise<void>;
  toggleMic: () => Promise<void>;
  ensureTracksForCall: () => Promise<void>;
  cleanupTracks: () => void;

  // Error handling
  lastError: string | null;
}

/**
 * Centralized media track management hook
 * Handles camera and microphone tracks with proper state synchronization
 * Prevents race conditions and ensures single source of truth
 */
export function useMediaTracks(): UseMediaTracksReturn {
  const [state, setState] = useState<MediaTracksState>({
    videoTrack: null,
    audioTrack: null,
    isCameraOn: false,
    isMicOn: false,
    isCreatingVideo: false,
    isCreatingAudio: false,
  });

  const [lastError, setLastError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const stateRef = useRef<MediaTracksState>(state);

  // Keep ref in sync with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Cleanup on unmount ONLY
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Cleanup tracks on unmount - use ref to get latest tracks
      const currentState = stateRef.current;
      if (currentState.videoTrack) {
        currentState.videoTrack.stop();
        currentState.videoTrack.close();
      }
      if (currentState.audioTrack) {
        currentState.audioTrack.stop();
        currentState.audioTrack.close();
      }
    };
  }, []); // Empty deps = only run on mount/unmount

  /**
   * Toggle camera on/off
   * Creates track if needed, or enables/disables existing track
   */
  const toggleCamera = useCallback(async () => {
    // Use setState callback to get latest state
    return new Promise<void>((resolve, reject) => {
      setState((prev) => {
        if (prev.isCreatingVideo) {
          resolve();
          return prev;
        }

        // Start creation process
        const processToggle = async () => {
          try {
            setLastError(null);
            const currentState = stateRef.current;

            if (!currentState.isCameraOn) {
              // Turn camera ON
              if (!currentState.videoTrack) {
                // Create new video track
                const tracks = await agoraService.createLocalTracks(true, false);
                if (tracks.videoTrack && isMountedRef.current) {
                  await tracks.videoTrack.setEnabled(true);
                  setState((p) => ({
                    ...p,
                    videoTrack: tracks.videoTrack,
                    isCameraOn: true,
                    isCreatingVideo: false,
                  }));
                  analyticsService.trackPermissionGranted("camera");
                  analyticsService.trackVideoToggle(true);
                  resolve();
                } else {
                  setState((p) => ({ ...p, isCreatingVideo: false }));
                  resolve();
                }
              } else {
                // Re-enable existing track
                await currentState.videoTrack.setEnabled(true);
                setState((p) => ({
                  ...p,
                  isCameraOn: true,
                  isCreatingVideo: false,
                }));
                analyticsService.trackVideoToggle(true);
                resolve();
              }
            } else {
              // Turn camera OFF
              if (currentState.videoTrack) {
                await currentState.videoTrack.setEnabled(false);
              }
              setState((p) => ({
                ...p,
                isCameraOn: false,
                isCreatingVideo: false,
              }));
              analyticsService.trackVideoToggle(false);
              resolve();
            }
          } catch (error: unknown) {
            const message = getErrorMessage(error);
            setLastError(message);
            setState((p) => ({ ...p, isCreatingVideo: false }));

            const err = error as Record<string, unknown>;
            if (err?.code === "PERMISSION_DENIED" || err?.name === "NotAllowedError") {
              analyticsService.trackPermissionDenied("camera");
            }
            reject(error);
          }
        };

        processToggle();
        return { ...prev, isCreatingVideo: true };
      });
    });
  }, []);

  /**
   * Toggle microphone on/off
   * Creates track if needed, or enables/disables existing track
   */
  const toggleMic = useCallback(async () => {
    return new Promise<void>((resolve, reject) => {
      setState((prev) => {
        if (prev.isCreatingAudio) {
          resolve();
          return prev;
        }

        const processToggle = async () => {
          try {
            setLastError(null);
            const currentState = stateRef.current;

            if (!currentState.isMicOn) {
              // Turn mic ON
              if (!currentState.audioTrack) {
                // Create new audio track
                const tracks = await agoraService.createLocalTracks(false, true);
                if (tracks.audioTrack && isMountedRef.current) {
                  await tracks.audioTrack.setEnabled(true);
                  setState((p) => ({
                    ...p,
                    audioTrack: tracks.audioTrack,
                    isMicOn: true,
                    isCreatingAudio: false,
                  }));
                  analyticsService.trackPermissionGranted("microphone");
                  analyticsService.trackAudioToggle(true);
                  resolve();
                } else {
                  setState((p) => ({ ...p, isCreatingAudio: false }));
                  resolve();
                }
              } else {
                // Re-enable existing track
                await currentState.audioTrack.setEnabled(true);
                setState((p) => ({
                  ...p,
                  isMicOn: true,
                  isCreatingAudio: false,
                }));
                analyticsService.trackAudioToggle(true);
                resolve();
              }
            } else {
              // Turn mic OFF
              if (currentState.audioTrack) {
                await currentState.audioTrack.setEnabled(false);
              }
              setState((p) => ({
                ...p,
                isMicOn: false,
                isCreatingAudio: false,
              }));
              analyticsService.trackAudioToggle(false);
              resolve();
            }
          } catch (error: unknown) {
            const message = getErrorMessage(error);
            setLastError(message);
            setState((p) => ({ ...p, isCreatingAudio: false }));

            const err = error as Record<string, unknown>;
            if (err?.code === "PERMISSION_DENIED" || err?.name === "NotAllowedError") {
              analyticsService.trackPermissionDenied("microphone");
            }
            reject(error);
          }
        };

        processToggle();
        return { ...prev, isCreatingAudio: true };
      });
    });
  }, []);

  /**
   * Ensure tracks are created and enabled for call
   * Called before joining a video call
   */
  const ensureTracksForCall = useCallback(async () => {
    const promises: Promise<void>[] = [];

    // Ensure video track is ready if camera is on
    if (state.isCameraOn && !state.videoTrack) {
      promises.push(toggleCamera());
    } else if (state.isCameraOn && state.videoTrack) {
      promises.push(state.videoTrack.setEnabled(true));
    }

    // Ensure audio track is ready if mic is on
    if (state.isMicOn && !state.audioTrack) {
      promises.push(toggleMic());
    } else if (state.isMicOn && state.audioTrack) {
      promises.push(state.audioTrack.setEnabled(true));
    }

    await Promise.all(promises);
  }, [
    state.isCameraOn,
    state.isMicOn,
    state.videoTrack,
    state.audioTrack,
    toggleCamera,
    toggleMic,
  ]);

  /**
   * Cleanup all tracks
   * Called when leaving a call or navigating away
   */
  const cleanupTracks = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.videoTrack) {
      currentState.videoTrack.stop();
      currentState.videoTrack.close();
    }
    if (currentState.audioTrack) {
      currentState.audioTrack.stop();
      currentState.audioTrack.close();
    }
    setState({
      videoTrack: null,
      audioTrack: null,
      isCameraOn: false,
      isMicOn: false,
      isCreatingVideo: false,
      isCreatingAudio: false,
    });
  }, []);

  return {
    videoTrack: state.videoTrack,
    audioTrack: state.audioTrack,
    isCameraOn: state.isCameraOn,
    isMicOn: state.isMicOn,
    toggleCamera,
    toggleMic,
    ensureTracksForCall,
    cleanupTracks,
    lastError,
  };
}
