/**
 * Analytics Facade
 *
 * Main entry point for analytics tracking. This facade provides a unified API
 * that delegates to specialized tracker modules:
 *
 * - FunnelTracker: User journey through conversion funnel
 * - MatchTracker: Match lifecycle and quality metrics
 * - MediaTracker: Camera, mic, and messaging
 * - ConnectionTracker: WebSocket and RTC events
 * - PerformanceTracker: Page load, video frames, network quality
 * - ErrorTracker: All error events
 * - EngagementTracker: Page views, navigation, user behavior
 *
 * This facade maintains backward compatibility with the original monolithic
 * AnalyticsService API while providing better code organization.
 */

import type { Analytics } from 'firebase/analytics';
import { getFirebaseAnalytics } from './config';

// Import all trackers
import { funnelTracker } from './analytics/funnel.tracker';
import { matchTracker } from './analytics/match.tracker';
import { mediaTracker } from './analytics/media.tracker';
import { connectionTracker } from './analytics/connection.tracker';
import { performanceTracker } from './analytics/performance.tracker';
import { errorTracker } from './analytics/error.tracker';
import { engagementTracker } from './analytics/engagement.tracker';

// Import types for method signatures
import type {
  ErrorType,
  NetworkQuality,
  MediaContext,
  DeviceType,
  ReconnectionType,
  MatchEndReason,
} from './analytics/types';

class AnalyticsFacade {
  private analytics: Analytics | null = null;

  /**
   * Initialize all analytics trackers
   * Should be called once at app startup
   */
  initialize(): void {
    if (typeof window === 'undefined') return;

    this.analytics = getFirebaseAnalytics();

    // Set analytics instance on all trackers
    const trackers = [
      funnelTracker,
      matchTracker,
      mediaTracker,
      connectionTracker,
      performanceTracker,
      errorTracker,
      engagementTracker,
    ];

    trackers.forEach((tracker) => tracker.setAnalytics(this.analytics));

    // Initialize engagement tracking
    engagementTracker.loadSessionCount();
    engagementTracker.trackReturningUser();
    engagementTracker.setDeviceProperties();

    // Sync session count to trackers that need it
    const sessionCount = engagementTracker.getSessionCount();
    funnelTracker.setSessionCount(sessionCount);
    matchTracker.setSessionCount(sessionCount);
  }

  /**
   * Set anonymous user ID for cross-session tracking
   */
  setAnonymousUserId(uid: string): void {
    engagementTracker.setAnonymousUserId(uid);
  }

  // ============================================
  // FUNNEL METHODS
  // ============================================

  trackFunnelWelcomeView(): void {
    funnelTracker.trackWelcomeView();
  }

  trackFunnelNameEntered(nameLength: number): void {
    funnelTracker.trackNameEntered(nameLength);
  }

  trackFunnelGenderSelected(gender: string): void {
    funnelTracker.trackGenderSelected(gender);
  }

  trackFunnelJoinClicked(): void {
    funnelTracker.trackJoinClicked();
  }

  trackFunnelChatPageLoaded(): void {
    funnelTracker.trackChatPageLoaded();
  }

  trackFunnelSearchStarted(): void {
    funnelTracker.trackSearchStarted();
  }

  trackFunnelMatchConnected(): void {
    funnelTracker.trackMatchConnected();
  }

  trackFunnelFirstMessageSent(): void {
    funnelTracker.trackFirstMessageSent();
  }

  trackFunnelSessionCompleted(durationMs: number, messageCount: number): void {
    funnelTracker.trackSessionCompleted(durationMs, messageCount);
  }

  // ============================================
  // MATCH METHODS
  // ============================================

  trackMatchStart(preferences?: { camera?: boolean; microphone?: boolean; gender?: string }): void {
    mediaTracker.resetFirstMessageFlag();
    matchTracker.trackStart(preferences);
  }

  trackMatchFound(waitTime?: number): void {
    matchTracker.trackFound(waitTime);
  }

  trackMatchEnded(reason: MatchEndReason, duration?: number): void {
    matchTracker.trackEnded(reason, duration);
  }

  trackMatchQuality(durationMs: number, messageCount: number): void {
    matchTracker.trackQuality(durationMs, messageCount);
  }

  trackSearchTimeout(waitTimeMs: number): void {
    matchTracker.trackTimeout(waitTimeMs);
  }

  // ============================================
  // MEDIA METHODS
  // ============================================

  trackCameraToggle(enabled: boolean, context: MediaContext): void {
    mediaTracker.trackCameraToggle(enabled, context);
  }

  trackMicrophoneToggle(enabled: boolean, context: MediaContext): void {
    mediaTracker.trackMicrophoneToggle(enabled, context);
  }

  trackDeviceSwitch(deviceType: DeviceType, deviceLabel?: string): void {
    mediaTracker.trackDeviceSwitch(deviceType, deviceLabel);
  }

  trackDeviceListOpened(deviceType: DeviceType): void {
    mediaTracker.trackDeviceListOpened(deviceType);
  }

  trackMessageSent(messageLength: number, hasEmoji: boolean): void {
    mediaTracker.trackMessageSent(messageLength, hasEmoji);
  }

  trackMessageReceived(messageLength: number): void {
    mediaTracker.trackMessageReceived(messageLength);
  }

  trackEmojiUsed(): void {
    mediaTracker.trackEmojiUsed();
  }

  trackChatWindow(action: 'opened' | 'closed'): void {
    mediaTracker.trackChatWindow(action);
  }

  // ============================================
  // CONNECTION METHODS
  // ============================================

  trackWebSocketConnect(): void {
    connectionTracker.trackWebSocketConnect();
  }

  trackWebSocketDisconnect(reason?: string): void {
    connectionTracker.trackWebSocketDisconnect(reason);
  }

  trackRTCJoin(): void {
    connectionTracker.trackRTCJoin();
  }

  trackRTCLeave(): void {
    connectionTracker.trackRTCLeave();
  }

  trackRTCConnectionTime(connectionTimeMs: number): void {
    connectionTracker.trackRTCConnectionTime(connectionTimeMs);
  }

  trackReconnection(type: ReconnectionType, attemptNumber: number, success: boolean): void {
    connectionTracker.trackReconnection(type, attemptNumber, success);
  }

  // ============================================
  // PERFORMANCE METHODS
  // ============================================

  trackPageLoadTime(loadTimeMs: number): void {
    performanceTracker.trackPageLoadTime(loadTimeMs);
  }

  trackTimeOnPage(pageName: string, timeSeconds: number): void {
    performanceTracker.trackTimeOnPage(pageName, timeSeconds);
  }

  trackFirstVideoFrame(timeToFirstFrameMs: number, isLocal: boolean): void {
    performanceTracker.trackFirstVideoFrame(timeToFirstFrameMs, isLocal);
  }

  trackNetworkQuality(quality: NetworkQuality, latency?: number): void {
    performanceTracker.trackNetworkQuality(quality, latency);
  }

  trackConnectionQualityDrop(fromQuality: string, toQuality: string): void {
    performanceTracker.trackConnectionQualityDrop(fromQuality, toQuality);
  }

  // ============================================
  // ERROR METHODS
  // ============================================

  trackError(errorType: ErrorType, errorMessage: string): void {
    errorTracker.trackError(errorType, errorMessage);
  }

  // ============================================
  // ENGAGEMENT METHODS
  // ============================================

  trackPageView(pageName: string, pageTitle?: string): void {
    engagementTracker.trackPageView(pageName, pageTitle);
  }

  trackNavigation(destination: string): void {
    engagementTracker.trackNavigation(destination);
  }

  trackButtonClick(buttonName: string, buttonLocation: string): void {
    engagementTracker.trackButtonClick(buttonName, buttonLocation);
  }

  trackTabVisibility(isVisible: boolean): void {
    engagementTracker.trackTabVisibility(isVisible);
  }

  trackEngagement(score: number, actions: string[]): void {
    engagementTracker.trackEngagement(score, actions);
  }

  trackUserGender(gender: string): void {
    engagementTracker.trackUserGender(gender);
  }

  trackGenderPreference(preference: string): void {
    engagementTracker.trackGenderPreference(preference);
  }

  setUserProperty(key: string, value: string): void {
    engagementTracker.setUserProperty(key, value);
  }

  trackCustomEvent(eventName: string, params?: Record<string, unknown>): void {
    engagementTracker.trackCustomEvent(eventName, params);
  }
}

export const analytics = new AnalyticsFacade();
