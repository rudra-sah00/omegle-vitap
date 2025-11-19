/**
 * Analytics Service
 *
 * Provides centralized analytics tracking using Firebase Analytics.
 * Tracks user interactions, video chat sessions, and engagement metrics.
 */

import { logEvent, setUserProperties, setUserId } from "firebase/analytics";
import { analytics } from "@/lib/firebase";

/**
 * User event types for analytics tracking
 */
export type AnalyticsEvent =
  | "page_view"
  | "session_start"
  | "session_end"
  | "chat_started"
  | "chat_ended"
  | "partner_found"
  | "partner_disconnected"
  | "video_enabled"
  | "video_disabled"
  | "audio_enabled"
  | "audio_disabled"
  | "skip_partner"
  | "report_user"
  | "connection_error"
  | "network_quality_change"
  | "device_switched"
  | "beauty_effect_toggled"
  | "dual_stream_enabled"
  | "camera_permission_granted"
  | "camera_permission_denied"
  | "microphone_permission_granted"
  | "microphone_permission_denied"
  | "audio_volume_changed"
  | "video_quality_changed"
  | "chat_message_sent"
  | "search_timeout"
  | "user_idle"
  | "user_active";

/**
 * Event parameters for analytics
 */
export interface AnalyticsEventParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * User properties for segmentation
 */
export interface UserProperties {
  [key: string]: string | number | boolean | undefined;
  device_type?: "mobile" | "desktop" | "tablet";
  browser?: string;
  network_quality?: "excellent" | "good" | "poor" | "bad";
  camera_enabled?: boolean;
  microphone_enabled?: boolean;
  screen_width?: number;
  screen_height?: number;
  platform?: string;
  language?: string;
}

/**
 * Analytics service for tracking user behavior and app metrics
 */
class AnalyticsService {
  private isEnabled: boolean = false;
  private sessionStartTime: number | null = null;
  private chatStartTime: number | null = null;
  private lastActivityTime: number = Date.now();
  private idleCheckInterval: NodeJS.Timeout | null = null;
  private deviceType: "mobile" | "desktop" | "tablet" = "desktop";

  constructor() {
    // Analytics is enabled only in production and when supported
    this.isEnabled = process.env.NODE_ENV === "production" && analytics !== null;

    if (typeof window !== "undefined") {
      this.initializeSessionTracking();
      this.initializeIdleTracking();
    }
  }

  /**
   * Initialize session tracking
   */
  private initializeSessionTracking(): void {
    this.sessionStartTime = Date.now();
    this.trackEvent("session_start", {
      timestamp: this.sessionStartTime,
    });

    // Track session end on page unload
    window.addEventListener("beforeunload", () => {
      this.trackSessionEnd();
    });

    // Track visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.trackEvent("user_idle", {
          timestamp: Date.now(),
        });
      } else {
        this.lastActivityTime = Date.now();
        this.trackEvent("user_active", {
          timestamp: Date.now(),
        });
      }
    });
  }

  /**
   * Initialize idle tracking
   */
  private initializeIdleTracking(): void {
    const IDLE_TIMEOUT = 60000; // 1 minute

    // Track user activity
    const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    activityEvents.forEach((event) => {
      document.addEventListener(event, () => {
        this.lastActivityTime = Date.now();
      });
    });

    // Check for idle state every 30 seconds
    this.idleCheckInterval = setInterval(() => {
      const idleTime = Date.now() - this.lastActivityTime;
      if (idleTime > IDLE_TIMEOUT) {
        this.trackEvent("user_idle", {
          idle_duration_seconds: Math.floor(idleTime / 1000),
        });
      }
    }, 30000);
  }

  /**
   * Track session end
   */
  trackSessionEnd(): void {
    if (this.sessionStartTime) {
      const duration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
      this.trackEvent("session_end", {
        duration_seconds: duration,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Track a custom event
   *
   * @param eventName - Name of the event to track
   * @param params - Optional parameters for the event
   */
  trackEvent(eventName: string, params?: AnalyticsEventParams): void {
    if (!this.isEnabled || !analytics) return;

    try {
      logEvent(analytics, eventName, params);
    } catch (_error) {
      // Silently fail to not disrupt user experience
    }
  }

  /**
   * Track page view
   *
   * @param pagePath - Path of the page being viewed
   * @param pageTitle - Title of the page
   */
  trackPageView(pagePath: string, pageTitle?: string): void {
    this.trackEvent("page_view", {
      page_path: pagePath,
      page_title: pageTitle,
    });
  }

  /**
   * Track when a chat session starts
   *
   * @param hasVideo - Whether video is enabled
   * @param hasAudio - Whether audio is enabled
   */
  trackChatStarted(hasVideo: boolean, hasAudio: boolean): void {
    this.chatStartTime = Date.now();
    this.trackEvent("chat_started", {
      video_enabled: hasVideo,
      audio_enabled: hasAudio,
      device_type: this.deviceType,
      timestamp: this.chatStartTime,
    });
  }

  /**
   * Track when a chat session ends
   *
   * @param duration - Duration of the chat in seconds
   * @param reason - Reason for ending (user_left, partner_left, error)
   */
  trackChatEnded(duration: number, reason: "user_left" | "partner_left" | "error"): void {
    this.trackEvent("chat_ended", {
      duration_seconds: duration,
      end_reason: reason,
      device_type: this.deviceType,
      timestamp: Date.now(),
    });
    this.chatStartTime = null;
  }

  /**
   * Get current chat duration
   *
   * @returns Duration in seconds
   */
  getCurrentChatDuration(): number {
    if (!this.chatStartTime) return 0;
    return Math.floor((Date.now() - this.chatStartTime) / 1000);
  }

  /**
   * Track when a partner is found
   *
   * @param waitTime - Time waited to find partner in seconds
   */
  trackPartnerFound(waitTime: number): void {
    this.trackEvent("partner_found", {
      wait_time_seconds: waitTime,
    });
  }

  /**
   * Track partner disconnection
   */
  trackPartnerDisconnected(): void {
    this.trackEvent("partner_disconnected", {
      timestamp: Date.now(),
    });
  }

  /**
   * Track video toggle
   *
   * @param enabled - Whether video was enabled or disabled
   */
  trackVideoToggle(enabled: boolean): void {
    this.trackEvent(enabled ? "video_enabled" : "video_disabled", {
      timestamp: Date.now(),
    });
  }

  /**
   * Track audio toggle
   *
   * @param enabled - Whether audio was enabled or disabled
   */
  trackAudioToggle(enabled: boolean): void {
    this.trackEvent(enabled ? "audio_enabled" : "audio_disabled", {
      timestamp: Date.now(),
    });
  }

  /**
   * Track skip partner action
   */
  trackSkipPartner(): void {
    this.trackEvent("skip_partner", {
      timestamp: Date.now(),
    });
  }

  /**
   * Track user report
   *
   * @param reason - Reason for reporting
   */
  trackReportUser(reason: string): void {
    this.trackEvent("report_user", {
      reason,
      timestamp: Date.now(),
    });
  }

  /**
   * Track connection errors
   *
   * @param errorType - Type of error encountered
   * @param errorMessage - Error message
   * @param errorCode - Optional error code
   */
  trackConnectionError(errorType: string, errorMessage: string, errorCode?: string): void {
    this.trackEvent("connection_error", {
      error_type: errorType,
      error_message: errorMessage,
      error_code: errorCode,
      device_type: this.deviceType,
      timestamp: Date.now(),
    });
  }

  /**
   * Track permission granted
   *
   * @param permissionType - Type of permission (camera or microphone)
   */
  trackPermissionGranted(permissionType: "camera" | "microphone"): void {
    this.trackEvent(
      permissionType === "camera" ? "camera_permission_granted" : "microphone_permission_granted",
      {
        device_type: this.deviceType,
        timestamp: Date.now(),
      }
    );
  }

  /**
   * Track permission denied
   *
   * @param permissionType - Type of permission (camera or microphone)
   */
  trackPermissionDenied(permissionType: "camera" | "microphone"): void {
    this.trackEvent(
      permissionType === "camera" ? "camera_permission_denied" : "microphone_permission_denied",
      {
        device_type: this.deviceType,
        timestamp: Date.now(),
      }
    );
  }

  /**
   * Track audio volume change
   *
   * @param volume - New volume level (0-100)
   */
  trackAudioVolumeChange(volume: number): void {
    this.trackEvent("audio_volume_changed", {
      volume,
      device_type: this.deviceType,
      timestamp: Date.now(),
    });
  }

  /**
   * Track video quality change
   *
   * @param resolution - New resolution
   * @param frameRate - New frame rate
   */
  trackVideoQualityChange(resolution: string, frameRate: number): void {
    this.trackEvent("video_quality_changed", {
      resolution,
      frame_rate: frameRate,
      device_type: this.deviceType,
      timestamp: Date.now(),
    });
  }

  /**
   * Track chat message sent
   */
  trackMessageSent(): void {
    this.trackEvent("chat_message_sent", {
      device_type: this.deviceType,
      timestamp: Date.now(),
    });
  }

  /**
   * Track search timeout
   *
   * @param searchDuration - How long the search lasted in seconds
   */
  trackSearchTimeout(searchDuration: number): void {
    this.trackEvent("search_timeout", {
      search_duration_seconds: searchDuration,
      device_type: this.deviceType,
      timestamp: Date.now(),
    });
  }

  /**
   * Track network quality changes
   *
   * @param quality - Current network quality
   */
  trackNetworkQuality(quality: "excellent" | "good" | "poor" | "bad"): void {
    this.trackEvent("network_quality_change", {
      quality,
      timestamp: Date.now(),
    });
  }

  /**
   * Track device switching (camera/microphone)
   *
   * @param deviceType - Type of device switched
   */
  trackDeviceSwitched(deviceType: "camera" | "microphone" | "speaker"): void {
    this.trackEvent("device_switched", {
      device_type: deviceType,
      timestamp: Date.now(),
    });
  }

  /**
   * Track beauty effect toggle
   *
   * @param enabled - Whether beauty effect was enabled
   */
  trackBeautyEffect(enabled: boolean): void {
    this.trackEvent("beauty_effect_toggled", {
      enabled,
      timestamp: Date.now(),
    });
  }

  /**
   * Track dual stream mode
   */
  trackDualStream(): void {
    this.trackEvent("dual_stream_enabled", {
      timestamp: Date.now(),
    });
  }

  /**
   * Set user ID for analytics
   *
   * @param userId - Unique user identifier
   */
  setUser(userId: string): void {
    if (!this.isEnabled || !analytics) return;

    try {
      setUserId(analytics, userId);
    } catch (_error) {
      // Silently fail
    }
  }

  /**
   * Set user properties for segmentation
   *
   * @param properties - User properties to set
   */
  setUserProperties(properties: UserProperties): void {
    if (!this.isEnabled || !analytics) return;

    try {
      setUserProperties(analytics, properties);
    } catch (_error) {
      // Silently fail
    }
  }

  /**
   * Detect and set device type
   */
  detectDeviceType(): void {
    if (typeof window === "undefined") return;

    const userAgent = navigator.userAgent.toLowerCase();
    let deviceType: "mobile" | "desktop" | "tablet" = "desktop";

    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
      deviceType = "tablet";
    } else if (
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
        userAgent
      )
    ) {
      deviceType = "mobile";
    }

    this.deviceType = deviceType;

    // Get screen dimensions
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;

    this.setUserProperties({
      device_type: deviceType,
      browser: this.detectBrowser(),
      screen_width: screenWidth,
      screen_height: screenHeight,
      platform: navigator.platform,
      language: navigator.language,
    });
  }

  /**
   * Detect browser type
   *
   * @returns Browser name
   */
  private detectBrowser(): string {
    if (typeof window === "undefined") return "unknown";

    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes("edg")) return "edge";
    if (userAgent.includes("chrome")) return "chrome";
    if (userAgent.includes("safari")) return "safari";
    if (userAgent.includes("firefox")) return "firefox";
    if (userAgent.includes("opera") || userAgent.includes("opr")) return "opera";

    return "unknown";
  }
}

/**
 * Singleton instance of AnalyticsService
 * Tracks user behavior, events, and analytics across the application
 */
export const analyticsService = new AnalyticsService();
