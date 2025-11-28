/**
 * Firebase Analytics Service
 * Centralized analytics event tracking
 */

import { logEvent, setUserProperties, setUserId, type Analytics } from 'firebase/analytics';
import { getFirebaseAnalytics } from './config';

export const AnalyticsEvents = {
  // Page & Navigation
  PAGE_VIEW: 'page_view',
  PAGE_LOAD_TIME: 'page_load_time',
  TIME_ON_PAGE: 'time_on_page',
  NAVIGATE_TO_WELCOME: 'navigate_to_welcome',
  NAVIGATE_TO_CHAT: 'navigate_to_chat',
  NAVIGATE_TO_GUIDELINES: 'navigate_to_guidelines',
  NAVIGATE_TO_FAQ: 'navigate_to_faq',
  
  // Match Flow
  MATCH_START: 'match_start',
  MATCH_STOP: 'match_stop',
  MATCH_SKIP: 'match_skip',
  MATCH_FOUND: 'match_found',
  MATCH_ENDED: 'match_ended',
  SESSION_START: 'session_start',
  SESSION_DURATION: 'session_duration',
  SEARCH_TIMEOUT: 'search_timeout',
  SEARCH_CANCELLED: 'search_cancelled',
  AVERAGE_WAIT_TIME: 'average_wait_time',
  
  // Media Controls
  CAMERA_TOGGLE: 'camera_toggle',
  MICROPHONE_TOGGLE: 'microphone_toggle',
  CAMERA_SWITCH: 'camera_switch',
  MICROPHONE_SWITCH: 'microphone_switch',
  DEVICE_LIST_OPENED: 'device_list_opened',
  DEVICE_PERMISSION_PROMPT: 'device_permission_prompt',
  SCREEN_SHARE_START: 'screen_share_start',
  SCREEN_SHARE_STOP: 'screen_share_stop',
  
  // Chat & Messaging
  MESSAGE_SENT: 'message_sent',
  MESSAGE_RECEIVED: 'message_received',
  EMOJI_USED: 'emoji_used',
  CHAT_OPENED: 'chat_opened',
  CHAT_CLOSED: 'chat_closed',
  TYPING_INDICATOR: 'typing_indicator',
  
  // Connection & RTC
  WEBSOCKET_CONNECT: 'websocket_connect',
  WEBSOCKET_DISCONNECT: 'websocket_disconnect',
  WEBSOCKET_RECONNECT: 'websocket_reconnect',
  RTC_JOIN: 'rtc_join',
  RTC_LEAVE: 'rtc_leave',
  RTC_CONNECTION_TIME: 'rtc_connection_time',
  RTC_RECONNECT: 'rtc_reconnect',
  REMOTE_VIDEO_READY: 'remote_video_ready',
  FIRST_VIDEO_FRAME: 'first_video_frame',
  
  // Quality & Performance
  VIDEO_QUALITY_CHANGE: 'video_quality_change',
  NETWORK_QUALITY: 'network_quality',
  CONNECTION_QUALITY_DROP: 'connection_quality_drop',
  AUDIO_QUALITY: 'audio_quality',
  
  // Errors
  ERROR_CAMERA_PERMISSION: 'error_camera_permission',
  ERROR_MICROPHONE_PERMISSION: 'error_microphone_permission',
  ERROR_CONNECTION: 'error_connection',
  ERROR_RTC: 'error_rtc',
  ERROR_WEBSOCKET: 'error_websocket',
  ERROR_MEDIA_DEVICE: 'error_media_device',
  
  // User Behavior
  IDLE_TIME: 'idle_time',
  TAB_VISIBILITY_CHANGE: 'tab_visibility_change',
  BROWSER_CLOSE_ATTEMPT: 'browser_close_attempt',
  BUTTON_CLICK: 'button_click',
  LINK_CLICK: 'link_click',
  FORM_SUBMIT: 'form_submit',
  
  // Engagement & Retention
  USER_ENGAGEMENT: 'user_engagement',
  RETURNING_USER: 'returning_user',
  SESSION_COUNT: 'session_count',
  
  // Funnel Events
  FUNNEL_WELCOME_VIEW: 'funnel_welcome_view',
  FUNNEL_NAME_ENTERED: 'funnel_name_entered',
  FUNNEL_GENDER_SELECTED: 'funnel_gender_selected',
  FUNNEL_JOIN_CLICKED: 'funnel_join_clicked',
  FUNNEL_CHAT_PAGE_LOADED: 'funnel_chat_page_loaded',
  FUNNEL_SEARCH_STARTED: 'funnel_search_started',
  FUNNEL_MATCH_CONNECTED: 'funnel_match_connected',
  FUNNEL_FIRST_MESSAGE_SENT: 'funnel_first_message_sent',
  FUNNEL_SESSION_COMPLETED: 'funnel_session_completed',
  
  // Match Quality
  MATCH_QUALITY_SCORE: 'match_quality_score',
  MATCH_DURATION_BUCKET: 'match_duration_bucket',
  MESSAGES_PER_SESSION: 'messages_per_session',
  
  // User Preferences
  GENDER_PREFERENCE_SET: 'gender_preference_set',
  USER_GENDER_SET: 'user_gender_set',
} as const;

// Duration buckets for match analysis
type DurationBucket = 'very_short' | 'short' | 'medium' | 'long' | 'very_long';

// Match quality rating
type MatchQuality = 'poor' | 'fair' | 'good' | 'excellent';

class AnalyticsService {
  private analytics: Analytics | null = null;
  private sessionStartTime: number | null = null;
  private matchStartTime: number | null = null;
  private messageCount: number = 0;
  private sessionCount: number = 0;
  private isFirstMessageInSession: boolean = true;
  private userId: string | null = null;

  initialize() {
    if (typeof window !== 'undefined') {
      this.analytics = getFirebaseAnalytics();
      this.loadSessionCount();
      this.trackReturningUser();
      this.setDeviceProperties();
    }
  }

  /**
   * Set anonymous user ID for cross-session tracking
   */
  setAnonymousUserId(uid: string) {
    if (!this.analytics) return;
    
    this.userId = uid;
    try {
      setUserId(this.analytics, uid);
    } catch {
      // Failed to set user ID
    }
  }

  /**
   * Load and increment session count from localStorage
   */
  private loadSessionCount() {
    try {
      const stored = localStorage.getItem('omegle_session_count');
      this.sessionCount = stored ? parseInt(stored, 10) + 1 : 1;
      localStorage.setItem('omegle_session_count', this.sessionCount.toString());
      localStorage.setItem('omegle_last_visit', new Date().toISOString());
    } catch {
      this.sessionCount = 1;
    }
  }

  /**
   * Track returning users
   */
  private trackReturningUser() {
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
          timestamp: new Date().toISOString(),
        });
      }

      logEvent(this.analytics, AnalyticsEvents.SESSION_COUNT, {
        total_sessions: this.sessionCount,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Analytics tracking failed
    }
  }

  /**
   * Set device and browser properties
   */
  private setDeviceProperties() {
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
      // Setting user properties failed
    }
  }

  // ============================================
  // FUNNEL TRACKING
  // ============================================

  trackFunnelWelcomeView() {
    if (!this.analytics) return;
    try {
      logEvent(this.analytics, AnalyticsEvents.FUNNEL_WELCOME_VIEW, {
        session_number: this.sessionCount,
        timestamp: new Date().toISOString(),
      });
    } catch { /* Analytics tracking failed */ }
  }

  trackFunnelNameEntered(nameLength: number) {
    if (!this.analytics) return;
    try {
      logEvent(this.analytics, AnalyticsEvents.FUNNEL_NAME_ENTERED, {
        name_length: nameLength,
        timestamp: new Date().toISOString(),
      });
    } catch { /* Analytics tracking failed */ }
  }

  trackFunnelGenderSelected(gender: string) {
    if (!this.analytics) return;
    try {
      logEvent(this.analytics, AnalyticsEvents.FUNNEL_GENDER_SELECTED, {
        gender,
        timestamp: new Date().toISOString(),
      });
    } catch { /* Analytics tracking failed */ }
  }

  trackFunnelJoinClicked() {
    if (!this.analytics) return;
    try {
      logEvent(this.analytics, AnalyticsEvents.FUNNEL_JOIN_CLICKED, {
        timestamp: new Date().toISOString(),
      });
    } catch { /* Analytics tracking failed */ }
  }

  trackFunnelChatPageLoaded() {
    if (!this.analytics) return;
    try {
      logEvent(this.analytics, AnalyticsEvents.FUNNEL_CHAT_PAGE_LOADED, {
        timestamp: new Date().toISOString(),
      });
    } catch { /* Analytics tracking failed */ }
  }

  trackFunnelSearchStarted() {
    if (!this.analytics) return;
    try {
      logEvent(this.analytics, AnalyticsEvents.FUNNEL_SEARCH_STARTED, {
        timestamp: new Date().toISOString(),
      });
    } catch { /* Analytics tracking failed */ }
  }

  trackFunnelMatchConnected() {
    if (!this.analytics) return;
    try {
      logEvent(this.analytics, AnalyticsEvents.FUNNEL_MATCH_CONNECTED, {
        timestamp: new Date().toISOString(),
      });
    } catch { /* Analytics tracking failed */ }
  }

  trackFunnelFirstMessageSent() {
    if (!this.analytics) return;
    try {
      logEvent(this.analytics, AnalyticsEvents.FUNNEL_FIRST_MESSAGE_SENT, {
        timestamp: new Date().toISOString(),
      });
    } catch { /* Analytics tracking failed */ }
  }

  trackFunnelSessionCompleted(durationMs: number, messageCount: number) {
    if (!this.analytics) return;
    try {
      logEvent(this.analytics, AnalyticsEvents.FUNNEL_SESSION_COMPLETED, {
        duration_ms: durationMs,
        duration_seconds: Math.floor(durationMs / 1000),
        message_count: messageCount,
        timestamp: new Date().toISOString(),
      });
    } catch { /* Analytics tracking failed */ }
  }

  // ============================================
  // MATCH QUALITY TRACKING
  // ============================================

  private getDurationBucket(durationMs: number): DurationBucket {
    const seconds = durationMs / 1000;
    if (seconds < 30) return 'very_short';
    if (seconds < 120) return 'short';
    if (seconds < 300) return 'medium';
    if (seconds < 600) return 'long';
    return 'very_long';
  }

  private calculateMatchQuality(durationMs: number, messageCount: number): MatchQuality {
    const durationMinutes = durationMs / 60000;
    const messagesPerMinute = durationMinutes > 0 ? messageCount / durationMinutes : 0;
    
    // Score based on duration (max 50) + messages per minute (max 50)
    let score = 0;
    score += Math.min(durationMinutes * 5, 50); // 10 minutes = max score
    score += Math.min(messagesPerMinute * 10, 50); // 5 msg/min = max score
    
    if (score >= 80) return 'excellent';
    if (score >= 50) return 'good';
    if (score >= 25) return 'fair';
    return 'poor';
  }

  trackMatchQuality(durationMs: number, messageCount: number) {
    if (!this.analytics) return;

    const quality = this.calculateMatchQuality(durationMs, messageCount);
    const bucket = this.getDurationBucket(durationMs);

    try {
      logEvent(this.analytics, AnalyticsEvents.MATCH_QUALITY_SCORE, {
        quality,
        duration_ms: durationMs,
        message_count: messageCount,
        timestamp: new Date().toISOString(),
      });

      logEvent(this.analytics, AnalyticsEvents.MATCH_DURATION_BUCKET, {
        bucket,
        duration_seconds: Math.floor(durationMs / 1000),
        timestamp: new Date().toISOString(),
      });

      logEvent(this.analytics, AnalyticsEvents.MESSAGES_PER_SESSION, {
        count: messageCount,
        duration_ms: durationMs,
        messages_per_minute: durationMs > 0 ? (messageCount / (durationMs / 60000)).toFixed(2) : '0',
        timestamp: new Date().toISOString(),
      });
    } catch { /* Analytics tracking failed */ }
  }

  // ============================================
  // SCREEN SHARE TRACKING
  // ============================================

  trackScreenShareStart() {
    if (!this.analytics) return;
    try {
      logEvent(this.analytics, AnalyticsEvents.SCREEN_SHARE_START, {
        timestamp: new Date().toISOString(),
      });
    } catch { /* Analytics tracking failed */ }
  }

  trackScreenShareStop(durationMs?: number) {
    if (!this.analytics) return;
    try {
      logEvent(this.analytics, AnalyticsEvents.SCREEN_SHARE_STOP, {
        duration_ms: durationMs,
        duration_seconds: durationMs ? Math.floor(durationMs / 1000) : undefined,
        timestamp: new Date().toISOString(),
      });
    } catch { /* Analytics tracking failed */ }
  }

  // ============================================
  // USER PREFERENCE TRACKING
  // ============================================

  trackUserGender(gender: string) {
    if (!this.analytics) return;
    try {
      logEvent(this.analytics, AnalyticsEvents.USER_GENDER_SET, {
        gender: gender.toLowerCase(),
        timestamp: new Date().toISOString(),
      });
      
      setUserProperties(this.analytics, {
        user_gender: gender.toLowerCase(),
      });
    } catch { /* Analytics tracking failed */ }
  }

  trackGenderPreference(preference: string) {
    if (!this.analytics) return;
    try {
      logEvent(this.analytics, AnalyticsEvents.GENDER_PREFERENCE_SET, {
        preference: preference.toLowerCase(),
        timestamp: new Date().toISOString(),
      });
      
      setUserProperties(this.analytics, {
        gender_preference: preference.toLowerCase(),
      });
    } catch { /* Analytics tracking failed */ }
  }

  // ============================================
  // PERFORMANCE TRACKING
  // ============================================

  trackFirstVideoFrame(timeToFirstFrameMs: number, isLocal: boolean) {
    if (!this.analytics) return;
    try {
      logEvent(this.analytics, AnalyticsEvents.FIRST_VIDEO_FRAME, {
        time_to_first_frame_ms: timeToFirstFrameMs,
        is_local: isLocal,
        timestamp: new Date().toISOString(),
      });
    } catch { /* Analytics tracking failed */ }
  }

  trackConnectionQualityDrop(fromQuality: string, toQuality: string) {
    if (!this.analytics) return;
    try {
      logEvent(this.analytics, AnalyticsEvents.CONNECTION_QUALITY_DROP, {
        from_quality: fromQuality,
        to_quality: toQuality,
        timestamp: new Date().toISOString(),
      });
    } catch { /* Analytics tracking failed */ }
  }

  trackReconnection(type: 'websocket' | 'rtc', attemptNumber: number, success: boolean) {
    if (!this.analytics) return;
    const eventName = type === 'websocket' 
      ? AnalyticsEvents.WEBSOCKET_RECONNECT 
      : AnalyticsEvents.RTC_RECONNECT;
    
    try {
      logEvent(this.analytics, eventName, {
        attempt_number: attemptNumber,
        success,
        timestamp: new Date().toISOString(),
      });
    } catch { /* Analytics tracking failed */ }
  }

  // ============================================
  // ORIGINAL METHODS (ENHANCED)
  // ============================================

  trackPageView(pageName: string, pageTitle?: string) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.PAGE_VIEW, {
        page_name: pageName,
        page_title: pageTitle || pageName,
        page_location: window.location.href,
        page_path: window.location.pathname,
        session_number: this.sessionCount,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Analytics tracking failed
    }
  }

  trackMatchStart(preferences?: { camera?: boolean; microphone?: boolean; gender?: string }) {
    if (!this.analytics) return;

    this.sessionStartTime = Date.now();
    this.matchStartTime = Date.now();
    this.messageCount = 0;
    this.isFirstMessageInSession = true;

    try {
      logEvent(this.analytics, AnalyticsEvents.MATCH_START, {
        camera_enabled: preferences?.camera || false,
        microphone_enabled: preferences?.microphone || false,
        user_gender: preferences?.gender,
        session_number: this.sessionCount,
        timestamp: new Date().toISOString(),
      });
      
      this.trackFunnelSearchStarted();
    } catch {
      // Analytics tracking failed
    }
  }

  trackMatchFound(waitTime?: number) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.MATCH_FOUND, {
        wait_time_ms: waitTime,
        wait_time_seconds: waitTime ? Math.floor(waitTime / 1000) : undefined,
        timestamp: new Date().toISOString(),
      });
      
      this.trackFunnelMatchConnected();
    } catch {
      // Analytics tracking failed
    }
  }

  trackMatchEnded(reason: 'user_stop' | 'user_skip' | 'remote_disconnect' | 'error', duration?: number) {
    if (!this.analytics) return;

    const matchDuration = this.matchStartTime ? Date.now() - this.matchStartTime : duration;

    try {
      logEvent(this.analytics, AnalyticsEvents.MATCH_ENDED, {
        reason,
        duration_ms: matchDuration,
        duration_seconds: matchDuration ? Math.floor(matchDuration / 1000) : undefined,
        message_count: this.messageCount,
        timestamp: new Date().toISOString(),
      });

      // Track match quality
      if (matchDuration) {
        this.trackMatchQuality(matchDuration, this.messageCount);
        this.trackFunnelSessionCompleted(matchDuration, this.messageCount);
      }

      if (this.sessionStartTime) {
        const sessionDuration = Date.now() - this.sessionStartTime;
        logEvent(this.analytics, AnalyticsEvents.SESSION_DURATION, {
          duration_ms: sessionDuration,
          duration_seconds: Math.floor(sessionDuration / 1000),
          message_count: this.messageCount,
        });
        this.sessionStartTime = null;
      }
      
      this.matchStartTime = null;
      this.messageCount = 0;
    } catch {
      // Analytics tracking failed
    }
  }

  trackCameraToggle(enabled: boolean, context: 'preview' | 'call') {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.CAMERA_TOGGLE, {
        enabled,
        context,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Analytics tracking failed
    }
  }

  trackMicrophoneToggle(enabled: boolean, context: 'preview' | 'call') {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.MICROPHONE_TOGGLE, {
        enabled,
        context,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Analytics tracking failed
    }
  }

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
    } catch {
      // Analytics tracking failed
    }
  }

  trackMessageSent(messageLength: number, hasEmoji: boolean) {
    if (!this.analytics) return;

    this.messageCount++;

    try {
      logEvent(this.analytics, AnalyticsEvents.MESSAGE_SENT, {
        message_length: messageLength,
        has_emoji: hasEmoji,
        message_number: this.messageCount,
        timestamp: new Date().toISOString(),
      });

      // Track first message in session
      if (this.isFirstMessageInSession) {
        this.isFirstMessageInSession = false;
        this.trackFunnelFirstMessageSent();
      }
    } catch {
      // Analytics tracking failed
    }
  }

  trackMessageReceived(messageLength: number) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.MESSAGE_RECEIVED, {
        message_length: messageLength,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Analytics tracking failed
    }
  }

  trackEmojiUsed() {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.EMOJI_USED, {
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Analytics tracking failed
    }
  }

  trackWebSocketConnect() {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.WEBSOCKET_CONNECT, {
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Analytics tracking failed
    }
  }

  trackWebSocketDisconnect(reason?: string) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.WEBSOCKET_DISCONNECT, {
        reason,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Analytics tracking failed
    }
  }

  trackRTCJoin() {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.RTC_JOIN, {
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Analytics tracking failed
    }
  }

  trackRTCLeave() {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.RTC_LEAVE, {
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Analytics tracking failed
    }
  }

  trackError(errorType: 'camera_permission' | 'microphone_permission' | 'connection' | 'rtc' | 'websocket' | 'media_device', errorMessage: string) {
    if (!this.analytics) return;

    try {
      const eventMap: Record<string, string> = {
        camera_permission: AnalyticsEvents.ERROR_CAMERA_PERMISSION,
        microphone_permission: AnalyticsEvents.ERROR_MICROPHONE_PERMISSION,
        connection: AnalyticsEvents.ERROR_CONNECTION,
        rtc: AnalyticsEvents.ERROR_RTC,
        websocket: AnalyticsEvents.ERROR_WEBSOCKET,
        media_device: AnalyticsEvents.ERROR_MEDIA_DEVICE,
      };

      logEvent(this.analytics, eventMap[errorType], {
        error_message: errorMessage,
        error_type: errorType,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Analytics tracking failed
    }
  }

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
    } catch {
      // Analytics tracking failed
    }
  }

  setUserProperty(key: string, value: string) {
    if (!this.analytics) return;

    try {
      setUserProperties(this.analytics, { [key]: value });
    } catch {
      // Setting user property failed
    }
  }

  trackTimeOnPage(pageName: string, timeSeconds: number) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.TIME_ON_PAGE, {
        page_name: pageName,
        time_seconds: timeSeconds,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Analytics tracking failed
    }
  }

  trackTabVisibility(isVisible: boolean) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.TAB_VISIBILITY_CHANGE, {
        is_visible: isVisible,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Analytics tracking failed
    }
  }

  trackSearchTimeout(waitTimeMs: number) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.SEARCH_TIMEOUT, {
        wait_time_ms: waitTimeMs,
        wait_time_seconds: Math.floor(waitTimeMs / 1000),
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Analytics tracking failed
    }
  }

  trackNetworkQuality(quality: 'excellent' | 'good' | 'poor' | 'bad', latency?: number) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.NETWORK_QUALITY, {
        quality,
        latency_ms: latency,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Analytics tracking failed
    }
  }

  trackRTCConnectionTime(connectionTimeMs: number) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.RTC_CONNECTION_TIME, {
        connection_time_ms: connectionTimeMs,
        connection_time_seconds: Math.round(connectionTimeMs / 1000),
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Analytics tracking failed
    }
  }

  trackPageLoadTime(loadTimeMs: number) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.PAGE_LOAD_TIME, {
        load_time_ms: loadTimeMs,
        load_time_seconds: Math.round(loadTimeMs / 1000),
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Analytics tracking failed
    }
  }

  trackButtonClick(buttonName: string, buttonLocation: string) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.BUTTON_CLICK, {
        button_name: buttonName,
        button_location: buttonLocation,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Analytics tracking failed
    }
  }

  trackDeviceListOpened(deviceType: 'camera' | 'microphone') {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.DEVICE_LIST_OPENED, {
        device_type: deviceType,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Analytics tracking failed
    }
  }

  trackChatWindow(action: 'opened' | 'closed') {
    if (!this.analytics) return;

    try {
      const eventName = action === 'opened' ? AnalyticsEvents.CHAT_OPENED : AnalyticsEvents.CHAT_CLOSED;
      logEvent(this.analytics, eventName, {
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Analytics tracking failed
    }
  }

  trackEngagement(score: number, actions: string[]) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, AnalyticsEvents.USER_ENGAGEMENT, {
        engagement_score: score,
        actions_taken: actions.join(','),
        total_actions: actions.length,
        session_number: this.sessionCount,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Analytics tracking failed
    }
  }

  trackCustomEvent(eventName: string, params?: Record<string, unknown>) {
    if (!this.analytics) return;

    try {
      logEvent(this.analytics, eventName, {
        ...params,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Analytics tracking failed
    }
  }
}

export const analytics = new AnalyticsService();
