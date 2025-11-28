/**
 * Screen Share Manager
 * Handles screen sharing functionality
 */

import {
  LocalVideoTrack,
  Track,
  VideoPresets,
  createLocalScreenTracks,
  ScreenShareCaptureOptions,
} from 'livekit-client';
import type { LiveKitState } from './types';

/**
 * ScreenShareManager Class
 * 
 * Manages screen sharing:
 * - Start/stop screen share
 * - Publish screen share tracks
 * - Handle browser "Stop sharing" button
 */
export class ScreenShareManager {
  constructor(private state: LiveKitState) {}

  /**
   * Start sharing screen
   * 
   * Uses browser's screen capture API to get screen/window/tab.
   * Includes audio capture if user grants permission.
   */
  async start(): Promise<void> {
    if (this.state.isLeaving || this.state.isTogglingScreenShare || this.state.isScreenSharing) {
      return;
    }

    if (!this.state.isJoined || !this.state.room?.localParticipant) {
      throw new Error('Must be in a room to share screen');
    }

    this.state.isTogglingScreenShare = true;

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

      this.state.localScreenTrack = videoTrack;

      // Publish video track
      await this.state.room.localParticipant.publishTrack(this.state.localScreenTrack, {
        source: Track.Source.ScreenShare,
        videoEncoding: {
          maxBitrate: 3_000_000,
          maxFramerate: 30,
        },
      });

      // Publish audio track if available
      const audioTrack = screenTracks.find(t => t.kind === Track.Kind.Audio);
      if (audioTrack) {
        await this.state.room.localParticipant.publishTrack(audioTrack, {
          source: Track.Source.ScreenShareAudio,
        });
      }

      this.state.isScreenSharing = true;

      // Auto-stop when user clicks browser's "Stop sharing" button
      this.state.localScreenTrack.mediaStreamTrack.onended = () => {
        this.stop().catch(() => {});
      };
    } catch (error) {
      this.state.localScreenTrack = null;
      this.state.isScreenSharing = false;
      throw error;
    } finally {
      this.state.isTogglingScreenShare = false;
    }
  }

  /**
   * Stop sharing screen
   */
  async stop(): Promise<void> {
    if (this.state.isTogglingScreenShare || !this.state.isScreenSharing) {
      return;
    }

    this.state.isTogglingScreenShare = true;

    try {
      if (this.state.localScreenTrack) {
        if (this.state.isJoined && this.state.room?.localParticipant) {
          await this.state.room.localParticipant.unpublishTrack(this.state.localScreenTrack);
        }
        this.state.localScreenTrack.stop();
        this.state.localScreenTrack = null;
      }

      this.state.isScreenSharing = false;
    } finally {
      this.state.isTogglingScreenShare = false;
    }
  }

  /**
   * Toggle screen share on/off
   * @returns New screen share state
   */
  async toggle(): Promise<boolean> {
    if (this.state.isScreenSharing) {
      await this.stop();
      return false;
    } else {
      await this.start();
      return true;
    }
  }

  /**
   * Check if screen sharing is active
   */
  isActive(): boolean {
    return this.state.isScreenSharing;
  }

  /**
   * Cleanup screen share track
   */
  cleanup(): void {
    if (this.state.localScreenTrack) {
      this.state.localScreenTrack.stop();
      this.state.localScreenTrack = null;
    }
    this.state.isScreenSharing = false;
  }
}
