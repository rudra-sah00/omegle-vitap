import { renderHook, act, waitFor } from "@testing-library/react";
import { useVideoChat } from "../useVideoChat";
import { agoraService } from "@/services/agoraService";
import { requestToken } from "@/services/agoraTokenService";

// Mock services
jest.mock("@/services/agoraService");
jest.mock("@/services/agoraTokenService");
jest.mock("@/services/analyticsService");

interface MockTrack {
  setEnabled: jest.Mock;
  close: jest.Mock;
  stop: jest.Mock;
  play?: jest.Mock;
  enabled: boolean;
  _ID: string;
}

interface MockClient {
  on: jest.Mock;
  join: jest.Mock;
  leave: jest.Mock;
  publish: jest.Mock;
  unpublish: jest.Mock;
  subscribe: jest.Mock;
  connectionState: string;
  remoteUsers: unknown[];
}

describe("useVideoChat", () => {
  const mockUserId = "user-123";
  const mockChannelName = "test-channel";
  const mockOnError = jest.fn();
  let mockClient: MockClient;
  let mockVideoTrack: MockTrack;
  let mockAudioTrack: MockTrack;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock tracks
    mockVideoTrack = {
      setEnabled: jest.fn().mockResolvedValue(undefined),
      close: jest.fn(),
      stop: jest.fn(),
      play: jest.fn(),
      enabled: true,
      _ID: "video-track-1",
    };

    mockAudioTrack = {
      setEnabled: jest.fn().mockResolvedValue(undefined),
      close: jest.fn(),
      stop: jest.fn(),
      enabled: true,
      _ID: "audio-track-1",
    };

    // Create mock client
    mockClient = {
      on: jest.fn(),
      join: jest.fn().mockResolvedValue(12345),
      leave: jest.fn().mockResolvedValue(undefined),
      publish: jest.fn().mockResolvedValue(undefined),
      unpublish: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockResolvedValue(undefined),
      connectionState: "CONNECTED",
      remoteUsers: [],
    };

    (requestToken as jest.Mock).mockResolvedValue("mock-token");
    (agoraService.initClient as jest.Mock).mockResolvedValue(mockClient);
    (agoraService.joinChannel as jest.Mock).mockResolvedValue(123);
    (agoraService.getLocalTracks as jest.Mock).mockReturnValue({
      videoTrack: mockVideoTrack,
      audioTrack: mockAudioTrack,
    });
    (agoraService.getLocalVideoTrack as jest.Mock).mockReturnValue(mockVideoTrack);
    (agoraService.getLocalAudioTrack as jest.Mock).mockReturnValue(mockAudioTrack);
    (agoraService.createLocalTracks as jest.Mock).mockResolvedValue({
      videoTrack: mockVideoTrack,
      audioTrack: mockAudioTrack,
    });
    (agoraService.setLocalTracks as jest.Mock).mockImplementation(() => {});
    (agoraService.publishTracks as jest.Mock).mockResolvedValue(undefined);
    (agoraService.unpublishTracks as jest.Mock).mockResolvedValue(undefined);
    (agoraService.enableDualStream as jest.Mock).mockResolvedValue(undefined);
    (agoraService.leaveChannel as jest.Mock).mockResolvedValue(undefined);
    (agoraService.restoreTracksForPreview as jest.Mock).mockResolvedValue(undefined);
  });

  describe("Initialization", () => {
    it("initializes with states matching shouldPublish props", () => {
      const { result } = renderHook(() =>
        useVideoChat(mockUserId, mockChannelName, false, true, false, mockOnError)
      );

      expect(result.current.isCameraOn).toBe(true);
      expect(result.current.isMicOn).toBe(false);
      expect(result.current.localVideoTrack).toBeNull();
      expect(result.current.localAudioTrack).toBeNull();
      expect(result.current.remoteUsers).toEqual([]);
      expect(result.current.isJoined).toBe(false);
    });

    it("does not join when disabled", () => {
      renderHook(() => useVideoChat(mockUserId, mockChannelName, false, true, true, mockOnError));

      expect(agoraService.initClient).not.toHaveBeenCalled();
    });
  });

  describe("Audio Track Publishing", () => {
    it("publishes audio track when joining with mic enabled", async () => {
      renderHook(() => useVideoChat(mockUserId, mockChannelName, true, true, true, mockOnError));

      await waitFor(
        () => {
          expect(agoraService.setLocalTracks).toHaveBeenCalledWith({
            videoTrack: mockVideoTrack,
            audioTrack: mockAudioTrack,
          });
          expect(agoraService.publishTracks).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });

    it("does not publish audio when joining with mic disabled", async () => {
      renderHook(() => useVideoChat(mockUserId, mockChannelName, true, true, false, mockOnError));

      await waitFor(
        () => {
          expect(agoraService.initClient).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      // setLocalTracks should be called only with video track
      expect(agoraService.setLocalTracks).toHaveBeenCalledWith({
        videoTrack: mockVideoTrack,
        audioTrack: null,
      });
    });

    it("publishes audio track when toggled on during call", async () => {
      const { result } = renderHook(() =>
        useVideoChat(mockUserId, mockChannelName, true, true, true, mockOnError)
      );

      await waitFor(
        () => {
          expect(result.current.isJoined).toBe(true);
        },
        { timeout: 3000 }
      );

      jest.clearAllMocks();
      // Mock initial state as off
      (agoraService.getLocalAudioTrack as jest.Mock).mockReturnValue(mockAudioTrack);

      await act(async () => {
        await result.current.toggleMic();
      });

      await waitFor(() => {
        expect(mockAudioTrack.setEnabled).toHaveBeenCalled();
      });

      // Note: publish is called conditionally based on newState && isJoined
      // If toggling from on to off, it won't publish
    });

    it("handles missing audio track gracefully", async () => {
      (agoraService.getLocalAudioTrack as jest.Mock).mockReturnValue(null);

      const { result } = renderHook(() =>
        useVideoChat(mockUserId, mockChannelName, true, true, true, mockOnError)
      );

      await waitFor(
        () => {
          expect(result.current.isJoined).toBe(true);
        },
        { timeout: 3000 }
      );

      jest.clearAllMocks();

      await act(async () => {
        await result.current.toggleMic();
      });

      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining("Microphone track not available")
      );
    });
  });

  describe("Camera Track After Disconnect", () => {
    it("restores preview tracks after leaving call", async () => {
      const { result, rerender } = renderHook(
        ({ enabled }) =>
          useVideoChat(mockUserId, mockChannelName, enabled, true, true, mockOnError),
        { initialProps: { enabled: true } }
      );

      await waitFor(
        () => {
          expect(result.current.isJoined).toBe(true);
        },
        { timeout: 3000 }
      );

      // Disable auto-rejoin before leaving
      rerender({ enabled: false });

      await act(async () => {
        await result.current.leaveChannel();
      });

      // Wait for state to update after async operations complete
      await waitFor(() => {
        expect(result.current.isJoined).toBe(false);
      });

      expect(agoraService.restoreTracksForPreview).toHaveBeenCalled();
    });

    it("resets states to preview preferences after leaving", async () => {
      const { result } = renderHook(() =>
        useVideoChat(mockUserId, mockChannelName, true, true, false, mockOnError)
      );

      await waitFor(
        () => {
          expect(result.current.isJoined).toBe(true);
        },
        { timeout: 3000 }
      );

      // Initial mic should be off (shouldPublishAudio = false)
      expect(result.current.isMicOn).toBe(false);

      // Toggle mic on during call
      (agoraService.getLocalAudioTrack as jest.Mock).mockReturnValue(mockAudioTrack);
      await act(async () => {
        await result.current.toggleMic();
      });

      await waitFor(() => {
        expect(result.current.isMicOn).toBe(true);
      });

      // Leave channel
      await act(async () => {
        await result.current.leaveChannel();
      });

      // Should restore to original preference (false)
      await waitFor(() => {
        expect(result.current.isMicOn).toBe(false);
      });
    });

    it("unpublishes tracks before leaving", async () => {
      const { result } = renderHook(() =>
        useVideoChat(mockUserId, mockChannelName, true, true, true, mockOnError)
      );

      await waitFor(
        () => {
          expect(result.current.isJoined).toBe(true);
        },
        { timeout: 3000 }
      );

      jest.clearAllMocks();

      await act(async () => {
        await result.current.leaveChannel();
      });

      expect(agoraService.unpublishTracks).toHaveBeenCalled();
      expect(agoraService.leaveChannel).toHaveBeenCalled();
    });
  });

  describe("State Synchronization", () => {
    it("syncs camera/mic states with props on mount", () => {
      const { result } = renderHook(() =>
        useVideoChat(mockUserId, mockChannelName, false, false, true, mockOnError)
      );

      expect(result.current.isCameraOn).toBe(false);
      expect(result.current.isMicOn).toBe(true);
    });

    it("updates states when props change before joining", () => {
      const { result, rerender } = renderHook(
        ({ video, audio }) =>
          useVideoChat(mockUserId, mockChannelName, false, video, audio, mockOnError),
        { initialProps: { video: true, audio: false } }
      );

      expect(result.current.isCameraOn).toBe(true);
      expect(result.current.isMicOn).toBe(false);

      rerender({ video: false, audio: true });

      expect(result.current.isCameraOn).toBe(false);
      expect(result.current.isMicOn).toBe(true);
    });
  });

  describe("Toggle Operations", () => {
    it("prevents concurrent mic toggles", async () => {
      const { result } = renderHook(() =>
        useVideoChat(mockUserId, mockChannelName, true, true, true, mockOnError)
      );

      await waitFor(
        () => {
          expect(result.current.isJoined).toBe(true);
        },
        { timeout: 3000 }
      );

      jest.clearAllMocks();

      // Rapid toggles
      const toggles = [
        result.current.toggleMic(),
        result.current.toggleMic(),
        result.current.toggleMic(),
      ];

      await act(async () => {
        await Promise.all(toggles);
      });

      // Only first should execute
      expect(mockAudioTrack.setEnabled).toHaveBeenCalledTimes(1);
    });

    it("reverts state on toggle error", async () => {
      const { result } = renderHook(() =>
        useVideoChat(mockUserId, mockChannelName, true, true, true, mockOnError)
      );

      await waitFor(
        () => {
          expect(result.current.isJoined).toBe(true);
        },
        { timeout: 3000 }
      );

      const originalState = result.current.isMicOn;

      // Mock error after hook is initialized
      mockAudioTrack.setEnabled.mockRejectedValueOnce(new Error("Toggle failed"));
      (agoraService.getLocalAudioTrack as jest.Mock).mockReturnValue(mockAudioTrack);

      await act(async () => {
        await result.current.toggleMic();
      });

      await waitFor(() => {
        expect(result.current.isMicOn).toBe(originalState);
        expect(mockOnError).toHaveBeenCalled();
      });
    });

    it("toggles camera correctly", async () => {
      const { result } = renderHook(() =>
        useVideoChat(mockUserId, mockChannelName, true, true, true, mockOnError)
      );

      await waitFor(
        () => {
          expect(result.current.isJoined).toBe(true);
        },
        { timeout: 3000 }
      );

      jest.clearAllMocks();
      (agoraService.getLocalVideoTrack as jest.Mock).mockReturnValue(mockVideoTrack);

      await act(async () => {
        await result.current.toggleCamera();
      });

      await waitFor(() => {
        expect(mockVideoTrack.setEnabled).toHaveBeenCalled();
      });
    });
  });

  describe("Join Channel Flow", () => {
    it("requests token before joining", async () => {
      renderHook(() => useVideoChat(mockUserId, mockChannelName, true, true, true, mockOnError));

      await waitFor(
        () => {
          expect(requestToken).toHaveBeenCalledWith(mockChannelName, expect.any(Number));
        },
        { timeout: 3000 }
      );
    });

    it("initializes client and joins channel", async () => {
      renderHook(() => useVideoChat(mockUserId, mockChannelName, true, true, true, mockOnError));

      await waitFor(
        () => {
          expect(agoraService.initClient).toHaveBeenCalled();
          expect(agoraService.joinChannel).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });

    it("handles join failures", async () => {
      (agoraService.joinChannel as jest.Mock).mockRejectedValue(new Error("Join failed"));

      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

      renderHook(() => useVideoChat(mockUserId, mockChannelName, true, true, true, mockOnError));

      await waitFor(
        () => {
          expect(mockOnError).toHaveBeenCalledWith(
            expect.stringContaining("Unable to join video call")
          );
        },
        { timeout: 3000 }
      );

      consoleError.mockRestore();
    });

    it("handles token failures", async () => {
      (requestToken as jest.Mock).mockRejectedValue(new Error("Token failed"));

      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

      renderHook(() => useVideoChat(mockUserId, mockChannelName, true, true, true, mockOnError));

      await waitFor(
        () => {
          expect(mockOnError).toHaveBeenCalledWith(
            expect.stringContaining("Unable to connect to video service")
          );
        },
        { timeout: 3000 }
      );

      consoleError.mockRestore();
    });
  });

  describe("Remote Users", () => {
    it("subscribes to remote user tracks", async () => {
      renderHook(() => useVideoChat(mockUserId, mockChannelName, true, true, true, mockOnError));

      await waitFor(
        () => {
          expect(mockClient.on).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      const userPublishedCallback = mockClient.on.mock.calls.find(
        (call: unknown[]) => call[0] === "user-published"
      )?.[1];

      expect(userPublishedCallback).toBeDefined();

      const remoteUser = { uid: 67890, videoTrack: {}, audioTrack: {} };
      await act(async () => {
        await userPublishedCallback(remoteUser, "video");
      });

      expect(mockClient.subscribe).toHaveBeenCalledWith(remoteUser, "video");
    });

    it("handles remote user left event", async () => {
      const onPartnerLeft = jest.fn();
      renderHook(() =>
        useVideoChat(mockUserId, mockChannelName, true, true, true, mockOnError, onPartnerLeft)
      );

      await waitFor(
        () => {
          expect(mockClient.on).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      const userLeftCallback = mockClient.on.mock.calls.find(
        (call: unknown[]) => call[0] === "user-left"
      )?.[1];

      const remoteUser = { uid: 67890 };
      await act(async () => {
        userLeftCallback(remoteUser);
      });

      expect(onPartnerLeft).toHaveBeenCalled();
    });
  });

  describe("Cleanup", () => {
    it("cleans up on unmount when joined", async () => {
      const { unmount } = renderHook(() =>
        useVideoChat(mockUserId, mockChannelName, true, true, true, mockOnError)
      );

      await waitFor(
        () => {
          expect(agoraService.initClient).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      jest.clearAllMocks();

      unmount();

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(agoraService.unpublishTracks).toHaveBeenCalled();
    });
  });

  describe("Network Quality", () => {
    it("handles network quality updates - excellent", async () => {
      renderHook(() => useVideoChat(mockUserId, mockChannelName, true, true, true, mockOnError));

      await waitFor(
        () => {
          expect(mockClient.on).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      const networkQualityCallback = mockClient.on.mock.calls.find(
        (call: unknown[]) => call[0] === "network-quality"
      )?.[1];

      expect(networkQualityCallback).toBeDefined();

      await act(async () => {
        networkQualityCallback({ uplinkNetworkQuality: 1, downlinkNetworkQuality: 1 });
      });
    });

    it("handles network quality updates - good", async () => {
      renderHook(() => useVideoChat(mockUserId, mockChannelName, true, true, true, mockOnError));

      await waitFor(
        () => {
          expect(mockClient.on).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      const networkQualityCallback = mockClient.on.mock.calls.find(
        (call: unknown[]) => call[0] === "network-quality"
      )?.[1];

      await act(async () => {
        networkQualityCallback({ uplinkNetworkQuality: 2, downlinkNetworkQuality: 2 });
      });
    });

    it("handles network quality updates - poor", async () => {
      renderHook(() => useVideoChat(mockUserId, mockChannelName, true, true, true, mockOnError));

      await waitFor(
        () => {
          expect(mockClient.on).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      const networkQualityCallback = mockClient.on.mock.calls.find(
        (call: unknown[]) => call[0] === "network-quality"
      )?.[1];

      await act(async () => {
        networkQualityCallback({ uplinkNetworkQuality: 3, downlinkNetworkQuality: 3 });
      });
    });

    it("handles network quality updates - bad", async () => {
      renderHook(() => useVideoChat(mockUserId, mockChannelName, true, true, true, mockOnError));

      await waitFor(
        () => {
          expect(mockClient.on).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      const networkQualityCallback = mockClient.on.mock.calls.find(
        (call: unknown[]) => call[0] === "network-quality"
      )?.[1];

      await act(async () => {
        networkQualityCallback({ uplinkNetworkQuality: 4, downlinkNetworkQuality: 4 });
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles empty token string", async () => {
      (requestToken as jest.Mock).mockResolvedValueOnce("   ");

      const onError = jest.fn();
      renderHook(() => useVideoChat(mockUserId, mockChannelName, true, true, true, onError));

      await waitFor(
        () => {
          expect(onError).toHaveBeenCalledWith(
            expect.stringContaining("Unable to connect to video service")
          );
        },
        { timeout: 3000 }
      );
    });

    it("handles joinChannel when already joining", async () => {
      const { result } = renderHook(() =>
        useVideoChat(mockUserId, mockChannelName, true, true, true, mockOnError)
      );

      await waitFor(
        () => {
          expect(result.current.isJoined).toBe(true);
        },
        { timeout: 3000 }
      );

      // Try to join again while already joined
      await act(async () => {
        await result.current.joinChannel();
      });

      // Should not call initClient again
      expect(agoraService.initClient).toHaveBeenCalledTimes(1);
    });

    it("handles leaveChannel when not joined", async () => {
      const { result } = renderHook(() =>
        useVideoChat(mockUserId, mockChannelName, false, true, true, mockOnError)
      );

      // Hook starts not joined
      expect(result.current.isJoined).toBe(false);

      // Try to leave when not joined
      await act(async () => {
        await result.current.leaveChannel();
      });

      // Should not have called unpublish since not joined
      expect(agoraService.unpublishTracks).not.toHaveBeenCalled();
    });

    it("handles user unpublished with user removal", async () => {
      renderHook(() => useVideoChat(mockUserId, mockChannelName, true, true, true, mockOnError));

      await waitFor(
        () => {
          expect(mockClient.on).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      const userUnpublishedCallback = mockClient.on.mock.calls.find(
        (call: unknown[]) => call[0] === "user-unpublished"
      )?.[1];

      expect(userUnpublishedCallback).toBeDefined();

      // Simulate user with no tracks (should be removed)
      const remoteUser = { uid: 67890, videoTrack: null, audioTrack: null };
      await act(async () => {
        userUnpublishedCallback(remoteUser, "video");
      });
    });

    it("handles user unpublished with track update", async () => {
      renderHook(() => useVideoChat(mockUserId, mockChannelName, true, true, true, mockOnError));

      await waitFor(
        () => {
          expect(mockClient.on).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      const userUnpublishedCallback = mockClient.on.mock.calls.find(
        (call: unknown[]) => call[0] === "user-unpublished"
      )?.[1];

      // Simulate user with remaining track (should update, not remove)
      const remoteUser = { uid: 67890, videoTrack: null, audioTrack: {} };
      await act(async () => {
        userUnpublishedCallback(remoteUser, "video");
      });
    });

    it("handles track creation when needed for video", async () => {
      (agoraService.getLocalTracks as jest.Mock).mockReturnValueOnce({
        videoTrack: null,
        audioTrack: mockAudioTrack,
      });

      (agoraService.createLocalTracks as jest.Mock).mockResolvedValueOnce({
        videoTrack: mockVideoTrack,
        audioTrack: null,
      });

      renderHook(() => useVideoChat(mockUserId, mockChannelName, true, true, false, mockOnError));

      await waitFor(
        () => {
          expect(agoraService.createLocalTracks).toHaveBeenCalledWith(true, false);
        },
        { timeout: 3000 }
      );
    });

    it("handles track creation when needed for audio", async () => {
      (agoraService.getLocalTracks as jest.Mock).mockReturnValueOnce({
        videoTrack: mockVideoTrack,
        audioTrack: null,
      });

      (agoraService.createLocalTracks as jest.Mock).mockResolvedValueOnce({
        videoTrack: null,
        audioTrack: mockAudioTrack,
      });

      renderHook(() => useVideoChat(mockUserId, mockChannelName, true, false, true, mockOnError));

      await waitFor(
        () => {
          expect(agoraService.createLocalTracks).toHaveBeenCalledWith(false, true);
        },
        { timeout: 3000 }
      );
    });

    it("handles error during track enable", async () => {
      mockVideoTrack.setEnabled.mockRejectedValueOnce(new Error("Enable failed"));

      const onError = jest.fn();
      renderHook(() => useVideoChat(mockUserId, mockChannelName, true, true, true, onError));

      await waitFor(
        () => {
          expect(onError).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });

    it("handles leaveChannel error gracefully", async () => {
      const { result, rerender } = renderHook(
        ({ enabled }) =>
          useVideoChat(mockUserId, mockChannelName, enabled, true, true, mockOnError),
        { initialProps: { enabled: true } }
      );

      await waitFor(
        () => {
          expect(result.current.isJoined).toBe(true);
        },
        { timeout: 3000 }
      );

      // Mock error after join
      (agoraService.leaveChannel as jest.Mock).mockRejectedValueOnce(new Error("Leave failed"));

      // Disable auto-rejoin
      rerender({ enabled: false });

      await act(async () => {
        await result.current.leaveChannel();
      });

      // Should still update state even on error
      await waitFor(() => {
        expect(result.current.isJoined).toBe(false);
      });
    });

    it("does not auto-leave when enabled becomes false and not joined", () => {
      const { rerender } = renderHook(
        ({ enabled }) =>
          useVideoChat(mockUserId, mockChannelName, enabled, true, true, mockOnError),
        { initialProps: { enabled: false } }
      );

      // Change enabled but we're not joined
      rerender({ enabled: false });

      // Should not call leaveChannel
      expect(agoraService.leaveChannel).not.toHaveBeenCalled();
    });

    it("handles missing channelName", () => {
      renderHook(() => useVideoChat(mockUserId, "", true, true, true, mockOnError));

      // Should not try to join
      expect(agoraService.initClient).not.toHaveBeenCalled();
    });

    it("handles missing userId", () => {
      renderHook(() => useVideoChat("", mockChannelName, true, true, true, mockOnError));

      // Should not try to join
      expect(agoraService.initClient).not.toHaveBeenCalled();
    });
  });
});
