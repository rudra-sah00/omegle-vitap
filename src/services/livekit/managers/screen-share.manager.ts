/**
 * Screen Share Manager
 * Handles screen sharing functionality with bandwidth optimization
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
 * - Reduce camera quality during screen share to save bandwidth
 */
export class ScreenShareManager {
  constructor(private state: LiveKitState) {}

  /**
   * Reduce camera quality during screen share to prioritize screen share bandwidth
   * Uses track constraints to lower resolution
   */
  private async reduceCameraQuality(): Promise<void> {
    if (!this.state.localVideoTrack) return;

    try {
      // Apply constraints to reduce camera resolution during screen share
      const mediaStreamTrack = this.state.localVideoTrack.mediaStreamTrack;
      if (mediaStreamTrack && 'applyConstraints' in mediaStreamTrack) {
        await mediaStreamTrack.applyConstraints({
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 },
        });
      }
    } catch {
      // Quality reduction failed - non-critical, continue with screen share
    }
  }

  /**
   * Restore camera quality after screen share ends
   */
  private async restoreCameraQuality(): Promise<void> {
    if (!this.state.localVideoTrack) return;

    try {
      // Restore camera to higher quality
      const mediaStreamTrack = this.state.localVideoTrack.mediaStreamTrack;
      if (mediaStreamTrack && 'applyConstraints' in mediaStreamTrack) {
        await mediaStreamTrack.applyConstraints({
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        });
      }
    } catch {
      // Quality restoration failed - non-critical
    }
  }

  /**
   * Start sharing screen
   *
   * Uses browser's screen capture API to get screen/window/tab.
   * Includes audio capture if user grants permission.
   * Reduces camera quality to prioritize screen share bandwidth.
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

      const videoTrack = screenTracks.find((t) => t.kind === Track.Kind.Video) as LocalVideoTrack;
      if (!videoTrack) {
        throw new Error('Failed to get screen share video track');
      }

      this.state.localScreenTrack = videoTrack;

      // Reduce camera quality to save bandwidth for screen share
      await this.reduceCameraQuality();

      // Publish video track with high quality for screen content
      await this.state.room.localParticipant.publishTrack(this.state.localScreenTrack, {
        source: Track.Source.ScreenShare,
        videoEncoding: {
          maxBitrate: 3_000_000, // 3 Mbps for crisp text
          maxFramerate: 30,
        },
      });

      // Publish audio track if available
      const audioTrack = screenTracks.find((t) => t.kind === Track.Kind.Audio);
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
      // Restore camera quality on error
      await this.restoreCameraQuality();
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

      // Restore camera quality after stopping screen share
      await this.restoreCameraQuality();

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
