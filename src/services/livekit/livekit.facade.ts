/**
 * LiveKit Service Facade
 *
 * Main entry point for LiveKit functionality. This facade provides a unified API
 * that delegates to specialized manager modules:
 *
 * - RoomManager: Room lifecycle and events
 * - TrackManager: Local track management (camera, mic)
 * - VideoRenderer: DOM attachment utilities
 *
 * This facade maintains backward compatibility with the original monolithic
 * LiveKitService API while providing better code organization.
 */

import type {
  Room,
  LocalVideoTrack,
  LocalAudioTrack,
  RemoteParticipant,
  ConnectionQuality,
} from 'livekit-client';
import type { LiveKitConfig, DeviceIds, NetworkQualityLevel } from './types';
import {
  TrackManager,
  RoomManager,
  attachLocalVideo,
  attachRemoteVideo,
  attachRemoteCameraToPip,
  type LiveKitState,
  type LiveKitCallbacks,
} from './managers';

/**
 * LiveKitService Class
 *
 * Unified interface for all LiveKit functionality.
 * Instantiate once per session and reuse across components.
 */
export class LiveKitService {
  // Shared state across all managers
  private state: LiveKitState;

  // Callbacks for room events
  private callbacks: LiveKitCallbacks = {};

  // Manager instances
  private roomManager: RoomManager;
  private trackManager: TrackManager;

  constructor() {
    // Initialize shared state
    this.state = {
      room: null,
      localVideoTrack: null,
      localAudioTrack: null,
      localScreenTrack: null,
      isJoined: false,
      isLeaving: false,
      isPreviewMode: false,
      isTogglingCamera: false,
      isTogglingMic: false,
      currentCameraId: undefined,
      currentMicId: undefined,
      currentNetworkQuality: 'unknown',
    };

    // Initialize managers
    this.trackManager = new TrackManager(this.state);
    this.roomManager = new RoomManager(this.state, this.callbacks);
  }

  // ============================================
  // PREVIEW MODE
  // ============================================

  async createLocalPreview(cameraOn: boolean = true, micOn: boolean = true): Promise<void> {
    await this.trackManager.createPreview(cameraOn, micOn);
  }

  async stopPreview(): Promise<void> {
    await this.trackManager.stopPreview();
  }

  // ============================================
  // ROOM LIFECYCLE
  // ============================================

  async join(
    config: LiveKitConfig,
    cameraOn: boolean = true,
    micOn: boolean = true
  ): Promise<void> {
    await this.roomManager.join(config, cameraOn, micOn);
  }

  async leave(): Promise<void> {
    await this.roomManager.leave();
  }

  isRoomJoined(): boolean {
    return this.state.isJoined;
  }

  getRemoteParticipants(): RemoteParticipant[] {
    return this.roomManager.getRemoteParticipants();
  }

  // ============================================
  // CAMERA & MICROPHONE
  // ============================================

  async toggleCamera(enabled: boolean): Promise<void> {
    await this.trackManager.toggleCamera(enabled);
  }

  async toggleMicrophone(enabled: boolean): Promise<void> {
    await this.trackManager.toggleMicrophone(enabled);
  }

  async switchCamera(deviceId: string): Promise<void> {
    await this.trackManager.switchCamera(deviceId);
  }

  async switchMicrophone(deviceId: string): Promise<void> {
    await this.trackManager.switchMicrophone(deviceId);
  }

  getCurrentDevices(): DeviceIds {
    return {
      cameraId: this.state.currentCameraId,
      micId: this.state.currentMicId,
    };
  }

  // ============================================
  // VIDEO RENDERING
  // ============================================

  playLocalVideo(elementId: string): void {
    attachLocalVideo(this.state.localVideoTrack, elementId);
  }

  playRemoteVideo(participant: RemoteParticipant, elementId: string): void {
    attachRemoteVideo(participant, elementId);
  }

  playRemoteCameraToPip(participant: RemoteParticipant, elementId: string): void {
    attachRemoteCameraToPip(participant, elementId);
  }

  reattachLocalVideo(elementId: string): void {
    if (this.state.localVideoTrack) {
      this.playLocalVideo(elementId);
    }
  }

  // ============================================
  // CONNECTION QUALITY
  // ============================================

  static convertQuality(quality: ConnectionQuality): NetworkQualityLevel {
    return RoomManager.convertQuality(quality);
  }

  getLocalConnectionQuality(): NetworkQualityLevel {
    return this.roomManager.getLocalConnectionQuality();
  }

  getRemoteConnectionQuality(): NetworkQualityLevel {
    return this.roomManager.getRemoteConnectionQuality();
  }

  // ============================================
  // CALLBACK SETTERS
  // ============================================

  setOnUserPublished(
    callback: (participant: RemoteParticipant, mediaType: 'audio' | 'video') => void
  ): void {
    this.callbacks.onTrackSubscribed = callback;
  }

  setOnUserUnpublished(
    callback: (participant: RemoteParticipant, mediaType: 'audio' | 'video') => void
  ): void {
    this.callbacks.onTrackUnsubscribed = callback;
  }

  setOnUserJoined(callback: (participant: RemoteParticipant) => void): void {
    this.callbacks.onParticipantConnected = callback;
  }

  setOnUserLeft(callback: (participant: RemoteParticipant) => void): void {
    this.callbacks.onParticipantDisconnected = callback;
  }

  setOnConnectionQualityChanged(
    callback: (quality: ConnectionQuality, participant: RemoteParticipant | null) => void
  ): void {
    this.callbacks.onConnectionQualityChanged = callback;
  }

  // ============================================
  // TRACK & ROOM ACCESSORS
  // ============================================

  getLocalVideoTrack(): LocalVideoTrack | null {
    return this.state.localVideoTrack;
  }

  getLocalAudioTrack(): LocalAudioTrack | null {
    return this.state.localAudioTrack;
  }

  getRoom(): Room | null {
    return this.state.room;
  }

  getLocalParticipantIdentity(): string | null {
    return this.state.room?.localParticipant?.identity ?? null;
  }
}
