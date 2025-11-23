import { io, Socket } from 'socket.io-client';
import type { ClientMessage, ServerMessage } from '@/types/matchmaking';

type MessageHandler = (message: ServerMessage) => void;
type ErrorHandler = (error: Error) => void;
type CloseHandler = () => void;
type OpenHandler = () => void;

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'dev-api-key-2024';

let socketIOInstance: SocketIOService | null = null;
let isCreating = false;

export const getSocketIOService = (): SocketIOService => {
  // Prevent multiple instances during React StrictMode double-mounting
  if (isCreating) {
    // Wait for the instance to be created
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
};

export const destroySocketIOService = (): void => {
  if (socketIOInstance) {
    socketIOInstance.disconnect();
    socketIOInstance = null;
  }
};

class SocketIOService {
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

  connect(): void {
    // Prevent multiple connection attempts
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
        autoConnect: false, // Don't auto-connect, we'll call connect() manually
        timeout: 10000,
      });

      // Manually connect
      this.socket.connect();

      this.socket.on('connect', () => {
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.openHandlers.forEach(handler => handler());
      });

      this.socket.on('disconnect', (reason) => {
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

      this.socket.onAny((eventName: string, ...args: any[]) => {
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
      this.errorHandlers.forEach(handler => 
        handler(new Error('Unable to connect to server'))
      );
    }
  }

  disconnect(): void {
    this.isIntentionalClose = true;
    this.isConnecting = false;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  send(message: ClientMessage): boolean {
    if (!this.socket?.connected) {
      return false;
    }

    try {
      this.socket.emit(message.type, message.data);
      return true;
    } catch (error) {
      return false;
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  onClose(handler: CloseHandler): () => void {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }

  onOpen(handler: OpenHandler): () => void {
    this.openHandlers.add(handler);
    return () => this.openHandlers.delete(handler);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionState(): string {
    if (!this.socket) return 'disconnected';
    return this.socket.connected ? 'connected' : 'disconnected';
  }
}

export type { SocketIOService };
