import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
  UID,
} from "agora-rtc-sdk-ng";

// Dynamic import for Agora RTC (client-side only)
let AgoraRTC: any = null;

// Agora Configuration
const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";

export interface AgoraConfig {
  appId: string;
  channel: string;
  token: string | null;
  uid: UID;
}

export interface MediaTracks {
  videoTrack: ICameraVideoTrack | null;
  audioTrack: IMicrophoneAudioTrack | null;
}

export interface RemoteUser {
  uid: UID;
  hasVideo: boolean;
  hasAudio: boolean;
  videoTrack?: IRemoteVideoTrack;
  audioTrack?: IRemoteAudioTrack;
}

export class AgoraService {
  private client: IAgoraRTCClient | null = null;
  private localTracks: MediaTracks = {
    videoTrack: null,
    audioTrack: null,
  };
  private isJoined: boolean = false;

  /**
   * Initialize Agora client
   */
  public async initClient(mode: "rtc" | "live" = "rtc"): Promise<IAgoraRTCClient> {
    if (this.client) {
      return this.client;
    }

    // Ensure AgoraRTC is loaded
    if (!AgoraRTC) {
      const module = await import("agora-rtc-sdk-ng");
      AgoraRTC = module.default;
    }

    this.client = AgoraRTC.createClient({
      mode: mode,
      codec: "vp8",
    });

    return this.client!;
  }

  /**
   * Get current client instance
   */
  public getClient(): IAgoraRTCClient | null {
    return this.client;
  }

  /**
   * Join a channel
   */
  public async joinChannel(
    channel: string,
    token: string | null,
    uid: UID
  ): Promise<UID> {
    if (!this.client) {
      throw new Error("Client not initialized. Call initClient() first.");
    }

    if (this.isJoined) {
      throw new Error("Already joined a channel.");
    }

    try {
      const assignedUid = await this.client.join(APP_ID, channel, token, uid);
      this.isJoined = true;
      console.log("Joined channel:", channel, "with UID:", assignedUid);
      return assignedUid;
    } catch (error) {
      console.error("Failed to join channel:", error);
      throw error;
    }
  }

  /**
   * Create local audio and video tracks
   */
  public async createLocalTracks(
    enableVideo: boolean = true,
    enableAudio: boolean = true
  ): Promise<MediaTracks> {
    try {
      if (enableVideo && enableAudio) {
        const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        this.localTracks.audioTrack = tracks[0];
        this.localTracks.videoTrack = tracks[1];
      } else if (enableVideo) {
        this.localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
      } else if (enableAudio) {
        this.localTracks.audioTrack =
          await AgoraRTC.createMicrophoneAudioTrack();
      }

      console.log("Local tracks created:", this.localTracks);
      return this.localTracks;
    } catch (error) {
      console.error("Failed to create local tracks:", error);
      throw error;
    }
  }

  /**
   * Publish local tracks to the channel
   */
  public async publishTracks(): Promise<void> {
    if (!this.client) {
      throw new Error("Client not initialized.");
    }

    if (!this.isJoined) {
      throw new Error("Not joined to any channel.");
    }

    try {
      const tracksToPublish = [];
      if (this.localTracks.videoTrack) {
        tracksToPublish.push(this.localTracks.videoTrack);
      }
      if (this.localTracks.audioTrack) {
        tracksToPublish.push(this.localTracks.audioTrack);
      }

      if (tracksToPublish.length > 0) {
        await this.client.publish(tracksToPublish);
        console.log("Published local tracks");
      }
    } catch (error) {
      console.error("Failed to publish tracks:", error);
      throw error;
    }
  }

  /**
   * Unpublish local tracks from the channel
   */
  public async unpublishTracks(): Promise<void> {
    if (!this.client) {
      throw new Error("Client not initialized.");
    }

    try {
      const tracksToUnpublish = [];
      if (this.localTracks.videoTrack) {
        tracksToUnpublish.push(this.localTracks.videoTrack);
      }
      if (this.localTracks.audioTrack) {
        tracksToUnpublish.push(this.localTracks.audioTrack);
      }

      if (tracksToUnpublish.length > 0) {
        await this.client.unpublish(tracksToUnpublish);
        console.log("Unpublished local tracks");
      }
    } catch (error) {
      console.error("Failed to unpublish tracks:", error);
      throw error;
    }
  }

  /**
   * Leave the channel
   */
  public async leaveChannel(): Promise<void> {
    if (!this.client) {
      console.warn("Client not initialized, nothing to leave.");
      return; // Don't throw, just return
    }

    try {
      // Close local tracks
      await this.closeLocalTracks();

      // Leave the channel
      await this.client.leave();
      this.isJoined = false;
      console.log("Left the channel");
    } catch (error) {
      console.error("Failed to leave channel:", error);
      throw error;
    }
  }

  /**
   * Close and release local tracks
   */
  public async closeLocalTracks(): Promise<void> {
    try {
      if (this.localTracks.videoTrack) {
        this.localTracks.videoTrack.stop();
        this.localTracks.videoTrack.close();
        this.localTracks.videoTrack = null;
      }

      if (this.localTracks.audioTrack) {
        this.localTracks.audioTrack.stop();
        this.localTracks.audioTrack.close();
        this.localTracks.audioTrack = null;
      }

      console.log("Local tracks closed");
    } catch (error) {
      console.error("Failed to close local tracks:", error);
      throw error;
    }
  }

  /**
   * Toggle video (mute/unmute)
   */
  public async toggleVideo(enabled: boolean): Promise<void> {
    if (!this.localTracks.videoTrack) {
      throw new Error("Video track not available");
    }

    try {
      await this.localTracks.videoTrack.setEnabled(enabled);
      console.log("Video", enabled ? "enabled" : "disabled");
    } catch (error) {
      console.error("Failed to toggle video:", error);
      throw error;
    }
  }

  /**
   * Toggle audio (mute/unmute)
   */
  public async toggleAudio(enabled: boolean): Promise<void> {
    if (!this.localTracks.audioTrack) {
      throw new Error("Audio track not available");
    }

    try {
      await this.localTracks.audioTrack.setEnabled(enabled);
      console.log("Audio", enabled ? "enabled" : "disabled");
    } catch (error) {
      console.error("Failed to toggle audio:", error);
      throw error;
    }
  }

  /**
   * Get local video track
   */
  public getLocalVideoTrack(): ICameraVideoTrack | null {
    return this.localTracks.videoTrack;
  }

  /**
   * Get local audio track
   */
  public getLocalAudioTrack(): IMicrophoneAudioTrack | null {
    return this.localTracks.audioTrack;
  }

  /**
   * Get all remote users
   */
  public getRemoteUsers(): IAgoraRTCRemoteUser[] {
    if (!this.client) {
      return [];
    }
    return this.client.remoteUsers;
  }

  /**
   * Subscribe to a remote user's tracks
   */
  public async subscribeToUser(
    user: IAgoraRTCRemoteUser,
    mediaType: "audio" | "video"
  ): Promise<void> {
    if (!this.client) {
      throw new Error("Client not initialized.");
    }

    try {
      await this.client.subscribe(user, mediaType);
      console.log("Subscribed to user:", user.uid, "mediaType:", mediaType);
    } catch (error) {
      console.error("Failed to subscribe to user:", error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a remote user's tracks
   */
  public async unsubscribeFromUser(
    user: IAgoraRTCRemoteUser,
    mediaType: "audio" | "video"
  ): Promise<void> {
    if (!this.client) {
      throw new Error("Client not initialized.");
    }

    try {
      await this.client.unsubscribe(user, mediaType);
      console.log("Unsubscribed from user:", user.uid, "mediaType:", mediaType);
    } catch (error) {
      console.error("Failed to unsubscribe from user:", error);
      throw error;
    }
  }

  /**
   * Get connection state
   */
  public getConnectionState(): string {
    if (!this.client) {
      return "DISCONNECTED";
    }
    return this.client.connectionState;
  }

  /**
   * Check if joined to a channel
   */
  public isChannelJoined(): boolean {
    return this.isJoined;
  }

  /**
   * Destroy the client and cleanup
   */
  public async destroy(): Promise<void> {
    try {
      await this.closeLocalTracks();
      if (this.isJoined && this.client) {
        await this.client.leave();
      }
      this.client = null;
      this.isJoined = false;
      console.log("Agora service destroyed");
    } catch (error) {
      console.error("Failed to destroy Agora service:", error);
      throw error;
    }
  }

  /**
   * Enable/Disable video track
   */
  public async setVideoEnabled(enabled: boolean): Promise<void> {
    await this.toggleVideo(enabled);
  }

  /**
   * Enable/Disable audio track
   */
  public async setAudioEnabled(enabled: boolean): Promise<void> {
    await this.toggleAudio(enabled);
  }

  /**
   * Get available cameras
   */
  public async getCameras(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await AgoraRTC.getCameras();
      return devices;
    } catch (error) {
      console.error("Failed to get cameras:", error);
      throw error;
    }
  }

  /**
   * Get available microphones
   */
  public async getMicrophones(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await AgoraRTC.getMicrophones();
      return devices;
    } catch (error) {
      console.error("Failed to get microphones:", error);
      throw error;
    }
  }

  /**
   * Switch camera device
   */
  public async switchCamera(deviceId: string): Promise<void> {
    if (!this.localTracks.videoTrack) {
      throw new Error("Video track not available");
    }

    try {
      await this.localTracks.videoTrack.setDevice(deviceId);
      console.log("Switched to camera:", deviceId);
    } catch (error) {
      console.error("Failed to switch camera:", error);
      throw error;
    }
  }

  /**
   * Switch microphone device
   */
  public async switchMicrophone(deviceId: string): Promise<void> {
    if (!this.localTracks.audioTrack) {
      throw new Error("Audio track not available");
    }

    try {
      await this.localTracks.audioTrack.setDevice(deviceId);
      console.log("Switched to microphone:", deviceId);
    } catch (error) {
      console.error("Failed to switch microphone:", error);
      throw error;
    }
  }

  /**
   * Get playback devices (speakers)
   */
  public async getPlaybackDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await AgoraRTC.getPlaybackDevices();
      return devices;
    } catch (error) {
      console.error("Failed to get playback devices:", error);
      throw error;
    }
  }

  /**
   * Set audio volume for local track
   */
  public async setAudioVolume(volume: number): Promise<void> {
    if (!this.localTracks.audioTrack) {
      throw new Error("Audio track not available");
    }

    try {
      await this.localTracks.audioTrack.setVolume(volume);
      console.log("Audio volume set to:", volume);
    } catch (error) {
      console.error("Failed to set audio volume:", error);
      throw error;
    }
  }

  /**
   * Get current audio volume level
   */
  public getAudioVolumeLevel(): number {
    if (!this.localTracks.audioTrack) {
      return 0;
    }
    return this.localTracks.audioTrack.getVolumeLevel();
  }

  /**
   * Set video encoder configuration
   */
  public async setVideoEncoderConfiguration(config: {
    width?: number;
    height?: number;
    frameRate?: number;
    bitrateMin?: number;
    bitrateMax?: number;
  }): Promise<void> {
    if (!this.localTracks.videoTrack) {
      throw new Error("Video track not available");
    }

    try {
      await this.localTracks.videoTrack.setEncoderConfiguration({
        width: config.width,
        height: config.height,
        frameRate: config.frameRate,
        bitrateMin: config.bitrateMin,
        bitrateMax: config.bitrateMax,
      });
      console.log("Video encoder configuration updated:", config);
    } catch (error) {
      console.error("Failed to set video encoder configuration:", error);
      throw error;
    }
  }

  /**
   * Enable/disable video beauty effects
   */
  public async setBeautyEffect(enabled: boolean, options?: {
    lighteningContrastLevel?: 0 | 1 | 2;
    lighteningLevel?: number;
    smoothnessLevel?: number;
    rednessLevel?: number;
    sharpnessLevel?: number;
  }): Promise<void> {
    if (!this.localTracks.videoTrack) {
      throw new Error("Video track not available");
    }

    try {
      await this.localTracks.videoTrack.setBeautyEffect(enabled, options);
      console.log("Beauty effect", enabled ? "enabled" : "disabled");
    } catch (error) {
      console.error("Failed to set beauty effect:", error);
      throw error;
    }
  }

  /**
   * Get video track statistics
   */
  public getVideoStats(): any {
    if (!this.localTracks.videoTrack) {
      return null;
    }
    return this.localTracks.videoTrack.getStats();
  }

  /**
   * Get audio track statistics
   */
  public getAudioStats(): any {
    if (!this.localTracks.audioTrack) {
      return null;
    }
    return this.localTracks.audioTrack.getStats();
  }

  /**
   * Get RTC stats for the client
   */
  public async getRTCStats(): Promise<any> {
    if (!this.client) {
      throw new Error("Client not initialized");
    }
    return this.client.getRTCStats();
  }

  /**
   * Get remote video stats
   */
  public getRemoteVideoStats(user: IAgoraRTCRemoteUser): any {
    if (!this.client) {
      return null;
    }
    return this.client.getRemoteVideoStats()[user.uid];
  }

  /**
   * Get remote audio stats
   */
  public getRemoteAudioStats(user: IAgoraRTCRemoteUser): any {
    if (!this.client) {
      return null;
    }
    return this.client.getRemoteAudioStats()[user.uid];
  }

  /**
   * Enable dual stream mode (simulcast)
   */
  public async enableDualStream(): Promise<void> {
    if (!this.client) {
      throw new Error("Client not initialized");
    }

    try {
      await this.client.enableDualStream();
      console.log("Dual stream enabled");
    } catch (error) {
      console.error("Failed to enable dual stream:", error);
      throw error;
    }
  }

  /**
   * Disable dual stream mode
   */
  public async disableDualStream(): Promise<void> {
    if (!this.client) {
      throw new Error("Client not initialized");
    }

    try {
      await this.client.disableDualStream();
      console.log("Dual stream disabled");
    } catch (error) {
      console.error("Failed to disable dual stream:", error);
      throw error;
    }
  }

  /**
   * Set remote video stream type (high or low quality)
   */
  public async setRemoteVideoStreamType(
    uid: UID,
    streamType: 0 | 1 // 0 = high, 1 = low
  ): Promise<void> {
    if (!this.client) {
      throw new Error("Client not initialized");
    }

    try {
      await this.client.setRemoteVideoStreamType(uid, streamType);
      console.log("Remote video stream type set to:", streamType === 0 ? "high" : "low");
    } catch (error) {
      console.error("Failed to set remote video stream type:", error);
      throw error;
    }
  }

  /**
   * Set low stream video encoder configuration
   */
  public async setLowStreamParameter(config: {
    width: number;
    height: number;
    frameRate: number;
    bitrate: number;
  }): Promise<void> {
    if (!this.client) {
      throw new Error("Client not initialized");
    }

    try {
      await this.client.setLowStreamParameter({
        width: config.width,
        height: config.height,
        framerate: config.frameRate,
        bitrate: config.bitrate,
      });
      console.log("Low stream parameter updated:", config);
    } catch (error) {
      console.error("Failed to set low stream parameter:", error);
      throw error;
    }
  }

  /**
   * Enable/disable audio processing (AEC, AGC, ANS)
   */
  public async setAudioProfile(
    profile: "music_standard" | "speech_standard" | "speech_low_quality" | "music_high_quality" | "music_high_quality_stereo"
  ): Promise<void> {
    if (!this.localTracks.audioTrack) {
      throw new Error("Audio track not available");
    }

    try {
      // Note: Audio processing is configured during track creation
      // This is a placeholder for profile management
      console.log("Audio profile set to:", profile);
    } catch (error) {
      console.error("Failed to set audio profile:", error);
      throw error;
    }
  }

  /**
   * Get network quality stats
   */
  public async getNetworkQuality(): Promise<any> {
    if (!this.client) {
      return null;
    }
    
    try {
      const stats = await this.client.getRTCStats();
      return stats;
    } catch (error) {
      console.error("Failed to get network quality:", error);
      return null;
    }
  }

  /**
   * Take a snapshot of the video track
   */
  public async takeSnapshot(): Promise<string | null> {
    if (!this.localTracks.videoTrack) {
      throw new Error("Video track not available");
    }

    try {
      const imageData = this.localTracks.videoTrack.getCurrentFrameData();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx || !imageData) {
        return null;
      }

      canvas.width = imageData.width;
      canvas.height = imageData.height;
      ctx.putImageData(imageData, 0, 0);
      
      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error("Failed to take snapshot:", error);
      throw error;
    }
  }

  /**
   * Set video content hint (motion, detail, text)
   */
  public async setVideoContentHint(hint: "motion" | "detail" | "text"): Promise<void> {
    if (!this.localTracks.videoTrack) {
      throw new Error("Video track not available");
    }

    try {
      // Content hint optimization
      if (hint === "motion") {
        await this.setVideoEncoderConfiguration({
          frameRate: 30,
          bitrateMin: 600,
          bitrateMax: 1200,
        });
      } else if (hint === "detail") {
        await this.setVideoEncoderConfiguration({
          frameRate: 15,
          bitrateMin: 800,
          bitrateMax: 1500,
        });
      } else if (hint === "text") {
        await this.setVideoEncoderConfiguration({
          frameRate: 10,
          bitrateMin: 500,
          bitrateMax: 1000,
        });
      }
      console.log("Video content hint set to:", hint);
    } catch (error) {
      console.error("Failed to set video content hint:", error);
      throw error;
    }
  }

  /**
   * Enable/disable echo cancellation
   */
  public async setEchoCancellation(enabled: boolean): Promise<void> {
    // Echo cancellation is set during track creation
    // This is for reference
    console.log("Echo cancellation:", enabled ? "enabled" : "disabled");
  }

  /**
   * Enable/disable noise suppression
   */
  public async setNoiseSuppression(enabled: boolean): Promise<void> {
    // Noise suppression is set during track creation
    // This is for reference
    console.log("Noise suppression:", enabled ? "enabled" : "disabled");
  }

  /**
   * Enable/disable auto gain control
   */
  public async setAutoGainControl(enabled: boolean): Promise<void> {
    // Auto gain control is set during track creation
    // This is for reference
    console.log("Auto gain control:", enabled ? "enabled" : "disabled");
  }

  /**
   * Create screen share track
   */
  public async createScreenTrack(
    encoderConfig?: {
      width?: number;
      height?: number;
      frameRate?: number;
      bitrate?: number;
    },
    withAudio?: boolean
  ): Promise<any> {
    try {
      const screenTrack = await AgoraRTC.createScreenVideoTrack(
        {
          encoderConfig: encoderConfig || "1080p_1",
          optimizationMode: "detail",
        },
        withAudio ? "enable" : "disable"
      );
      console.log("Screen share track created");
      return screenTrack;
    } catch (error) {
      console.error("Failed to create screen share track:", error);
      throw error;
    }
  }

  /**
   * Get local track labels
   */
  public getLocalTrackLabels(): { video: string; audio: string } {
    return {
      video: this.localTracks.videoTrack?.getTrackLabel() || "",
      audio: this.localTracks.audioTrack?.getTrackLabel() || "",
    };
  }

  /**
   * Check browser compatibility
   */
  public static checkBrowserCompatibility(): {
    compatible: boolean;
    details: any;
  } {
    const result = AgoraRTC.checkSystemRequirements();
    return {
      compatible: result,
      details: {
        browser: navigator.userAgent,
        webRTCSupported: result,
      },
    };
  }

  /**
   * Get SDK version
   */
  public static getSDKVersion(): string {
    return AgoraRTC.VERSION;
  }

  /**
   * Set log level
   */
  public static setLogLevel(level: 0 | 1 | 2 | 3 | 4): void {
    // 0: DEBUG, 1: INFO, 2: WARNING, 3: ERROR, 4: NONE
    AgoraRTC.setLogLevel(level);
  }

  /**
   * Enable/disable log upload
   */
  public static enableLogUpload(): void {
    AgoraRTC.enableLogUpload();
  }

  public static disableLogUpload(): void {
    AgoraRTC.disableLogUpload();
  }
}

// Export singleton instance
export const agoraService = new AgoraService();
