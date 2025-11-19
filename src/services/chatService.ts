import { getDatabase, ref, push, onChildAdded, onChildRemoved, remove, query, limitToLast, onValue, off } from 'firebase/database';
import app from '@/lib/firebase';

export interface ChatMessage {
  id: string;
  senderId: string;
  message: string;
  timestamp: number;
  type: 'text' | 'system';
}

class ChatService {
  private db = getDatabase(app);
  private listeners: Map<string, any> = new Map();

  // Send message to channel
  async sendMessage(channelName: string, senderId: string, message: string): Promise<void> {
    const messagesRef = ref(this.db, `chats/${channelName}/messages`);
    await push(messagesRef, {
      senderId,
      message,
      timestamp: Date.now(),
      type: 'text',
    });
  }

  // Send system message
  async sendSystemMessage(channelName: string, message: string): Promise<void> {
    const messagesRef = ref(this.db, `chats/${channelName}/messages`);
    await push(messagesRef, {
      senderId: 'system',
      message,
      timestamp: Date.now(),
      type: 'system',
    });
  }

  // Listen to messages in a channel
  onMessage(channelName: string, callback: (message: ChatMessage) => void): () => void {
    const messagesRef = ref(this.db, `chats/${channelName}/messages`);
    const messagesQuery = query(messagesRef, limitToLast(100));

    const listener = onChildAdded(messagesQuery, (snapshot) => {
      const data = snapshot.val();
      const message: ChatMessage = {
        id: snapshot.key || '',
        senderId: data.senderId,
        message: data.message,
        timestamp: data.timestamp,
        type: data.type,
      };
      callback(message);
    });

    this.listeners.set(`messages_${channelName}`, listener);

    // Return unsubscribe function
    return () => {
      off(messagesRef, 'child_added', listener);
      this.listeners.delete(`messages_${channelName}`);
    };
  }

  // Set typing status
  async setTypingStatus(channelName: string, userId: string, isTyping: boolean): Promise<void> {
    const typingRef = ref(this.db, `chats/${channelName}/typing/${userId}`);
    if (isTyping) {
      await push(typingRef, {
        isTyping: true,
        timestamp: Date.now(),
      });
    } else {
      await remove(typingRef);
    }
  }

  // Listen to typing status
  onTypingStatus(channelName: string, userId: string, callback: (isTyping: boolean) => void): () => void {
    const typingRef = ref(this.db, `chats/${channelName}/typing`);

    const listener = onValue(typingRef, (snapshot) => {
      if (snapshot.exists()) {
        const typingUsers = snapshot.val();
        // Check if any user other than current user is typing
        const isAnyoneTyping = Object.keys(typingUsers).some(key => key !== userId);
        callback(isAnyoneTyping);
      } else {
        callback(false);
      }
    });

    this.listeners.set(`typing_${channelName}`, listener);

    return () => {
      off(typingRef, 'value', listener);
      this.listeners.delete(`typing_${channelName}`);
    };
  }

  // Clear all messages in a channel
  async clearChannel(channelName: string): Promise<void> {
    if (!channelName) {
      return;
    }

    try {
      const channelRef = ref(this.db, `chats/${channelName}`);
      await remove(channelRef);
    } catch (error) {
      throw error;
    }
  }

  // Cleanup - remove all listeners
  cleanup(channelName: string): void {
    // Remove message listener
    const messageKey = `messages_${channelName}`;
    if (this.listeners.has(messageKey)) {
      const listener = this.listeners.get(messageKey);
      const messagesRef = ref(this.db, `chats/${channelName}/messages`);
      off(messagesRef, 'child_added', listener);
      this.listeners.delete(messageKey);
    }

    // Remove typing listener
    const typingKey = `typing_${channelName}`;
    if (this.listeners.has(typingKey)) {
      const listener = this.listeners.get(typingKey);
      const typingRef = ref(this.db, `chats/${channelName}/typing`);
      off(typingRef, 'value', listener);
      this.listeners.delete(typingKey);
    }
  }
}

export const chatService = new ChatService();
