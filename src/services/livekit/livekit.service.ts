/**
 * LiveKit RTC Service
 * Handles video/audio communication using LiveKit
 */

import {
  Room,
  RoomEvent,
  RemoteParticipant,
  Track,
  LocalVideoTrack,
  LocalAudioTrack,
  RemoteTrack,
  VideoPresets,
  createLocalVideoTrack,
  createLocalAudioTrack,
  createLocalScreenTracks,
  ConnectionQuality,
  ScreenShareCaptureOptions,
} from 'livekit-client';

import type { LiveKitConfig, LiveKitCallbacks, DeviceIds, NetworkQualityLevel } from './types';
import { LIVEKIT_CONFIG, getVideoSettingsForNetwork, getAudioSettingsForNetwork, type NetworkQuality } from './config';

export class LiveKitService {
  private room: Room | null = null;
  private localVideoTrack: LocalVideoTrack | null = null;
  private localAudioTrack: LocalAudioTrack | null = null;
  private localScreenTrack: LocalVideoTrack | null = null;
  private isJoined = false;
  private isLeaving = false;
  private isPreviewMode = false;
  private isScreenSharing = false;
  
  private isTogglingCamera = false;
  private isTogglingMic = false;
  private isTogglingScreenShare = false;
  
  private currentCameraId?: string;
  private currentMicId?: string;
  private currentNetworkQuality: NetworkQuality = 'unknown';

  private callbacks: LiveKitCallbacks = {};

  constructor() {
    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: {
          width: LIVEKIT_CONFIG.VIDEO.resolution.width,
          height: LIVEKIT_CONFIG.VIDEO.resolution.height,
          frameRate: LIVEKIT_CONFIG.VIDEO.resolution.frameRate,
        },
      },
      publishDefaults: {
        simulcast: true,
        videoEncoding: {
          maxBitrate: LIVEKIT_CONFIG.VIDEO.presets.unknown.maxBitrate,
          maxFramerate: LIVEKIT_CONFIG.VIDEO.resolution.frameRate,
        },
      },
    });
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.room) return;

    this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      this.callbacks.onParticipantConnected?.(participant);
    });

    this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      this.callbacks.onParticipantDisconnected?.(participant);
    });

    this.room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication, participant: RemoteParticipant) => {
      const isScreenShare = publication.source === Track.Source.ScreenShare;
      const mediaType = track.kind === Track.Kind.Video ? 'video' : 'audio';
      
      if (track.kind === Track.Kind.Audio) {
        track.attach();
      }
      
      if (isScreenShare && track.kind === Track.Kind.Video) {
        this.callbacks.onScreenShareSubscribed?.(participant, true);
      } else {
        this.callbacks.onTrackSubscribed?.(participant, mediaType);
      }
    });

    this.room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, publication, participant: RemoteParticipant) => {
      const isScreenShare = publication.source === Track.Source.ScreenShare;
      const mediaType = track.kind === Track.Kind.Video ? 'video' : 'audio';
      track.detach();
      
      if (isScreenShare && track.kind === Track.Kind.Video) {
        this.callbacks.onScreenShareSubscribed?.(participant, false);
      } else {
        this.callbacks.onTrackUnsubscribed?.(participant, mediaType);
      }
    });

    this.room.on(RoomEvent.ConnectionQualityChanged, (quality: ConnectionQuality, participant) => {
      const networkQuality = LiveKitService.convertQuality(quality);
      const isLocal = !participant || participant.identity === this.room?.localParticipant?.identity;
      
      if (isLocal) {
        if (networkQuality !== this.currentNetworkQuality) {
          this.currentNetworkQuality = networkQuality;
          this.adaptQualityToNetwork(networkQuality);
        }
      }
      
      this.callbacks.onConnectionQualityChanged?.(quality, participant as RemoteParticipant | null);
    });

    this.room.on(RoomEvent.Disconnected, () => {
      this.isJoined = false;
    });
  }

  private async adaptQualityToNetwork(quality: NetworkQuality): Promise<void> {
    if (!this.room?.localParticipant) return;

    const videoSettings = getVideoSettingsForNetwork(quality);
    const audioSettings = getAudioSettingsForNetwork(quality);

    try {
      const videoPublication = this.room.localParticipant.getTrackPublication(Track.Source.Camera);
      if (videoPublication?.track) {
        await this.room.localParticipant.setTrackSubscriptionPermissions(true);
      }
    } catch {
      // Quality adaptation failed
    }
  }

  async createLocalPreview(cameraOn: boolean = true, micOn: boolean = true): Promise<void> {
    try {
      if (this.isJoined) {
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(d => d.kind === 'videoinput');
      const hasMic = devices.some(d => d.kind === 'audioinput');

      if (cameraOn && !hasCamera) {
        throw new Error('DEVICE_NOT_FOUND: No camera device found');
      }
      if (micOn && !hasMic) {
        throw new Error('DEVICE_NOT_FOUND: No microphone device found');
      }

      if (cameraOn && !this.localVideoTrack) {
        this.localVideoTrack = await createLocalVideoTrack({
          resolution: LIVEKIT_CONFIG.VIDEO.resolution,
          deviceId: this.currentCameraId,
        });
      }

      if (micOn && !this.localAudioTrack) {
        this.localAudioTrack = await createLocalAudioTrack({
          echoCancellation: LIVEKIT_CONFIG.AUDIO.echoCancellation,
          noiseSuppression: LIVEKIT_CONFIG.AUDIO.noiseSuppression,
          autoGainControl: LIVEKIT_CONFIG.AUDIO.autoGainControl,
          deviceId: this.currentMicId,
        });
      }

      this.isPreviewMode = true;
      await this.updateDeviceIdsFromTracks();
    } catch (error) {
      const errorStr = String(error);
      if (errorStr.includes('DEVICE_NOT_FOUND') || errorStr.includes('NotFoundError')) {
        this.currentCameraId = undefined;
        this.currentMicId = undefined;
      }
      throw error;
    }
  }

  async join(config: LiveKitConfig, cameraOn: boolean = true, micOn: boolean = true): Promise<void> {
    if (!this.room) {
      throw new Error('LiveKit room not initialized');
    }

    if (this.isJoined) {
      return;
    }

    if (this.isLeaving) {
      throw new Error('Cannot join while leaving another room');
    }

    try {
      if (!config.serverUrl || !config.token) {
        throw new Error('Invalid LiveKit configuration: missing serverUrl or token');
      }

      await this.room.connect(config.serverUrl, config.token, {
        autoSubscribe: true,
      });

      this.isJoined = true;

      await this.createAndPublishTracks(cameraOn, micOn);
      await this.updateDeviceIdsFromTracks();
    } catch (error) {
      this.isJoined = false;
      if (this.room) {
        try {
          await this.room.disconnect();
        } catch {
          // Ignore disconnect error
        }
      }
      throw error;
    }
  }

  private async createAndPublishTracks(cameraOn: boolean, micOn: boolean): Promise<void> {
    if (!this.room || !this.room.localParticipant) return;

    const localParticipant = this.room.localParticipant;

    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasCamera = devices.some(d => d.kind === 'videoinput');
    const hasMic = devices.some(d => d.kind === 'audioinput');

    if (cameraOn && hasCamera) {
      if (!this.localVideoTrack) {
        this.localVideoTrack = await createLocalVideoTrack({
          resolution: LIVEKIT_CONFIG.VIDEO.resolution,
          deviceId: this.currentCameraId,
        });
      }
      await localParticipant.publishTrack(this.localVideoTrack);
    }

    if (micOn && hasMic) {
      if (!this.localAudioTrack) {
        this.localAudioTrack = await createLocalAudioTrack({
          echoCancellation: LIVEKIT_CONFIG.AUDIO.echoCancellation,
          noiseSuppression: LIVEKIT_CONFIG.AUDIO.noiseSuppression,
          autoGainControl: LIVEKIT_CONFIG.AUDIO.autoGainControl,
          deviceId: this.currentMicId,
        });
      }
      await localParticipant.publishTrack(this.localAudioTrack);
    }
  }

  playLocalVideo(elementId: string): void {
    if (this.localVideoTrack) {
      this.localVideoTrack.detach();
      
      const element = document.getElementById(elementId);
      if (element && element instanceof HTMLVideoElement) {
        this.localVideoTrack.attach(element);
      } else if (element) {
        const videoEl = document.createElement('video');
        videoEl.style.width = '100%';
        videoEl.style.height = '100%';
        videoEl.style.objectFit = 'cover';
        videoEl.muted = true;
        videoEl.autoplay = true;
        videoEl.playsInline = true;
        element.innerHTML = '';
        element.appendChild(videoEl);
        this.localVideoTrack.attach(videoEl);
      }
    }
  }

  async stopPreview(): Promise<void> {
    if (this.isJoined) return;

    if (this.localVideoTrack) {
      this.localVideoTrack.stop();
      this.localVideoTrack = null;
    }

    if (this.localAudioTrack) {
      this.localAudioTrack.stop();
      this.localAudioTrack = null;
    }

    this.isPreviewMode = false;
  }

  playRemoteVideo(participant: RemoteParticipant, elementId: string): void {
    const videoTrack = participant.getTrackPublications().find(
      pub => pub.track?.kind === Track.Kind.Video
    )?.track;

    if (videoTrack) {
      const element = document.getElementById(elementId);
      if (element && element instanceof HTMLVideoElement) {
        videoTrack.attach(element);
      } else if (element) {
        const videoEl = document.createElement('video');
        videoEl.style.width = '100%';
        videoEl.style.height = '100%';
        videoEl.style.objectFit = 'cover';
        videoEl.autoplay = true;
        videoEl.playsInline = true;
        element.innerHTML = '';
        element.appendChild(videoEl);
        videoTrack.attach(videoEl);
      }
    }
  }

  async toggleCamera(enabled: boolean): Promise<void> {
    if (this.isLeaving || this.isTogglingCamera) {
      return;
    }
    
    this.isTogglingCamera = true;
    
    try {
      if (enabled) {
        if (!this.localVideoTrack) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasCamera = devices.some(d => d.kind === 'videoinput');
          
          if (!hasCamera) {
            throw new Error('DEVICE_NOT_FOUND: No camera found');
          }

          this.localVideoTrack = await createLocalVideoTrack({
            resolution: LIVEKIT_CONFIG.VIDEO.resolution,
            deviceId: this.currentCameraId,
          });
        }
        
        this.playLocalVideo('local-video');
        
        if (this.isJoined && this.room?.localParticipant) {
          await this.room.localParticipant.publishTrack(this.localVideoTrack);
        }
        
        await this.updateDeviceIdsFromTracks();
      } else {
        if (this.localVideoTrack) {
          if (this.isJoined && this.room?.localParticipant) {
            await this.room.localParticipant.unpublishTrack(this.localVideoTrack);
          }
          this.localVideoTrack.stop();
          this.localVideoTrack = null;
        }
      }
    } catch (error) {
      if (this.localVideoTrack) {
        try {
          this.localVideoTrack.stop();
        } catch {
          // Ignore cleanup error
        }
        this.localVideoTrack = null;
      }
      throw error;
    } finally {
      this.isTogglingCamera = false;
    }
  }

  async toggleMicrophone(enabled: boolean): Promise<void> {
    if (this.isLeaving || this.isTogglingMic) {
      return;
    }
    
    this.isTogglingMic = true;
    
    try {
      if (enabled) {
        if (!this.localAudioTrack) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasMicrophone = devices.some(d => d.kind === 'audioinput');
          
          if (!hasMicrophone) {
            throw new Error('DEVICE_NOT_FOUND: No microphone found');
          }

          this.localAudioTrack = await createLocalAudioTrack({
            echoCancellation: LIVEKIT_CONFIG.AUDIO.echoCancellation,
            noiseSuppression: LIVEKIT_CONFIG.AUDIO.noiseSuppression,
            autoGainControl: LIVEKIT_CONFIG.AUDIO.autoGainControl,
            deviceId: this.currentMicId,
          });
        }
        
        if (this.isJoined && this.room?.localParticipant) {
          await this.room.localParticipant.publishTrack(this.localAudioTrack);
        }
        
        await this.updateDeviceIdsFromTracks();
      } else {
        if (this.localAudioTrack) {
          if (this.isJoined && this.room?.localParticipant) {
            await this.room.localParticipant.unpublishTrack(this.localAudioTrack);
          }
          this.localAudioTrack.stop();
          this.localAudioTrack = null;
        }
      }
    } catch (error) {
      if (this.localAudioTrack) {
        try {
          this.localAudioTrack.stop();
        } catch {
          // Ignore cleanup error
        }
        this.localAudioTrack = null;
      }
      throw error;
    } finally {
      this.isTogglingMic = false;
    }
  }
  
  async switchCamera(deviceId: string): Promise<void> {
    if (this.isLeaving) return;
    
    this.currentCameraId = deviceId;
    
    if (this.localVideoTrack) {
      if (this.isJoined && this.room?.localParticipant) {
        await this.room.localParticipant.unpublishTrack(this.localVideoTrack);
      }
      this.localVideoTrack.stop();
      
      this.localVideoTrack = await createLocalVideoTrack({
        resolution: LIVEKIT_CONFIG.VIDEO.resolution,
        deviceId,
      });
      
      this.playLocalVideo('local-video');
      if (this.isJoined && this.room?.localParticipant) {
        await this.room.localParticipant.publishTrack(this.localVideoTrack);
      }
    }
  }
  
  async switchMicrophone(deviceId: string): Promise<void> {
    if (this.isLeaving) return;
    
    this.currentMicId = deviceId;
    
    if (this.localAudioTrack) {
      if (this.isJoined && this.room?.localParticipant) {
        await this.room.localParticipant.unpublishTrack(this.localAudioTrack);
      }
      this.localAudioTrack.stop();
      
      this.localAudioTrack = await createLocalAudioTrack({
        echoCancellation: LIVEKIT_CONFIG.AUDIO.echoCancellation,
        noiseSuppression: LIVEKIT_CONFIG.AUDIO.noiseSuppression,
        autoGainControl: LIVEKIT_CONFIG.AUDIO.autoGainControl,
        deviceId,
      });
      
      if (this.isJoined && this.room?.localParticipant) {
        await this.room.localParticipant.publishTrack(this.localAudioTrack);
      }
    }
  }
  
  getCurrentDevices(): DeviceIds {
    return {
      cameraId: this.currentCameraId,
      micId: this.currentMicId,
    };
  }

  private async updateDeviceIdsFromTracks(): Promise<void> {
    try {
      if (this.localVideoTrack) {
        const trackSettings = this.localVideoTrack.mediaStreamTrack?.getSettings();
        if (trackSettings?.deviceId) {
          this.currentCameraId = trackSettings.deviceId;
        }
      }
      
      if (this.localAudioTrack) {
        const trackSettings = this.localAudioTrack.mediaStreamTrack?.getSettings();
        if (trackSettings?.deviceId) {
          this.currentMicId = trackSettings.deviceId;
        }
      }
    } catch {
      // Silently ignore device ID update errors
    }
  }

  async leave(): Promise<void> {
    if (!this.isJoined) {
      return;
    }
    
    if (this.isLeaving) {
      return;
    }
    
    this.isLeaving = true;

    try {
      if (this.localVideoTrack) {
        this.localVideoTrack.stop();
        this.localVideoTrack = null;
      }
      if (this.localAudioTrack) {
        this.localAudioTrack.stop();
        this.localAudioTrack = null;
      }
      if (this.localScreenTrack) {
        this.localScreenTrack.stop();
        this.localScreenTrack = null;
      }
      this.isScreenSharing = false;

      if (this.room) {
        await this.room.disconnect();
      }

      this.isJoined = false;
      this.isPreviewMode = false;
      this.isLeaving = false;
      
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: VideoPresets.h540.resolution,
        },
      });
      this.setupEventListeners();
    } catch (error) {
      this.isLeaving = false;
      this.isJoined = false;
      throw error;
    }
  }

  getRemoteParticipants(): RemoteParticipant[] {
    return Array.from(this.room?.remoteParticipants.values() || []);
  }

  isRoomJoined(): boolean {
    return this.isJoined;
  }

  setOnUserPublished(callback: (participant: RemoteParticipant, mediaType: 'audio' | 'video') => void): void {
    this.callbacks.onTrackSubscribed = callback;
  }

  setOnUserUnpublished(callback: (participant: RemoteParticipant, mediaType: 'audio' | 'video') => void): void {
    this.callbacks.onTrackUnsubscribed = callback;
  }

  setOnUserJoined(callback: (participant: RemoteParticipant) => void): void {
    this.callbacks.onParticipantConnected = callback;
  }

  setOnUserLeft(callback: (participant: RemoteParticipant) => void): void {
    this.callbacks.onParticipantDisconnected = callback;
  }

  setOnConnectionQualityChanged(callback: (quality: ConnectionQuality, participant: RemoteParticipant | null) => void): void {
    this.callbacks.onConnectionQualityChanged = callback;
  }

  setOnScreenShareSubscribed(callback: (participant: RemoteParticipant, isSharing: boolean) => void): void {
    this.callbacks.onScreenShareSubscribed = callback;
  }

  async startScreenShare(): Promise<void> {
    if (this.isLeaving || this.isTogglingScreenShare || this.isScreenSharing) {
      return;
    }

    if (!this.isJoined || !this.room?.localParticipant) {
      throw new Error('Must be in a room to share screen');
    }

    this.isTogglingScreenShare = true;

    try {
      const screenTracks = await createLocalScreenTracks({
        audio: true,
        resolution: VideoPresets.h1080.resolution,
        contentHint: 'detail',
      } as ScreenShareCaptureOptions);

      const videoTrack = screenTracks.find(t => t.kind === Track.Kind.Video) as LocalVideoTrack;
      if (!videoTrack) {
        throw new Error('Failed to get screen share video track');
      }

      this.localScreenTrack = videoTrack;

      await this.room.localParticipant.publishTrack(this.localScreenTrack, {
        source: Track.Source.ScreenShare,
        videoEncoding: {
          maxBitrate: 3_000_000,
          maxFramerate: 30,
        },
      });

      const audioTrack = screenTracks.find(t => t.kind === Track.Kind.Audio);
      if (audioTrack) {
        await this.room.localParticipant.publishTrack(audioTrack, {
          source: Track.Source.ScreenShareAudio,
        });
      }

      this.isScreenSharing = true;

      this.localScreenTrack.mediaStreamTrack.onended = () => {
        this.stopScreenShare().catch(() => {});
      };
    } catch (error) {
      this.localScreenTrack = null;
      this.isScreenSharing = false;
      throw error;
    } finally {
      this.isTogglingScreenShare = false;
    }
  }

  async stopScreenShare(): Promise<void> {
    if (this.isTogglingScreenShare || !this.isScreenSharing) {
      return;
    }

    this.isTogglingScreenShare = true;

    try {
      if (this.localScreenTrack) {
        if (this.isJoined && this.room?.localParticipant) {
          await this.room.localParticipant.unpublishTrack(this.localScreenTrack);
        }
        this.localScreenTrack.stop();
        this.localScreenTrack = null;
      }

      this.isScreenSharing = false;
    } catch (error) {
      throw error;
    } finally {
      this.isTogglingScreenShare = false;
    }
  }

  async toggleScreenShare(): Promise<boolean> {
    if (this.isScreenSharing) {
      await this.stopScreenShare();
      return false;
    } else {
      await this.startScreenShare();
      return true;
    }
  }

  isScreenSharingActive(): boolean {
    return this.isScreenSharing;
  }

  playRemoteScreenShare(participant: RemoteParticipant, elementId: string): void {
    const screenTrack = participant.getTrackPublications().find(
      pub => pub.source === Track.Source.ScreenShare && pub.track?.kind === Track.Kind.Video
    )?.track;

    if (screenTrack) {
      const element = document.getElementById(elementId);
      if (element && element instanceof HTMLVideoElement) {
        screenTrack.attach(element);
      } else if (element) {
        const videoEl = document.createElement('video');
        videoEl.style.width = '100%';
        videoEl.style.height = '100%';
        videoEl.style.objectFit = 'contain';
        videoEl.autoplay = true;
        videoEl.playsInline = true;
        element.innerHTML = '';
        element.appendChild(videoEl);
        screenTrack.attach(videoEl);
      }
    }
  }

  playRemoteCameraToPip(participant: RemoteParticipant, elementId: string): void {
    const cameraTrack = participant.getTrackPublications().find(
      pub => pub.source === Track.Source.Camera && pub.track?.kind === Track.Kind.Video
    )?.track;

    if (cameraTrack) {
      const element = document.getElementById(elementId);
      if (element && element instanceof HTMLVideoElement) {
        cameraTrack.attach(element);
      } else if (element) {
        const videoEl = document.createElement('video');
        videoEl.style.width = '100%';
        videoEl.style.height = '100%';
        videoEl.style.objectFit = 'cover';
        videoEl.autoplay = true;
        videoEl.playsInline = true;
        element.innerHTML = '';
        element.appendChild(videoEl);
        cameraTrack.attach(videoEl);
      }
    }
  }

  static convertQuality(quality: ConnectionQuality): NetworkQualityLevel {
    switch (quality) {
      case ConnectionQuality.Excellent:
        return 'excellent';
      case ConnectionQuality.Good:
        return 'good';
      case ConnectionQuality.Poor:
        return 'poor';
      default:
        return 'unknown';
    }
  }

  getLocalConnectionQuality(): NetworkQualityLevel {
    if (!this.room?.localParticipant) return 'unknown';
    return LiveKitService.convertQuality(this.room.localParticipant.connectionQuality);
  }

  getRemoteConnectionQuality(): NetworkQualityLevel {
    if (!this.room) return 'unknown';
    const remoteParticipants = Array.from(this.room.remoteParticipants.values());
    if (remoteParticipants.length === 0) return 'unknown';
    return LiveKitService.convertQuality(remoteParticipants[0].connectionQuality);
  }

  getLocalVideoTrack(): LocalVideoTrack | null {
    return this.localVideoTrack;
  }

  getLocalAudioTrack(): LocalAudioTrack | null {
    return this.localAudioTrack;
  }

  reattachLocalVideo(elementId: string): void {
    if (this.localVideoTrack) {
      this.playLocalVideo(elementId);
    }
  }
}
