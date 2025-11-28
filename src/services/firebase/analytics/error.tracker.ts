/**
 * Error Tracker
 * Tracks error events for debugging and monitoring
 * 
 * Covers:
 * - Camera permission errors
 * - Microphone permission errors
 * - Connection errors
 * - RTC errors
 * - WebSocket errors
 * - Media device errors
 */

import { logEvent } from 'firebase/analytics';
import { BaseTracker, AnalyticsEvents, type ErrorType } from './types';

export class ErrorTracker extends BaseTracker {
  /** Error type to event mapping */
  private readonly errorEventMap: Record<ErrorType, string> = {
    camera_permission: AnalyticsEvents.ERROR_CAMERA_PERMISSION,
    microphone_permission: AnalyticsEvents.ERROR_MICROPHONE_PERMISSION,
    connection: AnalyticsEvents.ERROR_CONNECTION,
    rtc: AnalyticsEvents.ERROR_RTC,
    websocket: AnalyticsEvents.ERROR_WEBSOCKET,
    media_device: AnalyticsEvents.ERROR_MEDIA_DEVICE,
  };

  /** Track error event with type and message */
  trackError(errorType: ErrorType, errorMessage: string): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, this.errorEventMap[errorType], {
        error_message: errorMessage,
        error_type: errorType,
        timestamp: this.getTimestamp(),
      });
    });
  }

  /** Track camera permission error */
  trackCameraPermissionError(message: string): void {
    this.trackError('camera_permission', message);
  }

  /** Track microphone permission error */
  trackMicrophonePermissionError(message: string): void {
    this.trackError('microphone_permission', message);
  }

  /** Track connection error */
  trackConnectionError(message: string): void {
    this.trackError('connection', message);
  }

  /** Track RTC error */
  trackRTCError(message: string): void {
    this.trackError('rtc', message);
  }

  /** Track WebSocket error */
  trackWebSocketError(message: string): void {
    this.trackError('websocket', message);
  }

  /** Track media device error */
  trackMediaDeviceError(message: string): void {
    this.trackError('media_device', message);
  }
}

export const errorTracker = new ErrorTracker();
