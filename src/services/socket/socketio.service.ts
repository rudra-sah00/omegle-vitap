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

const WS_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

/** Singleton instance */
let socketIOInstance: SocketIOService | null = null;

/** Lock to prevent race conditions during creation */
let creationLock: Promise<SocketIOService> | null = null;

/**
 * Get singleton instance of SocketIOService
 * Uses a promise-based lock to prevent race conditions during React StrictMode
 */
export function getSocketIOService(): SocketIOService {
  // Return existing instance immediately
  if (socketIOInstance) {
    return socketIOInstance;
  }
  
  // Create new instance (synchronous for compatibility)
  socketIOInstance = new SocketIOService(WS_URL, API_KEY);
  return socketIOInstance;
}

/**
 * Get singleton instance asynchronously (preferred for new code)
 * Safely handles concurrent access
 */
export async function getSocketIOServiceAsync(): Promise<SocketIOService> {
  if (socketIOInstance) {
    return socketIOInstance;
  }

  // If creation is in progress, wait for it
  if (creationLock) {
    return creationLock;
  }

  // Create with lock to prevent race conditions
  creationLock = Promise.resolve().then(() => {
    if (!socketIOInstance) {
      socketIOInstance = new SocketIOService(WS_URL, API_KEY);
    }
    creationLock = null;
    return socketIOInstance;
  });

  return creationLock;
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
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelays = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff
  private isIntentionalClose = false;
  private isConnecting = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(url: string, apiKey: string) {
    this.url = url;
    this.apiKey = apiKey;
  }

  /**
   * Establish WebSocket connection with automatic reconnection
   */
  connect(): void {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    // Validate configuration
    if (!this.url) {
      this.errorHandlers.forEach(handler => 
        handler(new Error('Backend URL not configured. Check NEXT_PUBLIC_BACKEND_URL.'))
      );
      return;
    }

    this.isIntentionalClose = false;
    this.isConnecting = true;

    try {
      this.socket = io(this.url, {
        transports: ['websocket', 'polling'],
        auth: { apiKey: this.apiKey },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 16000,
        autoConnect: false,
        timeout: 10000,
        closeOnBeforeunload: false,
      });

      this.socket.connect();

      this.socket.on('connect', () => {
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.clearReconnectTimer();
        this.openHandlers.forEach(handler => handler());
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnecting = false;
        if (!this.isIntentionalClose) {
          this.closeHandlers.forEach(handler => handler());
          // Attempt manual reconnection for certain disconnect reasons
          if (reason === 'io server disconnect' || reason === 'transport close') {
            this.scheduleReconnect();
          }
        }
      });

      this.socket.on('connect_error', (error) => {
        this.reconnectAttempts++;
        this.isConnecting = false;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.errorHandlers.forEach(handler => 
            handler(new Error(`Connection failed after ${this.maxReconnectAttempts} attempts: ${error.message}`))
          );
        } else {
          // Schedule reconnection
          this.scheduleReconnect();
        }
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

    } catch (error) {
      this.isConnecting = false;
      this.errorHandlers.forEach(handler => 
        handler(new Error(`Unable to connect to server: ${error instanceof Error ? error.message : 'Unknown error'}`))
      );
    }
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.isIntentionalClose || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.clearReconnectTimer();
    
    const delay = this.reconnectDelays[Math.min(this.reconnectAttempts, this.reconnectDelays.length - 1)];
    
    this.reconnectTimer = setTimeout(() => {
      if (!this.isIntentionalClose && !this.socket?.connected) {
        this.socket?.connect();
      }
    }, delay);
  }

  /**
   * Clear any pending reconnection timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.isIntentionalClose = true;
    this.isConnecting = false;
    this.clearReconnectTimer();
    this.reconnectAttempts = 0;
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
      // Socket emit failed - likely disconnected, return false to signal failure
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
