/**
 * Agora RTC Service for Video/Audio Communication
 * Refactored into modular structure
 */

import AgoraRTC, {
  type IAgoraRTCClient,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
  type IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng';

import type { AgoraRTCConfig, AgoraCallbacks, DeviceIds } from './types';
import { AGORA_CONFIG, isSafariBrowser } from './config';
import { setupAgoraEventListeners } from './events';
import { joinChannel } from './channel';
import { cleanupTracks } from './tracks';
import { toggleCamera, toggleMicrophone, switchCamera, switchMicrophone } from './devices';
import { createLocalPreview, stopPreview } from './preview';

export type { AgoraRTCConfig } from './types';

export class AgoraRTCService {
  private client: IAgoraRTCClient | null = null;
  private localVideoTrack: ICameraVideoTrack | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private isJoined = false;
  private isLeaving = false;
  private isPreviewMode = false;
  
  private isTogglingCamera = false;
  private isTogglingMic = false;
  
  private currentCameraId?: string;
  private currentMicId?: string;

  private callbacks: AgoraCallbacks = {};

  constructor() {
    try {
      AgoraRTC.setLogLevel(AGORA_CONFIG.LOG_LEVEL);
      
      const codec = isSafariBrowser() ? 'h264' : 'vp8';
      this.client = AgoraRTC.createClient({ mode: 'rtc', codec });
      
      setupAgoraEventListeners(this.client, this.callbacks);
    } catch (error) {
      throw new Error('Failed to initialize video service');
    }
  }

  /**
   * Create local preview
   */
  async createLocalPreview(cameraOn: boolean = true, micOn: boolean = true): Promise<void> {
    try {
      const result = await createLocalPreview(
        cameraOn,
        micOn,
        this.localVideoTrack,
        this.localAudioTrack,
        this.isJoined
      );
      
      this.localVideoTrack = result.videoTrack;
      this.localAudioTrack = result.audioTrack;
      this.isPreviewMode = true;
      
      // Update current device IDs by matching track labels with available devices
      await this.updateDeviceIdsFromTracks();
    } catch (error) {
      // Clear device IDs if device not found
      const errorStr = String(error);
      if (errorStr.includes('DEVICE_NOT_FOUND') || errorStr.includes('NotFoundError')) {
        this.currentCameraId = undefined;
        this.currentMicId = undefined;
      }
      throw error;
    }
  }

  /**
   * Join Agora channel
   */
  async join(config: AgoraRTCConfig, cameraOn: boolean = true, micOn: boolean = true): Promise<void> {
    if (!this.client) {
      throw new Error('Agora client not initialized');
    }

    if (this.isJoined) {
      return;
    }

    if (this.isLeaving) {
      throw new Error('Cannot join while leaving another channel');
    }

    try {
      const tracks = await joinChannel(
        this.client,
        config,
        cameraOn,
        micOn,
        () => this.isLeaving,
        this.currentCameraId,
        this.currentMicId
      );

      this.localVideoTrack = tracks.videoTrack;
      this.localAudioTrack = tracks.audioTrack;
      this.isJoined = true;
      
      // Update current device IDs by matching track labels with available devices
      await this.updateDeviceIdsFromTracks();
    } catch (error) {
      this.isJoined = false;
      if (this.client) {
        try {
          await this.client.leave();
        } catch (leaveError) {
          // Ignore
        }
      }
      throw error;
    }
  }

  /**
   * Play local video
   */
  playLocalVideo(elementId: string): void {
    if (this.localVideoTrack) {
      this.localVideoTrack.play(elementId);
    }
  }

  /**
   * Stop preview
   */
  async stopPreview(): Promise<void> {
    stopPreview(this.localVideoTrack, this.localAudioTrack, this.isJoined);
    
    if (!this.isJoined) {
      this.localVideoTrack = null;
      this.localAudioTrack = null;
      this.isPreviewMode = false;
    }
  }

  /**
   * Publish video track
   */
  async publishVideoTrack(): Promise<void> {
    if (!this.client || !this.localVideoTrack) return;
    
    try {
      await this.client.publish([this.localVideoTrack]);
    } catch (error) {
      // Ignore
    }
  }

  /**
   * Unpublish video track
   */
  async unpublishVideoTrack(): Promise<void> {
    if (!this.client || !this.localVideoTrack) return;
    
    try {
      await this.client.unpublish([this.localVideoTrack]);
    } catch (error) {
      // Ignore
    }
  }

  /**
   * Publish audio track
   */
  async publishAudioTrack(): Promise<void> {
    if (!this.client || !this.localAudioTrack) return;
    
    try {
      await this.client.publish([this.localAudioTrack]);
    } catch (error) {
      // Ignore
    }
  }

  /**
   * Unpublish audio track
   */
  async unpublishAudioTrack(): Promise<void> {
    if (!this.client || !this.localAudioTrack) return;
    
    try {
      await this.client.unpublish([this.localAudioTrack]);
    } catch (error) {
      // Ignore
    }
  }

  /**
   * Play remote video
   */
  playRemoteVideo(user: IAgoraRTCRemoteUser, elementId: string): void {
    if (user.videoTrack) {
      user.videoTrack.play(elementId);
    }
  }

  /**
   * Toggle camera
   */
  async toggleCamera(enabled: boolean): Promise<void> {
    if (this.isLeaving || this.isTogglingCamera) {
      return;
    }
    
    this.isTogglingCamera = true;
    
    try {
      this.localVideoTrack = await toggleCamera(
        this.client,
        this.localVideoTrack,
        enabled,
        this.isJoined,
        this.isLeaving,
        this.currentCameraId
      );
      
      // Update current device ID from the actual track created
      if (enabled && this.localVideoTrack) {
        await this.updateDeviceIdsFromTracks();
      }
    } catch (error) {
      if (this.localVideoTrack) {
        try {
          this.localVideoTrack.stop();
          this.localVideoTrack.close();
        } catch (cleanupError) {
          // Ignore
        }
        this.localVideoTrack = null;
      }
      throw error;
    } finally {
      this.isTogglingCamera = false;
    }
  }

  /**
   * Toggle microphone
   */
  async toggleMicrophone(enabled: boolean): Promise<void> {
    if (this.isLeaving || this.isTogglingMic) {
      return;
    }
    
    this.isTogglingMic = true;
    
    try {
      this.localAudioTrack = await toggleMicrophone(
        this.client,
        this.localAudioTrack,
        enabled,
        this.isJoined,
        this.isLeaving,
        this.currentMicId
      );
      
      // Update current device ID from the actual track created
      if (enabled && this.localAudioTrack) {
        await this.updateDeviceIdsFromTracks();
      }
    } catch (error) {
      if (this.localAudioTrack) {
        try {
          this.localAudioTrack.stop();
          this.localAudioTrack.close();
        } catch (cleanupError) {
          // Ignore
        }
        this.localAudioTrack = null;
      }
      throw error;
    } finally {
      this.isTogglingMic = false;
    }
  }
  
  /**
   * Switch camera device
   */
  async switchCamera(deviceId: string): Promise<void> {
    if (this.isLeaving) return;
    
    try {
      this.currentCameraId = deviceId;
      this.localVideoTrack = await switchCamera(
        this.client,
        this.localVideoTrack,
        deviceId,
        this.isJoined,
        this.isLeaving
      );
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Switch microphone device
   */
  async switchMicrophone(deviceId: string): Promise<void> {
    if (this.isLeaving) return;
    
    try {
      this.currentMicId = deviceId;
      this.localAudioTrack = await switchMicrophone(
        this.client,
        this.localAudioTrack,
        deviceId,
        this.isJoined,
        this.isLeaving
      );
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get current device IDs
   */
  getCurrentDevices(): DeviceIds {
    return {
      cameraId: this.currentCameraId,
      micId: this.currentMicId,
    };
  }

  /**
   * Update device IDs by matching track labels with device list
   */
  private async updateDeviceIdsFromTracks(): Promise<void> {
    try {
      const devices = await AgoraRTC.getDevices();
      
      // Match video track
      if (this.localVideoTrack) {
        const trackLabel = this.localVideoTrack.getTrackLabel();
        const matchingDevice = devices.find(
          d => d.kind === 'videoinput' && d.label === trackLabel
        );
        
        if (matchingDevice?.deviceId) {
          this.currentCameraId = matchingDevice.deviceId;
        }
      }
      
      // Match audio track
      if (this.localAudioTrack) {
        const trackLabel = this.localAudioTrack.getTrackLabel();
        const matchingDevice = devices.find(
          d => d.kind === 'audioinput' && d.label === trackLabel
        );
        
        if (matchingDevice?.deviceId) {
          this.currentMicId = matchingDevice.deviceId;
        }
      }
    } catch (error) {
      // Silently ignore - device ID detection is not critical
    }
  }

  /**
   * Leave channel
   */
  async leave(): Promise<void> {
    if (!this.isJoined) {
      return;
    }
    
    if (this.isLeaving) {
      return;
    }
    
    this.isLeaving = true;

    try {
      // Unpublish tracks
      if (this.client && this.isJoined) {
        try {
          const tracksToUnpublish = [];
          if (this.localVideoTrack) tracksToUnpublish.push(this.localVideoTrack);
          if (this.localAudioTrack) tracksToUnpublish.push(this.localAudioTrack);
          if (tracksToUnpublish.length > 0) {
            await this.client.unpublish(tracksToUnpublish);
          }
        } catch (unpublishError) {
          // Ignore
        }
      }

      // Clean up tracks
      cleanupTracks(this.localVideoTrack, this.localAudioTrack);
      this.localVideoTrack = null;
      this.localAudioTrack = null;

      // Leave channel
      if (this.client) {
        await this.client.leave();
        this.isJoined = false;
        
        this.client.removeAllListeners();
        
        // Recreate client
        const codec = isSafariBrowser() ? 'h264' : 'vp8';
        this.client = AgoraRTC.createClient({ mode: 'rtc', codec });
        setupAgoraEventListeners(this.client, this.callbacks);
      }

      this.isPreviewMode = false;
      this.isLeaving = false;
    } catch (error) {
      this.isLeaving = false;
      this.isJoined = false;
      throw error;
    }
  }

  /**
   * Get remote users
   */
  getRemoteUsers(): IAgoraRTCRemoteUser[] {
    return this.client?.remoteUsers || [];
  }

  /**
   * Check if joined
   */
  isChannelJoined(): boolean {
    return this.isJoined;
  }

  /**
   * Set callbacks
   */
  setOnUserPublished(callback: (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => void): void {
    this.callbacks.onUserPublished = callback;
  }

  setOnUserUnpublished(callback: (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => void): void {
    this.callbacks.onUserUnpublished = callback;
  }

  setOnUserJoined(callback: (user: IAgoraRTCRemoteUser) => void): void {
    this.callbacks.onUserJoined = callback;
  }

  setOnUserLeft(callback: (user: IAgoraRTCRemoteUser) => void): void {
    this.callbacks.onUserLeft = callback;
  }

  /**
   * Get tracks
   */
  getLocalVideoTrack(): ICameraVideoTrack | null {
    return this.localVideoTrack;
  }

  getLocalAudioTrack(): IMicrophoneAudioTrack | null {
    return this.localAudioTrack;
  }
}
