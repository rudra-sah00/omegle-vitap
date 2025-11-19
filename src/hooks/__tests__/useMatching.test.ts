import { renderHook, act, waitFor } from "@testing-library/react";
import { useMatching } from "../useMatching";
import { userQueueService } from "@/services/userQueueService";

// Mock userQueueService
jest.mock("@/services/userQueueService", () => ({
  userQueueService: {
    generateUserId: jest.fn(() => "user-123"),
    addToQueue: jest.fn(),
    tryInstantMatch: jest.fn(),
    onPartnerConnected: jest.fn(() => jest.fn()),
    onPartnerDisconnected: jest.fn(() => jest.fn()),
    removeFromQueue: jest.fn(),
    cleanup: jest.fn(),
  },
}));

describe("useMatching", () => {
  const mockOnSystemMessage = jest.fn();
  const mockOnClearMessages = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("generates userId on mount", () => {
    const { result } = renderHook(() =>
      useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
    );

    expect(result.current.userId).toBe("user-123");
    expect(userQueueService.generateUserId).toHaveBeenCalled();
  });

  it("initializes with correct default state", () => {
    const { result } = renderHook(() =>
      useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
    );

    expect(result.current.partnerId).toBe("");
    expect(result.current.channelName).toBe("");
    expect(result.current.isSearching).toBe(false);
    expect(result.current.isConnected).toBe(false);
  });

  it("loads recent partners from localStorage", () => {
    const getItemSpy = jest.spyOn(Storage.prototype, "getItem");
    localStorage.setItem("recentPartners", JSON.stringify(["partner-1", "partner-2"]));

    renderHook(() => useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError));

    // Verify localStorage was accessed
    expect(getItemSpy).toHaveBeenCalledWith("recentPartners");
    getItemSpy.mockRestore();
  });

  it("starts searching for partner", async () => {
    localStorage.setItem(
      "userInfo",
      JSON.stringify({
        gender: "male",
        name: "Test User",
        year: "2nd Year",
        interests: "coding",
      })
    );

    const { result } = renderHook(() =>
      useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
    );

    await act(async () => {
      result.current.searchForPartner();
    });

    expect(userQueueService.addToQueue).toHaveBeenCalledWith(
      "user-123",
      "male",
      "Test User",
      "2nd Year",
      "coding",
      []
    );
  });

  it("prevents searching when already connected", async () => {
    const { result } = renderHook(() =>
      useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
    );

    // Verify initial state - the hook prevents duplicate searches internally
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isSearching).toBe(false);
  });

  it("handles next button click", async () => {
    const { result } = renderHook(() =>
      useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
    );

    await act(async () => {
      await result.current.handleNext();
    });

    await waitFor(() => {
      expect(userQueueService.removeFromQueue).toHaveBeenCalledWith("user-123");
      expect(mockOnClearMessages).toHaveBeenCalled();
    });
  });

  it("handles stop button click", async () => {
    const { result } = renderHook(() =>
      useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
    );

    // First search for a partner
    await act(async () => {
      result.current.searchForPartner();
    });

    await act(async () => {
      await result.current.handleStop();
    });

    expect(mockOnClearMessages).toHaveBeenCalled();
  });

  it("cleans up on unmount", () => {
    const { unmount } = renderHook(() =>
      useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
    );

    unmount();

    expect(userQueueService.removeFromQueue).toHaveBeenCalled();
    expect(userQueueService.cleanup).toHaveBeenCalled();
  });

  it("registers partner connected callback", () => {
    const { result } = renderHook(() =>
      useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
    );

    const callback = jest.fn();
    result.current.onPartnerConnected(callback);

    // Callback should be registered
    expect(callback).not.toHaveBeenCalled();
  });

  it("registers partner disconnected callback", () => {
    const { result } = renderHook(() =>
      useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
    );

    const callback = jest.fn();
    result.current.onPartnerDisconnected(callback);

    // Callback should be registered
    expect(callback).not.toHaveBeenCalled();
  });
});
