import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  remove,
  query,
  limitToLast,
  onValue,
  off,
  type DataSnapshot,
} from "firebase/database";
import app from "@/lib/firebase";

/**
 * Represents a chat message in the system
 */
export interface ChatMessage {
  /** Unique message identifier */
  id: string;
  /** ID of the user who sent the message */
  senderId: string;
  /** Message content */
  message: string;
  /** Timestamp when message was sent */
  timestamp: number;
  /** Type of message (text or system notification) */
  type: "text" | "system";
}

/**
 * Service for managing real-time chat functionality using Firebase Realtime Database
 */
class ChatService {
  private db = getDatabase(app);
  private listeners: Map<string, (snapshot: DataSnapshot) => void> = new Map();

  /**
   * Send a text message to a chat channel
   * @param channelName - Name of the chat channel
   * @param senderId - ID of the user sending the message
   * @param message - Message content to send
   */
  async sendMessage(channelName: string, senderId: string, message: string): Promise<void> {
    const messagesRef = ref(this.db, `chats/${channelName}/messages`);
    await push(messagesRef, {
      senderId,
      message,
      timestamp: Date.now(),
      type: "text",
    });
  }

  /**
   * Send a system notification message to a chat channel
   * @param channelName - Name of the chat channel
   * @param message - System message content
   */
  async sendSystemMessage(channelName: string, message: string): Promise<void> {
    const messagesRef = ref(this.db, `chats/${channelName}/messages`);
    await push(messagesRef, {
      senderId: "system",
      message,
      timestamp: Date.now(),
      type: "system",
    });
  }

  /**
   * Subscribe to new messages in a chat channel
   * @param channelName - Name of the chat channel
   * @param callback - Callback function invoked for each new message
   * @returns Unsubscribe function
   */
  onMessage(channelName: string, callback: (message: ChatMessage) => void): () => void {
    const messagesRef = ref(this.db, `chats/${channelName}/messages`);
    const messagesQuery = query(messagesRef, limitToLast(100));

    const listener = onChildAdded(messagesQuery, (snapshot) => {
      const data = snapshot.val();
      const message: ChatMessage = {
        id: snapshot.key || "",
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
      off(messagesRef, "child_added", listener);
      this.listeners.delete(`messages_${channelName}`);
    };
  }

  /**
   * Set user's typing status in a channel
   * @param channelName - Name of the chat channel
   * @param userId - User ID
   * @param isTyping - Whether user is currently typing
   */
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

  /**
   * Subscribe to typing status updates in a channel
   * @param channelName - Name of the chat channel
   * @param userId - Current user's ID (to exclude from typing detection)
   * @param callback - Callback function invoked when typing status changes
   * @returns Unsubscribe function
   */
  onTypingStatus(
    channelName: string,
    userId: string,
    callback: (isTyping: boolean) => void
  ): () => void {
    const typingRef = ref(this.db, `chats/${channelName}/typing`);

    const listener = onValue(typingRef, (snapshot) => {
      if (snapshot.exists()) {
        const typingUsers = snapshot.val();
        // Check if any user other than current user is typing
        const isAnyoneTyping = Object.keys(typingUsers).some((key) => key !== userId);
        callback(isAnyoneTyping);
      } else {
        callback(false);
      }
    });

    this.listeners.set(`typing_${channelName}`, listener);

    return () => {
      off(typingRef, "value", listener);
      this.listeners.delete(`typing_${channelName}`);
    };
  }

  /**
   * Clear all messages and data in a chat channel
   * @param channelName - Name of the chat channel to clear
   * @throws Error if channel cannot be cleared
   */
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

  /**
   * Clean up all listeners for a specific channel
   * @param channelName - Name of the chat channel to clean up
   */
  cleanup(channelName: string): void {
    // Remove message listener
    const messageKey = `messages_${channelName}`;
    if (this.listeners.has(messageKey)) {
      const listener = this.listeners.get(messageKey);
      const messagesRef = ref(this.db, `chats/${channelName}/messages`);
      off(messagesRef, "child_added", listener);
      this.listeners.delete(messageKey);
    }

    // Remove typing listener
    const typingKey = `typing_${channelName}`;
    if (this.listeners.has(typingKey)) {
      const listener = this.listeners.get(typingKey);
      const typingRef = ref(this.db, `chats/${channelName}/typing`);
      off(typingRef, "value", listener);
      this.listeners.delete(typingKey);
    }
  }
}

/**
 * Singleton instance of ChatService
 * Handles real-time chat messaging and message synchronization
 */
export const chatService = new ChatService();
