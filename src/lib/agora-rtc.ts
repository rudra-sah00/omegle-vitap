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
  private isLeaving = false;
  private isPreviewMode = false; // Track if we're in preview mode (before joining)
  
  // Current device IDs
  private currentCameraId?: string;
  private currentMicId?: string;

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
      
      if (mediaType === 'audio' || mediaType === 'video') {
        await this.client?.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
        }
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }

        this.onUserPublished?.(user, mediaType);
      }
    });

    this.client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'audio' || mediaType === 'video') {
        this.onUserUnpublished?.(user, mediaType);
      }
    });

    this.client.on('user-joined', (user) => {
      this.onUserJoined?.(user);
    });

    this.client.on('user-left', (user) => {
      this.onUserLeft?.(user);
    });
  }

  /**
   * Create local tracks for preview (without joining channel)
   */
  async createLocalPreview(cameraOn: boolean = true, micOn: boolean = true): Promise<void> {
    // Validate browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Browser does not support media devices');
    }

    try {
      // If tracks already exist, just update their state and replay
      if (this.localVideoTrack && this.localAudioTrack) {
        await this.localVideoTrack.setEnabled(cameraOn);
        await this.localAudioTrack.setEnabled(micOn);
        
        // Replay video if camera is on
        if (cameraOn) {
          this.localVideoTrack.play('local-video');
        }
        return;
      }

      // Check available devices before creating tracks
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(d => d.kind === 'videoinput');
      const hasMic = devices.some(d => d.kind === 'audioinput');

      if (cameraOn && !hasCamera) {
        throw new Error('No camera device found');
      }
      if (micOn && !hasMic) {
        throw new Error('No microphone device found');
      }

      // Create new tracks
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

      // Set initial enabled state
      await this.localVideoTrack.setEnabled(cameraOn);
      await this.localAudioTrack.setEnabled(micOn);
      
      this.isPreviewMode = true;
      
      // Play video preview
      if (cameraOn && this.localVideoTrack) {
        this.localVideoTrack.play('local-video');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Join Agora channel with video and audio
   */
  async join(config: AgoraRTCConfig, cameraOn: boolean = true, micOn: boolean = true): Promise<void> {
    if (!this.client) {
      throw new Error('Agora client not initialized');
    }

    if (this.isJoined) {
      return;
    }

    // Validate config
    if (!config.appId || !config.channelName) {
      throw new Error('Invalid Agora configuration: missing appId or channelName');
    }

    // Check network connectivity
    if (!navigator.onLine) {
      throw new Error('No internet connection');
    }

    try {
      // Set connection timeout
      const joinTimeout = setTimeout(() => {
        throw new Error('Connection timeout: Could not join channel');
      }, 10000); // 10 second timeout

      // Join the channel
      await this.client.join(
        config.appId, // App ID is required
        config.channelName,
        config.token,
        config.uid
      );

      clearTimeout(joinTimeout);
      this.isJoined = true;

      // Create and publish local tracks with initial state
      await this.createAndPublishTracks(cameraOn, micOn);
    } catch (error) {
      // Clean up on error
      this.isJoined = false;
      if (this.client) {
        try {
          await this.client.leave();
        } catch (leaveError) {
          // Ignore leave errors
        }
      }
      throw error;
    }
  }

  /**
   * Create local video and audio tracks and publish them
   */
  private async createAndPublishTracks(cameraOn: boolean = true, micOn: boolean = true): Promise<void> {
    if (!this.client) return;
    
    // Check if we're disconnecting
    if (this.isLeaving) {
      return;
    }
    
    // Check connection state
    if (this.client.connectionState !== 'CONNECTED') {
      return;
    }

    try {
      // Set track creation timeout
      const trackTimeout = setTimeout(() => {
        throw new Error('Track creation timeout: Could not access camera or microphone');
      }, 15000); // 15 second timeout

      // Create microphone and camera tracks
      [this.localAudioTrack, this.localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
        {
          // Audio config
          AEC: true, // Acoustic Echo Cancellation
          ANS: true, // Automatic Noise Suppression
          AGC: true, // Automatic Gain Control
          microphoneId: this.currentMicId || undefined,
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
          cameraId: this.currentCameraId || undefined,
        }
      );

      clearTimeout(trackTimeout);

      // Set enabled state
      await this.localVideoTrack.setEnabled(cameraOn);
      await this.localAudioTrack.setEnabled(micOn);

      // Only publish enabled tracks
      const tracksToPublish = [];
      if (cameraOn && this.localVideoTrack) {
        tracksToPublish.push(this.localVideoTrack);
      }
      if (micOn && this.localAudioTrack) {
        tracksToPublish.push(this.localAudioTrack);
      }

      if (tracksToPublish.length > 0) {
        // Set publish timeout
        const publishTimeout = setTimeout(() => {
          throw new Error('Publish timeout: Could not publish tracks to channel');
        }, 10000); // 10 second timeout

        await this.client.publish(tracksToPublish);
        clearTimeout(publishTimeout);
      }
    } catch (error) {
      // Clean up tracks on error
      if (this.localVideoTrack) {
        this.localVideoTrack.stop();
        this.localVideoTrack.close();
        this.localVideoTrack = null;
      }
      if (this.localAudioTrack) {
        this.localAudioTrack.stop();
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }
      throw error;
    }
  }

  /**
   * Play local video in a DOM element
   */
  playLocalVideo(elementId: string): void {
    if (this.localVideoTrack) {
      this.localVideoTrack.play(elementId);
    }
  }

  /**
   * Stop preview and cleanup tracks (only if not in a call)
   */
  async stopPreview(): Promise<void> {
    if (this.isJoined) {
      return;
    }

    if (this.localVideoTrack) {
      this.localVideoTrack.stop();
      this.localVideoTrack.close();
      this.localVideoTrack = null;
    }

    if (this.localAudioTrack) {
      this.localAudioTrack.stop();
      this.localAudioTrack.close();
      this.localAudioTrack = null;
    }

    this.isPreviewMode = false;
  }

  /**
   * Publish video track to channel
   */
  async publishVideoTrack(): Promise<void> {
    if (!this.client || !this.localVideoTrack) return;
    
    try {
      await this.client.publish([this.localVideoTrack]);
    } catch (error) {
    }
  }

  /**
   * Unpublish video track from channel
   */
  async unpublishVideoTrack(): Promise<void> {
    if (!this.client || !this.localVideoTrack) return;
    
    try {
      await this.client.unpublish([this.localVideoTrack]);
    } catch (error) {
    }
  }

  /**
   * Publish audio track to channel
   */
  async publishAudioTrack(): Promise<void> {
    if (!this.client || !this.localAudioTrack) return;
    
    try {
      await this.client.publish([this.localAudioTrack]);
    } catch (error) {
    }
  }

  /**
   * Unpublish audio track from channel
   */
  async unpublishAudioTrack(): Promise<void> {
    if (!this.client || !this.localAudioTrack) return;
    
    try {
      await this.client.unpublish([this.localAudioTrack]);
    } catch (error) {
    }
  }

  /**
   * Play remote video in a DOM element
   */
  playRemoteVideo(user: IAgoraRTCRemoteUser, elementId: string): void {
    if (user.videoTrack) {
      user.videoTrack.play(elementId);
    }
  }

  /**
   * Toggle local camera on/off - PROPERLY closes/reopens hardware
   */
  async toggleCamera(enabled: boolean): Promise<void> {
    if (this.isLeaving) {
      return;
    }
    
    try {
      if (enabled) {
        // Create new track if it doesn't exist
        if (!this.localVideoTrack) {
          // Set timeout for track creation
          const createTimeout = setTimeout(() => {
            throw new Error('Camera timeout: Could not access camera');
          }, 10000);

          this.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
            cameraId: this.currentCameraId,
          });

          clearTimeout(createTimeout);
        } else {
          // Just enable if track exists
          await this.localVideoTrack.setEnabled(true);
        }
        
        // Play the video
        this.localVideoTrack.play('local-video');
        
        // If in a call, publish the track
        if (this.isJoined && this.client) {
          const publishTimeout = setTimeout(() => {
            throw new Error('Publish timeout: Could not publish camera');
          }, 5000);

          await this.client.publish([this.localVideoTrack]);
          clearTimeout(publishTimeout);
        }
      } else {
        // Turn OFF - unpublish and CLOSE the track (releases camera hardware)
        if (this.localVideoTrack) {
          // Unpublish if in a call
          if (this.isJoined && this.client) {
            try {
              await this.client.unpublish([this.localVideoTrack]);
            } catch (unpublishError) {
              // Ignore unpublish errors, continue with cleanup
            }
          }
          
          // Stop and close track (releases camera)
          this.localVideoTrack.stop();
          this.localVideoTrack.close();
          this.localVideoTrack = null;
        }
      }
    } catch (error) {
      // Clean up on error
      if (this.localVideoTrack) {
        try {
          this.localVideoTrack.stop();
          this.localVideoTrack.close();
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        this.localVideoTrack = null;
      }
      throw error;
    }
  }

  /**
   * Toggle local microphone on/off - PROPERLY closes/reopens hardware
   */
  async toggleMicrophone(enabled: boolean): Promise<void> {
    if (this.isLeaving) {
      return;
    }
    
    try {
      if (enabled) {
        // Create new track if it doesn't exist
        if (!this.localAudioTrack) {
          // Set timeout for track creation
          const createTimeout = setTimeout(() => {
            throw new Error('Microphone timeout: Could not access microphone');
          }, 10000);

          this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
            microphoneId: this.currentMicId,
          });

          clearTimeout(createTimeout);
        } else {
          // Just enable if track exists
          await this.localAudioTrack.setEnabled(true);
        }
        
        // If in a call, publish the track
        if (this.isJoined && this.client) {
          const publishTimeout = setTimeout(() => {
            throw new Error('Publish timeout: Could not publish microphone');
          }, 5000);

          await this.client.publish([this.localAudioTrack]);
          clearTimeout(publishTimeout);
        }
      } else {
        // Turn OFF - unpublish and CLOSE the track (releases mic hardware)
        if (this.localAudioTrack) {
          // Unpublish if in a call
          if (this.isJoined && this.client) {
            try {
              await this.client.unpublish([this.localAudioTrack]);
            } catch (unpublishError) {
              // Ignore unpublish errors, continue with cleanup
            }
          }
          
          // Stop and close track (releases microphone)
          this.localAudioTrack.stop();
          this.localAudioTrack.close();
          this.localAudioTrack = null;
        }
      }
    } catch (error) {
      // Clean up on error
      if (this.localAudioTrack) {
        try {
          this.localAudioTrack.stop();
          this.localAudioTrack.close();
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        this.localAudioTrack = null;
      }
      throw error;
    }
  }
  
  /**
   * Switch to a different camera device
   */
  async switchCamera(deviceId: string): Promise<void> {
    if (this.isLeaving) return;
    
    try {
      // Store the new device ID
      this.currentCameraId = deviceId;
      
      const wasEnabled = !!this.localVideoTrack;
      
      if (wasEnabled) {
        // Close old track
        if (this.localVideoTrack) {
          if (this.isJoined && this.client) {
            await this.client.unpublish([this.localVideoTrack]);
          }
          this.localVideoTrack.stop();
          this.localVideoTrack.close();
        }
        
        // Create new track with selected device
        this.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
          cameraId: deviceId,
        });
        
        // Play the new video
        this.localVideoTrack.play('local-video');
        
        // Publish if in a call
        if (this.isJoined && this.client) {
          await this.client.publish([this.localVideoTrack]);
        }
      }
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Switch to a different microphone device
   */
  async switchMicrophone(deviceId: string): Promise<void> {
    if (this.isLeaving) return;
    
    try {
      // Store the new device ID
      this.currentMicId = deviceId;
      
      const wasEnabled = !!this.localAudioTrack;
      
      if (wasEnabled) {
        // Close old track
        if (this.localAudioTrack) {
          if (this.isJoined && this.client) {
            await this.client.unpublish([this.localAudioTrack]);
          }
          this.localAudioTrack.stop();
          this.localAudioTrack.close();
        }
        
        // Create new track with selected device
        this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
          microphoneId: deviceId,
        });
        
        // Publish if in a call
        if (this.isJoined && this.client) {
          await this.client.publish([this.localAudioTrack]);
        }
      }
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get current device IDs
   */
  getCurrentDevices(): { cameraId?: string; micId?: string } {
    return {
      cameraId: this.currentCameraId,
      micId: this.currentMicId,
    };
  }

  /**
   * Leave the channel and cleanup
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

      this.isLeaving = false;
    } catch (error) {
      this.isLeaving = false;
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
