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
  private maxReconnectAttempts = 3; // Reduced from 5 to 3
  private reconnectDelay = 2000; // Start with 2 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isIntentionalClose = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatIntervalMs = 25000; // 25 seconds (backend sends ping every 30s)
  private missedPongs = 0;
  private maxMissedPongs = 2;
  private consecutiveFailures = 0;
  private maxConsecutiveFailures = 3; // Stop after 3 consecutive connection failures
  private isAuthenticated = false; // Track authentication state (via auth message)

  private visibilityHandlerSetup = false;

  constructor(url: string, apiKey: string) {
    this.url = url;
    this.apiKey = apiKey;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    // Setup visibility handler on first connect
    if (!this.visibilityHandlerSetup) {
      this.setupVisibilityHandler();
      this.visibilityHandlerSetup = true;
    }

    this.isIntentionalClose = false;

    try {
      // Connect with API key - then authenticate via auth message
      const wsUrl = `${this.url}?apiKey=${encodeURIComponent(this.apiKey)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);

      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.ws?.readyState === WebSocket.CONNECTING) {
          this.consecutiveFailures++;
          this.ws.close();
          
          // Stop trying if server is consistently unavailable
          if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
            this.isIntentionalClose = true;
            this.handleError(new Error('Backend server is unavailable. Please check if the server is running.'));
          } else {
            this.handleError(new Error('Backend server is not responding. Please try again later.'));
          }
        }
      }, 5000); // 5 second timeout (reduced from 10)
      
      // Clear timeout on successful connection
      if (this.ws) {
        const ws = this.ws; // Store in local variable
        const originalOnOpen = ws.onopen;
        ws.onopen = (event) => {
          clearTimeout(connectionTimeout);
          originalOnOpen?.call(ws, event);
        };
      }
    } catch (error) {
      this.handleError(new Error('Unable to connect to backend server. Please check if the server is running.'));
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
  }

  /**
   * Send a message to the server
   */
  send(message: ClientMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const jsonMessage = JSON.stringify(message);
      this.ws.send(jsonMessage);
      return true;
    } catch (error) {
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
   * Check if authenticated
   */
  isAuth(): boolean {
    return this.isAuthenticated && this.isConnected();
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    this.reconnectAttempts = 0;
    this.consecutiveFailures = 0; // Reset consecutive failures on successful connection
    this.reconnectDelay = 2000;
    this.isAuthenticated = false; // Reset auth state on new connection
    this.startHeartbeat();

    this.openHandlers.forEach(handler => handler());
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      // Handle pong response
      if (data.type === 'pong') {
        this.missedPongs = 0; // Reset missed pongs counter
        return;
      }
      
      // Track authentication state
      if (data.type === 'authenticated') {
        this.isAuthenticated = true;
      }
      
      const message = data as ServerMessage;

      this.messageHandlers.forEach(handler => handler(message));
    } catch (error) {
      // Silently ignore malformed messages
    }
  }

  /**
   * Handle WebSocket errors
   */
  private handleError(error: Event | Error): void {
    this.errorHandlers.forEach(handler => handler(error));
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this.clearHeartbeat();

    this.closeHandlers.forEach(handler => handler(event));

    // Check if this is an authentication error (code 1008 = policy violation, 4001 = unauthorized)
    const isAuthError = event.code === 1008 || event.code === 4001 || event.code === 1002;
    
    // If authentication failed, don't reconnect
    if (isAuthError) {
      this.isIntentionalClose = true;
      this.handleError(new Error('Authentication failed. Please check your API key.'));
      return;
    }

    // Check if connection was never established (server unreachable)
    if (event.code === 1006 && !event.wasClean) {
      this.consecutiveFailures++;
      
      // Stop trying if server is consistently unreachable
      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        this.isIntentionalClose = true;
        this.handleError(new Error('Cannot connect to server. Please ensure the backend is running on localhost:8080.'));
        return;
      }
    }

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
      this.handleError(new Error('Maximum reconnection attempts reached. Please refresh the page.'));
      return;
    }

    // Don't reconnect if it was marked as intentional close (e.g., auth error)
    if (this.isIntentionalClose) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 30000);

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
    this.missedPongs = 0;
    
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
    this.missedPongs = 0;
  }

  /**
   * Setup page visibility handler to reconnect when page becomes visible
   */
  private setupVisibilityHandler(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
      } else {
        // Check if connection is still alive
        if (!this.isConnected() && !this.isIntentionalClose) {
          this.connect();
        }
      }
    });
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
 * Get or create WebSocket service instance (does NOT auto-connect)
 * 
 * Two-step authentication:
 * 1. API key in query param for WebSocket connection
 * 2. Auth message with uid/name/gender after connection
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
