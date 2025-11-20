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
type UserQueueServiceType = typeof import("../userQueueService").userQueueService;
let userQueueService: UserQueueServiceType;
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

      expect(mockRemove).toHaveBeenCalledTimes(1); // Only user is removed, partner is updated to "waiting"
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

    it("clears chat when user was connected to partner", async () => {
      const userId = "user-123";
      const partnerId = "user-456";
      const { chatService } = require("../chatService");

      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => ({ userId, status: "connected", partnerId }),
      });

      await userQueueService.cleanup(userId);

      expect(chatService.clearChannel).toHaveBeenCalledWith("user-123_user-456");
    });

    it("handles errors during cleanup gracefully", async () => {
      const userId = "user-123";

      mockGet.mockRejectedValue(new Error("Database error"));

      await expect(userQueueService.cleanup(userId)).resolves.not.toThrow();
      expect(userQueueService.getCurrentUserId()).toBeNull();
    });
  });

  describe("tryInstantMatch", () => {
    it("returns null if queue is empty", async () => {
      mockGet.mockResolvedValue({ exists: () => false });

      const partner = await userQueueService.tryInstantMatch("user-123");

      expect(partner).toBeNull();
    });

    it("returns null if no waiting users", async () => {
      const mockQueue = {
        "user-123": { userId: "user-123", status: "waiting" },
      };

      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => mockQueue,
      });

      const partner = await userQueueService.tryInstantMatch("user-123");

      expect(partner).toBeNull();
    });

    it("matches with opposite gender first", async () => {
      const mockQueue = {
        "user-123": {
          userId: "user-123",
          status: "waiting",
          gender: "male",
          recentPartners: [],
        },
        "user-456": {
          userId: "user-456",
          status: "waiting",
          gender: "female",
          recentPartners: [],
        },
        "user-789": {
          userId: "user-789",
          status: "waiting",
          gender: "male",
          recentPartners: [],
        },
      };

      mockGet
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => mockQueue,
        })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({ status: "waiting" }),
        });

      mockRunTransaction.mockResolvedValue({
        committed: true,
        snapshot: { val: () => mockQueue },
      });

      const partner = await userQueueService.tryInstantMatch("user-123");

      expect(partner).toBe("user-456");
    });

    it("matches with any gender if no opposite gender available", async () => {
      const mockQueue = {
        "user-123": {
          userId: "user-123",
          status: "waiting",
          gender: "male",
          recentPartners: [],
        },
        "user-456": {
          userId: "user-456",
          status: "waiting",
          gender: "male",
          recentPartners: [],
        },
      };

      mockGet
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => mockQueue,
        })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({ status: "waiting" }),
        });

      mockRunTransaction.mockResolvedValue({
        committed: true,
        snapshot: { val: () => mockQueue },
      });

      const partner = await userQueueService.tryInstantMatch("user-123");

      expect(partner).toBe("user-456");
    });

    it("retries if partner is no longer waiting", async () => {
      const mockQueue = {
        "user-123": {
          userId: "user-123",
          status: "waiting",
          recentPartners: [],
        },
        "user-456": {
          userId: "user-456",
          status: "waiting",
          recentPartners: [],
        },
        "user-789": {
          userId: "user-789",
          status: "waiting",
          recentPartners: [],
        },
      };

      mockGet
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => mockQueue,
        })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({ status: "connected", partnerId: "other" }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => mockQueue,
        })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({ status: "waiting" }),
        });

      mockRunTransaction.mockResolvedValue({
        committed: true,
        snapshot: { val: () => mockQueue },
      });

      const partner = await userQueueService.tryInstantMatch("user-123");

      expect(partner).toBeTruthy();
    });

    it("returns null after max retries", async () => {
      const mockQueue = {
        "user-123": { userId: "user-123", status: "waiting", recentPartners: [] },
        "user-456": { userId: "user-456", status: "waiting", recentPartners: [] },
      };

      mockGet
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => mockQueue,
        })
        .mockResolvedValue({
          exists: () => true,
          val: () => ({ status: "connected", partnerId: "other" }),
        });

      const partner = await userQueueService.tryInstantMatch("user-123");

      expect(partner).toBeNull();
    });

    it("returns null if markAsConnected fails", async () => {
      const mockQueue = {
        "user-123": { userId: "user-123", status: "waiting", recentPartners: [] },
        "user-456": { userId: "user-456", status: "waiting", recentPartners: [] },
      };

      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => mockQueue,
      });

      mockRunTransaction.mockResolvedValue({
        committed: false,
      });

      const partner = await userQueueService.tryInstantMatch("user-123");

      expect(partner).toBeNull();
    });

    it("excludes users already with partners", async () => {
      const mockQueue = {
        "user-123": { userId: "user-123", status: "waiting", recentPartners: [] },
        "user-456": {
          userId: "user-456",
          status: "waiting",
          partnerId: "user-789",
          recentPartners: [],
        },
        "user-999": { userId: "user-999", status: "waiting", recentPartners: [] },
      };

      mockGet
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => mockQueue,
        })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({ status: "waiting" }),
        });

      mockRunTransaction.mockResolvedValue({
        committed: true,
        snapshot: { val: () => mockQueue },
      });

      const partner = await userQueueService.tryInstantMatch("user-123");

      expect(partner).toBe("user-999");
      expect(partner).not.toBe("user-456");
    });

    it("excludes recent partners", async () => {
      const mockQueue = {
        "user-123": {
          userId: "user-123",
          status: "waiting",
          recentPartners: ["user-456"],
        },
        "user-456": { userId: "user-456", status: "waiting", recentPartners: [] },
        "user-789": { userId: "user-789", status: "waiting", recentPartners: [] },
      };

      mockGet
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => mockQueue,
        })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({ status: "waiting" }),
        });

      mockRunTransaction.mockResolvedValue({
        committed: true,
        snapshot: { val: () => mockQueue },
      });

      const partner = await userQueueService.tryInstantMatch("user-123");

      expect(partner).toBe("user-789");
      expect(partner).not.toBe("user-456");
    });
  });

  describe("markAsConnected", () => {
    it("returns false if userId1 is empty", async () => {
      const result = await userQueueService.markAsConnected("", "user-456");
      expect(result).toBe(false);
    });

    it("returns false if userId2 is empty", async () => {
      const result = await userQueueService.markAsConnected("user-123", "");
      expect(result).toBe(false);
    });

    it("returns true if transaction committed", async () => {
      mockRunTransaction.mockResolvedValue({
        committed: true,
      });

      const result = await userQueueService.markAsConnected("user-123", "user-456");
      expect(result).toBe(true);
    });

    it("returns false if transaction not committed", async () => {
      mockRunTransaction.mockResolvedValue({
        committed: false,
      });

      const result = await userQueueService.markAsConnected("user-123", "user-456");
      expect(result).toBe(false);
    });

    it("returns false if transaction throws error", async () => {
      mockRunTransaction.mockRejectedValue(new Error("Transaction error"));

      const result = await userQueueService.markAsConnected("user-123", "user-456");
      expect(result).toBe(false);
    });

    it("aborts transaction if queue does not exist", async () => {
      mockRunTransaction.mockImplementation(
        async (_ref: unknown, updateFn: (data: null) => null) => {
          const result = updateFn(null);
          expect(result).toBeNull();
          return { committed: false };
        }
      );

      const result = await userQueueService.markAsConnected("user-123", "user-456");
      expect(result).toBe(false);
    });

    it("aborts transaction if user1 does not exist", async () => {
      mockRunTransaction.mockImplementation(
        async (_ref: unknown, updateFn: (data: Record<string, unknown>) => unknown) => {
          const currentData = {
            "user-456": { userId: "user-456", status: "waiting" },
          };
          const result = updateFn(currentData);
          expect(result).toBeUndefined();
          return { committed: false };
        }
      );

      const result = await userQueueService.markAsConnected("user-123", "user-456");
      expect(result).toBe(false);
    });

    it("aborts transaction if user2 does not exist", async () => {
      mockRunTransaction.mockImplementation(
        async (_ref: unknown, updateFn: (data: Record<string, unknown>) => unknown) => {
          const currentData = {
            "user-123": { userId: "user-123", status: "waiting" },
          };
          const result = updateFn(currentData);
          expect(result).toBeUndefined();
          return { committed: false };
        }
      );

      const result = await userQueueService.markAsConnected("user-123", "user-456");
      expect(result).toBe(false);
    });

    it("aborts transaction if user1 not waiting", async () => {
      mockRunTransaction.mockImplementation(
        async (_ref: unknown, updateFn: (data: Record<string, unknown>) => unknown) => {
          const currentData = {
            "user-123": { userId: "user-123", status: "connected" },
            "user-456": { userId: "user-456", status: "waiting" },
          };
          const result = updateFn(currentData);
          expect(result).toBeUndefined();
          return { committed: false };
        }
      );

      const result = await userQueueService.markAsConnected("user-123", "user-456");
      expect(result).toBe(false);
    });

    it("aborts transaction if user2 not waiting", async () => {
      mockRunTransaction.mockImplementation(
        async (_ref: unknown, updateFn: (data: Record<string, unknown>) => unknown) => {
          const currentData = {
            "user-123": { userId: "user-123", status: "waiting" },
            "user-456": { userId: "user-456", status: "connected" },
          };
          const result = updateFn(currentData);
          expect(result).toBeUndefined();
          return { committed: false };
        }
      );

      const result = await userQueueService.markAsConnected("user-123", "user-456");
      expect(result).toBe(false);
    });

    it("aborts transaction if user1 already has partner", async () => {
      mockRunTransaction.mockImplementation(
        async (_ref: unknown, updateFn: (data: Record<string, unknown>) => unknown) => {
          const currentData = {
            "user-123": { userId: "user-123", status: "waiting", partnerId: "other" },
            "user-456": { userId: "user-456", status: "waiting" },
          };
          const result = updateFn(currentData);
          expect(result).toBeUndefined();
          return { committed: false };
        }
      );

      const result = await userQueueService.markAsConnected("user-123", "user-456");
      expect(result).toBe(false);
    });

    it("aborts transaction if user2 already has partner", async () => {
      mockRunTransaction.mockImplementation(
        async (_ref: unknown, updateFn: (data: Record<string, unknown>) => unknown) => {
          const currentData = {
            "user-123": { userId: "user-123", status: "waiting" },
            "user-456": { userId: "user-456", status: "waiting", partnerId: "other" },
          };
          const result = updateFn(currentData);
          expect(result).toBeUndefined();
          return { committed: false };
        }
      );

      const result = await userQueueService.markAsConnected("user-123", "user-456");
      expect(result).toBe(false);
    });

    it("atomically updates both users when successful", async () => {
      mockRunTransaction.mockImplementation(
        async (
          _ref: unknown,
          updateFn: (
            data: Record<string, Record<string, unknown>>
          ) => Record<string, Record<string, unknown>>
        ) => {
          const currentData = {
            "user-123": { userId: "user-123", status: "waiting" },
            "user-456": { userId: "user-456", status: "waiting" },
          };
          const result = updateFn(currentData);
          expect(result["user-123"].status).toBe("connected");
          expect(result["user-123"].partnerId).toBe("user-456");
          expect(result["user-456"].status).toBe("connected");
          expect(result["user-456"].partnerId).toBe("user-123");
          return { committed: true };
        }
      );

      const result = await userQueueService.markAsConnected("user-123", "user-456");
      expect(result).toBe(true);
    });
  });

  describe("onPartnerConnected", () => {
    it("calls callback when partner connected", () => {
      const callback = jest.fn();
      const { onValue } = require("firebase/database");

      userQueueService.onPartnerConnected("user-123", callback);

      expect(onValue).toHaveBeenCalled();
    });

    it("returns unsubscribe function", () => {
      const { onValue } = require("firebase/database");
      const mockUnsubscribe = jest.fn();
      onValue.mockReturnValue(mockUnsubscribe);

      const unsubscribe = userQueueService.onPartnerConnected("user-123", jest.fn());

      expect(typeof unsubscribe).toBe("function");
    });
  });

  describe("onPartnerDisconnected", () => {
    it("calls callback when partner disconnects", () => {
      const callback = jest.fn();
      const { onValue } = require("firebase/database");

      userQueueService.onPartnerDisconnected("user-123", callback);

      expect(onValue).toHaveBeenCalled();
    });

    it("returns unsubscribe function", () => {
      const { onValue } = require("firebase/database");
      const mockUnsubscribe = jest.fn();
      onValue.mockReturnValue(mockUnsubscribe);

      const unsubscribe = userQueueService.onPartnerDisconnected("user-123", jest.fn());

      expect(typeof unsubscribe).toBe("function");
    });
  });

  describe("getQueueStatus", () => {
    it("returns empty array if queue is empty", async () => {
      mockGet.mockResolvedValue({ exists: () => false });

      const status = await userQueueService.getQueueStatus();

      expect(status).toEqual([]);
    });

    it("returns array of users in queue", async () => {
      const mockQueue = {
        "user-123": { userId: "user-123", status: "waiting" },
        "user-456": { userId: "user-456", status: "connected" },
      };

      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => mockQueue,
      });

      const status = await userQueueService.getQueueStatus();

      expect(status).toHaveLength(2);
      expect(status).toContainEqual(mockQueue["user-123"]);
      expect(status).toContainEqual(mockQueue["user-456"]);
    });
  });

  describe("findPartner with gender matching", () => {
    it("matches female with male", async () => {
      const mockQueue = {
        "user-123": { userId: "user-123", status: "waiting", gender: "female" },
        "user-456": { userId: "user-456", status: "waiting", gender: "male" },
        "user-789": { userId: "user-789", status: "waiting", gender: "female" },
      };

      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => mockQueue,
      });

      const partner = await userQueueService.findPartner("user-123", "female");

      expect(partner).toBe("user-456");
    });

    it("matches 'other' gender with male or female", async () => {
      const mockQueue = {
        "user-123": { userId: "user-123", status: "waiting", gender: "other" },
        "user-456": { userId: "user-456", status: "waiting", gender: "male" },
        "user-789": { userId: "user-789", status: "waiting", gender: "other" },
      };

      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => mockQueue,
      });

      const partner = await userQueueService.findPartner("user-123", "other");

      expect(partner).toBe("user-456");
    });

    it("falls back to any gender if no opposite gender available", async () => {
      const mockQueue = {
        "user-123": { userId: "user-123", status: "waiting", gender: "male" },
        "user-456": { userId: "user-456", status: "waiting", gender: "male" },
      };

      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => mockQueue,
      });

      const partner = await userQueueService.findPartner("user-123", "male");

      expect(partner).toBe("user-456");
    });
  });

  describe("removeFromQueue with partner", () => {
    it("clears chat when user was connected", async () => {
      const userId = "user-123";
      const partnerId = "user-456";
      const { chatService } = require("../chatService");

      mockGet
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({ userId, status: "connected", partnerId }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({ userId: partnerId, status: "connected" }),
        });

      await userQueueService.removeFromQueue(userId);

      expect(chatService.clearChannel).toHaveBeenCalledWith("user-123_user-456");
    });

    it("updates partner status when user disconnects", async () => {
      const userId = "user-123";
      const partnerId = "user-456";

      mockGet
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({ userId, status: "connected", partnerId }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({ userId: partnerId, status: "connected" }),
        });

      await userQueueService.removeFromQueue(userId);

      expect(mockUpdate).toHaveBeenCalledWith(expect.anything(), {
        partnerId: null,
        status: "idle",
        connectedAt: null,
      });
    });

    it("handles partner update errors gracefully", async () => {
      const userId = "user-123";
      const partnerId = "user-456";

      mockGet
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({ userId, status: "connected", partnerId }),
        })
        .mockRejectedValueOnce(new Error("Partner update failed"));

      // Partner update errors are caught and ignored, so this should not throw
      await expect(userQueueService.removeFromQueue(userId)).resolves.not.toThrow();

      // User should still be removed despite partner update error
      expect(mockRemove).toHaveBeenCalled();
    });

    it("handles chat clear errors gracefully", async () => {
      const userId = "user-123";
      const partnerId = "user-456";
      const { chatService } = require("../chatService");

      chatService.clearChannel.mockRejectedValue(new Error("Chat clear failed"));

      mockGet
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({ userId, status: "connected", partnerId }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          val: () => ({ userId: partnerId, status: "connected" }),
        });

      await expect(userQueueService.removeFromQueue(userId)).resolves.not.toThrow();
    });
  });

  describe("addToQueue error handling", () => {
    it("throws error if database operation fails", async () => {
      mockSet.mockRejectedValue(new Error("Database error"));

      await expect(userQueueService.addToQueue("user-123")).rejects.toThrow(
        "Unable to connect to matching service"
      );
    });
  });

  describe("findPartner error handling", () => {
    it("throws error if database operation fails", async () => {
      mockGet.mockRejectedValue(new Error("Database error"));

      await expect(userQueueService.findPartner("user-123")).rejects.toThrow(
        "Unable to connect to matching service"
      );
    });
  });
});
