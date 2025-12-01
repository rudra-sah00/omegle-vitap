/**
 * Room Manager
 * Handles room lifecycle and event listeners
 */

import {
  Room,
  RoomEvent,
  RemoteParticipant,
  Track,
  RemoteTrack,
  ConnectionQuality,
  VideoPresets,
} from 'livekit-client';
import { LIVEKIT_CONFIG } from '../config';
import type { LiveKitConfig, NetworkQualityLevel } from '../types';
import type { LiveKitState, LiveKitCallbacks } from './types';
import { TrackManager } from './track.manager';

/**
 * RoomManager Class
 *
 * Manages room lifecycle:
 * - Room creation and configuration
 * - Event listener setup
 * - Join/leave operations
 * - Quality adaptation
 */
export class RoomManager {
  private trackManager: TrackManager;

  constructor(
    private state: LiveKitState,
    private callbacks: LiveKitCallbacks
  ) {
    this.trackManager = new TrackManager(state);
    this.initializeRoom();
  }

  /**
   * Initialize LiveKit Room with default settings
   */
  private initializeRoom(): void {
    this.state.room = new Room({
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

  /**
   * Setup Room event listeners
   */
  private setupEventListeners(): void {
    if (!this.state.room) return;

    // Participant events
    this.state.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      this.callbacks.onParticipantConnected?.(participant);
    });

    this.state.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      this.callbacks.onParticipantDisconnected?.(participant);
    });

    // Track events
    this.state.room.on(
      RoomEvent.TrackSubscribed,
      (track: RemoteTrack, publication, participant: RemoteParticipant) => {
        const mediaType = track.kind === Track.Kind.Video ? 'video' : 'audio';

        // Auto-attach audio tracks
        if (track.kind === Track.Kind.Audio) {
          track.attach();
        }

        this.callbacks.onTrackSubscribed?.(participant, mediaType);
      }
    );

    this.state.room.on(
      RoomEvent.TrackUnsubscribed,
      (track: RemoteTrack, publication, participant: RemoteParticipant) => {
        const mediaType = track.kind === Track.Kind.Video ? 'video' : 'audio';
        track.detach();

        this.callbacks.onTrackUnsubscribed?.(participant, mediaType);
      }
    );

    // Quality events
    this.state.room.on(
      RoomEvent.ConnectionQualityChanged,
      (quality: ConnectionQuality, participant) => {
        const networkQuality = RoomManager.convertQuality(quality);
        const isLocal =
          !participant || participant.identity === this.state.room?.localParticipant?.identity;

        if (isLocal && networkQuality !== this.state.currentNetworkQuality) {
          this.state.currentNetworkQuality = networkQuality;
          this.adaptQualityToNetwork();
        }

        this.callbacks.onConnectionQualityChanged?.(
          quality,
          participant as RemoteParticipant | null
        );
      }
    );

    // Disconnect event
    this.state.room.on(RoomEvent.Disconnected, () => {
      this.state.isJoined = false;
    });
  }

  /**
   * Adapt video quality based on network conditions
   */
  private async adaptQualityToNetwork(): Promise<void> {
    if (!this.state.room?.localParticipant) return;

    try {
      const videoPublication = this.state.room.localParticipant.getTrackPublication(
        Track.Source.Camera
      );
      if (videoPublication?.track) {
        await this.state.room.localParticipant.setTrackSubscriptionPermissions(true);
      }
    } catch {
      // Quality adaptation failed - non-critical
    }
  }

  /**
   * Join a LiveKit room
   */
  async join(
    config: LiveKitConfig,
    cameraOn: boolean = true,
    micOn: boolean = true
  ): Promise<void> {
    if (!this.state.room) {
      throw new Error('LiveKit room not initialized');
    }

    if (this.state.isJoined) return;

    if (this.state.isLeaving) {
      throw new Error('Cannot join while leaving another room');
    }

    try {
      if (!config.serverUrl || !config.token) {
        throw new Error('Invalid LiveKit configuration: missing serverUrl or token');
      }

      await this.state.room.connect(config.serverUrl, config.token, {
        autoSubscribe: true,
      });

      this.state.isJoined = true;

      await this.trackManager.createAndPublishTracks(cameraOn, micOn);
      await this.trackManager.updateDeviceIdsFromTracks();
    } catch (error) {
      this.state.isJoined = false;
      if (this.state.room) {
        try {
          await this.state.room.disconnect();
        } catch {
          /* ignore */
        }
      }
      throw error;
    }
  }

  /**
   * Leave the current room and cleanup
   */
  async leave(): Promise<void> {
    if (!this.state.isJoined || this.state.isLeaving) return;

    this.state.isLeaving = true;

    try {
      // Stop all tracks
      this.trackManager.stopAllTracks();

      // Disconnect from room
      if (this.state.room) {
        await this.state.room.disconnect();
      }

      // Reset state
      this.state.isJoined = false;
      this.state.isPreviewMode = false;
      this.state.isLeaving = false;

      // Create fresh room for next session
      this.state.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: VideoPresets.h540.resolution,
        },
      });
      this.setupEventListeners();
    } catch (error) {
      this.state.isLeaving = false;
      this.state.isJoined = false;
      throw error;
    }
  }

  /**
   * Get remote participants
   */
  getRemoteParticipants(): RemoteParticipant[] {
    return Array.from(this.state.room?.remoteParticipants.values() || []);
  }

  /**
   * Convert LiveKit ConnectionQuality to our type
   */
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

  /**
   * Get local connection quality
   */
  getLocalConnectionQuality(): NetworkQualityLevel {
    if (!this.state.room?.localParticipant) return 'unknown';
    return RoomManager.convertQuality(this.state.room.localParticipant.connectionQuality);
  }

  /**
   * Get remote connection quality
   */
  getRemoteConnectionQuality(): NetworkQualityLevel {
    if (!this.state.room) return 'unknown';
    const remotes = Array.from(this.state.room.remoteParticipants.values());
    if (remotes.length === 0) return 'unknown';
    return RoomManager.convertQuality(remotes[0].connectionQuality);
  }
}
