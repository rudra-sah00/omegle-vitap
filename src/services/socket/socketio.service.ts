/**
 * Socket.IO Service
 * Manages WebSocket connection for real-time communication
 */

import { io, Socket } from 'socket.io-client';
import type { ClientMessage, ServerMessage } from '@/types/matchmaking';
import type {
  MessageHandler,
  ErrorHandler,
  CloseHandler,
  OpenHandler,
  ISocketService,
} from './types';

const WS_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY!;

let socketIOInstance: SocketIOService | null = null;
let isCreating = false;

/**
 * Get singleton instance of SocketIOService
 * Prevents multiple instances during React StrictMode double-mounting
 */
export function getSocketIOService(): SocketIOService {
  if (isCreating) {
    const start = Date.now();
    while (!socketIOInstance && Date.now() - start < 100) {
      // Busy wait for max 100ms
    }
  }
  
  if (!socketIOInstance) {
    isCreating = true;
    socketIOInstance = new SocketIOService(WS_URL, API_KEY);
    isCreating = false;
  }
  return socketIOInstance;
}

/**
 * Destroy the singleton instance
 * Should be called on app unmount
 */
export function destroySocketIOService(): void {
  if (socketIOInstance) {
    socketIOInstance.disconnect();
    socketIOInstance = null;
  }
}

/**
 * Socket.IO Service Class
 * Handles all WebSocket communication with the backend
 */
export class SocketIOService implements ISocketService {
  private socket: Socket | null = null;
  private url: string;
  private apiKey: string;
  private messageHandlers: Set<MessageHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private closeHandlers: Set<CloseHandler> = new Set();
  private openHandlers: Set<OpenHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private isIntentionalClose = false;
  private isConnecting = false;

  constructor(url: string, apiKey: string) {
    this.url = url;
    this.apiKey = apiKey;
  }

  /**
   * Establish WebSocket connection
   */
  connect(): void {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isIntentionalClose = false;
    this.isConnecting = true;

    try {
      this.socket = io(this.url, {
        transports: ['websocket', 'polling'],
        auth: { apiKey: this.apiKey },
        reconnection: false,
        autoConnect: false,
        timeout: 10000,
        closeOnBeforeunload: false,
      });

      this.socket.connect();

      this.socket.on('connect', () => {
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.openHandlers.forEach(handler => handler());
      });

      this.socket.on('disconnect', () => {
        this.isConnecting = false;
        if (!this.isIntentionalClose) {
          this.closeHandlers.forEach(handler => handler());
        }
      });

      this.socket.on('connect_error', (error) => {
        this.reconnectAttempts++;
        this.isConnecting = false;
        this.errorHandlers.forEach(handler => 
          handler(new Error(`Connection failed: ${error.message}`))
        );
      });

      this.socket.onAny((eventName: string, ...args: unknown[]) => {
        if (eventName === 'connect' || eventName === 'disconnect' || eventName === 'connect_error') {
          return;
        }
        
        const message = {
          type: eventName,
          data: args[0] || {}
        } as ServerMessage;
        
        this.messageHandlers.forEach(handler => handler(message));
      });

    } catch {
      this.errorHandlers.forEach(handler => 
        handler(new Error('Unable to connect to server'))
      );
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.isIntentionalClose = true;
    this.isConnecting = false;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Send message to server
   */
  send(message: ClientMessage): boolean {
    if (!this.socket?.connected) {
      return false;
    }

    try {
      this.socket.emit(message.type, message.data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Subscribe to messages
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Subscribe to errors
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  /**
   * Subscribe to close events
   */
  onClose(handler: CloseHandler): () => void {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }

  /**
   * Subscribe to open events
   */
  onOpen(handler: OpenHandler): () => void {
    this.openHandlers.add(handler);
    return () => this.openHandlers.delete(handler);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get current connection state
   */
  getConnectionState(): string {
    if (!this.socket) return 'disconnected';
    return this.socket.connected ? 'connected' : 'disconnected';
  }
}
