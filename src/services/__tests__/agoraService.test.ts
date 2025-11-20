import { agoraService } from "../agoraService";
import type { ICameraVideoTrack, IMicrophoneAudioTrack, IAgoraRTCClient } from "agora-rtc-sdk-ng";

interface MockTrack {
  setEnabled: jest.Mock;
  close: jest.Mock;
  stop: jest.Mock;
  enabled: boolean;
  trackMediaType: string;
}

interface MockClient {
  join: jest.Mock;
  leave: jest.Mock;
  publish: jest.Mock;
  unpublish: jest.Mock;
  on: jest.Mock;
  connectionState: string;
  remoteUsers: unknown[];
}

// Type assertion helper for test access to private properties
interface AgoraServiceWithPrivates {
  client: IAgoraRTCClient | MockClient | null;
  isJoined: boolean;
}

// This is an integration test to verify track publishing flow
describe("AgoraService Track Publishing Integration", () => {
  let mockClient: MockClient;
  let mockVideoTrack: MockTrack;
  let mockAudioTrack: MockTrack;
  let serviceWithPrivates: AgoraServiceWithPrivates;

  beforeEach(() => {
    // Create mock tracks
    mockVideoTrack = {
      setEnabled: jest.fn().mockResolvedValue(undefined),
      close: jest.fn(),
      stop: jest.fn(),
      enabled: true,
      trackMediaType: "video",
    };

    mockAudioTrack = {
      setEnabled: jest.fn().mockResolvedValue(undefined),
      close: jest.fn(),
      stop: jest.fn(),
      enabled: true,
      trackMediaType: "audio",
    };

    // Create mock client
    mockClient = {
      join: jest.fn().mockResolvedValue(12345),
      leave: jest.fn().mockResolvedValue(undefined),
      publish: jest.fn().mockResolvedValue(undefined),
      unpublish: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      connectionState: "CONNECTED",
      remoteUsers: [],
    };

    // Cast service to access private properties in tests
    serviceWithPrivates = agoraService as unknown as AgoraServiceWithPrivates;
  });

  describe("publishTracks", () => {
    it("should publish both video and audio tracks when available", async () => {
      // Set local tracks
      agoraService.setLocalTracks({
        videoTrack: mockVideoTrack as unknown as ICameraVideoTrack,
        audioTrack: mockAudioTrack as unknown as IMicrophoneAudioTrack,
      });

      // Mock client and isJoined state
      serviceWithPrivates.client = mockClient;
      serviceWithPrivates.isJoined = true;

      // Publish tracks
      await agoraService.publishTracks();

      // Verify both tracks were published
      expect(mockClient.publish).toHaveBeenCalledWith([mockVideoTrack, mockAudioTrack]);
    });

    it("should publish only video track when audio is not available", async () => {
      // Set only video track
      agoraService.setLocalTracks({
        videoTrack: mockVideoTrack as unknown as ICameraVideoTrack,
        audioTrack: null,
      });

      serviceWithPrivates.client = mockClient;
      serviceWithPrivates.isJoined = true;

      await agoraService.publishTracks();

      // Verify only video track was published
      expect(mockClient.publish).toHaveBeenCalledWith([mockVideoTrack]);
    });

    it("should publish only audio track when video is not available", async () => {
      // Set only audio track
      agoraService.setLocalTracks({
        videoTrack: null,
        audioTrack: mockAudioTrack as unknown as IMicrophoneAudioTrack,
      });

      serviceWithPrivates.client = mockClient;
      serviceWithPrivates.isJoined = true;

      await agoraService.publishTracks();

      // Verify only audio track was published
      expect(mockClient.publish).toHaveBeenCalledWith([mockAudioTrack]);
    });

    it("should not publish when no tracks are available", async () => {
      // Set no tracks
      agoraService.setLocalTracks({
        videoTrack: null,
        audioTrack: null,
      });

      serviceWithPrivates.client = mockClient;
      serviceWithPrivates.isJoined = true;

      await agoraService.publishTracks();

      // Verify publish was not called
      expect(mockClient.publish).not.toHaveBeenCalled();
    });

    it("should throw error when client is not ready", async () => {
      agoraService.setLocalTracks({
        videoTrack: mockVideoTrack as unknown as ICameraVideoTrack,
        audioTrack: mockAudioTrack as unknown as IMicrophoneAudioTrack,
      });

      serviceWithPrivates.client = null;

      await expect(agoraService.publishTracks()).rejects.toThrow("Connection not ready");
    });

    it("should throw error when not joined to channel", async () => {
      agoraService.setLocalTracks({
        videoTrack: mockVideoTrack as unknown as ICameraVideoTrack,
        audioTrack: mockAudioTrack as unknown as IMicrophoneAudioTrack,
      });

      serviceWithPrivates.client = mockClient;
      serviceWithPrivates.isJoined = false;

      await expect(agoraService.publishTracks()).rejects.toThrow("Not connected to session");
    });
  });

  describe("unpublishTracks", () => {
    it("should unpublish all tracks", async () => {
      agoraService.setLocalTracks({
        videoTrack: mockVideoTrack as unknown as ICameraVideoTrack,
        audioTrack: mockAudioTrack as unknown as IMicrophoneAudioTrack,
      });

      serviceWithPrivates.client = mockClient;

      await agoraService.unpublishTracks();

      expect(mockClient.unpublish).toHaveBeenCalledWith([mockVideoTrack, mockAudioTrack]);
    });
  });

  describe("leaveChannel", () => {
    it("should leave channel without closing tracks", async () => {
      agoraService.setLocalTracks({
        videoTrack: mockVideoTrack as unknown as ICameraVideoTrack,
        audioTrack: mockAudioTrack as unknown as IMicrophoneAudioTrack,
      });

      serviceWithPrivates.client = mockClient;
      serviceWithPrivates.isJoined = true;

      await agoraService.leaveChannel();

      // Verify leave was called
      expect(mockClient.leave).toHaveBeenCalled();

      // Verify tracks were NOT closed
      expect(mockVideoTrack.close).not.toHaveBeenCalled();
      expect(mockAudioTrack.close).not.toHaveBeenCalled();

      // Verify isJoined is false
      expect(agoraService.isChannelJoined()).toBe(false);
    });
  });

  describe("restoreTracksForPreview", () => {
    it("should re-enable all tracks for preview mode", async () => {
      agoraService.setLocalTracks({
        videoTrack: mockVideoTrack as unknown as ICameraVideoTrack,
        audioTrack: mockAudioTrack as unknown as IMicrophoneAudioTrack,
      });

      await agoraService.restoreTracksForPreview();

      // Verify both tracks were enabled
      expect(mockVideoTrack.setEnabled).toHaveBeenCalledWith(true);
      expect(mockAudioTrack.setEnabled).toHaveBeenCalledWith(true);
    });

    it("should handle missing tracks gracefully", async () => {
      agoraService.setLocalTracks({
        videoTrack: null,
        audioTrack: null,
      });

      // Should not throw
      await expect(agoraService.restoreTracksForPreview()).resolves.not.toThrow();
    });

    it("should handle track enable errors gracefully", async () => {
      mockVideoTrack.setEnabled.mockRejectedValueOnce(new Error("Enable failed"));

      agoraService.setLocalTracks({
        videoTrack: mockVideoTrack as unknown as ICameraVideoTrack,
        audioTrack: mockAudioTrack as unknown as IMicrophoneAudioTrack,
      });

      // Should not throw even if one track fails
      await expect(agoraService.restoreTracksForPreview()).resolves.not.toThrow();
    });
  });

  describe("Track Lifecycle", () => {
    it("should maintain tracks through join -> publish -> leave cycle", async () => {
      const tracks = {
        videoTrack: mockVideoTrack as unknown as ICameraVideoTrack,
        audioTrack: mockAudioTrack as unknown as IMicrophoneAudioTrack,
      };

      // Set tracks
      agoraService.setLocalTracks(tracks);

      // Simulate join
      serviceWithPrivates.client = mockClient;
      serviceWithPrivates.isJoined = true;

      // Publish
      await agoraService.publishTracks();
      expect(mockClient.publish).toHaveBeenCalled();

      // Leave
      await agoraService.leaveChannel();
      expect(mockClient.leave).toHaveBeenCalled();

      // Verify tracks still exist in service
      const currentTracks = agoraService.getLocalTracks();
      expect(currentTracks.videoTrack).toBe(mockVideoTrack);
      expect(currentTracks.audioTrack).toBe(mockAudioTrack);

      // Restore for preview
      await agoraService.restoreTracksForPreview();
      expect(mockVideoTrack.setEnabled).toHaveBeenCalledWith(true);
      expect(mockAudioTrack.setEnabled).toHaveBeenCalledWith(true);
    });
  });

  describe("Additional Coverage", () => {
    it("should return client from getClient", () => {
      serviceWithPrivates.client = mockClient;
      expect(agoraService.getClient()).toBe(mockClient);
    });

    it("should return null when no client exists", () => {
      serviceWithPrivates.client = null;
      expect(agoraService.getClient()).toBeNull();
    });

    it("should return correct join status", () => {
      serviceWithPrivates.isJoined = true;
      expect(agoraService.isChannelJoined()).toBe(true);

      serviceWithPrivates.isJoined = false;
      expect(agoraService.isChannelJoined()).toBe(false);
    });

    it("should handle joinChannel errors", async () => {
      serviceWithPrivates.client = mockClient;
      serviceWithPrivates.isJoined = false;

      mockClient.join.mockRejectedValueOnce(new Error("Join failed"));

      await expect(agoraService.joinChannel("test-channel", "token", 123)).rejects.toThrow(
        "Join failed"
      );
    });

    it("should throw error when joining without client", async () => {
      serviceWithPrivates.client = null;

      await expect(agoraService.joinChannel("test-channel", "token", 123)).rejects.toThrow(
        "Client not initialized"
      );
    });

    it("should throw error when already joined", async () => {
      serviceWithPrivates.client = mockClient;
      serviceWithPrivates.isJoined = true;

      await expect(agoraService.joinChannel("test-channel", "token", 123)).rejects.toThrow(
        "Already joined a channel"
      );
    });

    it("should return local video track", () => {
      agoraService.setLocalTracks({
        videoTrack: mockVideoTrack as unknown as ICameraVideoTrack,
        audioTrack: mockAudioTrack as unknown as IMicrophoneAudioTrack,
      });

      expect(agoraService.getLocalVideoTrack()).toBe(mockVideoTrack);
    });

    it("should return local audio track", () => {
      agoraService.setLocalTracks({
        videoTrack: mockVideoTrack as unknown as ICameraVideoTrack,
        audioTrack: mockAudioTrack as unknown as IMicrophoneAudioTrack,
      });

      expect(agoraService.getLocalAudioTrack()).toBe(mockAudioTrack);
    });

    it("should throw error when unpublishing with no client", async () => {
      serviceWithPrivates.client = null;

      await expect(agoraService.unpublishTracks()).rejects.toThrow("Connection not ready");
    });

    it("should handle unpublish with no tracks gracefully", async () => {
      serviceWithPrivates.client = mockClient;
      agoraService.setLocalTracks({
        videoTrack: null,
        audioTrack: null,
      });

      await agoraService.unpublishTracks();
      expect(mockClient.unpublish).not.toHaveBeenCalled();
    });

    it("should leave channel even when isJoined is false", async () => {
      serviceWithPrivates.client = mockClient;
      serviceWithPrivates.isJoined = false;

      await agoraService.leaveChannel();
      // Leave is still called, Agora handles the state
      expect(mockClient.leave).toHaveBeenCalled();
    });

    it("should handle leave with no client", async () => {
      serviceWithPrivates.client = null;
      serviceWithPrivates.isJoined = true;

      await expect(agoraService.leaveChannel()).resolves.not.toThrow();
    });
  });
});
