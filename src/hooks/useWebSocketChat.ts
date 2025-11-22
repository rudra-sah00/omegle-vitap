/**
 * Hook to manage WebSocket-based chat (replaces Agora RTM)
 * Uses existing matchmaking WebSocket connection for text chat
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import type { WebSocketService } from '@/lib/websocket';

export interface MessageData {
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
}

interface UseWebSocketChatOptions {
  ws: WebSocketService | null;
  isInSession: boolean;
  onMessageReceived?: (message: MessageData) => void;
  onTypingIndicator?: (isTyping: boolean) => void;
}

export const useWebSocketChat = (options: UseWebSocketChatOptions) => {
  const { ws, isInSession, onMessageReceived, onTypingIndicator } = options;

  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Listen for incoming chat messages and typing indicators
   */
  useEffect(() => {
    if (!ws || !isInSession) return;

    const unsubscribe = ws.onMessage((msg) => {
      if (msg.type === 'message') {
        // Incoming message from partner
        const messageData: MessageData = {
          text: msg.data.text,
          senderId: msg.data.from.toString(),
          senderName: 'Stranger',
          timestamp: msg.data.timestamp,
        };
        
        setMessages((prev) => [...prev, messageData]);
        onMessageReceived?.(messageData);
      } else if (msg.type === 'typing') {
        // Partner typing indicator
        const isTyping = msg.data.isTyping;
        setIsPartnerTyping(isTyping);
        onTypingIndicator?.(isTyping);

        // Auto-hide typing indicator after 3 seconds
        if (isTyping) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsPartnerTyping(false);
          }, 3000);
        }
      }
    });

    return () => {
      unsubscribe();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [ws, isInSession, onMessageReceived, onTypingIndicator]);

  /**
   * Send a text message to partner
   */
  const sendMessage = useCallback((text: string) => {
    if (!ws || !text.trim() || !isInSession) {
      return;
    }

    const trimmedText = text.trim();
    
    // Send to backend
    const sent = ws.send({ 
      type: 'message', 
      data: { text: trimmedText } 
    });

    if (sent) {
      // Add to local messages immediately (optimistic update)
      const messageData: MessageData = {
        text: trimmedText,
        senderId: 'self',
        senderName: 'You',
        timestamp: Date.now(),
      };
      
      setMessages((prev) => [...prev, messageData]);
    }
  }, [ws, isInSession]);

  /**
   * Send typing indicator to partner
   */
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!ws || !isInSession) return;

    ws.send({ 
      type: 'typing', 
      data: { isTyping } 
    });
  }, [ws, isInSession]);

  /**
   * Clear all messages (on disconnect/new session)
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setIsPartnerTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  return {
    messages,
    isPartnerTyping,
    sendMessage,
    sendTypingIndicator,
    clearMessages,
  };
};
