/**
 * Match Tracker
 * Tracks match lifecycle and quality metrics
 * 
 * Covers:
 * - Match start/found/ended events
 * - Session duration tracking
 * - Match quality scoring
 * - Duration bucketing for analysis
 * - Search timeout events
 */

import { logEvent } from 'firebase/analytics';
import { BaseTracker, AnalyticsEvents, type DurationBucket, type MatchQuality, type MatchEndReason } from './types';
import { funnelTracker } from './funnel.tracker';

export class MatchTracker extends BaseTracker {
  private sessionStartTime: number | null = null;
  private matchStartTime: number | null = null;
  private messageCount: number = 0;
  private sessionCount: number = 0;

  /** Update session count from main service */
  setSessionCount(count: number): void {
    this.sessionCount = count;
  }

  /** Get current message count for quality calculations */
  getMessageCount(): number {
    return this.messageCount;
  }

  /** Increment message count */
  incrementMessageCount(): void {
    this.messageCount++;
  }

  /** Reset message count */
  resetMessageCount(): void {
    this.messageCount = 0;
  }

  /**
   * Categorize match duration into analysis buckets
   * - very_short: < 30s (likely bad match)
   * - short: 30s - 2min
   * - medium: 2-5min (healthy conversation)
   * - long: 5-10min (engaged users)
   * - very_long: > 10min (highly engaged)
   */
  private getDurationBucket(durationMs: number): DurationBucket {
    const seconds = durationMs / 1000;
    if (seconds < 30) return 'very_short';
    if (seconds < 120) return 'short';
    if (seconds < 300) return 'medium';
    if (seconds < 600) return 'long';
    return 'very_long';
  }

  /**
   * Calculate match quality based on duration and engagement
   * Score formula:
   * - Duration contribution: min(duration_minutes * 5, 50) - 10 min = max
   * - Message contribution: min(messages_per_minute * 10, 50) - 5 msg/min = max
   */
  private calculateMatchQuality(durationMs: number, messageCount: number): MatchQuality {
    const durationMinutes = durationMs / 60000;
    const messagesPerMinute = durationMinutes > 0 ? messageCount / durationMinutes : 0;
    
    let score = 0;
    score += Math.min(durationMinutes * 5, 50);
    score += Math.min(messagesPerMinute * 10, 50);
    
    if (score >= 80) return 'excellent';
    if (score >= 50) return 'good';
    if (score >= 25) return 'fair';
    return 'poor';
  }

  /** Track match search initiation */
  trackStart(preferences?: { camera?: boolean; microphone?: boolean; gender?: string }): void {
    this.sessionStartTime = Date.now();
    this.matchStartTime = Date.now();
    this.messageCount = 0;

    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.MATCH_START, {
        camera_enabled: preferences?.camera || false,
        microphone_enabled: preferences?.microphone || false,
        user_gender: preferences?.gender,
        session_number: this.sessionCount,
        timestamp: this.getTimestamp(),
      });
    });
    
    // Also trigger funnel event
    funnelTracker.trackSearchStarted();
  }

  /** Track successful match found */
  trackFound(waitTime?: number): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.MATCH_FOUND, {
        wait_time_ms: waitTime,
        wait_time_seconds: waitTime ? Math.floor(waitTime / 1000) : undefined,
        timestamp: this.getTimestamp(),
      });
    });
    
    // Also trigger funnel event
    funnelTracker.trackMatchConnected();
  }

  /** Track match end with quality metrics */
  trackEnded(reason: MatchEndReason, duration?: number): void {
    const matchDuration = this.matchStartTime ? Date.now() - this.matchStartTime : duration;

    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.MATCH_ENDED, {
        reason,
        duration_ms: matchDuration,
        duration_seconds: matchDuration ? Math.floor(matchDuration / 1000) : undefined,
        message_count: this.messageCount,
        timestamp: this.getTimestamp(),
      });

      // Track quality metrics
      if (matchDuration) {
        this.trackQuality(matchDuration, this.messageCount);
        funnelTracker.trackSessionCompleted(matchDuration, this.messageCount);
      }

      // Track session duration
      if (this.sessionStartTime) {
        const sessionDuration = Date.now() - this.sessionStartTime;
        logEvent(this.analytics!, AnalyticsEvents.SESSION_DURATION, {
          duration_ms: sessionDuration,
          duration_seconds: Math.floor(sessionDuration / 1000),
          message_count: this.messageCount,
        });
        this.sessionStartTime = null;
      }
      
      this.matchStartTime = null;
      this.messageCount = 0;
    });
  }

  /** Track match quality score and duration bucket */
  trackQuality(durationMs: number, messageCount: number): void {
    const quality = this.calculateMatchQuality(durationMs, messageCount);
    const bucket = this.getDurationBucket(durationMs);

    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.MATCH_QUALITY_SCORE, {
        quality,
        duration_ms: durationMs,
        message_count: messageCount,
        timestamp: this.getTimestamp(),
      });

      logEvent(this.analytics!, AnalyticsEvents.MATCH_DURATION_BUCKET, {
        bucket,
        duration_seconds: Math.floor(durationMs / 1000),
        timestamp: this.getTimestamp(),
      });

      logEvent(this.analytics!, AnalyticsEvents.MESSAGES_PER_SESSION, {
        count: messageCount,
        duration_ms: durationMs,
        messages_per_minute: durationMs > 0 ? (messageCount / (durationMs / 60000)).toFixed(2) : '0',
        timestamp: this.getTimestamp(),
      });
    });
  }

  /** Track search timeout when no match found */
  trackTimeout(waitTimeMs: number): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.SEARCH_TIMEOUT, {
        wait_time_ms: waitTimeMs,
        wait_time_seconds: Math.floor(waitTimeMs / 1000),
        timestamp: this.getTimestamp(),
      });
    });
  }
}

export const matchTracker = new MatchTracker();
