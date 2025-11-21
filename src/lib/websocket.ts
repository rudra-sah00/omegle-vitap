/**
 * WebSocket Service for Omegle VITAP Backend Integration
 * Handles connection, reconnection, and message routing
 */

import type { ClientMessage, ServerMessage } from '@/types/matchmaking';

type MessageHandler = (message: ServerMessage) => void;
type ErrorHandler = (error: Event | Error) => void;
type CloseHandler = (event: CloseEvent) => void;
type OpenHandler = () => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private apiKey: string;
  private messageHandlers: Set<MessageHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private closeHandlers: Set<CloseHandler> = new Set();
  private openHandlers: Set<OpenHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // Start with 2 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isIntentionalClose = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatIntervalMs = 30000; // 30 seconds

  constructor(url: string, apiKey: string) {
    this.url = url;
    this.apiKey = apiKey;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected');
      return;
    }

    if (this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('[WebSocket] Connection in progress');
      return;
    }

    this.isIntentionalClose = false;

    try {
      // Append API key as query parameter (browser compatible)
      const wsUrl = `${this.url}?apiKey=${encodeURIComponent(this.apiKey)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);

      console.log('[WebSocket] Connecting to:', this.url);
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      this.handleError(error as Error);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isIntentionalClose = true;
    this.clearReconnectTimer();
    this.clearHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnected');
      this.ws = null;
    }

    console.log('[WebSocket] Disconnected');
  }

  /**
   * Send a message to the server
   */
  send(message: ClientMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket] Cannot send message: not connected');
      return false;
    }

    try {
      const jsonMessage = JSON.stringify(message);
      this.ws.send(jsonMessage);
      console.log('[WebSocket] Sent:', message.type, message.data);
      return true;
    } catch (error) {
      console.error('[WebSocket] Send failed:', error);
      return false;
    }
  }

  /**
   * Subscribe to incoming messages
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
   * Get connection state
   */
  getReadyState(): number | null {
    return this.ws?.readyState ?? null;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('[WebSocket] Connected successfully');
    this.reconnectAttempts = 0;
    this.reconnectDelay = 2000;
    this.startHeartbeat();

    this.openHandlers.forEach(handler => handler());
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      // Handle pong response (has type but no data field)
      if (data.type === 'pong') {
        console.log('[WebSocket] Pong received');
        return;
      }
      
      const message = data as ServerMessage;
      console.log('[WebSocket] Received:', message.data?.status || message.type, message.data);

      this.messageHandlers.forEach(handler => handler(message));
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
    }
  }

  /**
   * Handle WebSocket errors
   */
  private handleError(error: Event | Error): void {
    console.error('[WebSocket] Error:', error);
    this.errorHandlers.forEach(handler => handler(error));
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log('[WebSocket] Connection closed:', event.code, event.reason);
    this.clearHeartbeat();

    this.closeHandlers.forEach(handler => handler(event));

    // Attempt reconnection if not intentional
    if (!this.isIntentionalClose) {
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 30000);

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Clear reconnection timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.clearHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping', data: {} });
      }
    }, this.heartbeatIntervalMs);
  }

  /**
   * Clear heartbeat interval
   */
  private clearHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Reset reconnection state
   */
  resetReconnection(): void {
    this.reconnectAttempts = 0;
    this.reconnectDelay = 2000;
    this.clearReconnectTimer();
  }
}

// Singleton instance
let wsInstance: WebSocketService | null = null;

/**
 * Get or create WebSocket service instance
 */
export const getWebSocketService = (): WebSocketService => {
  if (!wsInstance) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;

    if (!wsUrl || !apiKey) {
      throw new Error('WebSocket configuration missing. Set NEXT_PUBLIC_WS_URL and NEXT_PUBLIC_API_KEY in .env.local');
    }

    wsInstance = new WebSocketService(wsUrl, apiKey);
  }

  return wsInstance;
};

/**
 * Destroy WebSocket service instance
 */
export const destroyWebSocketService = (): void => {
  if (wsInstance) {
    wsInstance.disconnect();
    wsInstance = null;
  }
};
