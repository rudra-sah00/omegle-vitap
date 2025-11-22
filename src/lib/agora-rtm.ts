/**
 * Agora RTM Service for Real-time Messaging
 */

import AgoraRTM from 'agora-rtm-sdk';

export interface AgoraRTMConfig {
  channelName: string;
  token: string;
}

export interface MessageData {
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
}

export class AgoraRTMService {
  private client: any = null;
  private channel: string | null = null;
  private isLoggedIn = false;
  private isChannelJoined = false;
  private currentUserId: string | null = null;

  // Callbacks
  private onMessageReceived?: (message: MessageData) => void;
  private onMemberJoined?: (memberId: string) => void;
  private onMemberLeft?: (memberId: string) => void;
  private onTypingIndicator?: (isTyping: boolean, memberId: string) => void;

  /**
   * Initialize RTM client
   */
  async initialize(appId: string, uid: string): Promise<void> {
    // Prevent re-initialization if already initialized
    if (this.client && this.isLoggedIn) {
      console.warn('RTM client already initialized');
      return;
    }

    try {
      // Validate inputs
      if (!appId || !uid) {
        throw new Error('Invalid RTM configuration: missing appId or uid');
      }

      // UID must be alphanumeric, max 64 characters, no special characters except underscore
      const sanitizedUid = uid.toString().replace(/[^a-zA-Z0-9_]/g, '');
      
      if (!sanitizedUid || sanitizedUid.length === 0) {
        throw new Error('Invalid UID: cannot be empty after sanitization');
      }

      if (sanitizedUid.length > 64) {
        throw new Error('Invalid UID: exceeds 64 characters');
      }
      
      this.currentUserId = sanitizedUid;
      this.client = new AgoraRTM.RTM(appId, sanitizedUid, {
        logLevel: 'error', // Only show errors
      });

      // Ensure client is created before proceeding
      if (!this.client) {
        throw new Error('Failed to create RTM client instance');
      }

      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize RTM client:', error);
      this.client = null;
      this.currentUserId = null;
      throw new Error('Failed to initialize messaging service');
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.client) return;

    try {
      // Connection state changed
      this.client.on('ConnectionStateChanged', (newState: any, reason: any) => {
        if (newState === 'DISCONNECTED' || newState === 'FAILED') {
          console.warn('RTM connection state changed:', newState, 'Reason:', reason);
          this.isLoggedIn = false;
          this.isChannelJoined = false;
        }
      });

      // Token expired
      this.client.on('TokenExpired', () => {
        console.warn('RTM token expired');
        this.isLoggedIn = false;
      });

      // Error events
      this.client.on('error', (error: any) => {
        console.error('RTM error:', error);
      });
    } catch (error) {
      console.error('Error setting up RTM event listeners:', error);
    }
  }

  /**
   * Login to RTM
   */
  async login(config: AgoraRTMConfig): Promise<void> {
    if (!this.client) {
      throw new Error('RTM client not initialized. Call initialize() first.');
    }

    if (this.isLoggedIn) {
      return;
    }

    if (!config.token || !config.channelName) {
      throw new Error('Invalid RTM configuration: missing token or channelName');
    }

    try {
      // Double-check client exists before login attempt
      if (!this.client) {
        throw new Error('RTM client was destroyed before login');
      }

      const loginTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('RTM login timeout')), 10000);
      });

      await Promise.race([
        this.client.login({ token: config.token }),
        loginTimeout
      ]);

      this.isLoggedIn = true;

      // Verify client still exists before joining channel
      if (!this.client) {
        throw new Error('RTM client was destroyed after login');
      }

      // Join channel after login
      await this.joinChannel(config.channelName);
    } catch (error: any) {
      this.isLoggedIn = false;
      console.error('RTM login failed:', error);
      if (error.message?.includes('token') || error.code === -10005) {
        throw new Error('Invalid or expired messaging token');
      }
      throw new Error('Failed to login to messaging service');
    }
  }

  /**
   * Join RTM channel
   */
  private async joinChannel(channelName: string): Promise<void> {
    if (!this.client) {
      throw new Error('RTM client not initialized');
    }

    if (this.isChannelJoined) {
      return;
    }

    if (!channelName || channelName.trim().length === 0) {
      throw new Error('Invalid channel name');
    }

    try {
      // Subscribe to channel (new SDK API)
      const subscribeOptions = {
        withMessage: true,
        withPresence: true,
        withMetadata: false,
        withLock: false,
      };

      const subscribeTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('RTM channel subscribe timeout')), 10000);
      });

      await Promise.race([
        this.client.subscribe(channelName, subscribeOptions),
        subscribeTimeout
      ]);
      
      // Setup message listener
      this.client.addEventListener('message', (event: any) => {
        try {
          if (event.channelName === channelName && event.message) {
            this.handleChannelMessage(event.message, event.publisher);
          }
        } catch (error) {
          console.error('Error handling RTM message:', error);
        }
      });

      // Setup presence listener
      this.client.addEventListener('presence', (event: any) => {
        try {
          if (event.channelName === channelName) {
            if (event.eventType === 'REMOTE_JOIN') {
              this.onMemberJoined?.(event.publisher);
            } else if (event.eventType === 'REMOTE_LEAVE') {
              this.onMemberLeft?.(event.publisher);
            }
          }
        } catch (error) {
          console.error('Error handling RTM presence:', error);
        }
      });

      this.channel = channelName;
      this.isChannelJoined = true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle incoming channel message
   */
  private handleChannelMessage(message: any, memberId: string): void {
    // New SDK sends message as plain string
    const text = typeof message === 'string' ? message : message.text || message;

    // Check if it's a typing indicator
    if (text.startsWith('__TYPING__')) {
      const isTyping = text === '__TYPING__START__';
      this.onTypingIndicator?.(isTyping, memberId);
      return;
    }

    // Determine if this message is from the current user or stranger
    const isCurrentUser = memberId === this.currentUserId;

    // Regular message
    const messageData: MessageData = {
      text,
      senderId: memberId,
      senderName: isCurrentUser ? 'You' : 'Stranger',
      timestamp: Date.now(),
    };

    this.onMessageReceived?.(messageData);
  }

  /**
   * Send a text message to the channel
   */
  async sendMessage(text: string): Promise<void> {
    if (!this.client || !this.isLoggedIn) {
      throw new Error('Not logged in to messaging service');
    }

    if (!this.channel || !this.isChannelJoined) {
      throw new Error('Not joined to any channel');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    if (text.length > 32000) {
      throw new Error('Message too long (max 32KB)');
    }

    try {
      const publishTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Message send timeout')), 5000);
      });

      await Promise.race([
        this.client.publish(this.channel, text),
        publishTimeout
      ]);
    } catch (error: any) {
      console.error('❌ Failed to send RTM message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(isTyping: boolean): Promise<void> {
    if (!this.channel || !this.isChannelJoined) return;

    try {
      const text = isTyping ? '__TYPING__START__' : '__TYPING__STOP__';
      await this.client.publish(this.channel, text);
    } catch (error) {
    }
  }

  /**
   * Leave channel and logout
   */
  async leave(): Promise<void> {
    const errors: Error[] = [];

    try {
      if (this.channel && this.isChannelJoined && this.client) {
        try {
          await this.client.unsubscribe(this.channel);
        } catch (error: any) {
          console.error('Error unsubscribing from RTM channel:', error);
          errors.push(error);
        }
        this.isChannelJoined = false;
        this.channel = null;
      }

      if (this.client && this.isLoggedIn) {
        try {
          await this.client.logout();
        } catch (error: any) {
          console.error('Error logging out from RTM:', error);
          errors.push(error);
        }
        this.isLoggedIn = false;
      }

      // Clean up references
      this.client = null;
      this.currentUserId = null;

      // If there were critical errors, throw them
      if (errors.length > 0 && errors.some(e => e.message.includes('timeout'))) {
        throw new Error('Timeout while leaving messaging service');
      }
    } catch (error: any) {
      // Ensure state is reset even on error
      this.isChannelJoined = false;
      this.isLoggedIn = false;
      this.channel = null;
      this.client = null;
      this.currentUserId = null;
      throw error;
    }
  }

  /**
   * Set callback for message received
   */
  setOnMessageReceived(callback: (message: MessageData) => void): void {
    this.onMessageReceived = callback;
  }

  /**
   * Set callback for member joined
   */
  setOnMemberJoined(callback: (memberId: string) => void): void {
    this.onMemberJoined = callback;
  }

  /**
   * Set callback for member left
   */
  setOnMemberLeft(callback: (memberId: string) => void): void {
    this.onMemberLeft = callback;
  }

  /**
   * Set callback for typing indicator
   */
  setOnTypingIndicator(callback: (isTyping: boolean, memberId: string) => void): void {
    this.onTypingIndicator = callback;
  }

  /**
   * Check if logged in
   */
  isUserLoggedIn(): boolean {
    return this.isLoggedIn;
  }

  /**
   * Check if channel joined
   */
  isUserInChannel(): boolean {
    return this.isChannelJoined;
  }
}
