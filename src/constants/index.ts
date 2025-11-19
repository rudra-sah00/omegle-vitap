/** Application name */
export const APP_NAME = "ChatConnect";

/** Application route constants */
export const ROUTES = {
  HOME: "/",
  CHAT: "/chat",
  TERMS: "/terms",
} as const;

/** Firebase Realtime Database collection names */
export const FIREBASE_COLLECTIONS = {
  USERS: "users",
  ROOMS: "rooms",
  MESSAGES: "messages",
  WAITING_QUEUE: "waitingQueue",
} as const;

/** Chat event type constants */
export const CHAT_EVENTS = {
  USER_JOINED: "user_joined",
  USER_LEFT: "user_left",
  MESSAGE_SENT: "message_sent",
  TYPING: "typing",
} as const;
