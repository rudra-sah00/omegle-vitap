/**
 * Agora RTM Service for Real-time Messaging
 */

import AgoraRTM from 'agora-rtm-sdk';

export interface AgoraRTMConfig {
  appId: string;
  channelName: string;
  token: string;
  uid: string;
}

export interface MessageData {
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
}

export class AgoraRTMService {
  private client: any = null;
  private channel: any = null;
  private isLoggedIn = false;
  private isChannelJoined = false;

  // Callbacks
  private onMessageReceived?: (message: MessageData) => void;
  private onMemberJoined?: (memberId: string) => void;
  private onMemberLeft?: (memberId: string) => void;
  private onTypingIndicator?: (isTyping: boolean, memberId: string) => void;

  /**
   * Initialize RTM client
   */
  async initialize(appId: string): Promise<void> {
    try {
      this.client = new AgoraRTM.RTM(appId, '', {
        logLevel: 'error', // Only show errors
      });
      console.log('[Agora RTM] Client initialized');
      this.setupEventListeners();
    } catch (error) {
      console.error('[Agora RTM] Failed to initialize:', error);
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
      console.log('[Agora RTM] Connection state:', newState, 'reason:', reason);
    });

    // Token expired
    this.client.on('TokenExpired', () => {
      console.warn('[Agora RTM] Token expired');
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
      console.warn('[Agora RTM] Already logged in');
      return;
    }

    try {
      await this.client.login({
        uid: config.uid,
        token: config.token,
      });

      console.log('[Agora RTM] Logged in as:', config.uid);
      this.isLoggedIn = true;

      // Join channel after login
      await this.joinChannel(config.channelName);
    } catch (error) {
      console.error('[Agora RTM] Login failed:', error);
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
      console.warn('[Agora RTM] Already joined channel');
      return;
    }

    try {
      this.channel = this.client.createChannel(channelName);
      
      // Setup channel event listeners
      this.channel.on('ChannelMessage', (message: any, memberId: any) => {
        console.log('[Agora RTM] Message from:', memberId);
        this.handleChannelMessage(message, memberId);
      });

      this.channel.on('MemberJoined', (memberId: any) => {
        console.log('[Agora RTM] Member joined:', memberId);
        this.onMemberJoined?.(memberId);
      });

      this.channel.on('MemberLeft', (memberId: any) => {
        console.log('[Agora RTM] Member left:', memberId);
        this.onMemberLeft?.(memberId);
      });

      await this.channel.join();
      this.isChannelJoined = true;
      console.log('[Agora RTM] Joined channel:', channelName);
    } catch (error) {
      console.error('[Agora RTM] Failed to join channel:', error);
      throw error;
    }
  }

  /**
   * Handle incoming channel message
   */
  private handleChannelMessage(message: any, memberId: string): void {
    if (message.messageType === 'TEXT') {
      const text = message.text;

      // Check if it's a typing indicator
      if (text.startsWith('__TYPING__')) {
        const isTyping = text === '__TYPING__START__';
        this.onTypingIndicator?.(isTyping, memberId);
        return;
      }

      // Regular message
      const messageData: MessageData = {
        text,
        senderId: memberId,
        senderName: 'Stranger', // We don't have name in RTM, use partner name from match
        timestamp: Date.now(),
      };

      this.onMessageReceived?.(messageData);
    }
  }

  /**
   * Send a text message to the channel
   */
  async sendMessage(text: string): Promise<void> {
    if (!this.channel || !this.isChannelJoined) {
      throw new Error('Not joined to any channel');
    }

    try {
      await this.channel.sendMessage({ text });
      console.log('[Agora RTM] Message sent:', text);
    } catch (error) {
      console.error('[Agora RTM] Failed to send message:', error);
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
      await this.channel.sendMessage({ text });
    } catch (error) {
      console.error('[Agora RTM] Failed to send typing indicator:', error);
    }
  }

  /**
   * Leave channel and logout
   */
  async leave(): Promise<void> {
    try {
      if (this.channel && this.isChannelJoined) {
        await this.channel.leave();
        this.isChannelJoined = false;
        console.log('[Agora RTM] Left channel');
      }

      if (this.client && this.isLoggedIn) {
        await this.client.logout();
        this.isLoggedIn = false;
        console.log('[Agora RTM] Logged out');
      }
    } catch (error) {
      console.error('[Agora RTM] Error during leave:', error);
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
