import { renderHook } from "@testing-library/react";
import { useMediaDevices } from "../useMediaDevices";
import { agoraService } from "@/services/agoraService";

// Mock agoraService
jest.mock("@/services/agoraService", () => ({
  agoraService: {
    initClient: jest.fn(),
  },
}));

describe("useMediaDevices", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("initializes agora client on mount", async () => {
    renderHook(() => useMediaDevices());
    expect(agoraService.initClient).toHaveBeenCalledWith("rtc");
  });

  it("initializes client only once", () => {
    const { rerender } = renderHook(() => useMediaDevices());
    rerender();
    expect(agoraService.initClient).toHaveBeenCalledTimes(1);
  });
});
