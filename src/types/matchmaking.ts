/**
 * WebSocket Types for Omegle VITAP Backend Integration
 * Based on backend API documentation v1.0.0
 * Last Updated: November 22, 2025
 */

// Message Types
export type MessageType = 'join' | 'leave' | 'cancel' | 'message' | 'typing' | 'signal' | 'ping';

// Server Message Types
export type ServerMessageType = 'match' | 'reconnected' | 'session_expired' | 'leave' | 'cancel' | 'partner_left' | 'error' | 'message' | 'typing' | 'signal' | 'pong';

// Status Types
export type MatchStatus = 'idle' | 'searching' | 'active';

// User State
export type UserState = 'idle' | 'searching' | 'active';

// User Data
export interface UserData {
  uid: number;
  name: string;
  gender: 'male' | 'female' | 'other';
}

// Join Data (for join message)
export interface JoinData {
  uid: number;
  name: string;
  gender: 'male' | 'female' | 'other';
}

// Partner Information
export interface PartnerInfo {
  uid: number;
  name: string;
  gender?: string;
}

// Match Data - Waiting status
export interface MatchDataWaiting {
  status: 'waiting';
  message: string;
  queuePosition: number;
}

// Match Data - Matched status
export interface MatchDataMatched {
  status: 'matched';
  roomId: string;
  channelName: string;
  rtcToken: string;
  rtmToken: string;
  partnerName: string;
  partnerUid: number;
  expiresAt: number;
}

// Union type for match responses
export type MatchData = MatchDataWaiting | MatchDataMatched;

// Reconnected Response
export interface ReconnectedData {
  status: 'reconnected';
  roomId: string;
  channelName: string;
  partnerUid: number;
  message: string;
}

// Session Expired Response
export interface SessionExpiredData {
  message: string;
}

// Leave Response
export interface LeaveData {
  status: 'left';
}

// Cancel Response
export interface CancelData {
  status: 'cancelled';
}

// Partner Left Response
export interface PartnerLeftData {
  reason: string;
}

// Error Response
export interface ErrorData {
  code: string;
  message: string;
}

// Message Response (chat message from partner)
export interface MessageData {
  from: number;
  text: string;
  timestamp: number;
}

// Signal Response (WebRTC signaling from partner)
export interface SignalData {
  signal: RTCSignal;
}

// WebRTC Signal Types
export interface RTCOfferSignal {
  type: 'offer';
  sdp: string;
}

export interface RTCAnswerSignal {
  type: 'answer';
  sdp: string;
}

export interface RTCCandidateSignal {
  type: 'candidate';
  candidate: string;
  sdpMid: string;
  sdpMLineIndex: number;
}

export type RTCSignal = RTCOfferSignal | RTCAnswerSignal | RTCCandidateSignal;

// Client Messages (sent to server)
export interface JoinMessage {
  type: 'join';
  data: JoinData;
}

export interface LeaveMessage {
  type: 'leave';
  data: Record<string, never>; // empty object
}

export interface CancelMessage {
  type: 'cancel';
  data: Record<string, never>; // empty object
}

export interface ChatMessage {
  type: 'message';
  data: {
    text: string;
  };
}

export interface SignalMessage {
  type: 'signal';
  data: {
    signal: RTCSignal;
  };
}

export interface PingMessage {
  type: 'ping';
  data: Record<string, never>; // empty object
}

export interface TypingIndicatorMessage {
  type: 'typing';
  data: {
    isTyping: boolean;
  };
}

export type ClientMessage = 
  | JoinMessage 
  | LeaveMessage 
  | CancelMessage 
  | ChatMessage
  | TypingIndicatorMessage
  | SignalMessage
  | PingMessage;

// Server Messages (received from server)
export interface MatchMessage {
  type: 'match';
  data: MatchData;
}

export interface ReconnectedMessage {
  type: 'reconnected';
  data: ReconnectedData;
}

export interface SessionExpiredMessage {
  type: 'session_expired';
  data: SessionExpiredData;
}

export interface ServerLeaveMessage {
  type: 'leave';
  data: LeaveData;
}

export interface ServerCancelMessage {
  type: 'cancel';
  data: CancelData;
}

export interface PartnerLeftMessage {
  type: 'partner_left';
  data: PartnerLeftData;
}

export interface ErrorMessage {
  type: 'error';
  data: ErrorData;
}

export interface IncomingChatMessage {
  type: 'message';
  data: MessageData;
}

export interface IncomingSignalMessage {
  type: 'signal';
  data: SignalData;
}

export interface PongMessage {
  type: 'pong';
  data: Record<string, never>;
}

export interface IncomingTypingIndicatorMessage {
  type: 'typing';
  data: {
    isTyping: boolean;
  };
}

export type ServerMessage = 
  | MatchMessage
  | ReconnectedMessage
  | SessionExpiredMessage
  | ServerLeaveMessage
  | ServerCancelMessage
  | PartnerLeftMessage
  | ErrorMessage
  | IncomingChatMessage
  | IncomingTypingIndicatorMessage
  | IncomingSignalMessage
  | PongMessage;

// WebSocket Connection States
export type ConnectionState = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'waiting'
  | 'matched'
  | 'error';

// Match State
export interface MatchState {
  connectionState: ConnectionState;
  isMatched: boolean;
  matchData: MatchData | null;
  error: string | null;
}
