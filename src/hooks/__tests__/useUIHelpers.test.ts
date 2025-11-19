import { renderHook } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { useKeyboardShortcuts, useVideoRenderer } from "../useUIHelpers";
import type { ICameraVideoTrack } from "agora-rtc-sdk-ng";

describe("useUIHelpers", () => {
  describe("useKeyboardShortcuts", () => {
    it("calls onNext when Escape is pressed and isConnected is true", () => {
      const onNext = jest.fn();
      renderHook(() => useKeyboardShortcuts(true, onNext));

      fireEvent.keyDown(window, { key: "Escape" });
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it("does not call onNext when Escape is pressed and isConnected is false", () => {
      const onNext = jest.fn();
      renderHook(() => useKeyboardShortcuts(false, onNext));

      fireEvent.keyDown(window, { key: "Escape" });
      expect(onNext).not.toHaveBeenCalled();
    });

    it("does not call onNext when other key is pressed", () => {
      const onNext = jest.fn();
      renderHook(() => useKeyboardShortcuts(true, onNext));

      fireEvent.keyDown(window, { key: "Enter" });
      expect(onNext).not.toHaveBeenCalled();
    });
  });

  describe("useVideoRenderer", () => {
    it("plays video track when enabled", () => {
      const videoRef = { current: document.createElement("div") };
      const videoTrack = {
        play: jest.fn(),
        stop: jest.fn(),
      } as unknown as ICameraVideoTrack;

      renderHook(() => useVideoRenderer(videoRef, videoTrack, true));
      expect(videoTrack.play).toHaveBeenCalledWith(videoRef.current);
    });

    it("stops video track on unmount", () => {
      const videoRef = { current: document.createElement("div") };
      const videoTrack = {
        play: jest.fn(),
        stop: jest.fn(),
      } as unknown as ICameraVideoTrack;

      const { unmount } = renderHook(() => useVideoRenderer(videoRef, videoTrack, true));
      unmount();
      expect(videoTrack.stop).toHaveBeenCalled();
    });

    it("does not play if disabled", () => {
      const videoRef = { current: document.createElement("div") };
      const videoTrack = {
        play: jest.fn(),
        stop: jest.fn(),
      } as unknown as ICameraVideoTrack;

      renderHook(() => useVideoRenderer(videoRef, videoTrack, false));
      expect(videoTrack.play).not.toHaveBeenCalled();
    });
  });
});
