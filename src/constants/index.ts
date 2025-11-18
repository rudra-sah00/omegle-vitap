export const APP_NAME = "ChatConnect";

export const ROUTES = {
  HOME: "/",
  CHAT: "/chat",
  TERMS: "/terms",
} as const;

export const FIREBASE_COLLECTIONS = {
  USERS: "users",
  ROOMS: "rooms",
  MESSAGES: "messages",
  WAITING_QUEUE: "waitingQueue",
} as const;

export const CHAT_EVENTS = {
  USER_JOINED: "user_joined",
  USER_LEFT: "user_left",
  MESSAGE_SENT: "message_sent",
  TYPING: "typing",
} as const;
