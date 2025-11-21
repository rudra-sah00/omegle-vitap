/**
 * Hook to manage Agora RTM (Real-Time Messaging) state and operations
 */

import { useRef, useState, useCallback } from 'react';
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
  const [isRTMInitialized, setIsRTMInitialized] = useState(false);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  /**
   * Initialize RTM with match data
   */
  const initializeRTM = useCallback(async (
    matchData: MatchData,
    uid: string | number
  ) => {
    try {
      // Dynamically import Agora RTM (client-side only)
      const { AgoraRTMService } = await import('@/lib/agora-rtm');

      console.log('[Agora RTM] Initializing...');

      // Convert UID to string and ensure it's valid for RTM
      const uidString = typeof uid === 'number' ? uid.toString() : uid;
      
      // Initialize service with App ID and UID
      rtmServiceRef.current = new AgoraRTMService();
      await rtmServiceRef.current.initialize(
        process.env.NEXT_PUBLIC_AGORA_APP_ID!,
        uidString
      );

      // Setup event handlers
      rtmServiceRef.current.setOnMessageReceived((message: MessageData) => {
        console.log('[Agora RTM] Message received:', message);
        setMessages(prev => [...prev, message]);
        onMessageReceived?.(message);
      });

      rtmServiceRef.current.setOnTypingIndicator((isTyping: boolean) => {
        console.log('[Agora RTM] Partner typing:', isTyping);
        setIsPartnerTyping(isTyping);
        onTypingIndicator?.(isTyping);
      });

      // Login to RTM (automatically joins channel)
      await rtmServiceRef.current.login({
        channelName: matchData.channelName,
        token: matchData.rtmToken,
      });

      // Store UID for message sending
      currentUidRef.current = typeof uid === 'number' ? uid.toString() : uid;

      setIsRTMInitialized(true);
      console.log('✅ RTM initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize RTM:', error);
      console.warn('⚠️ RTM is not enabled in Agora Console. Please enable RTM service or messaging will not work.');
      console.warn('⚠️ Go to Agora Console → Your Project → Enable RTM (Real-Time Messaging)');
      // Don't throw error, just mark as not initialized
      setIsRTMInitialized(false);
    }
  }, [onMessageReceived, onTypingIndicator]);

  /**
   * Send a text message
   */
  const sendMessage = useCallback(async (text: string) => {
    if (!rtmServiceRef.current || !text.trim()) return;

    try {
      await rtmServiceRef.current.sendMessage(text);
      
      // Add to local messages
      const message: MessageData = {
        text,
        senderId: currentUidRef.current,
        senderName: 'You',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, message]);
      
      console.log('[Agora RTM] Message sent:', text);
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  }, []);

  /**
   * Send typing indicator
   */
  const sendTypingIndicator = useCallback(async (isTyping: boolean) => {
    if (!rtmServiceRef.current) return;

    try {
      await rtmServiceRef.current.sendTypingIndicator(isTyping);
    } catch (error) {
      console.error('❌ Error sending typing indicator:', error);
    }
  }, []);

  /**
   * Leave RTM channel and cleanup
   */
  const leaveRTM = useCallback(async () => {
    if (!rtmServiceRef.current) return;

    try {
      await rtmServiceRef.current.leave();
      setIsRTMInitialized(false);
      setMessages([]);
      setIsPartnerTyping(false);
      console.log('✅ RTM cleaned up');
    } catch (error) {
      console.error('❌ Error leaving RTM:', error);
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
