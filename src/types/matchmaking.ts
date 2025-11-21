/**
 * WebSocket Types for Omegle VITAP Backend Integration
 * Based on backend API documentation
 */

// Message Types
export type MessageType = 'join' | 'leave' | 'cancel' | 'ping' | 'response';

// Status Types
export type MatchStatus = 'waiting' | 'matched' | 'left' | 'partner_left' | 'cancelled' | 'error' | 'pong';

// User Data
export interface UserData {
  uid: number;
  name: string;
  gender?: 'male' | 'female' | 'other';
}

// Partner Information
export interface PartnerInfo {
  uid: number;
  name: string;
  gender?: string;
}

// Match Data (received when matched)
export interface MatchData {
  status: 'matched';
  roomId: string;
  channelName: string;
  rtcToken: string;
  rtmToken: string;
  partner: PartnerInfo;
}

// Waiting Response
export interface WaitingResponse {
  status: 'waiting';
  message: string;
}

// Left Response
export interface LeftResponse {
  status: 'left';
  message: string;
}

// Partner Left Response
export interface PartnerLeftResponse {
  status: 'partner_left';
  message: string;
}

// Error Response
export interface ErrorResponse {
  status: 'error';
  message: string;
}

// Pong Response
export interface PongResponse {
  status: 'pong';
  message: string;
}

// Cancelled Response
export interface CancelledResponse {
  status: 'cancelled';
  message: string;
}

// Union type for all response data
export type ResponseData =
  | MatchData
  | WaitingResponse
  | LeftResponse
  | PartnerLeftResponse
  | CancelledResponse
  | ErrorResponse
  | PongResponse;

// Client Messages (sent to server)
export interface JoinMessage {
  type: 'join';
  data: UserData;
}

export interface LeaveMessage {
  type: 'leave';
  data: Record<string, never>; // empty object
}

export interface PingMessage {
  type: 'ping';
  data: Record<string, never>; // empty object
}

export interface CancelMessage {
  type: 'cancel';
  data: UserData;
}

export type ClientMessage = JoinMessage | LeaveMessage | CancelMessage | PingMessage;

// Server Messages (received from server)
export interface ServerMessage {
  type: 'response';
  data: ResponseData;
}

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
