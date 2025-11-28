/**
 * LiveKit Managers - Shared Types
 * Internal types used across manager modules
 */

import type { 
  Room, 
  LocalVideoTrack, 
  LocalAudioTrack, 
  RemoteParticipant,
  ConnectionQuality 
} from 'livekit-client';
import type { NetworkQuality } from '../config';

// ============================================
// STATE INTERFACE
// Shared state accessed by all managers
// ============================================

export interface LiveKitState {
  /** LiveKit Room instance */
  room: Room | null;
  
  /** Local camera video track */
  localVideoTrack: LocalVideoTrack | null;
  
  /** Local microphone audio track */
  localAudioTrack: LocalAudioTrack | null;
  
  /** Local screen share video track */
  localScreenTrack: LocalVideoTrack | null;
  
  /** Whether we've successfully joined a room */
  isJoined: boolean;
  
  /** Whether we're in the process of leaving */
  isLeaving: boolean;
  
  /** Whether we're in preview mode */
  isPreviewMode: boolean;
  
  /** Whether screen share is currently active */
  isScreenSharing: boolean;
  
  /** Mutex for camera toggle operations */
  isTogglingCamera: boolean;
  
  /** Mutex for microphone toggle operations */
  isTogglingMic: boolean;
  
  /** Mutex for screen share toggle operations */
  isTogglingScreenShare: boolean;
  
  /** Currently selected camera device ID */
  currentCameraId?: string;
  
  /** Currently selected microphone device ID */
  currentMicId?: string;
  
  /** Current network quality level */
  currentNetworkQuality: NetworkQuality;
}

// ============================================
// CALLBACK INTERFACE
// ============================================

export interface LiveKitCallbacks {
  onParticipantConnected?: (participant: RemoteParticipant) => void;
  onParticipantDisconnected?: (participant: RemoteParticipant) => void;
  onTrackSubscribed?: (participant: RemoteParticipant, trackType: 'audio' | 'video') => void;
  onTrackUnsubscribed?: (participant: RemoteParticipant, trackType: 'audio' | 'video') => void;
  onConnectionQualityChanged?: (quality: ConnectionQuality, participant: RemoteParticipant | null) => void;
  onScreenShareSubscribed?: (participant: RemoteParticipant, isSharing: boolean) => void;
}

// ============================================
// MANAGER BASE CLASS
// ============================================

/**
 * Base class for LiveKit managers
 * Provides access to shared state and callbacks
 */
export abstract class BaseManager {
  protected state: LiveKitState;
  protected callbacks: LiveKitCallbacks;

  constructor(state: LiveKitState, callbacks: LiveKitCallbacks) {
    this.state = state;
    this.callbacks = callbacks;
  }
}
