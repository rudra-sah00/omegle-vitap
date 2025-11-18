import { getDatabase, ref, set, get, remove, onValue, push, update, serverTimestamp, onDisconnect } from 'firebase/database';
import app from '@/lib/firebase';
import { chatService } from './chatService';

export interface QueueUser {
  userId: string;
  status: 'waiting' | 'connected';
  partnerId?: string;
  timestamp: number;
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
  async addToQueue(userId: string): Promise<void> {
    if (!userId) {
      console.error('Cannot add to queue: userId is undefined');
      return;
    }

    const userRef = ref(this.db, `queue/${userId}`);
    await set(userRef, {
      userId,
      status: 'waiting',
      timestamp: serverTimestamp(),
    });

    // Setup auto-cleanup if user disconnects unexpectedly
    const disconnectRef = onDisconnect(userRef);
    await disconnectRef.remove();
    console.log(`Auto-cleanup enabled for ${userId}`);
  }

  // Find a random waiting partner (excluding current user)
  async findPartner(currentUserId: string): Promise<string | null> {
    const queueRef = ref(this.db, 'queue');
    const snapshot = await get(queueRef);

    if (!snapshot.exists()) return null;

    const users = snapshot.val();
    const waitingUsers = Object.values(users).filter(
      (user: any) => user.status === 'waiting' && user.userId !== currentUserId
    ) as QueueUser[];

    if (waitingUsers.length === 0) return null;

    // Pick random waiting user
    const randomIndex = Math.floor(Math.random() * waitingUsers.length);
    return waitingUsers[randomIndex].userId;
  }

  // Try to match immediately (atomic operation with retry)
  async tryInstantMatch(currentUserId: string, retryCount: number = 0): Promise<string | null> {
    const MAX_RETRIES = 3;
    
    if (retryCount >= MAX_RETRIES) {
      console.log('Max retries reached for instant match');
      return null;
    }

    const queueRef = ref(this.db, 'queue');
    const snapshot = await get(queueRef);

    if (!snapshot.exists()) return null;

    const users = snapshot.val();
    const waitingUsers = Object.values(users).filter(
      (user: any) => user.status === 'waiting' && user.userId !== currentUserId
    ) as QueueUser[];

    if (waitingUsers.length === 0) return null;

    // Pick random waiting user
    const randomIndex = Math.floor(Math.random() * waitingUsers.length);
    const partner = waitingUsers[randomIndex];

    if (!partner || !partner.userId) {
      console.error('Invalid partner data');
      return null;
    }

    // Verify partner still waiting before marking connected
    const partnerRef = ref(this.db, `queue/${partner.userId}`);
    const partnerSnapshot = await get(partnerRef);
    
    if (!partnerSnapshot.exists() || partnerSnapshot.val()?.status !== 'waiting') {
      console.log('Partner no longer available, retrying...');
      return this.tryInstantMatch(currentUserId, retryCount + 1); // Retry with another partner
    }

    // Immediately mark both as connected
    try {
      await this.markAsConnected(currentUserId, partner.userId);
      return partner.userId;
    } catch (error) {
      console.error('Failed to mark as connected, retrying...', error);
      return this.tryInstantMatch(currentUserId, retryCount + 1);
    }
  }

  // Mark two users as connected
  async markAsConnected(userId1: string, userId2: string): Promise<void> {
    if (!userId1 || !userId2) {
      console.error('Cannot mark as connected: userId is undefined');
      return;
    }

    const updates: Record<string, any> = {};
    updates[`queue/${userId1}/status`] = 'connected';
    updates[`queue/${userId1}/partnerId`] = userId2;
    updates[`queue/${userId2}/status`] = 'connected';
    updates[`queue/${userId2}/partnerId`] = userId1;

    try {
      await update(ref(this.db), updates);
      console.log(`Marked ${userId1} and ${userId2} as connected`);
    } catch (error) {
      console.error('Failed to mark users as connected:', error);
      throw error;
    }
  }

  // Remove user from queue (on disconnect/next)
  async removeFromQueue(userId: string): Promise<void> {
    if (!userId) {
      console.error('Cannot remove from queue: userId is undefined');
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
            console.log(`Chat channel ${channelName} deleted immediately`);
          } catch (chatError) {
            console.error('Failed to clear chat channel:', chatError);
          }

          // Set partner back to waiting (don't block on this)
          const partnerRef = ref(this.db, `queue/${partnerId}`);
          update(partnerRef, {
            status: 'waiting',
            partnerId: null,
          }).catch(err => console.error('Failed to update partner status:', err));
        }

        // Remove current user from queue
        await remove(userRef);
        console.log(`User ${userId} removed from queue`);
      }
    } catch (error) {
      console.error('Failed to remove user from queue:', error);
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
    const userRef = ref(this.db, `queue/${userId}`);
    const snapshot = await get(userRef);
    
    // Delete chat if connected to partner
    if (snapshot.exists()) {
      const userData = snapshot.val();
      if (userData.partnerId) {
        const channelName = [userId, userData.partnerId].sort().join('_');
        await chatService.clearChannel(channelName);
        console.log(`Cleanup: Chat channel ${channelName} deleted`);
      }
    }
    
    await this.removeFromQueue(userId);
    this.userId = null;
  }
}

export const userQueueService = new UserQueueService();
