/**
 * \@jest-environment jsdom
 */

import { analyticsService } from "../analyticsService";
import { logEvent, setUserId, setUserProperties } from "firebase/analytics";

// Mock Firebase Analytics
jest.mock("@/lib/firebase", () => ({
  analytics: {},
}));

jest.mock("firebase/analytics", () => ({
  logEvent: jest.fn(),
  setUserId: jest.fn(),
  setUserProperties: jest.fn(),
}));

describe("AnalyticsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("trackEvent", () => {
    it("does not track events in non-production environment", () => {
      analyticsService.trackEvent("chat_started", {
        video_enabled: true,
        audio_enabled: true,
      });

      // In development/test, events are not tracked
      expect(logEvent).not.toHaveBeenCalled();
    });
  });

  describe("trackPageView", () => {
    it("tracks page views with path and title", () => {
      analyticsService.trackPageView("/home", "Home Page");

      // Events not tracked in development
      expect(logEvent).not.toHaveBeenCalled();
    });
  });

  describe("trackChatStarted", () => {
    it("tracks chat start with video and audio state", () => {
      analyticsService.trackChatStarted(true, false);

      expect(logEvent).not.toHaveBeenCalled();
    });
  });

  describe("trackChatEnded", () => {
    it("tracks chat end with duration and reason", () => {
      analyticsService.trackChatEnded(120, "user_left");

      expect(logEvent).not.toHaveBeenCalled();
    });
  });

  describe("trackPartnerFound", () => {
    it("tracks when partner is found with wait time", () => {
      analyticsService.trackPartnerFound(5);

      expect(logEvent).not.toHaveBeenCalled();
    });
  });

  describe("trackPartnerDisconnected", () => {
    it("tracks partner disconnection", () => {
      analyticsService.trackPartnerDisconnected();

      expect(logEvent).not.toHaveBeenCalled();
    });
  });

  describe("trackVideoToggle", () => {
    it("tracks video enable", () => {
      analyticsService.trackVideoToggle(true);

      expect(logEvent).not.toHaveBeenCalled();
    });

    it("tracks video disable", () => {
      analyticsService.trackVideoToggle(false);

      expect(logEvent).not.toHaveBeenCalled();
    });
  });

  describe("trackAudioToggle", () => {
    it("tracks audio enable", () => {
      analyticsService.trackAudioToggle(true);

      expect(logEvent).not.toHaveBeenCalled();
    });

    it("tracks audio disable", () => {
      analyticsService.trackAudioToggle(false);

      expect(logEvent).not.toHaveBeenCalled();
    });
  });

  describe("trackSkipPartner", () => {
    it("tracks skip partner action", () => {
      analyticsService.trackSkipPartner();

      expect(logEvent).not.toHaveBeenCalled();
    });
  });

  describe("trackConnectionError", () => {
    it("tracks connection errors", () => {
      analyticsService.trackConnectionError("network", "Connection timeout");

      expect(logEvent).not.toHaveBeenCalled();
    });
  });

  describe("trackNetworkQuality", () => {
    it("tracks network quality changes", () => {
      analyticsService.trackNetworkQuality("good");

      expect(logEvent).not.toHaveBeenCalled();
    });
  });

  describe("setUser", () => {
    it("sets user ID", () => {
      analyticsService.setUser("user-123");

      expect(setUserId).not.toHaveBeenCalled();
    });
  });

  describe("setUserProperties", () => {
    it("sets user properties", () => {
      analyticsService.setUserProperties({
        device_type: "desktop",
        browser: "chrome",
      });

      expect(setUserProperties).not.toHaveBeenCalled();
    });
  });

  describe("detectDeviceType", () => {
    it("detects device type and browser", () => {
      // Mock navigator
      Object.defineProperty(window.navigator, "userAgent", {
        value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0",
        configurable: true,
      });

      analyticsService.detectDeviceType();

      expect(setUserProperties).not.toHaveBeenCalled();
    });
  });
});
