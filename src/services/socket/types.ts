/**
 * Socket.IO Service Types
 * Type definitions for WebSocket communication
 */

import type { ClientMessage, ServerMessage } from '@/types/matchmaking';

export type MessageHandler = (message: ServerMessage) => void;
export type ErrorHandler = (error: Error) => void;
export type CloseHandler = () => void;
export type OpenHandler = () => void;

export interface SocketServiceConfig {
  url: string;
  apiKey: string;
}

export interface ISocketService {
  connect(): void;
  disconnect(): void;
  send(message: ClientMessage): boolean;
  onMessage(handler: MessageHandler): () => void;
  onError(handler: ErrorHandler): () => void;
  onClose(handler: CloseHandler): () => void;
  onOpen(handler: OpenHandler): () => void;
  isConnected(): boolean;
  getConnectionState(): string;
}
