import { push, onValue, remove } from "firebase/database";

// Mock Firebase app
jest.mock("@/lib/firebase", () => ({
  __esModule: true,
  default: {},
}));

// Mock Firebase database functions
jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(() => ({})),
  ref: jest.fn(),
  push: jest.fn(() => ({ key: "message-123" })),
  set: jest.fn(),
  onValue: jest.fn(),
  onChildAdded: jest.fn((query, callback) => callback),
  onChildRemoved: jest.fn(),
  remove: jest.fn(),
  off: jest.fn(),
  query: jest.fn((ref) => ref),
  limitToLast: jest.fn((n) => n),
}));

// Import after mocks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let chatService: any;
beforeAll(() => {
  chatService = require("../chatService").chatService;
});

describe("ChatService", () => {
  const mockChannelName = "test-channel";
  const mockUserId = "user-123";
  const mockMessage = "Hello, World!";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sendMessage", () => {
    it("sends a message to the channel", async () => {
      await chatService.sendMessage(mockChannelName, mockUserId, mockMessage);

      expect(push).toHaveBeenCalled();
    });
  });

  describe("sendSystemMessage", () => {
    it("sends a system message", async () => {
      const systemMessage = "User has joined";

      await chatService.sendSystemMessage(mockChannelName, systemMessage);

      expect(push).toHaveBeenCalled();
    });
  });

  describe("onMessage", () => {
    it("subscribes to message events", () => {
      const callback = jest.fn();
      const { onChildAdded } = require("firebase/database");

      chatService.onMessage(mockChannelName, callback);

      expect(onChildAdded).toHaveBeenCalled();
    });
  });

  describe("onTypingStatus", () => {
    it("subscribes to typing status events", () => {
      const callback = jest.fn();

      chatService.onTypingStatus(mockChannelName, mockUserId, callback);

      expect(onValue).toHaveBeenCalled();
    });
  });

  describe("clearChannel", () => {
    it("clears all messages in a channel", async () => {
      await chatService.clearChannel(mockChannelName);

      expect(remove).toHaveBeenCalled();
    });

    it("does not clear if channel name is empty", async () => {
      await chatService.clearChannel("");

      expect(remove).not.toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("cleans up channel resources", () => {
      const { off } = require("firebase/database");

      // First setup a listener
      chatService.onMessage(mockChannelName, jest.fn());

      // Then cleanup
      chatService.cleanup(mockChannelName);

      // Cleanup doesn't call remove, it calls off
      expect(off).toHaveBeenCalled();
    });
  });
});
