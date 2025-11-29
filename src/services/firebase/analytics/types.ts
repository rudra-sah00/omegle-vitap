/**
 * Analytics Types and Constants
 * Shared types and event constants for analytics tracking
 */

import type { Analytics } from 'firebase/analytics';

// ============================================
// ANALYTICS EVENT CONSTANTS
// ============================================

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

// ============================================
// TYPE DEFINITIONS
// ============================================

/** Duration categories for match analysis */
export type DurationBucket = 'very_short' | 'short' | 'medium' | 'long' | 'very_long';

/** Quality ratings for match analysis */
export type MatchQuality = 'poor' | 'fair' | 'good' | 'excellent';

/** Network quality levels */
export type NetworkQuality = 'excellent' | 'good' | 'poor' | 'bad';

/** Error types for error tracking */
export type ErrorType =
  | 'camera_permission'
  | 'microphone_permission'
  | 'connection'
  | 'rtc'
  | 'websocket'
  | 'media_device';

/** Match end reasons */
export type MatchEndReason = 'user_stop' | 'user_skip' | 'remote_disconnect' | 'error';

/** Device types for media tracking */
export type DeviceType = 'camera' | 'microphone';

/** Reconnection types */
export type ReconnectionType = 'websocket' | 'rtc';

/** Media context for toggle events */
export type MediaContext = 'preview' | 'call';

// ============================================
// BASE TRACKER CLASS
// ============================================

/**
 * Base class for analytics trackers
 * Provides common functionality for all tracker modules
 */
export abstract class BaseTracker {
  protected analytics: Analytics | null = null;

  /** Set the analytics instance */
  setAnalytics(analytics: Analytics | null): void {
    this.analytics = analytics;
  }

  /** Get current timestamp in ISO format */
  protected getTimestamp(): string {
    return new Date().toISOString();
  }

  /** Safely execute analytics tracking with error handling */
  protected safeTrack(trackFn: () => void): void {
    if (!this.analytics) return;
    try {
      trackFn();
    } catch {
      // Analytics tracking failed - silent fail to not disrupt user experience
    }
  }
}
