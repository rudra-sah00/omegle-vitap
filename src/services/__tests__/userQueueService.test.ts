// Firebase DB types available if needed

// Mock Firebase app
jest.mock("@/lib/firebase", () => ({
  __esModule: true,
  default: {},
}));

const mockSet = jest.fn().mockResolvedValue(undefined);
const mockGet = jest.fn();
const mockRemove = jest.fn().mockResolvedValue(undefined);
const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockRunTransaction = jest.fn();
const mockOnDisconnect = jest.fn(() => ({ remove: jest.fn() }));
const mockRef = jest.fn(() => ({}));

// Mock Firebase database functions
jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(() => ({})),
  ref: mockRef,
  set: mockSet,
  get: mockGet,
  remove: mockRemove,
  update: mockUpdate,
  runTransaction: mockRunTransaction,
  push: jest.fn(),
  onValue: jest.fn(),
  serverTimestamp: jest.fn(() => Date.now()),
  onDisconnect: mockOnDisconnect,
}));

jest.mock("../chatService", () => ({
  chatService: {
    clearChannel: jest.fn(),
  },
}));

// Import after mocks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let userQueueService: any;
beforeAll(() => {
  userQueueService = require("../userQueueService").userQueueService;
});

describe("UserQueueService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSet.mockClear();
    mockGet.mockClear();
    mockRemove.mockClear();
    mockUpdate.mockClear();
    mockRunTransaction.mockClear();
  });

  describe("generateUserId", () => {
    it("generates a unique user ID", () => {
      const userId1 = userQueueService.generateUserId();
      const userId2 = userQueueService.generateUserId();

      expect(userId1).toMatch(/^user_/);
      expect(userId2).toMatch(/^user_/);
      expect(userId1).not.toBe(userId2);
    });

    it("stores current user ID", () => {
      const userId = userQueueService.generateUserId();
      expect(userQueueService.getCurrentUserId()).toBe(userId);
    });
  });

  describe("addToQueue", () => {
    it("adds user to queue with correct data", async () => {
      const userId = "user-123";
      const gender = "male";
      const name = "Test User";
      const year = "2nd Year";
      const interests = "coding";
      const recentPartners = ["partner-1"];

      await userQueueService.addToQueue(userId, gender, name, year, interests, recentPartners);

      expect(mockSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId,
          status: "waiting",
          gender,
          name,
          year,
          interests,
          recentPartners,
          timestamp: expect.any(Number),
        })
      );
    });

    it("handles missing optional parameters", async () => {
      const userId = "user-123";

      await userQueueService.addToQueue(userId);

      expect(mockSet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId,
          status: "waiting",
          gender: "other",
          name: "Anonymous",
          year: "",
          interests: "",
          recentPartners: [],
          timestamp: expect.any(Number),
        })
      );
    });

    it("does not add if userId is empty", async () => {
      await userQueueService.addToQueue("");
      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  describe("findPartner", () => {
    it("returns null if queue is empty", async () => {
      mockGet.mockResolvedValue({ exists: () => false });

      const partner = await userQueueService.findPartner("user-123");

      expect(partner).toBeNull();
    });

    it("excludes current user from results", async () => {
      const currentUserId = "user-123";
      const mockQueue = {
        "user-123": { userId: "user-123", status: "waiting" },
        "user-456": { userId: "user-456", status: "waiting" },
      };

      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => mockQueue,
      });

      const partner = await userQueueService.findPartner(currentUserId);

      expect(partner).toBe("user-456");
    });

    it("excludes recent partners from results", async () => {
      const currentUserId = "user-123";
      const mockQueue = {
        "user-123": {
          userId: "user-123",
          status: "waiting",
          recentPartners: ["user-456"],
        },
        "user-456": { userId: "user-456", status: "waiting" },
        "user-789": { userId: "user-789", status: "waiting" },
      };

      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => mockQueue,
      });

      const partner = await userQueueService.findPartner(currentUserId);

      expect(partner).toBe("user-789");
      expect(partner).not.toBe("user-456");
    });

    it("prioritizes opposite gender", async () => {
      const currentUserId = "user-123";
      const mockQueue = {
        "user-123": {
          userId: "user-123",
          status: "waiting",
          gender: "male",
          recentPartners: [],
        },
        "user-456": { userId: "user-456", status: "waiting", gender: "male" },
        "user-789": { userId: "user-789", status: "waiting", gender: "female" },
      };

      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => mockQueue,
      });

      const partner = await userQueueService.findPartner(currentUserId, "male");

      expect(partner).toBe("user-789");
    });
  });

  describe("removeFromQueue", () => {
    it("removes user from queue", async () => {
      const userId = "user-123";
      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => ({ userId, status: "waiting" }),
      });

      await userQueueService.removeFromQueue(userId);

      expect(mockRemove).toHaveBeenCalled();
    });

    it("removes partner when connected", async () => {
      const userId = "user-123";
      const partnerId = "user-456";

      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => ({ userId, status: "connected", partnerId }),
      });

      await userQueueService.removeFromQueue(userId);

      expect(mockRemove).toHaveBeenCalledTimes(2); // User and partner
    });

    it("does not remove if userId is empty", async () => {
      await userQueueService.removeFromQueue("");
      expect(mockRemove).not.toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("cleans up user data on page leave", async () => {
      const userId = "user-123";

      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => ({ userId, status: "waiting" }),
      });

      await userQueueService.cleanup(userId);

      expect(mockRemove).toHaveBeenCalled();
    });

    it("resets userId to null after cleanup", async () => {
      const userId = userQueueService.generateUserId();

      mockGet.mockResolvedValue({
        exists: () => false,
      });

      await userQueueService.cleanup(userId);

      expect(userQueueService.getCurrentUserId()).toBeNull();
    });
  });
});
