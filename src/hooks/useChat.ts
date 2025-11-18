'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { chatService, ChatMessage } from '@/services/chatService';

export function useChat(userId: string, channelName: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const unsubscribeMessagesRef = useRef<(() => void) | null>(null);
  const unsubscribeTypingRef = useRef<(() => void) | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to messages
  useEffect(() => {
    if (!channelName || !userId) return;

    setIsConnected(true);
    setMessages([]); // Clear messages when channel changes

    // Listen to messages
    const unsubMessages = chatService.onMessage(channelName, (message) => {
      setMessages((prev) => [...prev, message]);
    });
    unsubscribeMessagesRef.current = unsubMessages;

    // Listen to typing status
    const unsubTyping = chatService.onTypingStatus(channelName, userId, (isTyping) => {
      setPartnerTyping(isTyping);
    });
    unsubscribeTypingRef.current = unsubTyping;

    return () => {
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current();
      }
      if (unsubscribeTypingRef.current) {
        unsubscribeTypingRef.current();
      }
      chatService.cleanup(channelName);
    };
  }, [channelName, userId]);

  // Send message
  const sendMessage = useCallback(async (message: string) => {
    if (!channelName || !userId || !message.trim()) return;

    try {
      // Send with actual userId so we can distinguish between users
      await chatService.sendMessage(channelName, userId, message);
      // Stop typing indicator
      await chatService.setTypingStatus(channelName, userId, false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [channelName, userId]);

  // Send system message
  const sendSystemMessage = useCallback(async (message: string) => {
    if (!channelName) return;

    try {
      await chatService.sendSystemMessage(channelName, message);
    } catch (error) {
      console.error('Failed to send system message:', error);
    }
  }, [channelName]);

  // Set typing indicator
  const setTypingIndicator = useCallback(async () => {
    if (!channelName || !userId) return;

    try {
      await chatService.setTypingStatus(channelName, userId, true);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Auto-clear typing after 3 seconds
      typingTimeoutRef.current = setTimeout(async () => {
        await chatService.setTypingStatus(channelName, userId, false);
      }, 3000);
    } catch (error) {
      console.error('Failed to set typing indicator:', error);
    }
  }, [channelName, userId]);

  // Clear all messages
  const clearMessages = useCallback(async () => {
    if (!channelName) return;

    try {
      await chatService.clearChannel(channelName);
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear messages:', error);
    }
  }, [channelName]);

  // Cleanup
  const cleanup = useCallback(async () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (channelName && userId) {
      await chatService.setTypingStatus(channelName, userId, false);
    }

    setMessages([]);
    setPartnerTyping(false);
    setIsConnected(false);
  }, [channelName, userId]);

  return {
    messages,
    partnerTyping,
    isConnected,
    sendMessage,
    sendSystemMessage,
    setTypingIndicator,
    clearMessages,
    cleanup,
  };
}

export type { ChatMessage };
