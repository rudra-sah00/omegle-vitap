/**
 * LiveKit Service Types
 * Type definitions for WebRTC communication
 */

import type { RemoteParticipant, ConnectionQuality } from 'livekit-client';

export interface LiveKitConfig {
  serverUrl: string;
  token: string;
  roomName: string;
}

export interface LiveKitCallbacks {
  onParticipantConnected?: (participant: RemoteParticipant) => void;
  onParticipantDisconnected?: (participant: RemoteParticipant) => void;
  onTrackSubscribed?: (participant: RemoteParticipant, trackType: 'audio' | 'video') => void;
  onTrackUnsubscribed?: (participant: RemoteParticipant, trackType: 'audio' | 'video') => void;
  onConnectionQualityChanged?: (
    quality: ConnectionQuality,
    participant: RemoteParticipant | null
  ) => void;
  onScreenShareSubscribed?: (participant: RemoteParticipant, isSharing: boolean) => void;
}

export interface DeviceIds {
  cameraId?: string;
  micId?: string;
}

export type NetworkQualityLevel = 'excellent' | 'good' | 'poor' | 'unknown';
