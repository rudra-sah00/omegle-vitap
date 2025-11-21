export interface User {
  id: string;
  username?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
}
