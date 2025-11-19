import { renderHook, act } from "@testing-library/react";
import { useAgoraControls } from "../useAgoraControls";
import { agoraService } from "@/services/agoraService";

// Mock agoraService
jest.mock("@/services/agoraService", () => ({
  agoraService: {
    getCameras: jest.fn(),
    getMicrophones: jest.fn(),
    getPlaybackDevices: jest.fn(),
    switchCamera: jest.fn(),
    switchMicrophone: jest.fn(),
    setAudioVolume: jest.fn(),
    getAudioVolumeLevel: jest.fn(),
    setVideoEncoderConfiguration: jest.fn(),
    setAudioProfile: jest.fn(),
    setBeautyEffect: jest.fn(),
    enableDualStream: jest.fn(),
    disableDualStream: jest.fn(),
  },
}));

describe("useAgoraControls", () => {
  const mockCameras = [
    { deviceId: "camera1", label: "Camera 1", kind: "videoinput" as MediaDeviceKind, groupId: "" },
    { deviceId: "camera2", label: "Camera 2", kind: "videoinput" as MediaDeviceKind, groupId: "" },
  ];

  const mockMicrophones = [
    { deviceId: "mic1", label: "Microphone 1", kind: "audioinput" as MediaDeviceKind, groupId: "" },
    { deviceId: "mic2", label: "Microphone 2", kind: "audioinput" as MediaDeviceKind, groupId: "" },
  ];

  const mockSpeakers = [
    {
      deviceId: "speaker1",
      label: "Speaker 1",
      kind: "audiooutput" as MediaDeviceKind,
      groupId: "",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (agoraService.getCameras as jest.Mock).mockResolvedValue(mockCameras);
    (agoraService.getMicrophones as jest.Mock).mockResolvedValue(mockMicrophones);
    (agoraService.getPlaybackDevices as jest.Mock).mockResolvedValue(mockSpeakers);
  });

  it("initializes with default state", () => {
    const { result } = renderHook(() => useAgoraControls());

    expect(result.current.devices.cameras).toEqual([]);
    expect(result.current.devices.microphones).toEqual([]);
    expect(result.current.devices.speakers).toEqual([]);
  });

  it("refreshes devices", async () => {
    const { result } = renderHook(() => useAgoraControls());

    let devices: Awaited<ReturnType<typeof result.current.refreshDevices>>;
    await act(async () => {
      devices = await result.current.refreshDevices();
    });

    expect(devices!.cameras).toEqual(mockCameras);
    expect(devices!.microphones).toEqual(mockMicrophones);
    expect(devices!.speakers).toEqual(mockSpeakers);
  });

  it("switches camera", async () => {
    const { result } = renderHook(() => useAgoraControls());

    await result.current.switchCamera("camera2");

    expect(agoraService.switchCamera).toHaveBeenCalledWith("camera2");
  });

  it("switches microphone", async () => {
    const { result } = renderHook(() => useAgoraControls());

    await result.current.switchMicrophone("mic2");

    expect(agoraService.switchMicrophone).toHaveBeenCalledWith("mic2");
  });

  it("sets audio volume", async () => {
    const { result } = renderHook(() => useAgoraControls());

    await act(async () => {
      await result.current.setAudioVolume(75);
    });

    expect(agoraService.setAudioVolume).toHaveBeenCalledWith(75);
  });

  it("gets volume level", () => {
    (agoraService.getAudioVolumeLevel as jest.Mock).mockReturnValue(50);
    const { result } = renderHook(() => useAgoraControls());

    const level = result.current.getVolumeLevel();

    expect(level).toBe(50);
    expect(agoraService.getAudioVolumeLevel).toHaveBeenCalled();
  });

  it("sets video quality", async () => {
    const { result } = renderHook(() => useAgoraControls());

    await result.current.setVideoQuality({ resolution: "720p", frameRate: 30 });

    expect(agoraService.setVideoEncoderConfiguration).toHaveBeenCalledWith({
      width: 1280,
      height: 720,
      frameRate: 30,
    });
  });

  it("toggles beauty effect", async () => {
    const { result } = renderHook(() => useAgoraControls());

    await act(async () => {
      await result.current.toggleBeautyEffect(true, { lighteningLevel: 0.7 });
    });

    expect(agoraService.setBeautyEffect).toHaveBeenCalledWith(true, {
      lighteningLevel: 0.7,
    });
  });

  it("enables dual stream", async () => {
    const { result } = renderHook(() => useAgoraControls());

    await act(async () => {
      await result.current.enableDualStream();
    });

    expect(agoraService.enableDualStream).toHaveBeenCalled();
  });

  it("disables dual stream", async () => {
    const { result } = renderHook(() => useAgoraControls());

    await result.current.disableDualStream();

    expect(agoraService.disableDualStream).toHaveBeenCalled();
  });
});
