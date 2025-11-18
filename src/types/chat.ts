export interface User {
  id: string;
  isAnonymous: boolean;
  interests?: string[];
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  createdAt: number;
  status: "active" | "ended";
}

export interface ChatState {
  isConnected: boolean;
  currentRoom: ChatRoom | null;
  messages: ChatMessage[];
  partnerId: string | null;
}
