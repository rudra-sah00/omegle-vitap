import { useState, useCallback } from "react";
import { agoraService } from "@/services/agoraService";

export interface VideoQuality {
  resolution: "120p" | "240p" | "360p" | "480p" | "720p" | "1080p";
  frameRate: 15 | 24 | 30;
}

export interface AudioQuality {
  profile: "music_standard" | "speech_standard" | "speech_low_quality" | "music_high_quality" | "music_high_quality_stereo";
}

export interface BeautyEffectOptions {
  lighteningContrastLevel?: 0 | 1 | 2;
  lighteningLevel?: number;
  smoothnessLevel?: number;
  rednessLevel?: number;
  sharpnessLevel?: number;
}

export function useAgoraControls() {
  const [volume, setVolume] = useState(100);
  const [isBeautyEnabled, setIsBeautyEnabled] = useState(false);
  const [isDualStreamEnabled, setIsDualStreamEnabled] = useState(false);
  const [devices, setDevices] = useState<{
    cameras: MediaDeviceInfo[];
    microphones: MediaDeviceInfo[];
    speakers: MediaDeviceInfo[];
  }>({
    cameras: [],
    microphones: [],
    speakers: [],
  });

  /**
   * Get all available media devices
   */
  const refreshDevices = useCallback(async () => {
    try {
      const [cameras, microphones, speakers] = await Promise.all([
        agoraService.getCameras(),
        agoraService.getMicrophones(),
        agoraService.getPlaybackDevices(),
      ]);
      setDevices({ cameras, microphones, speakers });
      return { cameras, microphones, speakers };
    } catch (error) {
      console.error("Failed to get devices:", error);
      throw error;
    }
  }, []);

  /**
   * Switch camera
   */
  const switchCamera = useCallback(async (deviceId: string) => {
    try {
      await agoraService.switchCamera(deviceId);
    } catch (error) {
      console.error("Failed to switch camera:", error);
      throw error;
    }
  }, []);

  /**
   * Switch microphone
   */
  const switchMicrophone = useCallback(async (deviceId: string) => {
    try {
      await agoraService.switchMicrophone(deviceId);
    } catch (error) {
      console.error("Failed to switch microphone:", error);
      throw error;
    }
  }, []);

  /**
   * Set audio volume
   */
  const setAudioVolume = useCallback(async (vol: number) => {
    try {
      await agoraService.setAudioVolume(vol);
      setVolume(vol);
    } catch (error) {
      console.error("Failed to set volume:", error);
      throw error;
    }
  }, []);

  /**
   * Get current audio volume level
   */
  const getVolumeLevel = useCallback(() => {
    return agoraService.getAudioVolumeLevel();
  }, []);

  /**
   * Set video quality
   */
  const setVideoQuality = useCallback(async (quality: VideoQuality) => {
    try {
      const resolutionMap: Record<string, { width: number; height: number }> = {
        "120p": { width: 160, height: 120 },
        "240p": { width: 320, height: 240 },
        "360p": { width: 640, height: 360 },
        "480p": { width: 640, height: 480 },
        "720p": { width: 1280, height: 720 },
        "1080p": { width: 1920, height: 1080 },
      };

      const { width, height } = resolutionMap[quality.resolution];
      await agoraService.setVideoEncoderConfiguration({
        width,
        height,
        frameRate: quality.frameRate,
      });
    } catch (error) {
      console.error("Failed to set video quality:", error);
      throw error;
    }
  }, []);

  /**
   * Toggle beauty effect
   */
  const toggleBeautyEffect = useCallback(async (enabled: boolean, options?: BeautyEffectOptions) => {
    try {
      await agoraService.setBeautyEffect(enabled, options);
      setIsBeautyEnabled(enabled);
    } catch (error) {
      console.error("Failed to toggle beauty effect:", error);
      throw error;
    }
  }, []);

  /**
   * Enable dual stream mode
   */
  const enableDualStream = useCallback(async () => {
    try {
      await agoraService.enableDualStream();
      setIsDualStreamEnabled(true);
    } catch (error) {
      console.error("Failed to enable dual stream:", error);
      throw error;
    }
  }, []);

  /**
   * Disable dual stream mode
   */
  const disableDualStream = useCallback(async () => {
    try {
      await agoraService.disableDualStream();
      setIsDualStreamEnabled(false);
    } catch (error) {
      console.error("Failed to disable dual stream:", error);
      throw error;
    }
  }, []);

  /**
   * Set remote video stream type (high/low quality)
   */
  const setRemoteStreamQuality = useCallback(async (uid: number, highQuality: boolean) => {
    try {
      await agoraService.setRemoteVideoStreamType(uid, highQuality ? 0 : 1);
    } catch (error) {
      console.error("Failed to set remote stream quality:", error);
      throw error;
    }
  }, []);

  /**
   * Take a snapshot of current video
   */
  const takeSnapshot = useCallback(async (): Promise<string | null> => {
    try {
      return await agoraService.takeSnapshot();
    } catch (error) {
      console.error("Failed to take snapshot:", error);
      throw error;
    }
  }, []);

  /**
   * Set video content hint for optimization
   */
  const setContentHint = useCallback(async (hint: "motion" | "detail" | "text") => {
    try {
      await agoraService.setVideoContentHint(hint);
    } catch (error) {
      console.error("Failed to set content hint:", error);
      throw error;
    }
  }, []);

  /**
   * Get video stats
   */
  const getVideoStats = useCallback(() => {
    return agoraService.getVideoStats();
  }, []);

  /**
   * Get audio stats
   */
  const getAudioStats = useCallback(() => {
    return agoraService.getAudioStats();
  }, []);

  /**
   * Get RTC stats
   */
  const getRTCStats = useCallback(async () => {
    return await agoraService.getRTCStats();
  }, []);

  /**
   * Get network quality
   */
  const getNetworkQuality = useCallback(async () => {
    return await agoraService.getNetworkQuality();
  }, []);

  /**
   * Create screen share track
   */
  const createScreenShare = useCallback(async (withAudio: boolean = false) => {
    try {
      return await agoraService.createScreenTrack(
        { width: 1920, height: 1080, frameRate: 15 },
        withAudio
      );
    } catch (error) {
      console.error("Failed to create screen share:", error);
      throw error;
    }
  }, []);

  return {
    // State
    volume,
    isBeautyEnabled,
    isDualStreamEnabled,
    devices,

    // Device management
    refreshDevices,
    switchCamera,
    switchMicrophone,

    // Audio controls
    setAudioVolume,
    getVolumeLevel,

    // Video controls
    setVideoQuality,
    toggleBeautyEffect,
    setContentHint,
    takeSnapshot,

    // Streaming controls
    enableDualStream,
    disableDualStream,
    setRemoteStreamQuality,

    // Screen share
    createScreenShare,

    // Statistics
    getVideoStats,
    getAudioStats,
    getRTCStats,
    getNetworkQuality,
  };
}
