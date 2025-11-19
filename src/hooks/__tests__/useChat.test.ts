import { renderHook, act } from "@testing-library/react";
import { useChat } from "../useChat";
import { chatService } from "@/services/chatService";

// Mock chatService
jest.mock("@/services/chatService", () => ({
  chatService: {
    sendMessage: jest.fn(),
    sendSystemMessage: jest.fn(),
    setTypingStatus: jest.fn(),
    onMessage: jest.fn(() => jest.fn()),
    onTypingStatus: jest.fn(() => jest.fn()),
    clearChannel: jest.fn(),
    cleanup: jest.fn(),
  },
}));

describe("useChat", () => {
  const mockUserId = "user-123";
  const mockChannelName = "test-channel";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("initializes with empty messages", () => {
    const { result } = renderHook(() => useChat(mockUserId, mockChannelName));
    expect(result.current.messages).toEqual([]);
  });

  it("sends a message successfully", async () => {
    (chatService.sendMessage as jest.Mock).mockResolvedValue(undefined);
    const { result } = renderHook(() => useChat(mockUserId, mockChannelName));

    await act(async () => {
      result.current.sendMessage("Hello!");
    });

    expect(chatService.sendMessage).toHaveBeenCalledWith(mockChannelName, mockUserId, "Hello!");
  });

  it("does not send empty messages", async () => {
    const { result } = renderHook(() => useChat(mockUserId, mockChannelName));

    await act(async () => {
      result.current.sendMessage("");
    });

    expect(chatService.sendMessage).not.toHaveBeenCalled();
  });

  it("sets typing indicator", () => {
    const { result } = renderHook(() => useChat(mockUserId, mockChannelName));

    act(() => {
      result.current.setTypingIndicator();
    });

    expect(chatService.setTypingStatus).toHaveBeenCalledWith(mockChannelName, mockUserId, true);
  });

  it("clears all messages", () => {
    const { result } = renderHook(() => useChat(mockChannelName, mockUserId));

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
  });

  it("subscribes to message events on mount", () => {
    renderHook(() => useChat(mockUserId, mockChannelName));
    expect(chatService.onMessage).toHaveBeenCalled();
  });

  it("subscribes to typing status events on mount", () => {
    renderHook(() => useChat(mockUserId, mockChannelName));
    expect(chatService.onTypingStatus).toHaveBeenCalled();
  });

  it("updates when channelName changes", () => {
    const { rerender } = renderHook(({ channel }) => useChat(mockUserId, channel), {
      initialProps: { channel: "channel-1" },
    });

    rerender({ channel: "channel-2" });

    expect(chatService.onMessage).toHaveBeenCalledTimes(2);
  });
});
