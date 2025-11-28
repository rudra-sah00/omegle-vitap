/**
 * Media Tracker
 * Tracks media device and streaming events
 * 
 * Covers:
 * - Camera toggle events
 * - Microphone toggle events
 * - Device switching
 * - Screen sharing
 * - Device list interactions
 * - Chat window state
 * - Messaging events
 */

import { logEvent } from 'firebase/analytics';
import { BaseTracker, AnalyticsEvents, type DeviceType, type MediaContext } from './types';
import { funnelTracker } from './funnel.tracker';
import { matchTracker } from './match.tracker';

export class MediaTracker extends BaseTracker {
  private isFirstMessageInSession: boolean = true;

  /** Reset first message flag for new session */
  resetFirstMessageFlag(): void {
    this.isFirstMessageInSession = true;
  }

  // ============================================
  // CAMERA & MICROPHONE
  // ============================================

  /** Track camera enable/disable */
  trackCameraToggle(enabled: boolean, context: MediaContext): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.CAMERA_TOGGLE, {
        enabled,
        context,
        timestamp: this.getTimestamp(),
      });
    });
  }

  /** Track microphone enable/disable */
  trackMicrophoneToggle(enabled: boolean, context: MediaContext): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.MICROPHONE_TOGGLE, {
        enabled,
        context,
        timestamp: this.getTimestamp(),
      });
    });
  }

  /** Track camera or microphone device switch */
  trackDeviceSwitch(deviceType: DeviceType, deviceLabel?: string): void {
    this.safeTrack(() => {
      const eventName = deviceType === 'camera' 
        ? AnalyticsEvents.CAMERA_SWITCH 
        : AnalyticsEvents.MICROPHONE_SWITCH;

      logEvent(this.analytics!, eventName, {
        device_type: deviceType,
        device_label: deviceLabel,
        timestamp: this.getTimestamp(),
      });
    });
  }

  /** Track device list dropdown opened */
  trackDeviceListOpened(deviceType: DeviceType): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.DEVICE_LIST_OPENED, {
        device_type: deviceType,
        timestamp: this.getTimestamp(),
      });
    });
  }

  // ============================================
  // SCREEN SHARING
  // ============================================

  /** Track screen share start */
  trackScreenShareStart(): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.SCREEN_SHARE_START, {
        timestamp: this.getTimestamp(),
      });
    });
  }

  /** Track screen share stop with optional duration */
  trackScreenShareStop(durationMs?: number): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.SCREEN_SHARE_STOP, {
        duration_ms: durationMs,
        duration_seconds: durationMs ? Math.floor(durationMs / 1000) : undefined,
        timestamp: this.getTimestamp(),
      });
    });
  }

  // ============================================
  // MESSAGING
  // ============================================

  /** Track message sent with metadata */
  trackMessageSent(messageLength: number, hasEmoji: boolean): void {
    matchTracker.incrementMessageCount();

    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.MESSAGE_SENT, {
        message_length: messageLength,
        has_emoji: hasEmoji,
        message_number: matchTracker.getMessageCount(),
        timestamp: this.getTimestamp(),
      });

      // Track first message in funnel
      if (this.isFirstMessageInSession) {
        this.isFirstMessageInSession = false;
        funnelTracker.trackFirstMessageSent();
      }
    });
  }

  /** Track message received */
  trackMessageReceived(messageLength: number): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.MESSAGE_RECEIVED, {
        message_length: messageLength,
        timestamp: this.getTimestamp(),
      });
    });
  }

  /** Track emoji usage */
  trackEmojiUsed(): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.EMOJI_USED, {
        timestamp: this.getTimestamp(),
      });
    });
  }

  /** Track chat window open/close */
  trackChatWindow(action: 'opened' | 'closed'): void {
    this.safeTrack(() => {
      const eventName = action === 'opened' 
        ? AnalyticsEvents.CHAT_OPENED 
        : AnalyticsEvents.CHAT_CLOSED;
      logEvent(this.analytics!, eventName, {
        timestamp: this.getTimestamp(),
      });
    });
  }
}

export const mediaTracker = new MediaTracker();
