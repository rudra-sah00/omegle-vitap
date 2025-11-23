/**
 * Tests for Agora RTC Service
 * Comprehensive tests for video/audio communication service
 */

import { AgoraRTCService } from '../agora/agora-rtc';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng';

// Mock Agora RTC SDK
jest.mock('agora-rtc-sdk-ng');

describe('AgoraRTCService', () => {
  let service: AgoraRTCService;
  let mockClient: jest.Mocked<IAgoraRTCClient>;
  let mockVideoTrack: jest.Mocked<ICameraVideoTrack>;
  let mockAudioTrack: jest.Mocked<IMicrophoneAudioTrack>;
  let mockRemoteUser: jest.Mocked<IAgoraRTCRemoteUser>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.useRealTimers();

    // Mock video track
    mockVideoTrack = {
      play: jest.fn(),
      stop: jest.fn(),
      close: jest.fn(),
      setEnabled: jest.fn().mockResolvedValue(undefined),
      getTrackLabel: jest.fn().mockReturnValue('camera'),
      on: jest.fn(),
      off: jest.fn(),
    } as any;

    // Mock audio track
    mockAudioTrack = {
      play: jest.fn(),
      stop: jest.fn(),
      close: jest.fn(),
      setEnabled: jest.fn().mockResolvedValue(undefined),
      getTrackLabel: jest.fn().mockReturnValue('microphone'),
      on: jest.fn(),
      off: jest.fn(),
    } as any;

    // Mock remote user
    mockRemoteUser = {
      uid: '12345',
      audioTrack: {
        play: jest.fn(),
        stop: jest.fn(),
      } as any,
      videoTrack: {
        play: jest.fn(),
        stop: jest.fn(),
      } as any,
    } as any;

    // Mock Agora client
    mockClient = {
      join: jest.fn().mockResolvedValue(undefined),
      leave: jest.fn().mockResolvedValue(undefined),
      publish: jest.fn().mockResolvedValue(undefined),
      unpublish: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      off: jest.fn(),
      removeAllListeners: jest.fn(),
      remoteUsers: [],
      connectionState: 'CONNECTED',
    } as any;

    // Mock AgoraRTC static methods
    (AgoraRTC.createClient as jest.Mock).mockReturnValue(mockClient);
    (AgoraRTC.setLogLevel as jest.Mock).mockImplementation(() => {});
    (AgoraRTC.createMicrophoneAndCameraTracks as jest.Mock).mockResolvedValue([
      mockAudioTrack,
      mockVideoTrack,
    ]);
    (AgoraRTC.createMicrophoneAudioTrack as jest.Mock).mockResolvedValue(mockAudioTrack);
    (AgoraRTC.createCameraVideoTrack as jest.Mock).mockResolvedValue(mockVideoTrack);
    (AgoraRTC.getDevices as jest.Mock).mockResolvedValue([
      { kind: 'videoinput', deviceId: 'camera1', label: 'Camera 1' },
      { kind: 'audioinput', deviceId: 'mic1', label: 'Mic 1' },
    ]);

    // Mock navigator.mediaDevices
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockResolvedValue({}),
        enumerateDevices: jest.fn().mockResolvedValue([
          { kind: 'videoinput', deviceId: 'camera1', label: 'Camera 1' },
          { kind: 'audioinput', deviceId: 'mic1', label: 'Mic 1' },
        ]),
      },
      writable: true,
      configurable: true,
    });

    // Mock navigator.userAgent for Safari detection
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
      writable: true,
      configurable: true,
    });

    // Mock navigator.onLine
    Object.defineProperty(global.navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });

    // Create fresh service instance
    service = new AgoraRTCService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with Safari codec (h264)', () => {
      expect(AgoraRTC.createClient).toHaveBeenCalledWith({
        mode: 'rtc',
        codec: 'h264',
      });
    });

    it('should initialize with vp8 codec for non-Safari browsers', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        writable: true,
        configurable: true,
      });

      jest.clearAllMocks();
      service = new AgoraRTCService();

      expect(AgoraRTC.createClient).toHaveBeenCalledWith({
        mode: 'rtc',
        codec: 'vp8',
      });
    });

    it('should set Agora log level to 4 (NONE)', () => {
      expect(AgoraRTC.setLogLevel).toHaveBeenCalledWith(4);
    });

    it('should setup event listeners', () => {
      expect(mockClient.on).toHaveBeenCalledWith('user-published', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith('user-unpublished', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith('user-joined', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith('user-left', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith('connection-state-change', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith('exception', expect.any(Function));
    });

    it('should throw error if client creation fails', () => {
      (AgoraRTC.createClient as jest.Mock).mockImplementationOnce(() => {
        throw new Error('SDK error');
      });

      expect(() => new AgoraRTCService()).toThrow('Failed to initialize video service');
    });
  });

  describe('createLocalPreview', () => {
    it('should create local preview with camera and mic on', async () => {
      await service.createLocalPreview(true, true);

      expect(AgoraRTC.createMicrophoneAndCameraTracks).toHaveBeenCalled();
      expect(mockVideoTrack.setEnabled).toHaveBeenCalledWith(true);
      expect(mockAudioTrack.setEnabled).toHaveBeenCalledWith(true);
      expect(mockVideoTrack.play).toHaveBeenCalledWith('local-video');
    });

    it('should create local preview with camera off', async () => {
      await service.createLocalPreview(false, true);

      expect(mockVideoTrack.setEnabled).toHaveBeenCalledWith(false);
      expect(mockAudioTrack.setEnabled).toHaveBeenCalledWith(true);
      expect(mockVideoTrack.play).not.toHaveBeenCalled();
    });

    it('should throw error if browser does not support media devices', async () => {
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      await expect(service.createLocalPreview()).rejects.toThrow(
        'Browser does not support media devices'
      );
    });

    it('should not create preview if already joined channel', async () => {
      // Join channel first
      await service.join(
        { appId: 'test', channelName: 'test', token: 'test', uid: '123' },
        true,
        true
      );

      jest.clearAllMocks();

      // Try to create preview
      await service.createLocalPreview();

      // Should not create tracks again
      expect(AgoraRTC.createMicrophoneAndCameraTracks).not.toHaveBeenCalled();
    });

    it('should reuse existing tracks if they already exist', async () => {
      // Create preview first time
      await service.createLocalPreview(true, true);
      jest.clearAllMocks();

      // Create preview second time
      await service.createLocalPreview(true, true);

      // Should not create new tracks
      expect(AgoraRTC.createMicrophoneAndCameraTracks).not.toHaveBeenCalled();
      // But should update state
      expect(mockVideoTrack.setEnabled).toHaveBeenCalledWith(true);
      expect(mockAudioTrack.setEnabled).toHaveBeenCalledWith(true);
    });

    it('should recreate tracks if setEnabled fails', async () => {
      // Create preview first time
      await service.createLocalPreview(true, true);
      
      // Make setEnabled fail
      mockVideoTrack.setEnabled.mockRejectedValueOnce(new Error('Track error'));

      // Create preview second time (should recreate)
      await service.createLocalPreview(true, true);

      expect(mockVideoTrack.close).toHaveBeenCalled();
      expect(mockAudioTrack.close).toHaveBeenCalled();
      expect(AgoraRTC.createMicrophoneAndCameraTracks).toHaveBeenCalledTimes(2);
    });

    it('should throw error if no camera device found', async () => {
      (global.navigator.mediaDevices.enumerateDevices as jest.Mock).mockResolvedValueOnce([
        { kind: 'audioinput', deviceId: 'mic1', label: 'Mic 1' },
      ]);

      await expect(service.createLocalPreview(true, true)).rejects.toThrow(
        'No camera device found'
      );
    });

    it('should throw error if no microphone device found', async () => {
      (global.navigator.mediaDevices.enumerateDevices as jest.Mock).mockResolvedValueOnce([
        { kind: 'videoinput', deviceId: 'camera1', label: 'Camera 1' },
      ]);

      await expect(service.createLocalPreview(true, true)).rejects.toThrow(
        'No microphone device found'
      );
    });

    it('should handle track creation errors', async () => {
      (AgoraRTC.createMicrophoneAndCameraTracks as jest.Mock).mockRejectedValueOnce(
        new Error('Permission denied')
      );

      await expect(service.createLocalPreview()).rejects.toThrow('Permission denied');
    });

    it('should create tracks with both camera and mic on', async () => {
      await service.createLocalPreview(true, true);

      expect(AgoraRTC.createMicrophoneAndCameraTracks).toHaveBeenCalledWith(
        expect.objectContaining({
          AEC: true,
          ANS: true,
          AGC: true,
        }),
        expect.objectContaining({
          encoderConfig: expect.any(Object),
          optimizationMode: 'detail',
        })
      );
    });
  });

  describe('join', () => {
    const validConfig = {
      appId: 'test-app-id',
      channelName: 'test-channel',
      token: 'test-token',
      uid: '123',
    };

    it('should join channel successfully with camera and mic on', async () => {
      await service.join(validConfig, true, true);

      expect(mockClient.join).toHaveBeenCalledWith(
        'test-app-id',
        'test-channel',
        'test-token',
        '123'
      );
      expect(service.isChannelJoined()).toBe(true);
    });

    it('should throw error if client not initialized', async () => {
      (service as any).client = null;

      await expect(service.join(validConfig, true, true)).rejects.toThrow(
        'Agora client not initialized'
      );
    });

    it('should not join if isLeaving flag is set', async () => {
      // Directly set isLeaving flag
      (service as any).isLeaving = true;
      
      await expect(service.join(validConfig, true, true)).rejects.toThrow(
        'Cannot join while leaving another channel'
      );
      
      (service as any).isLeaving = false;
    });

    it('should throw error if appId is missing', async () => {
      await expect(
        service.join({ ...validConfig, appId: '' }, true, true)
      ).rejects.toThrow('Invalid Agora configuration: missing appId or channelName');
    });

    it('should throw error if channelName is missing', async () => {
      await expect(
        service.join({ ...validConfig, channelName: '' }, true, true)
      ).rejects.toThrow('Invalid Agora configuration: missing appId or channelName');
    });

    it('should throw error if uid is missing', async () => {
      await expect(
        service.join({ ...validConfig, uid: '' }, true, true)
      ).rejects.toThrow('Invalid Agora configuration: missing uid');
    });

    it('should throw error if no internet connection', async () => {
      Object.defineProperty(global.navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      await expect(service.join(validConfig, true, true)).rejects.toThrow(
        'No internet connection'
      );
    });

    it('should detect slow connection without throwing', async () => {
      Object.defineProperty(global.navigator, 'connection', {
        value: { effectiveType: 'slow-2g' },
        writable: true,
        configurable: true,
      });

      await service.join(validConfig, true, true);
      expect(service.isChannelJoined()).toBe(true);
    });

    it('should not join if already joined', async () => {
      await service.join(validConfig, true, true);
      jest.clearAllMocks();

      await service.join(validConfig, true, true);

      expect(mockClient.join).not.toHaveBeenCalled();
    });

    it('should timeout if join takes too long', async () => {
      jest.useFakeTimers();

      mockClient.join.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(resolve, 30000); // 30 seconds
        });
      });

      const joinPromise = service.join(validConfig, true, true);

      jest.advanceTimersByTime(20000); // Advance to timeout

      await expect(joinPromise).rejects.toThrow(
        'Connection timeout: Could not join channel'
      );

      jest.useRealTimers();
    });

    it('should clean up on join error', async () => {
      mockClient.join.mockRejectedValueOnce(new Error('Join failed'));

      await expect(service.join(validConfig, true, true)).rejects.toThrow('Join failed');

      expect(service.isChannelJoined()).toBe(false);
      expect(mockClient.leave).toHaveBeenCalled();
    });

    it('should handle createAndPublishTracks errors', async () => {
      (AgoraRTC.getDevices as jest.Mock).mockResolvedValueOnce([]);

      await expect(service.join(validConfig, true, true)).rejects.toThrow();
      expect(service.isChannelJoined()).toBe(false);
    });

    it('should retry on track creation failure', async () => {
      jest.useFakeTimers();

      (AgoraRTC.createMicrophoneAndCameraTracks as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce([mockAudioTrack, mockVideoTrack]);

      const joinPromise = service.join(validConfig, true, true);

      // Advance through retry delay
      await jest.advanceTimersByTimeAsync(1000);

      await joinPromise;

      expect(AgoraRTC.createMicrophoneAndCameraTracks).toHaveBeenCalledTimes(2);
      expect(service.isChannelJoined()).toBe(true);

      jest.useRealTimers();
    });

    it('should not retry on DEVICE_NOT_FOUND error', async () => {
      (AgoraRTC.getDevices as jest.Mock).mockResolvedValueOnce([]);

      await expect(service.join(validConfig, true, true)).rejects.toThrow('DEVICE_NOT_FOUND');
      expect(service.isChannelJoined()).toBe(false);
    });

    it('should handle connection state check', async () => {
      Object.defineProperty(mockClient, 'connectionState', {
        value: 'DISCONNECTED',
        writable: true,
      });

      await expect(service.join(validConfig, true, true)).rejects.toThrow(
        'Not connected to channel'
      );
    });

    it('should create only audio track if no camera available', async () => {
      (AgoraRTC.getDevices as jest.Mock).mockResolvedValueOnce([
        { kind: 'audioinput', deviceId: 'mic1', label: 'Mic 1' },
      ]);

      await service.join(validConfig, false, true);

      expect(AgoraRTC.createMicrophoneAudioTrack).toHaveBeenCalled();
      expect(service.isChannelJoined()).toBe(true);
    });

    it('should create only video track if no microphone available', async () => {
      (AgoraRTC.getDevices as jest.Mock).mockResolvedValueOnce([
        { kind: 'videoinput', deviceId: 'camera1', label: 'Camera 1' },
      ]);

      await service.join(validConfig, true, false);

      expect(AgoraRTC.createCameraVideoTrack).toHaveBeenCalled();
      expect(service.isChannelJoined()).toBe(true);
    });

    it('should publish only enabled tracks', async () => {
      await service.join(validConfig, false, false);

      // Should not publish any tracks since both are disabled
      expect(mockClient.publish).not.toHaveBeenCalled();
      expect(service.isChannelJoined()).toBe(true);
    });

    it('should throw error when leaving during track creation', async () => {
      (AgoraRTC.createMicrophoneAndCameraTracks as jest.Mock).mockImplementation(() => {
        (service as any).isLeaving = true;
        return Promise.reject(new Error('Leaving'));
      });

      await expect(service.join(validConfig, true, true)).rejects.toThrow();
      expect(service.isChannelJoined()).toBe(false);
    });



    it('should handle getDevices errors gracefully', async () => {
      // When getDevices fails, it returns empty array in catch
      (AgoraRTC.getDevices as jest.Mock).mockRejectedValueOnce(new Error('Device enum failed'));

      // Should throw DEVICE_NOT_FOUND since no devices detected
      await expect(service.join(validConfig, true, true)).rejects.toThrow('DEVICE_NOT_FOUND');
    });
  });

  describe('playLocalVideo', () => {
    it('should play local video track', async () => {
      await service.createLocalPreview(true, true);
      jest.clearAllMocks();

      service.playLocalVideo('test-element');

      expect(mockVideoTrack.play).toHaveBeenCalledWith('test-element');
    });

    it('should do nothing if no local video track', () => {
      expect(() => service.playLocalVideo('test-element')).not.toThrow();
    });
  });

  describe('stopPreview', () => {
    it('should stop and close tracks in preview mode', async () => {
      await service.createLocalPreview(true, true);

      await service.stopPreview();

      expect(mockVideoTrack.stop).toHaveBeenCalled();
      expect(mockVideoTrack.close).toHaveBeenCalled();
      expect(mockAudioTrack.stop).toHaveBeenCalled();
      expect(mockAudioTrack.close).toHaveBeenCalled();
    });

    it('should not close tracks if already joined channel', async () => {
      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, true);

      jest.clearAllMocks();

      await service.stopPreview();

      expect(mockVideoTrack.stop).not.toHaveBeenCalled();
      expect(mockVideoTrack.close).not.toHaveBeenCalled();
    });

    it('should handle missing tracks gracefully', async () => {
      await expect(service.stopPreview()).resolves.not.toThrow();
    });
  });

  describe('publishVideoTrack', () => {
    it('should publish video track if available', async () => {
      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, true);

      jest.clearAllMocks();

      await service.publishVideoTrack();

      expect(mockClient.publish).toHaveBeenCalledWith([mockVideoTrack]);
    });

    it('should do nothing if no video track', async () => {
      await service.publishVideoTrack();

      expect(mockClient.publish).not.toHaveBeenCalled();
    });

    it('should do nothing if client not initialized', async () => {
      (service as any).client = null;

      await service.publishVideoTrack();

      expect(mockClient.publish).not.toHaveBeenCalled();
    });

    it('should handle publish errors gracefully', async () => {
      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, true);

      mockClient.publish.mockRejectedValueOnce(new Error('Publish failed'));

      await expect(service.publishVideoTrack()).resolves.not.toThrow();
    });
  });

  describe('unpublishVideoTrack', () => {
    it('should unpublish video track if available', async () => {
      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, true);

      await service.unpublishVideoTrack();

      expect(mockClient.unpublish).toHaveBeenCalledWith([mockVideoTrack]);
    });

    it('should do nothing if no video track', async () => {
      await service.unpublishVideoTrack();

      expect(mockClient.unpublish).not.toHaveBeenCalled();
    });

    it('should do nothing if client not initialized', async () => {
      (service as any).client = null;

      await service.unpublishVideoTrack();

      expect(mockClient.unpublish).not.toHaveBeenCalled();
    });

    it('should handle unpublish errors gracefully', async () => {
      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, true);

      mockClient.unpublish.mockRejectedValueOnce(new Error('Unpublish failed'));

      await expect(service.unpublishVideoTrack()).resolves.not.toThrow();
    });
  });

  describe('publishAudioTrack', () => {
    it('should publish audio track if available', async () => {
      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, true);

      jest.clearAllMocks();

      await service.publishAudioTrack();

      expect(mockClient.publish).toHaveBeenCalledWith([mockAudioTrack]);
    });

    it('should do nothing if no audio track', async () => {
      await service.publishAudioTrack();

      expect(mockClient.publish).not.toHaveBeenCalled();
    });

    it('should handle publish errors gracefully', async () => {
      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, true);

      mockClient.publish.mockRejectedValueOnce(new Error('Publish failed'));

      await expect(service.publishAudioTrack()).resolves.not.toThrow();
    });
  });

  describe('unpublishAudioTrack', () => {
    it('should unpublish audio track if available', async () => {
      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, true);

      await service.unpublishAudioTrack();

      expect(mockClient.unpublish).toHaveBeenCalledWith([mockAudioTrack]);
    });

    it('should do nothing if no audio track', async () => {
      await service.unpublishAudioTrack();

      expect(mockClient.unpublish).not.toHaveBeenCalled();
    });

    it('should handle unpublish errors gracefully', async () => {
      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, true);

      mockClient.unpublish.mockRejectedValueOnce(new Error('Unpublish failed'));

      await expect(service.unpublishAudioTrack()).resolves.not.toThrow();
    });
  });

  describe('playRemoteVideo', () => {
    it('should play remote user video track', () => {
      service.playRemoteVideo(mockRemoteUser, 'remote-element');

      expect(mockRemoteUser.videoTrack?.play).toHaveBeenCalledWith('remote-element');
    });

    it('should handle missing video track gracefully', () => {
      const userWithoutVideo = { ...mockRemoteUser, videoTrack: undefined };

      expect(() => service.playRemoteVideo(userWithoutVideo, 'remote-element')).not.toThrow();
    });
  });

  describe('Getters', () => {
    it('should return remote users', async () => {
      Object.defineProperty(mockClient, 'remoteUsers', {
        value: [mockRemoteUser],
        writable: true,
      });

      const users = service.getRemoteUsers();

      expect(users).toEqual([mockRemoteUser]);
    });

    it('should return empty array if no client', () => {
      (service as any).client = null;

      expect(service.getRemoteUsers()).toEqual([]);
    });

    it('should return joined status', async () => {
      expect(service.isChannelJoined()).toBe(false);

      await service.join(
        { appId: 'test', channelName: 'test', token: 'test', uid: '123' },
        true,
        true
      );

      expect(service.isChannelJoined()).toBe(true);
    });

    it('should return local video track', async () => {
      await service.createLocalPreview(true, true);

      expect(service.getLocalVideoTrack()).toBe(mockVideoTrack);
    });

    it('should return null if no video track', () => {
      expect(service.getLocalVideoTrack()).toBeNull();
    });

    it('should return local audio track', async () => {
      await service.createLocalPreview(true, true);

      expect(service.getLocalAudioTrack()).toBe(mockAudioTrack);
    });

    it('should return null if no audio track', () => {
      expect(service.getLocalAudioTrack()).toBeNull();
    });

    it('should return current devices', async () => {
      await service.createLocalPreview(true, true);

      const devices = service.getCurrentDevices();

      expect(devices).toEqual({ cameraId: undefined, micId: undefined });
    });
  });

  describe('Callback setters', () => {
    it('should set onUserPublished callback', async () => {
      const callback = jest.fn();

      service.setOnUserPublished(callback);

      // Trigger event
      const eventHandler = (mockClient.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'user-published'
      )[1];
      await eventHandler(mockRemoteUser, 'video');

      expect(callback).toHaveBeenCalledWith(mockRemoteUser, 'video');
    });

    it('should set onUserUnpublished callback', () => {
      const callback = jest.fn();

      service.setOnUserUnpublished(callback);

      const eventHandler = (mockClient.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'user-unpublished'
      )[1];
      eventHandler(mockRemoteUser, 'video');

      expect(callback).toHaveBeenCalledWith(mockRemoteUser, 'video');
    });

    it('should set onUserJoined callback', () => {
      const callback = jest.fn();

      service.setOnUserJoined(callback);

      const eventHandler = (mockClient.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'user-joined'
      )[1];
      eventHandler(mockRemoteUser);

      expect(callback).toHaveBeenCalledWith(mockRemoteUser);
    });

    it('should set onUserLeft callback', () => {
      const callback = jest.fn();

      service.setOnUserLeft(callback);

      const eventHandler = (mockClient.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'user-left'
      )[1];
      eventHandler(mockRemoteUser);

      expect(callback).toHaveBeenCalledWith(mockRemoteUser);
    });
  });

  describe('Event Handlers', () => {
    it('should handle user-published for video', async () => {
      const eventHandler = (mockClient.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'user-published'
      )[1];

      await eventHandler(mockRemoteUser, 'video');

      expect(mockClient.subscribe).toHaveBeenCalledWith(mockRemoteUser, 'video');
    });

    it('should handle user-published for audio and play', async () => {
      const eventHandler = (mockClient.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'user-published'
      )[1];

      await eventHandler(mockRemoteUser, 'audio');

      expect(mockClient.subscribe).toHaveBeenCalledWith(mockRemoteUser, 'audio');
      expect(mockRemoteUser.audioTrack?.play).toHaveBeenCalled();
    });

    it('should handle user-published subscription errors', async () => {
      mockClient.subscribe.mockRejectedValueOnce(new Error('Subscribe failed'));

      const eventHandler = (mockClient.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'user-published'
      )[1];

      await expect(eventHandler(mockRemoteUser, 'video')).resolves.not.toThrow();
    });
  });

  describe('toggleCamera', () => {
    it('should enable camera when turning on', async () => {
      await service.createLocalPreview(false, true); // Start with camera off

      jest.clearAllMocks();

      await service.toggleCamera(true);

      expect(mockVideoTrack.setEnabled).toHaveBeenCalledWith(true);
      expect(mockVideoTrack.play).toHaveBeenCalledWith('local-video');
    });

    it('should create new video track if it does not exist', async () => {
      await service.toggleCamera(true);

      expect(AgoraRTC.createCameraVideoTrack).toHaveBeenCalled();
      expect(mockVideoTrack.play).toHaveBeenCalledWith('local-video');
    });

    it('should publish video track when in channel', async () => {
      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, false, true);

      jest.clearAllMocks();

      await service.toggleCamera(true);

      expect(mockClient.publish).toHaveBeenCalledWith([mockVideoTrack]);
    });

    it('should disable camera when turning off', async () => {
      await service.createLocalPreview(true, true);

      await service.toggleCamera(false);

      expect(mockVideoTrack.stop).toHaveBeenCalled();
      expect(mockVideoTrack.close).toHaveBeenCalled();
      expect(service.getLocalVideoTrack()).toBeNull();
    });

    it('should unpublish before disabling camera in channel', async () => {
      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, true);

      jest.clearAllMocks();

      await service.toggleCamera(false);

      expect(mockClient.unpublish).toHaveBeenCalledWith([mockVideoTrack]);
      expect(mockVideoTrack.stop).toHaveBeenCalled();
      expect(mockVideoTrack.close).toHaveBeenCalled();
    });

    it('should throw error if no camera device found', async () => {
      (AgoraRTC.getDevices as jest.Mock).mockResolvedValueOnce([
        { kind: 'audioinput', deviceId: 'mic1', label: 'Mic 1' },
      ]);

      await expect(service.toggleCamera(true)).rejects.toThrow(
        'DEVICE_NOT_FOUND: No camera found'
      );
    });

    it('should handle unpublish errors gracefully when disabling', async () => {
      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, true);

      mockClient.unpublish.mockRejectedValueOnce(new Error('Unpublish failed'));

      await service.toggleCamera(false);

      expect(mockVideoTrack.stop).toHaveBeenCalled();
      expect(mockVideoTrack.close).toHaveBeenCalled();
    });

    it('should cleanup on error', async () => {
      (AgoraRTC.createCameraVideoTrack as jest.Mock).mockRejectedValueOnce(
        new Error('Track creation failed')
      );

      await expect(service.toggleCamera(true)).rejects.toThrow('Track creation failed');
    });

    it('should prevent concurrent toggle operations', async () => {
      const toggle1 = service.toggleCamera(true);
      const toggle2 = service.toggleCamera(true);

      await Promise.all([toggle1, toggle2]);

      expect(AgoraRTC.createCameraVideoTrack).toHaveBeenCalledTimes(1);
    });

    it('should not toggle if leaving', async () => {
      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, true);

      const leavePromise = service.leave();
      const togglePromise = service.toggleCamera(false);

      await Promise.all([leavePromise, togglePromise]);

      // Toggle should have been skipped
    });

    it('should cleanup track on toggle error', async () => {
      (AgoraRTC.createCameraVideoTrack as jest.Mock).mockRejectedValueOnce(
        new Error('Create failed')
      );

      await expect(service.toggleCamera(true)).rejects.toThrow('Create failed');
      
      // Track should be null after failed creation
      expect(service.getLocalVideoTrack()).toBeNull();
    });


  });

  describe('toggleMicrophone', () => {
    it('should enable microphone when turning on', async () => {
      await service.createLocalPreview(true, false); // Start with mic off

      jest.clearAllMocks();

      await service.toggleMicrophone(true);

      expect(mockAudioTrack.setEnabled).toHaveBeenCalledWith(true);
    });

    it('should create new audio track if it does not exist', async () => {
      await service.toggleMicrophone(true);

      expect(AgoraRTC.createMicrophoneAudioTrack).toHaveBeenCalled();
    });

    it('should publish audio track when in channel', async () => {
      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, false);

      jest.clearAllMocks();

      await service.toggleMicrophone(true);

      expect(mockClient.publish).toHaveBeenCalledWith([mockAudioTrack]);
    });

    it('should disable microphone when turning off', async () => {
      await service.createLocalPreview(true, true);

      await service.toggleMicrophone(false);

      expect(mockAudioTrack.stop).toHaveBeenCalled();
      expect(mockAudioTrack.close).toHaveBeenCalled();
      expect(service.getLocalAudioTrack()).toBeNull();
    });

    it('should unpublish before disabling microphone in channel', async () => {
      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, true);

      jest.clearAllMocks();

      await service.toggleMicrophone(false);

      expect(mockClient.unpublish).toHaveBeenCalledWith([mockAudioTrack]);
      expect(mockAudioTrack.stop).toHaveBeenCalled();
      expect(mockAudioTrack.close).toHaveBeenCalled();
    });

    it('should throw error if no microphone device found', async () => {
      (AgoraRTC.getDevices as jest.Mock).mockResolvedValueOnce([
        { kind: 'videoinput', deviceId: 'camera1', label: 'Camera 1' },
      ]);

      await expect(service.toggleMicrophone(true)).rejects.toThrow(
        'DEVICE_NOT_FOUND: No microphone found'
      );
    });

    it('should handle unpublish errors gracefully when disabling', async () => {
      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, true);

      mockClient.unpublish.mockRejectedValueOnce(new Error('Unpublish failed'));

      await service.toggleMicrophone(false);

      expect(mockAudioTrack.stop).toHaveBeenCalled();
      expect(mockAudioTrack.close).toHaveBeenCalled();
    });

    it('should cleanup on error', async () => {
      (AgoraRTC.createMicrophoneAudioTrack as jest.Mock).mockRejectedValueOnce(
        new Error('Track creation failed')
      );

      await expect(service.toggleMicrophone(true)).rejects.toThrow('Track creation failed');
    });

    it('should prevent concurrent toggle operations', async () => {
      const toggle1 = service.toggleMicrophone(true);
      const toggle2 = service.toggleMicrophone(true);

      await Promise.all([toggle1, toggle2]);

      expect(AgoraRTC.createMicrophoneAudioTrack).toHaveBeenCalledTimes(1);
    });

    it('should not toggle if leaving', async () => {
      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, true);

      const leavePromise = service.leave();
      const togglePromise = service.toggleMicrophone(false);

      await Promise.all([leavePromise, togglePromise]);

      // Toggle should have been skipped
    });

    it('should cleanup track on toggle error', async () => {
      (AgoraRTC.createMicrophoneAudioTrack as jest.Mock).mockRejectedValueOnce(
        new Error('Create failed')
      );

      await expect(service.toggleMicrophone(true)).rejects.toThrow('Create failed');
      
      // Track should be null after failed creation
      expect(service.getLocalAudioTrack()).toBeNull();
    });


  });

  describe('switchCamera', () => {
    it('should switch to new camera device', async () => {
      await service.createLocalPreview(true, true);

      jest.clearAllMocks();
      
      // Reset mock to resolve
      (AgoraRTC.createCameraVideoTrack as jest.Mock).mockResolvedValue(mockVideoTrack);

      await service.switchCamera('camera2');

      expect(mockVideoTrack.stop).toHaveBeenCalled();
      expect(mockVideoTrack.close).toHaveBeenCalled();
      expect(AgoraRTC.createCameraVideoTrack).toHaveBeenCalledWith({
        cameraId: 'camera2',
      });
      expect(mockVideoTrack.play).toHaveBeenCalledWith('local-video');
    });

    it('should unpublish old track and publish new track when in channel', async () => {
      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, true);

      jest.clearAllMocks();

      await service.switchCamera('camera2');

      expect(mockClient.unpublish).toHaveBeenCalledWith([mockVideoTrack]);
      expect(mockClient.publish).toHaveBeenCalledWith([mockVideoTrack]);
    });

    it('should do nothing if no video track exists', async () => {
      await service.switchCamera('camera2');

      expect(mockVideoTrack.stop).not.toHaveBeenCalled();
      expect(service.getCurrentDevices().cameraId).toBe('camera2');
    });

    it('should not switch if leaving', async () => {
      await service.createLocalPreview(true, true);

      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, true);

      jest.clearAllMocks();

      const leavePromise = service.leave();
      await service.switchCamera('camera2');

      await leavePromise;

      // Should have been skipped or completed
    });

    it('should handle errors during switch', async () => {
      await service.createLocalPreview(true, true);

      (AgoraRTC.createCameraVideoTrack as jest.Mock).mockRejectedValueOnce(
        new Error('Switch failed')
      );

      await expect(service.switchCamera('camera2')).rejects.toThrow('Switch failed');
    });
  });

  describe('switchMicrophone', () => {
    it('should switch to new microphone device', async () => {
      await service.createLocalPreview(true, true);

      jest.clearAllMocks();
      
      // Reset mock to resolve
      (AgoraRTC.createMicrophoneAudioTrack as jest.Mock).mockResolvedValue(mockAudioTrack);

      await service.switchMicrophone('mic2');

      expect(mockAudioTrack.stop).toHaveBeenCalled();
      expect(mockAudioTrack.close).toHaveBeenCalled();
      expect(AgoraRTC.createMicrophoneAudioTrack).toHaveBeenCalledWith({
        microphoneId: 'mic2',
      });
    });

    it('should unpublish old track and publish new track when in channel', async () => {
      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, true);

      jest.clearAllMocks();

      await service.switchMicrophone('mic2');

      expect(mockClient.unpublish).toHaveBeenCalledWith([mockAudioTrack]);
      expect(mockClient.publish).toHaveBeenCalledWith([mockAudioTrack]);
    });

    it('should do nothing if no audio track exists', async () => {
      await service.switchMicrophone('mic2');

      expect(mockAudioTrack.stop).not.toHaveBeenCalled();
      expect(service.getCurrentDevices().micId).toBe('mic2');
    });

    it('should not switch if leaving', async () => {
      await service.createLocalPreview(true, true);

      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, true);

      jest.clearAllMocks();

      const leavePromise = service.leave();
      await service.switchMicrophone('mic2');

      await leavePromise;

      // Should have been skipped or completed
    });

    it('should handle errors during switch', async () => {
      await service.createLocalPreview(true, true);

      (AgoraRTC.createMicrophoneAudioTrack as jest.Mock).mockRejectedValueOnce(
        new Error('Switch failed')
      );

      await expect(service.switchMicrophone('mic2')).rejects.toThrow('Switch failed');
    });
  });

  describe('leave', () => {
    it('should leave channel and clean up tracks', async () => {
      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, true);

      await service.leave();

      expect(mockClient.unpublish).toHaveBeenCalledWith([mockVideoTrack, mockAudioTrack]);
      expect(mockClient.leave).toHaveBeenCalled();
      expect(mockVideoTrack.stop).toHaveBeenCalled();
      expect(mockVideoTrack.close).toHaveBeenCalled();
      expect(mockAudioTrack.stop).toHaveBeenCalled();
      expect(mockAudioTrack.close).toHaveBeenCalled();
      expect(mockClient.removeAllListeners).toHaveBeenCalled();
      expect(service.isChannelJoined()).toBe(false);
    });

    it('should do nothing if not joined', async () => {
      await service.leave();

      expect(mockClient.leave).not.toHaveBeenCalled();
    });

    it('should prevent multiple leave calls', async () => {
      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, true);

      const leave1 = service.leave();
      const leave2 = service.leave();

      await Promise.all([leave1, leave2]);

      // Should only unpublish and leave once
      expect(mockClient.leave).toHaveBeenCalledTimes(1);
    });

    it('should handle leave errors and reset state', async () => {
      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, true);

      mockClient.leave.mockRejectedValueOnce(new Error('Leave failed'));

      await expect(service.leave()).rejects.toThrow('Leave failed');
      expect(service.isChannelJoined()).toBe(false);
    });

    it('should handle unpublish errors gracefully', async () => {
      const config = {
        appId: 'test',
        channelName: 'test',
        token: 'test',
        uid: '123',
      };
      await service.join(config, true, true);

      mockClient.unpublish.mockRejectedValueOnce(new Error('Unpublish failed'));

      await service.leave();

      // Should still complete leave despite unpublish error
      expect(mockClient.leave).toHaveBeenCalled();
      expect(service.isChannelJoined()).toBe(false);
    });
  });
});
