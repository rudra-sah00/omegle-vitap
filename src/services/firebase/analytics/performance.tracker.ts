/**
 * Performance Tracker
 * Tracks performance and quality metrics
 * 
 * Covers:
 * - Page load time
 * - First video frame time
 * - Network quality
 * - Connection quality drops
 * - Time on page
 */

import { logEvent } from 'firebase/analytics';
import { BaseTracker, AnalyticsEvents, type NetworkQuality } from './types';

export class PerformanceTracker extends BaseTracker {
  // ============================================
  // PAGE PERFORMANCE
  // ============================================

  /** Track page load time */
  trackPageLoadTime(loadTimeMs: number): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.PAGE_LOAD_TIME, {
        load_time_ms: loadTimeMs,
        load_time_seconds: Math.round(loadTimeMs / 1000),
        timestamp: this.getTimestamp(),
      });
    });
  }

  /** Track time user spent on page */
  trackTimeOnPage(pageName: string, timeSeconds: number): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.TIME_ON_PAGE, {
        page_name: pageName,
        time_seconds: timeSeconds,
        timestamp: this.getTimestamp(),
      });
    });
  }

  // ============================================
  // VIDEO PERFORMANCE
  // ============================================

  /** Track time to first video frame */
  trackFirstVideoFrame(timeToFirstFrameMs: number, isLocal: boolean): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.FIRST_VIDEO_FRAME, {
        time_to_first_frame_ms: timeToFirstFrameMs,
        is_local: isLocal,
        timestamp: this.getTimestamp(),
      });
    });
  }

  // ============================================
  // NETWORK QUALITY
  // ============================================

  /** Track network quality measurement */
  trackNetworkQuality(quality: NetworkQuality, latency?: number): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.NETWORK_QUALITY, {
        quality,
        latency_ms: latency,
        timestamp: this.getTimestamp(),
      });
    });
  }

  /** Track connection quality degradation */
  trackConnectionQualityDrop(fromQuality: string, toQuality: string): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.CONNECTION_QUALITY_DROP, {
        from_quality: fromQuality,
        to_quality: toQuality,
        timestamp: this.getTimestamp(),
      });
    });
  }
}

export const performanceTracker = new PerformanceTracker();
