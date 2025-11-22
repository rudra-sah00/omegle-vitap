/**
 * Hook to manage Agora RTM (Real-Time Messaging) state and operations
 */

import { useRef, useState, useCallback } from 'react';
import { showError, ErrorCode } from '@/lib/toast';
import type { MatchData } from '@/types/matchmaking';
import type { MessageData } from '@/lib/agora-rtm';

interface UseAgoraRTMOptions {
  onMessageReceived?: (message: MessageData) => void;
  onTypingIndicator?: (isTyping: boolean) => void;
}

export const useAgoraRTM = (options: UseAgoraRTMOptions = {}) => {
  const { onMessageReceived, onTypingIndicator } = options;

  const rtmServiceRef = useRef<any>(null);
  const currentUidRef = useRef<string>('');
  const isInitializingRef = useRef(false);
  const isCleaningUpRef = useRef(false);
  const [isRTMInitialized, setIsRTMInitialized] = useState(false);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  /**
   * Initialize RTM with match data
   */
  const initializeRTM = useCallback(async (
    matchData: import('@/types/matchmaking').MatchDataMatched,
    uid: string | number
  ) => {
    // Prevent concurrent initialization
    if (isInitializingRef.current) {
      console.log('⚠️ RTM initialization already in progress, skipping');
      return;
    }
    
    // Don't initialize if cleanup is in progress
    if (isCleaningUpRef.current) {
      console.log('⚠️ RTM cleanup in progress, skipping initialization');
      return;
    }
    
    isInitializingRef.current = true;
    
    try {
      // Dynamically import Agora RTM (client-side only)
      const { AgoraRTMService } = await import('@/lib/agora-rtm');

      // Convert UID to string and ensure it's valid for RTM
      const uidString = typeof uid === 'number' ? uid.toString() : uid;
      
      // Initialize service with App ID and UID
      rtmServiceRef.current = new AgoraRTMService();
      await rtmServiceRef.current.initialize(
        process.env.NEXT_PUBLIC_AGORA_APP_ID!,
        uidString
      );

      // Verify service was initialized successfully
      if (!rtmServiceRef.current) {
        throw new Error('RTM service initialization returned null');
      }

      // Setup event handlers
      rtmServiceRef.current.setOnMessageReceived((message: MessageData) => {
        setMessages(prev => [...prev, message]);
        onMessageReceived?.(message);
      });

      rtmServiceRef.current.setOnTypingIndicator((isTyping: boolean) => {
        setIsPartnerTyping(isTyping);
        onTypingIndicator?.(isTyping);
      });

      // Login to RTM immediately (no delay to prevent race condition)
      console.log('🔐 Logging into RTM channel:', matchData.channelName);
      await rtmServiceRef.current.login({
        channelName: matchData.channelName,
        token: matchData.rtmToken,
      });

      // Store UID for message sending
      currentUidRef.current = typeof uid === 'number' ? uid.toString() : uid;

      // Final check - if cleanup happened during async operations, abort
      if (!rtmServiceRef.current) {
        console.warn('⚠️ RTM was cleaned up after login, aborting');
        return;
      }

      console.log('✅ RTM initialized successfully');
      setIsRTMInitialized(true);
    } catch (error) {
      console.error('RTM initialization failed:', error);
      setIsRTMInitialized(false);
      // Clean up on failure
      if (rtmServiceRef.current) {
        try {
          await rtmServiceRef.current.leave();
        } catch (e) {
          // Ignore cleanup errors
        }
        rtmServiceRef.current = null;
      }
    } finally {
      isInitializingRef.current = false;
    }
  }, [onMessageReceived, onTypingIndicator]);

  /**
   * Send a text message
   */
  const sendMessage = useCallback(async (text: string) => {
    console.log('📨 sendMessage called, ref status:', {
      hasRef: !!rtmServiceRef.current,
      isInitialized: isRTMInitialized,
      text: text
    });
    
    if (!text.trim()) {
      console.log('⚠️ Empty message, not sending');
      return;
    }
    
    if (!rtmServiceRef.current) {
      console.error('❌ RTM service not initialized, cannot send message');
      console.error('Debug: isRTMInitialized state:', isRTMInitialized);
      showError('Chat not ready. Please wait a moment.', ErrorCode.MESSAGE_SEND_FAILED);
      return;
    }

    try {
      console.log('📤 Sending message:', text);
      await rtmServiceRef.current.sendMessage(text);
      console.log('✅ Message sent successfully');
      
      // Don't add to local messages - let the RTM SDK echo it back
      // This prevents duplicate messages
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      showError('Failed to send message. Please try again.', ErrorCode.MESSAGE_SEND_FAILED);
    }
  }, [isRTMInitialized]);

  /**
   * Send typing indicator
   */
  const sendTypingIndicator = useCallback(async (isTyping: boolean) => {
    if (!rtmServiceRef.current) return;

    try {
      await rtmServiceRef.current.sendTypingIndicator(isTyping);
    } catch (error) {
    }
  }, []);

  /**
   * Leave RTM channel and cleanup
   */
  const leaveRTM = useCallback(async () => {
    isCleaningUpRef.current = true;
    
    // Wait for any ongoing initialization to complete (up to 2 seconds)
    let waitCount = 0;
    while (isInitializingRef.current && waitCount < 20) {
      await new Promise(resolve => setTimeout(resolve, 100));
      waitCount++;
    }
    
    if (!rtmServiceRef.current) {
      isCleaningUpRef.current = false;
      return;
    }

    try {
      await rtmServiceRef.current.leave();
      // Set to null to force recreation on next join (fixes token issues)
      rtmServiceRef.current = null;
      currentUidRef.current = '';
      setIsRTMInitialized(false);
      setMessages([]);
      setIsPartnerTyping(false);
    } catch (error) {
      // Reset state even on error
      rtmServiceRef.current = null;
      currentUidRef.current = '';
      setIsRTMInitialized(false);
      setMessages([]);
      setIsPartnerTyping(false);
    } finally {
      isCleaningUpRef.current = false;
    }
  }, []);

  return {
    // State
    isRTMInitialized,
    messages,
    isPartnerTyping,

    // Methods
    initializeRTM,
    sendMessage,
    sendTypingIndicator,
    leaveRTM,
  };
};
