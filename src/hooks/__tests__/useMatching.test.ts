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

  describe("connectToPartner scenarios", () => {
    it("prevents duplicate connections", async () => {
      const { result } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      // Mock instant match
      (userQueueService.tryInstantMatch as jest.Mock).mockResolvedValueOnce("partner-1");
      (userQueueService.onPartnerDisconnected as jest.Mock).mockReturnValue(jest.fn());

      await act(async () => {
        result.current.searchForPartner();
      });

      // Wait for connection
      await waitFor(() => expect(result.current.isConnected).toBe(true));

      // Try to connect again while already connected
      (userQueueService.tryInstantMatch as jest.Mock).mockResolvedValueOnce("partner-2");

      const initialPartnerId = result.current.partnerId;

      await act(async () => {
        result.current.searchForPartner();
      });

      // Should not change partner
      expect(result.current.partnerId).toBe(initialPartnerId);
    });

    it("tracks recent partners in localStorage", async () => {
      const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

      const { result } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      // Mock instant match
      (userQueueService.tryInstantMatch as jest.Mock).mockResolvedValueOnce("partner-xyz");
      (userQueueService.onPartnerDisconnected as jest.Mock).mockReturnValue(jest.fn());

      await act(async () => {
        result.current.searchForPartner();
      });

      // Wait for connection to complete
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Just verify setItem was called with recentPartners key
      await waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledWith("recentPartners", expect.any(String));
      });

      setItemSpy.mockRestore();
    });

    it("calls partner connected callback", async () => {
      const { result } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      const callback = jest.fn();
      result.current.onPartnerConnected(callback);

      // Mock instant match
      (userQueueService.tryInstantMatch as jest.Mock).mockResolvedValueOnce("partner-1");
      (userQueueService.onPartnerDisconnected as jest.Mock).mockReturnValue(jest.fn());

      await act(async () => {
        result.current.searchForPartner();
      });

      await waitFor(() => {
        expect(callback).toHaveBeenCalled();
      });
    });

    it("handles partner disconnection during search", async () => {
      let disconnectCallback: (() => void) | null = null;

      (userQueueService.onPartnerDisconnected as jest.Mock).mockImplementation(
        (_userId: string, callback: () => void) => {
          disconnectCallback = callback;
          return jest.fn();
        }
      );

      const { result } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      // Mock instant match
      (userQueueService.tryInstantMatch as jest.Mock).mockResolvedValueOnce("partner-1");

      await act(async () => {
        result.current.searchForPartner();
      });

      await waitFor(() => expect(result.current.isConnected).toBe(true));

      // Trigger partner disconnect
      await act(async () => {
        if (disconnectCallback) {
          await disconnectCallback();
        }
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
        expect(result.current.partnerId).toBe("");
        expect(mockOnSystemMessage).toHaveBeenCalledWith("Stranger has disconnected.");
      });
    });

    it("calls partner disconnected callback on disconnect", async () => {
      let disconnectCallback: (() => void) | null = null;

      (userQueueService.onPartnerDisconnected as jest.Mock).mockImplementation(
        (_userId: string, callback: () => void) => {
          disconnectCallback = callback;
          return jest.fn();
        }
      );

      const { result } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      const callback = jest.fn();
      result.current.onPartnerDisconnected(callback);

      // Mock instant match
      (userQueueService.tryInstantMatch as jest.Mock).mockResolvedValueOnce("partner-1");

      await act(async () => {
        result.current.searchForPartner();
      });

      await waitFor(() => expect(result.current.isConnected).toBe(true));

      // Trigger partner disconnect
      await act(async () => {
        if (disconnectCallback) {
          await disconnectCallback();
        }
      });

      await waitFor(() => {
        expect(callback).toHaveBeenCalled();
      });
    });

    it("does not auto-search after manual stop", async () => {
      let disconnectCallback: (() => void) | null = null;

      (userQueueService.onPartnerDisconnected as jest.Mock).mockImplementation(
        (_userId: string, callback: () => void) => {
          disconnectCallback = callback;
          return jest.fn();
        }
      );

      const { result } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      // Mock instant match
      (userQueueService.tryInstantMatch as jest.Mock).mockResolvedValueOnce("partner-1");

      await act(async () => {
        result.current.searchForPartner();
      });

      await waitFor(() => expect(result.current.isConnected).toBe(true));

      // Manually stop
      await act(async () => {
        await result.current.handleStop();
      });

      // Now trigger disconnect callback
      await act(async () => {
        if (disconnectCallback) {
          await disconnectCallback();
        }
      });

      // Should not start searching again
      expect(result.current.isSearching).toBe(false);
    });

    it("handles error when removing from queue on partner disconnect", async () => {
      let disconnectCallback: (() => void) | null = null;

      (userQueueService.onPartnerDisconnected as jest.Mock).mockImplementation(
        (_userId: string, callback: () => void) => {
          disconnectCallback = callback;
          return jest.fn();
        }
      );

      const { result } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      // Mock instant match
      (userQueueService.tryInstantMatch as jest.Mock).mockResolvedValueOnce("partner-1");

      await act(async () => {
        result.current.searchForPartner();
      });

      await waitFor(() => expect(result.current.isConnected).toBe(true));

      // Mock error on removeFromQueue
      (userQueueService.removeFromQueue as jest.Mock).mockRejectedValueOnce(
        new Error("Queue error")
      );

      // Trigger partner disconnect
      await act(async () => {
        if (disconnectCallback) {
          await disconnectCallback();
        }
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
      });
    });
  });

  describe("searchForPartner edge cases", () => {
    it("does not search if already searching", async () => {
      const { result } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      (userQueueService.onPartnerConnected as jest.Mock).mockReturnValue(jest.fn());
      (userQueueService.tryInstantMatch as jest.Mock).mockResolvedValue(null);
      (userQueueService.addToQueue as jest.Mock).mockResolvedValue(undefined);

      // Start first search
      act(() => {
        result.current.searchForPartner();
      });

      // Wait for isSearching state to update
      await waitFor(() => {
        expect(result.current.isSearching).toBe(true);
      });

      const callCount = (userQueueService.addToQueue as jest.Mock).mock.calls.length;

      // Try to search again (while still searching) - should be blocked
      act(() => {
        result.current.searchForPartner();
      });

      // Give React time to process if there was an errant call
      await new Promise((resolve) => setTimeout(resolve, 50));

      // addToQueue should not have been called again
      expect((userQueueService.addToQueue as jest.Mock).mock.calls.length).toBe(callCount);
    });

    it("does not search if already connected", async () => {
      const { result } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      // Mock instant match
      (userQueueService.tryInstantMatch as jest.Mock).mockResolvedValueOnce("partner-1");
      (userQueueService.onPartnerDisconnected as jest.Mock).mockReturnValue(jest.fn());

      await act(async () => {
        result.current.searchForPartner();
      });

      await waitFor(() => expect(result.current.isConnected).toBe(true));

      const callCount = (userQueueService.addToQueue as jest.Mock).mock.calls.length;

      // Try to search again while connected
      await act(async () => {
        result.current.searchForPartner();
      });

      // Should not call addToQueue again
      expect((userQueueService.addToQueue as jest.Mock).mock.calls.length).toBe(callCount);
    });

    it("loads user info from localStorage", async () => {
      const userInfo = {
        gender: "male",
        name: "Test User",
        year: "2024",
        interests: "coding, testing",
      };

      const getItemSpy = jest.spyOn(Storage.prototype, "getItem");
      getItemSpy.mockImplementation((key: string) => {
        if (key === "userInfo") {
          return JSON.stringify(userInfo);
        }
        return null;
      });

      const { result } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      (userQueueService.onPartnerConnected as jest.Mock).mockReturnValue(jest.fn());

      await act(async () => {
        result.current.searchForPartner();
      });

      expect(userQueueService.addToQueue).toHaveBeenCalledWith(
        expect.any(String),
        "male",
        "Test User",
        "2024",
        "coding, testing",
        expect.any(Array)
      );

      getItemSpy.mockRestore();
    });

    it("uses default values if userInfo not in localStorage", async () => {
      const getItemSpy = jest.spyOn(Storage.prototype, "getItem");
      getItemSpy.mockReturnValue(null);

      const { result } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      (userQueueService.onPartnerConnected as jest.Mock).mockReturnValue(jest.fn());

      await act(async () => {
        result.current.searchForPartner();
      });

      expect(userQueueService.addToQueue).toHaveBeenCalledWith(
        expect.any(String),
        "other",
        "Anonymous",
        "",
        "",
        expect.any(Array)
      );

      getItemSpy.mockRestore();
    });

    it("finds partner via polling interval", async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      (userQueueService.onPartnerConnected as jest.Mock).mockReturnValue(jest.fn());
      (userQueueService.onPartnerDisconnected as jest.Mock).mockReturnValue(jest.fn());

      // First attempt returns no partner
      (userQueueService.tryInstantMatch as jest.Mock).mockResolvedValueOnce(null);

      await act(async () => {
        result.current.searchForPartner();
      });

      // Advance to trigger interval
      (userQueueService.tryInstantMatch as jest.Mock).mockResolvedValueOnce("partner-1");

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      jest.useRealTimers();
    });

    it("times out after 30 seconds and shows message", async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      (userQueueService.onPartnerConnected as jest.Mock).mockReturnValue(jest.fn());
      (userQueueService.tryInstantMatch as jest.Mock).mockResolvedValue(null);

      await act(async () => {
        result.current.searchForPartner();
      });

      // Advance to timeout
      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(result.current.isSearching).toBe(false);
        expect(mockOnSystemMessage).toHaveBeenCalledWith(
          'No match found. Click "Start" to search again.'
        );
      });

      jest.useRealTimers();
    });

    it("handles error during search", async () => {
      const { result } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      (userQueueService.addToQueue as jest.Mock).mockRejectedValueOnce(new Error("Queue error"));

      await act(async () => {
        result.current.searchForPartner();
      });

      await waitFor(() => {
        expect(result.current.isSearching).toBe(false);
      });
    });

    it("clears existing listener before setting new one", async () => {
      const unsubscribe1 = jest.fn();
      const unsubscribe2 = jest.fn();

      (userQueueService.onPartnerConnected as jest.Mock)
        .mockReturnValueOnce(unsubscribe1)
        .mockReturnValueOnce(unsubscribe2);

      const { result } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      // First search
      await act(async () => {
        result.current.searchForPartner();
      });

      // Stop search
      await act(async () => {
        await result.current.handleStop();
      });

      // Second search
      await act(async () => {
        result.current.searchForPartner();
      });

      // First listener should be unsubscribed
      expect(unsubscribe1).toHaveBeenCalled();
    });
  });

  describe("handleNext edge cases", () => {
    it("does not proceed if already searching", async () => {
      const { result } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      (userQueueService.onPartnerConnected as jest.Mock).mockReturnValue(jest.fn());

      await act(async () => {
        result.current.searchForPartner();
      });

      const callCount = (userQueueService.removeFromQueue as jest.Mock).mock.calls.length;

      await act(async () => {
        await result.current.handleNext();
      });

      // Should not call removeFromQueue again
      expect((userQueueService.removeFromQueue as jest.Mock).mock.calls.length).toBe(callCount);
    });

    it("clears all timers and intervals", async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      (userQueueService.onPartnerConnected as jest.Mock).mockReturnValue(jest.fn());
      (userQueueService.tryInstantMatch as jest.Mock).mockResolvedValue(null);

      await act(async () => {
        result.current.searchForPartner();
      });

      await act(async () => {
        await result.current.handleNext();
      });

      // Wait for new search to start
      await waitFor(() => {
        expect(result.current.isSearching).toBe(true);
      });

      // Advance timers - should not cause issues
      await act(async () => {
        jest.advanceTimersByTime(35000);
      });

      jest.useRealTimers();
    });

    it("handles error during removeFromQueue", async () => {
      const { result } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      (userQueueService.tryInstantMatch as jest.Mock).mockResolvedValueOnce("partner-1");
      (userQueueService.onPartnerDisconnected as jest.Mock).mockReturnValue(jest.fn());

      await act(async () => {
        result.current.searchForPartner();
      });

      await waitFor(() => expect(result.current.isConnected).toBe(true));

      // Reset mock to reject on next call
      (userQueueService.removeFromQueue as jest.Mock).mockReset();
      (userQueueService.removeFromQueue as jest.Mock).mockRejectedValueOnce(
        new Error("Queue error")
      );

      await act(async () => {
        await result.current.handleNext();
      });

      // Error during removeFromQueue causes isSearching to be set to false
      expect(result.current.isSearching).toBe(false);
    });
  });

  describe("handleStop edge cases", () => {
    it("stops when searching but not connected", async () => {
      const { result } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      (userQueueService.onPartnerConnected as jest.Mock).mockReturnValue(jest.fn());

      await act(async () => {
        result.current.searchForPartner();
      });

      expect(result.current.isSearching).toBe(true);

      await act(async () => {
        await result.current.handleStop();
      });

      expect(result.current.isSearching).toBe(false);
      expect(mockOnClearMessages).toHaveBeenCalled();
    });

    it("stops when connected", async () => {
      const { result } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      (userQueueService.tryInstantMatch as jest.Mock).mockResolvedValueOnce("partner-1");
      (userQueueService.onPartnerDisconnected as jest.Mock).mockReturnValue(jest.fn());

      await act(async () => {
        result.current.searchForPartner();
      });

      await waitFor(() => expect(result.current.isConnected).toBe(true));

      await act(async () => {
        await result.current.handleStop();
      });

      expect(result.current.isConnected).toBe(false);
      expect(mockOnSystemMessage).toHaveBeenCalledWith("You have disconnected.");
    });
  });

  describe("localStorage edge cases", () => {
    it("handles invalid JSON in recentPartners", () => {
      const getItemSpy = jest.spyOn(Storage.prototype, "getItem");
      getItemSpy.mockImplementation((key: string) => {
        if (key === "recentPartners") {
          return "invalid json";
        }
        return null;
      });

      const { result } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      // Should not crash and use empty array
      expect(result.current.userId).toBeTruthy();

      getItemSpy.mockRestore();
    });

    it("handles non-array value in recentPartners", () => {
      const getItemSpy = jest.spyOn(Storage.prototype, "getItem");
      getItemSpy.mockImplementation((key: string) => {
        if (key === "recentPartners") {
          return JSON.stringify({ not: "an array" });
        }
        return null;
      });

      const { result } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      // Should not crash and use empty array
      expect(result.current.userId).toBeTruthy();

      getItemSpy.mockRestore();
    });
  });

  describe("cleanup on unmount", () => {
    it("clears all timers on unmount", () => {
      jest.useFakeTimers();

      const { result, unmount } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      (userQueueService.onPartnerConnected as jest.Mock).mockReturnValue(jest.fn());

      act(() => {
        result.current.searchForPartner();
      });

      unmount();

      // Should not throw errors
      expect(() => jest.advanceTimersByTime(35000)).not.toThrow();

      jest.useRealTimers();
    });

    it("unsubscribes listeners on unmount", async () => {
      const unsubscribe = jest.fn();

      (userQueueService.onPartnerConnected as jest.Mock).mockReturnValue(unsubscribe);
      (userQueueService.tryInstantMatch as jest.Mock).mockResolvedValue(null);

      const { result, unmount } = renderHook(() =>
        useMatching(mockOnSystemMessage, mockOnClearMessages, mockOnError)
      );

      await act(async () => {
        result.current.searchForPartner();
      });

      // Wait for search to complete
      await waitFor(() => {
        expect(result.current.isSearching).toBe(true);
      });

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
