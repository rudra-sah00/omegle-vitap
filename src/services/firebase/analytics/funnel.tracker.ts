/**
 * Funnel Tracker
 * Tracks user journey through the conversion funnel
 * 
 * Funnel stages:
 * 1. Welcome View - User lands on welcome page
 * 2. Name Entered - User enters their name
 * 3. Gender Selected - User selects gender
 * 4. Join Clicked - User initiates matchmaking
 * 5. Chat Page Loaded - Chat UI loads
 * 6. Search Started - User enters queue
 * 7. Match Connected - User matched with partner
 * 8. First Message Sent - User sends first message
 * 9. Session Completed - Match ends (any reason)
 */

import { logEvent } from 'firebase/analytics';
import { BaseTracker, AnalyticsEvents } from './types';

export class FunnelTracker extends BaseTracker {
  private sessionCount: number = 0;

  /** Update session count from main service */
  setSessionCount(count: number): void {
    this.sessionCount = count;
  }

  /** Track welcome page view - funnel entry point */
  trackWelcomeView(): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.FUNNEL_WELCOME_VIEW, {
        session_number: this.sessionCount,
        timestamp: this.getTimestamp(),
      });
    });
  }

  /** Track name input completion */
  trackNameEntered(nameLength: number): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.FUNNEL_NAME_ENTERED, {
        name_length: nameLength,
        timestamp: this.getTimestamp(),
      });
    });
  }

  /** Track gender selection */
  trackGenderSelected(gender: string): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.FUNNEL_GENDER_SELECTED, {
        gender,
        timestamp: this.getTimestamp(),
      });
    });
  }

  /** Track join button click */
  trackJoinClicked(): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.FUNNEL_JOIN_CLICKED, {
        timestamp: this.getTimestamp(),
      });
    });
  }

  /** Track chat page successfully loaded */
  trackChatPageLoaded(): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.FUNNEL_CHAT_PAGE_LOADED, {
        timestamp: this.getTimestamp(),
      });
    });
  }

  /** Track search/queue initiation */
  trackSearchStarted(): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.FUNNEL_SEARCH_STARTED, {
        timestamp: this.getTimestamp(),
      });
    });
  }

  /** Track successful match connection */
  trackMatchConnected(): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.FUNNEL_MATCH_CONNECTED, {
        timestamp: this.getTimestamp(),
      });
    });
  }

  /** Track first message in session */
  trackFirstMessageSent(): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.FUNNEL_FIRST_MESSAGE_SENT, {
        timestamp: this.getTimestamp(),
      });
    });
  }

  /** Track completed session with metrics */
  trackSessionCompleted(durationMs: number, messageCount: number): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.FUNNEL_SESSION_COMPLETED, {
        duration_ms: durationMs,
        duration_seconds: Math.floor(durationMs / 1000),
        message_count: messageCount,
        timestamp: this.getTimestamp(),
      });
    });
  }
}

export const funnelTracker = new FunnelTracker();
