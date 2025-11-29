/**
 * Engagement Tracker
 * Tracks user engagement and behavior metrics
 *
 * Covers:
 * - Page views and navigation
 * - Button and link clicks
 * - Tab visibility changes
 * - Returning users
 * - Session counts
 * - User engagement scoring
 * - User preferences (gender)
 */

import { logEvent, setUserProperties, setUserId } from 'firebase/analytics';
import { BaseTracker, AnalyticsEvents } from './types';

export class EngagementTracker extends BaseTracker {
  private sessionCount: number = 0;
  private userId: string | null = null;

  /** Get current session count */
  getSessionCount(): number {
    return this.sessionCount;
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  /** Load session count from localStorage and increment */
  loadSessionCount(): void {
    try {
      const stored = localStorage.getItem('omegle_session_count');
      this.sessionCount = stored ? parseInt(stored, 10) + 1 : 1;
      localStorage.setItem('omegle_session_count', this.sessionCount.toString());
      localStorage.setItem('omegle_last_visit', new Date().toISOString());
    } catch {
      // localStorage not available (private mode, SSR, etc.)
      this.sessionCount = 1;
    }
  }

  /** Set anonymous user ID for cross-session tracking */
  setAnonymousUserId(uid: string): void {
    if (!this.analytics) return;

    this.userId = uid;
    try {
      setUserId(this.analytics, uid);
    } catch {
      // Analytics SDK failed to set user ID
    }
  }

  /** Set device and browser properties */
  setDeviceProperties(): void {
    if (!this.analytics) return;

    try {
      const userAgent = navigator.userAgent;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
      const isTablet = /iPad|Android/i.test(userAgent) && !/Mobile/i.test(userAgent);

      let browser = 'unknown';
      if (userAgent.includes('Chrome')) browser = 'chrome';
      else if (userAgent.includes('Firefox')) browser = 'firefox';
      else if (userAgent.includes('Safari')) browser = 'safari';
      else if (userAgent.includes('Edge')) browser = 'edge';

      let os = 'unknown';
      if (userAgent.includes('Windows')) os = 'windows';
      else if (userAgent.includes('Mac')) os = 'macos';
      else if (userAgent.includes('Linux')) os = 'linux';
      else if (userAgent.includes('Android')) os = 'android';
      else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) os = 'ios';

      setUserProperties(this.analytics, {
        device_type: isMobile ? (isTablet ? 'tablet' : 'mobile') : 'desktop',
        browser_type: browser,
        os_type: os,
        screen_width: window.screen.width.toString(),
        screen_height: window.screen.height.toString(),
        session_count: this.sessionCount.toString(),
      });
    } catch {
      // User properties failed to set
    }
  }

  // ============================================
  // RETURNING USERS
  // ============================================

  /** Track returning user with session metrics */
  trackReturningUser(): void {
    if (!this.analytics) return;

    try {
      const lastVisit = localStorage.getItem('omegle_last_visit');
      const isReturning = !!lastVisit;

      if (isReturning) {
        const daysSinceLastVisit = lastVisit
          ? Math.floor((Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        logEvent(this.analytics, AnalyticsEvents.RETURNING_USER, {
          session_number: this.sessionCount,
          days_since_last_visit: daysSinceLastVisit,
          timestamp: this.getTimestamp(),
        });
      }

      logEvent(this.analytics, AnalyticsEvents.SESSION_COUNT, {
        total_sessions: this.sessionCount,
        timestamp: this.getTimestamp(),
      });
    } catch {
      // Analytics tracking failed
    }
  }

  // ============================================
  // PAGE & NAVIGATION
  // ============================================

  /** Track page view */
  trackPageView(pageName: string, pageTitle?: string): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.PAGE_VIEW, {
        page_name: pageName,
        page_title: pageTitle || pageName,
        page_location: window.location.href,
        page_path: window.location.pathname,
        session_number: this.sessionCount,
        timestamp: this.getTimestamp(),
      });
    });
  }

  /** Track navigation to specific pages */
  trackNavigation(destination: string): void {
    this.safeTrack(() => {
      const eventMap: Record<string, string> = {
        welcome: AnalyticsEvents.NAVIGATE_TO_WELCOME,
        chat: AnalyticsEvents.NAVIGATE_TO_CHAT,
        guidelines: AnalyticsEvents.NAVIGATE_TO_GUIDELINES,
        faq: AnalyticsEvents.NAVIGATE_TO_FAQ,
      };

      const eventName = eventMap[destination] || 'navigation';
      logEvent(this.analytics!, eventName, {
        destination,
        timestamp: this.getTimestamp(),
      });
    });
  }

  // ============================================
  // USER INTERACTIONS
  // ============================================

  /** Track button click */
  trackButtonClick(buttonName: string, buttonLocation: string): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.BUTTON_CLICK, {
        button_name: buttonName,
        button_location: buttonLocation,
        timestamp: this.getTimestamp(),
      });
    });
  }

  /** Track tab visibility change */
  trackTabVisibility(isVisible: boolean): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.TAB_VISIBILITY_CHANGE, {
        is_visible: isVisible,
        timestamp: this.getTimestamp(),
      });
    });
  }

  /** Track user engagement score */
  trackEngagement(score: number, actions: string[]): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.USER_ENGAGEMENT, {
        engagement_score: score,
        actions_taken: actions.join(','),
        total_actions: actions.length,
        session_number: this.sessionCount,
        timestamp: this.getTimestamp(),
      });
    });
  }

  // ============================================
  // USER PREFERENCES
  // ============================================

  /** Track user gender selection */
  trackUserGender(gender: string): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.USER_GENDER_SET, {
        gender: gender.toLowerCase(),
        timestamp: this.getTimestamp(),
      });

      setUserProperties(this.analytics!, {
        user_gender: gender.toLowerCase(),
      });
    });
  }

  /** Track gender preference selection */
  trackGenderPreference(preference: string): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, AnalyticsEvents.GENDER_PREFERENCE_SET, {
        preference: preference.toLowerCase(),
        timestamp: this.getTimestamp(),
      });

      setUserProperties(this.analytics!, {
        gender_preference: preference.toLowerCase(),
      });
    });
  }

  /** Set custom user property */
  setUserProperty(key: string, value: string): void {
    if (!this.analytics) return;
    try {
      setUserProperties(this.analytics, { [key]: value });
    } catch {
      // Setting user property failed
    }
  }

  /** Track custom event */
  trackCustomEvent(eventName: string, params?: Record<string, unknown>): void {
    this.safeTrack(() => {
      logEvent(this.analytics!, eventName, {
        ...params,
        timestamp: this.getTimestamp(),
      });
    });
  }
}

export const engagementTracker = new EngagementTracker();
