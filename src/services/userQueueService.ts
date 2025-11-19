import { getDatabase, ref, set, get, remove, onValue, push, update, serverTimestamp, onDisconnect, runTransaction } from 'firebase/database';
import app from '@/lib/firebase';
import { chatService } from './chatService';

export interface QueueUser {
  userId: string;
  status: 'waiting' | 'connected';
  partnerId?: string;
  timestamp: number;
  gender?: 'male' | 'female' | 'other';
  name?: string;
  year?: string;
  interests?: string;
  recentPartners?: string[]; // Track last 5 partners to avoid consecutive matches
}

class UserQueueService {
  private db = getDatabase(app);
  private userId: string | null = null;

  // Generate random user ID
  generateUserId(): string {
    const randomId = `user_${Math.random().toString(36).substring(2, 15)}${Date.now()}`;
    this.userId = randomId;
    return randomId;
  }

  getCurrentUserId(): string | null {
    return this.userId;
  }

  // Add user to waiting queue with auto-cleanup on disconnect
  async addToQueue(userId: string, gender?: string, name?: string, year?: string, interests?: string, recentPartners?: string[]): Promise<void> {
    if (!userId) {
      return;
    }

    const userRef = ref(this.db, `queue/${userId}`);
    await set(userRef, {
      userId,
      status: 'waiting',
      timestamp: serverTimestamp(),
      gender: gender || 'other',
      name: name || 'Anonymous',
      year: year || '',
      interests: interests || '',
      recentPartners: recentPartners || [], // Include recent partners list
    });

    // Setup auto-cleanup if user disconnects unexpectedly
    const disconnectRef = onDisconnect(userRef);
    await disconnectRef.remove();
  }

  // Find a random waiting partner with gender preference (excluding current user and recent partners)
  async findPartner(currentUserId: string, currentUserGender?: string): Promise<string | null> {
    const queueRef = ref(this.db, 'queue');
    const snapshot = await get(queueRef);

    if (!snapshot.exists()) return null;

    const users = snapshot.val();
    const currentUser = users[currentUserId] as QueueUser;
    const recentPartnerIds = currentUser?.recentPartners || [];

    // CRITICAL: Only match with users who are waiting AND have no partner AND not recently matched
    const waitingUsers = Object.values(users).filter(
      (user: any) => 
        user.status === 'waiting' && 
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

  // Helper: Filter users by opposite gender
  private filterByOppositeGender(users: QueueUser[], currentGender: string): QueueUser[] {
    if (currentGender === 'male') {
      return users.filter(u => u.gender === 'female');
    } else if (currentGender === 'female') {
      return users.filter(u => u.gender === 'male');
    } else {
      // For 'other', match with male or female
      return users.filter(u => u.gender === 'male' || u.gender === 'female');
    }
  }

  // Try to match immediately (atomic operation with retry and gender preference)
  async tryInstantMatch(currentUserId: string, retryCount: number = 0): Promise<string | null> {
    const MAX_RETRIES = 3;
    
    if (retryCount >= MAX_RETRIES) {
      return null;
    }

    const queueRef = ref(this.db, 'queue');
    const snapshot = await get(queueRef);

    if (!snapshot.exists()) return null;

    const users = snapshot.val();
    
    // Get current user's gender and recent partners
    const currentUser = users[currentUserId] as QueueUser;
    const currentUserGender = currentUser?.gender;
    const recentPartnerIds = currentUser?.recentPartners || [];

    // CRITICAL: Only match with users who are waiting AND have no partner AND not recently matched
    const waitingUsers = Object.values(users).filter(
      (user: any) => 
        user.status === 'waiting' && 
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
    if (!partnerSnapshot.exists() || 
        partnerData?.status !== 'waiting' || 
        partnerData?.partnerId) { // Check if already has partner
      return this.tryInstantMatch(currentUserId, retryCount + 1); // Retry with another partner
    }

    // Immediately mark both as connected using atomic transaction
    try {
      await this.markAsConnected(currentUserId, partner.userId);
      // Add partner to recent partners list for both users
      await this.addToRecentPartners(currentUserId, partner.userId);
      await this.addToRecentPartners(partner.userId, currentUserId);
      return partner.userId;
    } catch (error) {
      return this.tryInstantMatch(currentUserId, retryCount + 1);
    }
  }

  // Add partner to recent partners list (keep last 5)
  private async addToRecentPartners(userId: string, partnerId: string): Promise<void> {
    const userRef = ref(this.db, `queue/${userId}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      const recentPartners = userData.recentPartners || [];
      
      // Add new partner and keep only last 5
      const updatedRecent = [partnerId, ...recentPartners.filter((id: string) => id !== partnerId)].slice(0, 5);
      
      await update(userRef, {
        recentPartners: updatedRecent
      });
    }
  }

  // Mark two users as connected (atomic transaction to prevent race conditions)
  async markAsConnected(userId1: string, userId2: string): Promise<void> {
    if (!userId1 || !userId2) {
      return;
    }

    const queueRef = ref(this.db, 'queue');
    
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
          throw new Error('Unable to connect');
        }

        if (user1.status !== 'waiting' || user2.status !== 'waiting') {
          throw new Error('Unable to connect');
        }

        // Check if either user already has a partner
        if (user1.partnerId || user2.partnerId) {
          throw new Error('Unable to connect');
        }

        // Atomically update both users to connected
        currentData[userId1].status = 'connected';
        currentData[userId1].partnerId = userId2;
        currentData[userId1].connectedAt = Date.now();
        
        currentData[userId2].status = 'connected';
        currentData[userId2].partnerId = userId1;
        currentData[userId2].connectedAt = Date.now();

        return currentData;
      });
    } catch (error) {
      throw error;
    }
  }

  // Remove user from queue (on disconnect/next)
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
          const channelName = [userId, partnerId].sort().join('_');
          // Delete chat room immediately
          try {
            await chatService.clearChannel(channelName);
          } catch (chatError) {
            // Ignore errors during cleanup
          }

          // Important: Remove the partner completely from queue to trigger disconnect
          // This ensures the partner sees the disconnect and can search again
          const partnerRef = ref(this.db, `queue/${partnerId}`);
          try {
            await remove(partnerRef);
          } catch (err) {
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

  // Listen for partner connection
  onPartnerConnected(userId: string, callback: (partnerId: string | null) => void): () => void {
    const userRef = ref(this.db, `queue/${userId}`);
    
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (userData.status === 'connected' && userData.partnerId) {
          callback(userData.partnerId);
        }
      } else {
        callback(null);
      }
    });

    return unsubscribe;
  }

  // Listen for partner disconnect
  onPartnerDisconnected(userId: string, callback: () => void): () => void {
    const userRef = ref(this.db, `queue/${userId}`);
    
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        // Partner disconnected if status changed back to waiting or partnerId removed
        if (userData.status === 'waiting' && !userData.partnerId) {
          callback();
        }
      } else {
        // User was removed from queue entirely (partner left)
        callback();
      }
    });

    return unsubscribe;
  }

  // Get queue status (for debugging)
  async getQueueStatus(): Promise<QueueUser[]> {
    const queueRef = ref(this.db, 'queue');
    const snapshot = await get(queueRef);
    
    if (!snapshot.exists()) return [];
    
    return Object.values(snapshot.val()) as QueueUser[];
  }

  // Cleanup - remove user on page leave
  async cleanup(userId: string): Promise<void> {
    try {
      const userRef = ref(this.db, `queue/${userId}`);
      const snapshot = await get(userRef);
      
      // Delete chat if connected to partner
      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (userData.partnerId) {
          const channelName = [userId, userData.partnerId].sort().join('_');
          try {
            await chatService.clearChannel(channelName);
          } catch (chatError) {
            // Ignore chat cleanup errors
          }
        }
      }
      
      await this.removeFromQueue(userId);
      this.userId = null;
    } catch (error) {
      // Ensure cleanup always completes even if there are errors
      this.userId = null;
    }
  }
}

export const userQueueService = new UserQueueService();
