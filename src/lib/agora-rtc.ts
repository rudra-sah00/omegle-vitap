/**
 * Agora RTC Service for Video/Audio Communication
 */

import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
  UID,
} from 'agora-rtc-sdk-ng';

export interface AgoraRTCConfig {
  appId: string;
  channelName: string;
  token: string;
  uid: string;
}

export class AgoraRTCService {
  private client: IAgoraRTCClient | null = null;
  private localVideoTrack: ICameraVideoTrack | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private isJoined = false;

  // Callbacks
  private onUserPublished?: (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => void;
  private onUserUnpublished?: (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => void;
  private onUserJoined?: (user: IAgoraRTCRemoteUser) => void;
  private onUserLeft?: (user: IAgoraRTCRemoteUser) => void;

  constructor() {
    // Disable Agora RTC SDK logs (only show errors)
    AgoraRTC.setLogLevel(4); // 0=DEBUG, 1=INFO, 2=WARNING, 3=ERROR, 4=NONE
    
    this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for remote users
   */
  private setupEventListeners(): void {
    if (!this.client) return;

    this.client.on('user-published', async (user, mediaType) => {
      console.log('[Agora RTC] User published:', user.uid, mediaType);
      
      if (mediaType === 'audio' || mediaType === 'video') {
        await this.client?.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
          console.log('[Agora RTC] Playing remote video');
        }
        if (mediaType === 'audio') {
          console.log('[Agora RTC] Playing remote audio');
          user.audioTrack?.play();
        }

        this.onUserPublished?.(user, mediaType);
      }
    });

    this.client.on('user-unpublished', (user, mediaType) => {
      console.log('[Agora RTC] User unpublished:', user.uid, mediaType);
      if (mediaType === 'audio' || mediaType === 'video') {
        this.onUserUnpublished?.(user, mediaType);
      }
    });

    this.client.on('user-joined', (user) => {
      console.log('[Agora RTC] User joined:', user.uid);
      this.onUserJoined?.(user);
    });

    this.client.on('user-left', (user) => {
      console.log('[Agora RTC] User left:', user.uid);
      this.onUserLeft?.(user);
    });
  }

  /**
   * Join Agora channel with video and audio
   */
  async join(config: AgoraRTCConfig): Promise<void> {
    if (!this.client) {
      throw new Error('Agora client not initialized');
    }

    if (this.isJoined) {
      console.warn('[Agora RTC] Already joined channel');
      return;
    }

    try {
      // Join the channel
      await this.client.join(
        config.appId, // App ID is required
        config.channelName,
        config.token,
        config.uid
      );

      console.log('[Agora RTC] Joined channel:', config.channelName);
      this.isJoined = true;

      // Create and publish local tracks
      await this.createAndPublishTracks();
    } catch (error) {
      console.error('[Agora RTC] Failed to join channel:', error);
      throw error;
    }
  }

  /**
   * Create local video and audio tracks and publish them
   */
  private async createAndPublishTracks(): Promise<void> {
    if (!this.client) return;

    try {
      // Create microphone and camera tracks
      [this.localAudioTrack, this.localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
        {
          // Audio config
          AEC: true, // Acoustic Echo Cancellation
          ANS: true, // Automatic Noise Suppression
          AGC: true, // Automatic Gain Control
        },
        {
          // Video config
          encoderConfig: {
            width: 640,
            height: 480,
            frameRate: 30,
            bitrateMin: 400,
            bitrateMax: 1000,
          },
          optimizationMode: 'detail',
        }
      );

      console.log('[Agora RTC] Local tracks created');

      // Publish tracks to the channel
      await this.client.publish([this.localAudioTrack, this.localVideoTrack]);
      console.log('[Agora RTC] Published local tracks');
    } catch (error) {
      console.error('[Agora RTC] Failed to create/publish tracks:', error);
      throw error;
    }
  }

  /**
   * Play local video in a DOM element
   */
  playLocalVideo(elementId: string): void {
    if (this.localVideoTrack) {
      this.localVideoTrack.play(elementId);
      console.log('[Agora RTC] Playing local video in:', elementId);
    }
  }

  /**
   * Play remote video in a DOM element
   */
  playRemoteVideo(user: IAgoraRTCRemoteUser, elementId: string): void {
    if (user.videoTrack) {
      user.videoTrack.play(elementId);
      console.log('[Agora RTC] Playing remote video in:', elementId);
    }
  }

  /**
   * Toggle local camera on/off
   */
  async toggleCamera(enabled: boolean): Promise<void> {
    if (!this.localVideoTrack) return;
    
    await this.localVideoTrack.setEnabled(enabled);
    console.log('[Agora RTC] Camera:', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Toggle local microphone on/off
   */
  async toggleMicrophone(enabled: boolean): Promise<void> {
    if (!this.localAudioTrack) return;
    
    await this.localAudioTrack.setEnabled(enabled);
    console.log('[Agora RTC] Microphone:', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Leave the channel and cleanup
   */
  async leave(): Promise<void> {
    if (!this.isJoined) {
      console.warn('[Agora RTC] Not joined to any channel');
      return;
    }

    try {
      // Stop and close local tracks
      if (this.localAudioTrack) {
        this.localAudioTrack.stop();
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }

      if (this.localVideoTrack) {
        this.localVideoTrack.stop();
        this.localVideoTrack.close();
        this.localVideoTrack = null;
      }

      // Leave the channel
      if (this.client) {
        await this.client.leave();
        this.isJoined = false;
      }

      console.log('[Agora RTC] Left channel and cleaned up');
    } catch (error) {
      console.error('[Agora RTC] Error leaving channel:', error);
      throw error;
    }
  }

  /**
   * Get remote users in the channel
   */
  getRemoteUsers(): IAgoraRTCRemoteUser[] {
    return this.client?.remoteUsers || [];
  }

  /**
   * Check if user is joined to channel
   */
  isChannelJoined(): boolean {
    return this.isJoined;
  }

  /**
   * Set callback for user published event
   */
  setOnUserPublished(callback: (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => void): void {
    this.onUserPublished = callback;
  }

  /**
   * Set callback for user unpublished event
   */
  setOnUserUnpublished(callback: (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => void): void {
    this.onUserUnpublished = callback;
  }

  /**
   * Set callback for user joined event
   */
  setOnUserJoined(callback: (user: IAgoraRTCRemoteUser) => void): void {
    this.onUserJoined = callback;
  }

  /**
   * Set callback for user left event
   */
  setOnUserLeft(callback: (user: IAgoraRTCRemoteUser) => void): void {
    this.onUserLeft = callback;
  }

  /**
   * Get local video track
   */
  getLocalVideoTrack(): ICameraVideoTrack | null {
    return this.localVideoTrack;
  }

  /**
   * Get local audio track
   */
  getLocalAudioTrack(): IMicrophoneAudioTrack | null {
    return this.localAudioTrack;
  }
}
