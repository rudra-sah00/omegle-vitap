import { database } from "@/lib/firebase";
import { ref, set, get, remove, onValue, off } from "firebase/database";
import { FIREBASE_COLLECTIONS } from "@/constants";
import type { ChatRoom, ChatMessage } from "@/types";

export class ChatService {
  static async createRoom(roomId: string, participants: string[]): Promise<void> {
    const roomRef = ref(database, `${FIREBASE_COLLECTIONS.ROOMS}/${roomId}`);
    const room: ChatRoom = {
      id: roomId,
      participants,
      createdAt: Date.now(),
      status: "active",
    };
    await set(roomRef, room);
  }

  static async sendMessage(roomId: string, message: ChatMessage): Promise<void> {
    const messageRef = ref(
      database,
      `${FIREBASE_COLLECTIONS.MESSAGES}/${roomId}/${message.id}`
    );
    await set(messageRef, message);
  }

  static subscribeToMessages(
    roomId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    const messagesRef = ref(database, `${FIREBASE_COLLECTIONS.MESSAGES}/${roomId}`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const messages: ChatMessage[] = data ? Object.values(data) : [];
      callback(messages.sort((a, b) => a.timestamp - b.timestamp));
    });

    return () => off(messagesRef);
  }

  static async endRoom(roomId: string): Promise<void> {
    const roomRef = ref(database, `${FIREBASE_COLLECTIONS.ROOMS}/${roomId}`);
    await remove(roomRef);
    
    const messagesRef = ref(database, `${FIREBASE_COLLECTIONS.MESSAGES}/${roomId}`);
    await remove(messagesRef);
  }
}
