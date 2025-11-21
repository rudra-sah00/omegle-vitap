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
    try {
      // UID must be alphanumeric, max 64 characters, no special characters except underscore
      const sanitizedUid = uid.toString().replace(/[^a-zA-Z0-9_]/g, '');
      
      this.currentUserId = sanitizedUid;
      this.client = new AgoraRTM.RTM(appId, sanitizedUid, {
        logLevel: 'error', // Only show errors
      });
      this.setupEventListeners();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.client) return;

    // Connection state changed
    this.client.on('ConnectionStateChanged', (newState: any, reason: any) => {
    });

    // Token expired
    this.client.on('TokenExpired', () => {
    });
  }

  /**
   * Login to RTM
   */
  async login(config: AgoraRTMConfig): Promise<void> {
    if (!this.client) {
      throw new Error('RTM client not initialized');
    }

    if (this.isLoggedIn) {
      return;
    }

    try {
      await this.client.login({
        token: config.token,
      });

      this.isLoggedIn = true;

      // Join channel after login
      await this.joinChannel(config.channelName);
    } catch (error) {
      throw error;
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

    try {
      // Subscribe to channel (new SDK API)
      const subscribeOptions = {
        withMessage: true,
        withPresence: true,
        withMetadata: false,
        withLock: false,
      };

      await this.client.subscribe(channelName, subscribeOptions);
      
      // Setup message listener
      this.client.addEventListener('message', (event: any) => {
        if (event.channelName === channelName && event.message) {
          this.handleChannelMessage(event.message, event.publisher);
        }
      });

      // Setup presence listener
      this.client.addEventListener('presence', (event: any) => {
        if (event.channelName === channelName) {
          if (event.eventType === 'REMOTE_JOIN') {
            this.onMemberJoined?.(event.publisher);
          } else if (event.eventType === 'REMOTE_LEAVE') {
            this.onMemberLeft?.(event.publisher);
          }
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
    if (!this.channel || !this.isChannelJoined) {
      throw new Error('Not joined to any channel');
    }

    try {
      // Use publish method with the new SDK API
      await this.client.publish(this.channel, text);
    } catch (error) {
      throw error;
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
    try {
      if (this.channel && this.isChannelJoined) {
        await this.client.unsubscribe(this.channel);
        this.isChannelJoined = false;
      }

      if (this.client && this.isLoggedIn) {
        await this.client.logout();
        this.isLoggedIn = false;
      }
    } catch (error) {
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
