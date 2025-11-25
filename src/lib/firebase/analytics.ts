/**
 * Firebase Analytics Event Tracking
 */

import { logEvent, setUserProperties, type Analytics } from 'firebase/analytics';
import { getFirebaseAnalytics } from './config';

// Event Names (standardized)
export const AnalyticsEvents = {
  // Page Views
  PAGE_VIEW: 'page_view',
  
  // User Actions
  MATCH_START: 'match_start',
  MATCH_STOP: 'match_stop',
  MATCH_SKIP: 'match_skip',
  MATCH_FOUND: 'match_found',
  MATCH_ENDED: 'match_ended',
  
  // Media Controls
  CAMERA_TOGGLE: 'camera_toggle',
  MICROPHONE_TOGGLE: 'microphone_toggle',
  CAMERA_SWITCH: 'camera_switch',
  MICROPHONE_SWITCH: 'microphone_switch',
  
  // Chat Actions
  MESSAGE_SENT: 'message_sent',
  EMOJI_USED: 'emoji_used',
  
  // Connection Events
  WEBSOCKET_CONNECT: 'websocket_connect',
  WEBSOCKET_DISCONNECT: 'websocket_disconnect',
  RTC_JOIN: 'rtc_join',
  RTC_LEAVE: 'rtc_leave',
  
  // Errors
  ERROR_CAMERA_PERMISSION: 'error_camera_permission',
  ERROR_MICROPHONE_PERMISSION: 'error_microphone_permission',
  ERROR_CONNECTION: 'error_connection',
  ERROR_RTC: 'error_rtc',
  
  // Session
  SESSION_START: 'session_start',
  SESSION_DURATION: 'session_duration',
  
  // Engagement
  TYPING_INDICATOR: 'typing_indicator',
  REMOTE_VIDEO_READY: 'remote_video_ready',
  CHAT_OPENED: 'chat_opened',
  CHAT_CLOSED: 'chat_closed',
  
  // User Behavior
  TIME_ON_PAGE: 'time_on_page',
  IDLE_TIME: 'idle_time',
  TAB_VISIBILITY_CHANGE: 'tab_visibility_change',
  BROWSER_CLOSE_ATTEMPT: 'browser_close_attempt',
  
  // Video Quality
  VIDEO_QUALITY_CHANGE: 'video_quality_change',
  NETWORK_QUALITY: 'network_quality',
  
  // Device Selection
  DEVICE_LIST_OPENED: 'device_list_opened',
  DEVICE_PERMISSION_PROMPT: 'device_permission_prompt',
  
  // Search Metrics
  SEARCH_TIMEOUT: 'search_timeout',
  SEARCH_CANCELLED: 'search_cancelled',
  AVERAGE_WAIT_TIME: 'average_wait_time',
  
  // User Interaction
  BUTTON_CLICK: 'button_click',
  LINK_CLICK: 'link_click',
  FORM_SUBMIT: 'form_submit',
  
  // Performance
  PAGE_LOAD_TIME: 'page_load_time',
  RTC_CONNECTION_TIME: 'rtc_connection_time',
  
  // Navigation
  NAVIGATE_TO_WELCOME: 'navigate_to_welcome',
  NAVIGATE_TO_CHAT: 'navigate_to_chat',
  NAVIGATE_TO_GUIDELINES: 'navigate_to_guidelines',
  NAVIGATE_TO_FAQ: 'navigate_to_faq',
} as const;

// Analytics Helper Class
class FirebaseAnalyticsHelper {
  private analytics: Analytics | null = null;
  private sessionStartTime: number | null = null;

  initialize() {
    if (typeof window !== 'undefined') {
      this.analytics = getFirebaseAnalytics();
    }
  }

  /**
   * Track page view
   */
  trackPageView(pageName: string, pageTitle?: string) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.PAGE_VIEW, {
        page_name: pageName,
        page_title: pageTitle || pageName,
        page_location: window.location.href,
        page_path: window.location.pathname,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Track match start
   */
  trackMatchStart(preferences?: { camera?: boolean; microphone?: boolean }) {
    if (!this.analytics) return;

    this.sessionStartTime = Date.now();

    try {
      logEvent(this.analytics, AnalyticsEvents.MATCH_START, {
        camera_enabled: preferences?.camera || false,
        microphone_enabled: preferences?.microphone || false,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Track match found
   */
  trackMatchFound(waitTime?: number) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.MATCH_FOUND, {
        wait_time_ms: waitTime,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Track match ended
   */
  trackMatchEnded(reason: 'user_stop' | 'user_skip' | 'remote_disconnect' | 'error', duration?: number) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.MATCH_ENDED, {
        reason,
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      });

      // Track session duration
      if (this.sessionStartTime) {
        const sessionDuration = Date.now() - this.sessionStartTime;
        logEvent(this.analytics, AnalyticsEvents.SESSION_DURATION, {
          duration_ms: sessionDuration,
          duration_seconds: Math.floor(sessionDuration / 1000),
        });
        this.sessionStartTime = null;
      }
    } catch (error) {
    }
  }

  /**
   * Track camera toggle
   */
  trackCameraToggle(enabled: boolean, context: 'preview' | 'call') {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.CAMERA_TOGGLE, {
        enabled,
        context,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Track microphone toggle
   */
  trackMicrophoneToggle(enabled: boolean, context: 'preview' | 'call') {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.MICROPHONE_TOGGLE, {
        enabled,
        context,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Track device switch
   */
  trackDeviceSwitch(deviceType: 'camera' | 'microphone', deviceLabel?: string) {
    if (!this.analytics) return;

    try {
      const eventName = deviceType === 'camera' 
        ? AnalyticsEvents.CAMERA_SWITCH 
        : AnalyticsEvents.MICROPHONE_SWITCH;

      logEvent(this.analytics, eventName, {
        device_type: deviceType,
        device_label: deviceLabel,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Track message sent
   */
  trackMessageSent(messageLength: number, hasEmoji: boolean) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.MESSAGE_SENT, {
        message_length: messageLength,
        has_emoji: hasEmoji,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Track emoji usage
   */
  trackEmojiUsed() {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.EMOJI_USED, {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Track WebSocket connection
   */
  trackWebSocketConnect() {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.WEBSOCKET_CONNECT, {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Track WebSocket disconnection
   */
  trackWebSocketDisconnect(reason?: string) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.WEBSOCKET_DISCONNECT, {
        reason,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Track RTC join
   */
  trackRTCJoin() {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.RTC_JOIN, {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Track RTC leave
   */
  trackRTCLeave() {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.RTC_LEAVE, {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Track errors
   */
  trackError(errorType: 'camera_permission' | 'microphone_permission' | 'connection' | 'rtc', errorMessage: string) {
    if (!this.analytics) return;

    try {
      const eventMap = {
        camera_permission: AnalyticsEvents.ERROR_CAMERA_PERMISSION,
        microphone_permission: AnalyticsEvents.ERROR_MICROPHONE_PERMISSION,
        connection: AnalyticsEvents.ERROR_CONNECTION,
        rtc: AnalyticsEvents.ERROR_RTC,
      };

      logEvent(this.analytics, eventMap[errorType], {
        error_message: errorMessage,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Track navigation
   */
  trackNavigation(destination: string) {
    if (!this.analytics) return;

    try {
      const eventMap: Record<string, string> = {
        welcome: AnalyticsEvents.NAVIGATE_TO_WELCOME,
        chat: AnalyticsEvents.NAVIGATE_TO_CHAT,
        guidelines: AnalyticsEvents.NAVIGATE_TO_GUIDELINES,
        faq: AnalyticsEvents.NAVIGATE_TO_FAQ,
      };

      const eventName = eventMap[destination] || 'navigation';

      logEvent(this.analytics, eventName, {
        destination,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Set user properties
   */
  setUserProperty(key: string, value: string) {
    if (!this.analytics) return;

    try {
      setUserProperties(this.analytics, { [key]: value });
    } catch (error) {
    }
  }

  /**
   * Track time on page
   */
  trackTimeOnPage(pageName: string, timeSeconds: number) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.TIME_ON_PAGE, {
        page_name: pageName,
        time_seconds: timeSeconds,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Track tab visibility change
   */
  trackTabVisibility(isVisible: boolean) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.TAB_VISIBILITY_CHANGE, {
        is_visible: isVisible,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Track search timeout
   */
  trackSearchTimeout(waitTimeMs: number) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.SEARCH_TIMEOUT, {
        wait_time_ms: waitTimeMs,
        wait_time_seconds: Math.floor(waitTimeMs / 1000),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Track network quality
   */
  trackNetworkQuality(quality: 'excellent' | 'good' | 'poor' | 'bad', latency?: number) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.NETWORK_QUALITY, {
        quality,
        latency_ms: latency,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Track RTC connection time
   */
  trackRTCConnectionTime(connectionTimeMs: number) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.RTC_CONNECTION_TIME, {
        connection_time_ms: connectionTimeMs,
        connection_time_seconds: Math.round(connectionTimeMs / 1000),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Track page load time
   */
  trackPageLoadTime(loadTimeMs: number) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.PAGE_LOAD_TIME, {
        load_time_ms: loadTimeMs,
        load_time_seconds: Math.round(loadTimeMs / 1000),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Track button click
   */
  trackButtonClick(buttonName: string, buttonLocation: string) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.BUTTON_CLICK, {
        button_name: buttonName,
        button_location: buttonLocation,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Track device list opened
   */
  trackDeviceListOpened(deviceType: 'camera' | 'microphone') {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.DEVICE_LIST_OPENED, {
        device_type: deviceType,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Track chat window opened/closed
   */
  trackChatWindow(action: 'opened' | 'closed') {
    if (!this.analytics) return;

    try {
      const eventName = action === 'opened' ? AnalyticsEvents.CHAT_OPENED : AnalyticsEvents.CHAT_CLOSED;
      logEvent(this.analytics, eventName, {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Track user engagement score
   */
  trackEngagement(score: number, actions: string[]) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, 'user_engagement', {
        engagement_score: score,
        actions_taken: actions.join(','),
        total_actions: actions.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }

  /**
   * Track custom event
   */
  trackCustomEvent(eventName: string, params?: Record<string, any>) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, eventName, {
        ...params,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
    }
  }
}

// Export singleton instance
export const analytics = new FirebaseAnalyticsHelper();
