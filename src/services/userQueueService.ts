import { getDatabase, ref, set, get, remove, onValue, push, update, serverTimestamp } from 'firebase/database';
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

  // Add user to waiting queue
  async addToQueue(userId: string): Promise<void> {
    const userRef = ref(this.db, `queue/${userId}`);
    await set(userRef, {
      userId,
      status: 'waiting',
      timestamp: serverTimestamp(),
    });
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

  // Try to match immediately (atomic operation)
  async tryInstantMatch(currentUserId: string): Promise<string | null> {
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

    // Immediately mark both as connected
    await this.markAsConnected(currentUserId, partner.userId);
    
    return partner.userId;
  }

  // Mark two users as connected
  async markAsConnected(userId1: string, userId2: string): Promise<void> {
    const updates: Record<string, any> = {};
    updates[`queue/${userId1}/status`] = 'connected';
    updates[`queue/${userId1}/partnerId`] = userId2;
    updates[`queue/${userId2}/status`] = 'connected';
    updates[`queue/${userId2}/partnerId`] = userId1;

    await update(ref(this.db), updates);
  }

  // Remove user from queue (on disconnect/next)
  async removeFromQueue(userId: string): Promise<void> {
    const userRef = ref(this.db, `queue/${userId}`);
    
    // First check if user has a partner
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const userData = snapshot.val();
      const partnerId = userData.partnerId;

      // Create channel name to delete chat
      if (partnerId) {
        const channelName = [userId, partnerId].sort().join('_');
        // Delete chat room immediately
        await chatService.clearChannel(channelName);
        console.log(`Chat channel ${channelName} deleted`);
      }

      // Remove current user
      await remove(userRef);

      // If partner exists, set them back to waiting
      if (partnerId) {
        const partnerRef = ref(this.db, `queue/${partnerId}`);
        await update(partnerRef, {
          status: 'waiting',
          partnerId: null,
        });
      }
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
