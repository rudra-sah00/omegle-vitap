import {
  getDatabase,
  ref,
  set,
  get,
  remove,
  onValue,
  update,
  serverTimestamp,
  onDisconnect,
  runTransaction,
} from "firebase/database";
import app from "@/lib/firebase";
import { chatService } from "./chatService";

/**
 * Represents a user in the matching queue
 */
export interface QueueUser {
  /** Unique user identifier */
  userId: string;
  /** Current status of the user */
  status: "waiting" | "connected";
  /** ID of matched partner (if connected) */
  partnerId?: string;
  /** Timestamp when user joined queue */
  timestamp: number;
  /** User's gender preference */
  gender?: "male" | "female" | "other";
  /** User's display name */
  name?: string;
  /** User's year/grade */
  year?: string;
  /** User's interests */
  interests?: string;
  /** Track last 5 partners to avoid consecutive matches */
  recentPartners?: string[];
}

/**
 * Service for managing user matching queue and partner matching logic
 */
class UserQueueService {
  private db = getDatabase(app);
  private userId: string | null = null;

  /**
   * Generate a random unique user ID
   * @returns Generated user ID
   */
  generateUserId(): string {
    const randomId = `user_${Math.random().toString(36).substring(2, 15)}${Date.now()}`;
    this.userId = randomId;
    return randomId;
  }

  /**
   * Get the current user ID
   * @returns Current user ID or null if not set
   */
  getCurrentUserId(): string | null {
    return this.userId;
  }

  /**
   * Add user to waiting queue with auto-cleanup on disconnect
   * @param userId - User's unique identifier
   * @param gender - User's gender preference
   * @param name - User's display name
   * @param year - User's year/grade
   * @param interests - User's interests
   * @param recentPartners - List of recent partner IDs to avoid
   */
  async addToQueue(
    userId: string,
    gender?: string,
    name?: string,
    year?: string,
    interests?: string,
    recentPartners?: string[]
  ): Promise<void> {
    if (!userId) {
      return;
    }

    const userRef = ref(this.db, `queue/${userId}`);
    await set(userRef, {
      userId,
      status: "waiting",
      timestamp: serverTimestamp(),
      gender: gender || "other",
      name: name || "Anonymous",
      year: year || "",
      interests: interests || "",
      recentPartners: recentPartners || [], // Include recent partners list
    });

    // Setup auto-cleanup if user disconnects unexpectedly
    const disconnectRef = onDisconnect(userRef);
    await disconnectRef.remove();
  }

  /**
   * Find a random waiting partner with gender preference (excluding current user and recent partners)
   * @param currentUserId - Current user's ID
   * @param currentUserGender - Current user's gender for matching preferences
   * @returns Partner ID if found, null otherwise
   */
  async findPartner(currentUserId: string, currentUserGender?: string): Promise<string | null> {
    const queueRef = ref(this.db, "queue");
    const snapshot = await get(queueRef);

    if (!snapshot.exists()) return null;

    const users = snapshot.val();
    const currentUser = users[currentUserId] as QueueUser;
    const recentPartnerIds = currentUser?.recentPartners || [];

    // CRITICAL: Only match with users who are waiting AND have no partner AND not recently matched
    const waitingUsers = Object.values(users).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (user: any) =>
        user.status === "waiting" &&
        user.userId !== currentUserId &&
        !user.partnerId && // Ensure they're not already matched
        !recentPartnerIds.includes(user.userId) // Exclude recent partners
    ) as QueueUser[];

    if (waitingUsers.length === 0) return null;

    // Priority 1: Try to match with opposite gender
    if (currentUserGender) {
      const oppositeGenderUsers = this.filterByOppositeGender(waitingUsers, currentUserGender);
      if (oppositeGenderUsers.length > 0) {
        const randomIndex = Math.floor(Math.random() * oppositeGenderUsers.length);
        return oppositeGenderUsers[randomIndex].userId;
      }
    }

    // Priority 2: If no opposite gender found, match with any available user
    const randomIndex = Math.floor(Math.random() * waitingUsers.length);
    return waitingUsers[randomIndex].userId;
  }

  /**
   * Filter users by opposite gender for matching
   * @param users - Array of users to filter
   * @param currentGender - Current user's gender
   * @returns Filtered array of opposite gender users
   */
  private filterByOppositeGender(users: QueueUser[], currentGender: string): QueueUser[] {
    if (currentGender === "male") {
      return users.filter((u) => u.gender === "female");
    } else if (currentGender === "female") {
      return users.filter((u) => u.gender === "male");
    } else {
      // For 'other', match with male or female
      return users.filter((u) => u.gender === "male" || u.gender === "female");
    }
  }

  /**
   * Try to match immediately with atomic operation and retry logic
   * @param currentUserId - Current user's ID attempting to match
   * @param retryCount - Number of retry attempts (default: 0, max: 3)
   * @returns Partner ID if match successful, null otherwise
   */
  async tryInstantMatch(currentUserId: string, retryCount: number = 0): Promise<string | null> {
    const MAX_RETRIES = 3;

    if (retryCount >= MAX_RETRIES) {
      return null;
    }

    const queueRef = ref(this.db, "queue");
    const snapshot = await get(queueRef);

    if (!snapshot.exists()) return null;

    const users = snapshot.val();

    // Get current user's gender and recent partners
    const currentUser = users[currentUserId] as QueueUser;
    const currentUserGender = currentUser?.gender;
    const recentPartnerIds = currentUser?.recentPartners || [];

    // CRITICAL: Only match with users who are waiting AND have no partner AND not recently matched
    const waitingUsers = Object.values(users).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (user: any) =>
        user.status === "waiting" &&
        user.userId !== currentUserId &&
        !user.partnerId && // Ensure they're not already matched
        !recentPartnerIds.includes(user.userId) // Exclude recent partners
    ) as QueueUser[];

    if (waitingUsers.length === 0) return null;

    // Priority 1: Try opposite gender first
    let partner: QueueUser | null = null;
    if (currentUserGender) {
      const oppositeGenderUsers = this.filterByOppositeGender(waitingUsers, currentUserGender);
      if (oppositeGenderUsers.length > 0) {
        const randomIndex = Math.floor(Math.random() * oppositeGenderUsers.length);
        partner = oppositeGenderUsers[randomIndex];
      }
    }

    // Priority 2: If no opposite gender, pick any available user
    if (!partner) {
      const randomIndex = Math.floor(Math.random() * waitingUsers.length);
      partner = waitingUsers[randomIndex];
    }

    if (!partner || !partner.userId) {
      return null;
    }

    // Verify partner still waiting before marking connected
    const partnerRef = ref(this.db, `queue/${partner.userId}`);
    const partnerSnapshot = await get(partnerRef);

    const partnerData = partnerSnapshot.val();
    if (!partnerSnapshot.exists() || partnerData?.status !== "waiting" || partnerData?.partnerId) {
      // Check if already has partner
      return this.tryInstantMatch(currentUserId, retryCount + 1); // Retry with another partner
    }

    // Immediately mark both as connected using atomic transaction
    try {
      await this.markAsConnected(currentUserId, partner.userId);
      // Add partner to recent partners list for both users
      await this.addToRecentPartners(currentUserId, partner.userId);
      await this.addToRecentPartners(partner.userId, currentUserId);
      return partner.userId;
    } catch (_error) {
      return this.tryInstantMatch(currentUserId, retryCount + 1);
    }
  }

  /**
   * Add partner to user's recent partners list (maintains last 5)
   * @param userId - User ID to update
   * @param partnerId - Partner ID to add to recent list
   */
  private async addToRecentPartners(userId: string, partnerId: string): Promise<void> {
    const userRef = ref(this.db, `queue/${userId}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const userData = snapshot.val();
      const recentPartners = userData.recentPartners || [];

      // Add new partner and keep only last 5
      const updatedRecent = [
        partnerId,
        ...recentPartners.filter((id: string) => id !== partnerId),
      ].slice(0, 5);

      await update(userRef, {
        recentPartners: updatedRecent,
      });
    }
  }

  /**
   * Mark two users as connected using atomic transaction to prevent race conditions
   * @param userId1 - First user's ID
   * @param userId2 - Second user's ID
   * @throws Error if users cannot be connected
   */
  async markAsConnected(userId1: string, userId2: string): Promise<void> {
    if (!userId1 || !userId2) {
      return;
    }

    const queueRef = ref(this.db, "queue");

    try {
      // Use transaction to atomically check and update both users
      await runTransaction(queueRef, (currentData) => {
        if (!currentData) {
          return currentData; // Abort if queue doesn't exist
        }

        const user1 = currentData[userId1];
        const user2 = currentData[userId2];

        // Check if both users exist and are waiting
        if (!user1 || !user2) {
          throw new Error("Unable to connect");
        }

        if (user1.status !== "waiting" || user2.status !== "waiting") {
          throw new Error("Unable to connect");
        }

        // Check if either user already has a partner
        if (user1.partnerId || user2.partnerId) {
          throw new Error("Unable to connect");
        }

        // Atomically update both users to connected
        currentData[userId1].status = "connected";
        currentData[userId1].partnerId = userId2;
        currentData[userId1].connectedAt = Date.now();

        currentData[userId2].status = "connected";
        currentData[userId2].partnerId = userId1;
        currentData[userId2].connectedAt = Date.now();

        return currentData;
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove user from queue and clean up associated data
   * @param userId - User ID to remove from queue
   */
  async removeFromQueue(userId: string): Promise<void> {
    if (!userId) {
      return;
    }

    const userRef = ref(this.db, `queue/${userId}`);

    try {
      // First check if user has a partner
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();
        const partnerId = userData.partnerId;

        // Delete chat immediately if user was connected
        if (partnerId) {
          const channelName = [userId, partnerId].sort().join("_");
          // Delete chat room immediately
          try {
            await chatService.clearChannel(channelName);
          } catch (_chatError) {
            // Ignore errors during cleanup
          }

          // Important: Remove the partner completely from queue to trigger disconnect
          // This ensures the partner sees the disconnect and can search again
          const partnerRef = ref(this.db, `queue/${partnerId}`);
          try {
            await remove(partnerRef);
          } catch (_err) {
            // Ignore errors during cleanup
          }
        }

        // Remove current user from queue
        await remove(userRef);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Subscribe to partner connection events
   * @param userId - User ID to monitor
   * @param callback - Callback function invoked when partner is found
   * @returns Unsubscribe function
   */
  onPartnerConnected(userId: string, callback: (partnerId: string | null) => void): () => void {
    const userRef = ref(this.db, `queue/${userId}`);

    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (userData.status === "connected" && userData.partnerId) {
          callback(userData.partnerId);
        }
      } else {
        callback(null);
      }
    });

    return unsubscribe;
  }

  /**
   * Subscribe to partner disconnection events
   * @param userId - User ID to monitor
   * @param callback - Callback function invoked when partner disconnects
   * @returns Unsubscribe function
   */
  onPartnerDisconnected(userId: string, callback: () => void): () => void {
    const userRef = ref(this.db, `queue/${userId}`);

    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        // Partner disconnected if status changed back to waiting or partnerId removed
        if (userData.status === "waiting" && !userData.partnerId) {
          callback();
        }
      } else {
        // User was removed from queue entirely (partner left)
        callback();
      }
    });

    return unsubscribe;
  }

  /**
   * Get current queue status for debugging purposes
   * @returns Array of all users currently in queue
   */
  async getQueueStatus(): Promise<QueueUser[]> {
    const queueRef = ref(this.db, "queue");
    const snapshot = await get(queueRef);

    if (!snapshot.exists()) return [];

    return Object.values(snapshot.val()) as QueueUser[];
  }

  /**
   * Clean up user data on page leave, removing from queue and clearing chat
   * @param userId - User ID to clean up
   */
  async cleanup(userId: string): Promise<void> {
    try {
      const userRef = ref(this.db, `queue/${userId}`);
      const snapshot = await get(userRef);

      // Delete chat if connected to partner
      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (userData.partnerId) {
          const channelName = [userId, userData.partnerId].sort().join("_");
          try {
            await chatService.clearChannel(channelName);
          } catch (_chatError) {
            // Ignore chat cleanup errors
          }
        }
      }

      await this.removeFromQueue(userId);
      this.userId = null;
    } catch (_error) {
      // Ensure cleanup always completes even if there are errors
      this.userId = null;
    }
  }
}

export const userQueueService = new UserQueueService();
