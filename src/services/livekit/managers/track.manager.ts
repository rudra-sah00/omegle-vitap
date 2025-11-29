/**
 * Track Manager
 * Handles local media track creation, toggling, and device switching
 */

import {
  LocalVideoTrack,
  LocalAudioTrack,
  createLocalVideoTrack,
  createLocalAudioTrack,
} from 'livekit-client';
import { LIVEKIT_CONFIG } from '../config';
import { attachLocalVideo } from './video-renderer';
import type { LiveKitState } from './types';

/**
 * TrackManager Class
 *
 * Manages local camera and microphone tracks:
 * - Track creation with device selection
 * - Toggle on/off with mutex protection
 * - Device switching
 * - Preview mode (tracks without publishing)
 */
export class TrackManager {
  constructor(private state: LiveKitState) {}

  // ============================================
  // TRACK CREATION
  // ============================================

  /**
   * Create local video track
   */
  async createVideoTrack(): Promise<LocalVideoTrack> {
    return createLocalVideoTrack({
      resolution: LIVEKIT_CONFIG.VIDEO.resolution,
      deviceId: this.state.currentCameraId,
    });
  }

  /**
   * Create local audio track
   */
  async createAudioTrack(): Promise<LocalAudioTrack> {
    return createLocalAudioTrack({
      echoCancellation: LIVEKIT_CONFIG.AUDIO.echoCancellation,
      noiseSuppression: LIVEKIT_CONFIG.AUDIO.noiseSuppression,
      autoGainControl: LIVEKIT_CONFIG.AUDIO.autoGainControl,
      deviceId: this.state.currentMicId,
    });
  }

  // ============================================
  // PREVIEW MODE
  // ============================================

  /**
   * Create local media tracks for preview without publishing
   */
  async createPreview(cameraOn: boolean = true, micOn: boolean = true): Promise<void> {
    if (this.state.isJoined) return;

    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasCamera = devices.some((d) => d.kind === 'videoinput');
    const hasMic = devices.some((d) => d.kind === 'audioinput');

    if (cameraOn && !hasCamera) {
      throw new Error('DEVICE_NOT_FOUND: No camera device found');
    }
    if (micOn && !hasMic) {
      throw new Error('DEVICE_NOT_FOUND: No microphone device found');
    }

    if (cameraOn && !this.state.localVideoTrack) {
      this.state.localVideoTrack = await this.createVideoTrack();
    }

    if (micOn && !this.state.localAudioTrack) {
      this.state.localAudioTrack = await this.createAudioTrack();
    }

    this.state.isPreviewMode = true;
    await this.updateDeviceIdsFromTracks();
  }

  /**
   * Stop preview mode and cleanup tracks
   */
  async stopPreview(): Promise<void> {
    if (this.state.isJoined) return;

    if (this.state.localVideoTrack) {
      this.state.localVideoTrack.stop();
      this.state.localVideoTrack = null;
    }

    if (this.state.localAudioTrack) {
      this.state.localAudioTrack.stop();
      this.state.localAudioTrack = null;
    }

    this.state.isPreviewMode = false;
  }

  // ============================================
  // CAMERA TOGGLE
  // ============================================

  /**
   * Toggle camera on/off
   */
  async toggleCamera(enabled: boolean): Promise<void> {
    if (this.state.isLeaving || this.state.isTogglingCamera) return;

    this.state.isTogglingCamera = true;

    try {
      if (enabled) {
        await this.enableCamera();
      } else {
        await this.disableCamera();
      }
    } catch (error) {
      // Cleanup on error
      if (this.state.localVideoTrack) {
        try {
          this.state.localVideoTrack.stop();
        } catch {
          /* ignore */
        }
        this.state.localVideoTrack = null;
      }
      throw error;
    } finally {
      this.state.isTogglingCamera = false;
    }
  }

  private async enableCamera(): Promise<void> {
    if (!this.state.localVideoTrack) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      if (!devices.some((d) => d.kind === 'videoinput')) {
        throw new Error('DEVICE_NOT_FOUND: No camera found');
      }
      this.state.localVideoTrack = await this.createVideoTrack();
    }

    attachLocalVideo(this.state.localVideoTrack, 'local-video');

    if (this.state.isJoined && this.state.room?.localParticipant) {
      await this.state.room.localParticipant.publishTrack(this.state.localVideoTrack);
    }

    await this.updateDeviceIdsFromTracks();
  }

  private async disableCamera(): Promise<void> {
    if (this.state.localVideoTrack) {
      if (this.state.isJoined && this.state.room?.localParticipant) {
        await this.state.room.localParticipant.unpublishTrack(this.state.localVideoTrack);
      }
      this.state.localVideoTrack.stop();
      this.state.localVideoTrack = null;
    }
  }

  // ============================================
  // MICROPHONE TOGGLE
  // ============================================

  /**
   * Toggle microphone on/off
   */
  async toggleMicrophone(enabled: boolean): Promise<void> {
    if (this.state.isLeaving || this.state.isTogglingMic) return;

    this.state.isTogglingMic = true;

    try {
      if (enabled) {
        await this.enableMicrophone();
      } else {
        await this.disableMicrophone();
      }
    } catch (error) {
      // Cleanup on error
      if (this.state.localAudioTrack) {
        try {
          this.state.localAudioTrack.stop();
        } catch {
          /* ignore */
        }
        this.state.localAudioTrack = null;
      }
      throw error;
    } finally {
      this.state.isTogglingMic = false;
    }
  }

  private async enableMicrophone(): Promise<void> {
    if (!this.state.localAudioTrack) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      if (!devices.some((d) => d.kind === 'audioinput')) {
        throw new Error('DEVICE_NOT_FOUND: No microphone found');
      }
      this.state.localAudioTrack = await this.createAudioTrack();
    }

    if (this.state.isJoined && this.state.room?.localParticipant) {
      await this.state.room.localParticipant.publishTrack(this.state.localAudioTrack);
    }

    await this.updateDeviceIdsFromTracks();
  }

  private async disableMicrophone(): Promise<void> {
    if (this.state.localAudioTrack) {
      if (this.state.isJoined && this.state.room?.localParticipant) {
        await this.state.room.localParticipant.unpublishTrack(this.state.localAudioTrack);
      }
      this.state.localAudioTrack.stop();
      this.state.localAudioTrack = null;
    }
  }

  // ============================================
  // DEVICE SWITCHING
  // ============================================

  /**
   * Switch to a different camera
   */
  async switchCamera(deviceId: string): Promise<void> {
    if (this.state.isLeaving) return;

    this.state.currentCameraId = deviceId;

    if (this.state.localVideoTrack) {
      if (this.state.isJoined && this.state.room?.localParticipant) {
        await this.state.room.localParticipant.unpublishTrack(this.state.localVideoTrack);
      }
      this.state.localVideoTrack.stop();

      this.state.localVideoTrack = await createLocalVideoTrack({
        resolution: LIVEKIT_CONFIG.VIDEO.resolution,
        deviceId,
      });

      attachLocalVideo(this.state.localVideoTrack, 'local-video');

      if (this.state.isJoined && this.state.room?.localParticipant) {
        await this.state.room.localParticipant.publishTrack(this.state.localVideoTrack);
      }
    }
  }

  /**
   * Switch to a different microphone
   */
  async switchMicrophone(deviceId: string): Promise<void> {
    if (this.state.isLeaving) return;

    this.state.currentMicId = deviceId;

    if (this.state.localAudioTrack) {
      if (this.state.isJoined && this.state.room?.localParticipant) {
        await this.state.room.localParticipant.unpublishTrack(this.state.localAudioTrack);
      }
      this.state.localAudioTrack.stop();

      this.state.localAudioTrack = await createLocalAudioTrack({
        echoCancellation: LIVEKIT_CONFIG.AUDIO.echoCancellation,
        noiseSuppression: LIVEKIT_CONFIG.AUDIO.noiseSuppression,
        autoGainControl: LIVEKIT_CONFIG.AUDIO.autoGainControl,
        deviceId,
      });

      if (this.state.isJoined && this.state.room?.localParticipant) {
        await this.state.room.localParticipant.publishTrack(this.state.localAudioTrack);
      }
    }
  }

  // ============================================
  // UTILITIES
  // ============================================

  /**
   * Update stored device IDs from actual track settings
   */
  async updateDeviceIdsFromTracks(): Promise<void> {
    try {
      if (this.state.localVideoTrack) {
        const settings = this.state.localVideoTrack.mediaStreamTrack?.getSettings();
        if (settings?.deviceId) {
          this.state.currentCameraId = settings.deviceId;
        }
      }

      if (this.state.localAudioTrack) {
        const settings = this.state.localAudioTrack.mediaStreamTrack?.getSettings();
        if (settings?.deviceId) {
          this.state.currentMicId = settings.deviceId;
        }
      }
    } catch {
      // Silently ignore device ID update errors
    }
  }

  /**
   * Create and publish tracks to room
   */
  async createAndPublishTracks(cameraOn: boolean, micOn: boolean): Promise<void> {
    if (!this.state.room?.localParticipant) return;

    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasCamera = devices.some((d) => d.kind === 'videoinput');
    const hasMic = devices.some((d) => d.kind === 'audioinput');

    if (cameraOn && hasCamera) {
      if (!this.state.localVideoTrack) {
        this.state.localVideoTrack = await this.createVideoTrack();
      }
      await this.state.room.localParticipant.publishTrack(this.state.localVideoTrack);
    }

    if (micOn && hasMic) {
      if (!this.state.localAudioTrack) {
        this.state.localAudioTrack = await this.createAudioTrack();
      }
      await this.state.room.localParticipant.publishTrack(this.state.localAudioTrack);
    }
  }

  /**
   * Stop all local tracks
   */
  stopAllTracks(): void {
    if (this.state.localVideoTrack) {
      this.state.localVideoTrack.stop();
      this.state.localVideoTrack = null;
    }
    if (this.state.localAudioTrack) {
      this.state.localAudioTrack.stop();
      this.state.localAudioTrack = null;
    }
  }
}
