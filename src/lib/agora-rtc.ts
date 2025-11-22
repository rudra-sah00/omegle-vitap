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
  
  // Track operation flags to prevent race conditions
  private isTogglingCamera = false;
  private isTogglingMic = false;
  
  // Current device IDs
  private currentCameraId?: string;
  private currentMicId?: string;

  // Callbacks
  private onUserPublished?: (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => void;
  private onUserUnpublished?: (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => void;
  private onUserJoined?: (user: IAgoraRTCRemoteUser) => void;
  private onUserLeft?: (user: IAgoraRTCRemoteUser) => void;

  constructor() {
    try {
      // Note: Browser polyfills are initialized at root layout level
      
      // Disable Agora RTC SDK logs (only show errors)
      AgoraRTC.setLogLevel(4); // 0=DEBUG, 1=INFO, 2=WARNING, 3=ERROR, 4=NONE
      
      // Use h264 codec for better Safari compatibility, vp8 as fallback
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const codec = isSafari ? 'h264' : 'vp8';
      
      this.client = AgoraRTC.createClient({ mode: 'rtc', codec });
      this.setupEventListeners();
    } catch (error) {
      // Silently handle initialization error
      throw new Error('Failed to initialize video service');
    }
  }

  /**
   * Setup event listeners for remote users
   */
  private setupEventListeners(): void {
    if (!this.client) return;

    this.client.on('user-published', async (user, mediaType) => {
      try {
        if (mediaType === 'audio' || mediaType === 'video') {
          await this.client?.subscribe(user, mediaType);
          
          if (mediaType === 'video') {
            // Video track available
          }
          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }

          this.onUserPublished?.(user, mediaType);
        }
      } catch (error) {
        // Silently handle subscription errors
      }
    });

    this.client.on('user-unpublished', (user, mediaType) => {
      try {
        if (mediaType === 'audio' || mediaType === 'video') {
          this.onUserUnpublished?.(user, mediaType);
        }
      } catch (error) {
        // Silently handle unsubscription errors
      }
    });

    this.client.on('user-joined', (user) => {
      try {
        this.onUserJoined?.(user);
      } catch (error) {
        // Silently handle user join errors
      }
    });

    this.client.on('user-left', (user) => {
      try {
        this.onUserLeft?.(user);
      } catch (error) {
        // Silently handle user leave errors
      }
    });

    // Handle connection state changes
    this.client.on('connection-state-change', (curState, prevState, reason) => {
      // Silently monitor connection state
    });

    // Handle exceptions
    this.client.on('exception', (event) => {
      // Silently handle Agora exceptions
    });
  }

  /**
   * Create local tracks for preview (without joining channel)
   */
  async createLocalPreview(cameraOn: boolean = true, micOn: boolean = true): Promise<void> {
    // Validate browser support (check for webkit prefix for Safari)
    const hasMediaDevices = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    const hasWebkitGetUserMedia = (navigator as any).webkitGetUserMedia;
    
    if (!hasMediaDevices && !hasWebkitGetUserMedia) {
      throw new Error('Browser does not support media devices');
    }

    // Prevent creating preview if already in a call
    if (this.isJoined) {
      return;
    }

    try {
      // If tracks already exist, just update their state and replay
      if (this.localVideoTrack && this.localAudioTrack) {
        try {
          await this.localVideoTrack.setEnabled(cameraOn);
          await this.localAudioTrack.setEnabled(micOn);
          
          // Replay video if camera is on
          if (cameraOn) {
            this.localVideoTrack.play('local-video');
          }
          return;
        } catch (error) {
          // If setting enabled fails, clean up and recreate
          this.localVideoTrack?.close();
          this.localAudioTrack?.close();
          this.localVideoTrack = null;
          this.localAudioTrack = null;
        }
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
      // Safari may have issues with simultaneous track creation, but Agora SDK handles it
      const audioConfig = {
        AEC: true, // Acoustic Echo Cancellation
        ANS: true, // Automatic Noise Suppression
        AGC: true, // Automatic Gain Control
      };

      const videoConfig = {
        encoderConfig: {
          width: 640,
          height: 480,
          frameRate: 30,
          bitrateMin: 400,
          bitrateMax: 1000,
        },
        optimizationMode: 'detail' as const,
      };

      [this.localAudioTrack, this.localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
        audioConfig,
        videoConfig
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

    if (this.isLeaving) {
      throw new Error('Cannot join while leaving another channel');
    }

    // Validate config
    if (!config.appId || !config.channelName) {
      throw new Error('Invalid Agora configuration: missing appId or channelName');
    }

    if (!config.uid) {
      throw new Error('Invalid Agora configuration: missing uid');
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
   * Create local video and audio tracks and publish them (with retry logic)
   */
  private async createAndPublishTracks(cameraOn: boolean = true, micOn: boolean = true): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    
    // Check if we're disconnecting
    if (this.isLeaving) {
      throw new Error('Cannot create tracks while leaving');
    }
    
    // Check connection state
    if (this.client.connectionState !== 'CONNECTED') {
      throw new Error('Not connected to channel');
    }

    // Retry logic with exponential backoff
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await this.attemptCreateAndPublishTracks(cameraOn, micOn);
        return; // Success, exit retry loop
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on device not found errors
        if (lastError.message.includes('DEVICE_NOT_FOUND')) {
          throw lastError;
        }

        // Don't retry on intentional cancellation
        if (this.isLeaving) {
          throw lastError;
        }

        // If not last attempt, wait before retry (exponential backoff)
        if (attempt < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 4000); // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    throw lastError || new Error('Failed to create tracks after multiple attempts');
  }

  /**
   * Single attempt to create and publish tracks
   */
  private async attemptCreateAndPublishTracks(cameraOn: boolean = true, micOn: boolean = true): Promise<void> {
    try {
      // Set track creation timeout
      let timeoutId: NodeJS.Timeout | null = null;
      const trackTimeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Track creation timeout: Could not access camera or microphone'));
        }, 15000);
      });

      // Check if devices are available
      const devices = await AgoraRTC.getDevices().catch(() => []);
      const hasMicrophone = devices.some(d => d.kind === 'audioinput');
      const hasCamera = devices.some(d => d.kind === 'videoinput');

      // Only throw error if no devices at all AND tracks don't already exist
      if (!hasMicrophone && !hasCamera && !this.localAudioTrack && !this.localVideoTrack) {
        throw new Error('DEVICE_NOT_FOUND: No camera or microphone found. Please connect a device and grant permissions.');
      }

      // Create tracks based on available devices (only if not already created)
      const needsAudioTrack = hasMicrophone && !this.localAudioTrack;
      const needsVideoTrack = hasCamera && !this.localVideoTrack;

      if (needsAudioTrack && needsVideoTrack) {
        // Create both tracks together (more efficient)
        const tracksPromise = AgoraRTC.createMicrophoneAndCameraTracks(
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

        try {
          [this.localAudioTrack, this.localVideoTrack] = await Promise.race([
            tracksPromise,
            trackTimeout
          ]) as [IMicrophoneAudioTrack, ICameraVideoTrack];
        } catch (error) {
          if (timeoutId) clearTimeout(timeoutId);
          throw error;
        }
      } else if (needsAudioTrack) {
        // Audio only
        try {
          this.localAudioTrack = await Promise.race([
            AgoraRTC.createMicrophoneAudioTrack({
              AEC: true,
              ANS: true,
              AGC: true,
              microphoneId: this.currentMicId || undefined,
            }),
            trackTimeout
          ]) as IMicrophoneAudioTrack;
        } catch (error) {
          if (timeoutId) clearTimeout(timeoutId);
          throw error;
        }
      } else if (needsVideoTrack) {
        // Video only
        try {
          this.localVideoTrack = await Promise.race([
            AgoraRTC.createCameraVideoTrack({
              encoderConfig: {
                width: 640,
                height: 480,
                frameRate: 30,
                bitrateMin: 400,
                bitrateMax: 1000,
              },
              optimizationMode: 'detail',
              cameraId: this.currentCameraId || undefined,
            }),
            trackTimeout
          ]) as ICameraVideoTrack;
        } catch (error) {
          if (timeoutId) clearTimeout(timeoutId);
          throw error;
        }
      }

      if (timeoutId) clearTimeout(timeoutId);

      // Set enabled state for available tracks
      if (this.localVideoTrack) {
        await this.localVideoTrack.setEnabled(cameraOn);
      }
      if (this.localAudioTrack) {
        await this.localAudioTrack.setEnabled(micOn);
      }

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
        let publishTimeoutId: NodeJS.Timeout | null = null;
        const publishTimeout = new Promise<never>((_, reject) => {
          publishTimeoutId = setTimeout(() => {
            reject(new Error('Publish timeout: Could not publish tracks to channel'));
          }, 10000); // 10 second timeout
        });

        try {
          await Promise.race([
            this.client!.publish(tracksToPublish),
            publishTimeout
          ]);
        } finally {
          if (publishTimeoutId) clearTimeout(publishTimeoutId);
        }
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
    if (this.isLeaving || this.isTogglingCamera) {
      return;
    }
    
    this.isTogglingCamera = true;
    
    try {
      if (enabled) {
        // Create new track if it doesn't exist
        if (!this.localVideoTrack) {
          // Check if camera is available first
          const devices = await AgoraRTC.getDevices();
          const hasCamera = devices.some(d => d.kind === 'videoinput');
          
          if (!hasCamera) {
            throw new Error('DEVICE_NOT_FOUND: No camera found. Please connect a camera and try again.');
          }

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
    } finally {
      this.isTogglingCamera = false;
    }
  }

  /**
   * Toggle local microphone on/off - PROPERLY closes/reopens hardware
   */
  async toggleMicrophone(enabled: boolean): Promise<void> {
    if (this.isLeaving || this.isTogglingMic) {
      return;
    }
    
    this.isTogglingMic = true;
    
    try {
      if (enabled) {
        // Create new track if it doesn't exist
        if (!this.localAudioTrack) {
          // Check if microphone is available first
          const devices = await AgoraRTC.getDevices();
          const hasMicrophone = devices.some(d => d.kind === 'audioinput');
          
          if (!hasMicrophone) {
            throw new Error('DEVICE_NOT_FOUND: No microphone found. Please connect a microphone and try again.');
          }

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
    } finally {
      this.isTogglingMic = false;
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
      // Unpublish tracks first if in a call
      if (this.client && this.isJoined) {
        try {
          const tracksToUnpublish = [];
          if (this.localVideoTrack) tracksToUnpublish.push(this.localVideoTrack);
          if (this.localAudioTrack) tracksToUnpublish.push(this.localAudioTrack);
          if (tracksToUnpublish.length > 0) {
            await this.client.unpublish(tracksToUnpublish);
          }
        } catch (unpublishError) {
          // Ignore unpublish errors
        }
      }

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
        
        // Remove all event listeners
        this.client.removeAllListeners();
        
        // Recreate client for next session to avoid stale connection issues
        this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        this.setupEventListeners();
      }

      // Reset state
      this.isPreviewMode = false;
      this.isLeaving = false;
    } catch (error) {
      this.isLeaving = false;
      // Reset state even on error
      this.isJoined = false;
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
