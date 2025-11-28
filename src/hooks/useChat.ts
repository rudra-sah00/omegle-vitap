/**
 * useChat Hook
 * Manages chat messages and typing indicators
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { 
  TYPING_INDICATOR_TIMEOUT, 
  TYPING_DEBOUNCE_DELAY, 
  MESSAGE_PENDING_CLEAR_DELAY 
} from '@/constants';
import type { SocketIOService } from '@/services/socket';

export interface MessageData {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
}

interface UseChatOptions {
  ws: SocketIOService | null;
  isInSession: boolean;
  onMessageReceived?: (message: MessageData) => void;
  onTypingIndicator?: (isTyping: boolean) => void;
}

export function useChat(options: UseChatOptions) {
  const { ws, isInSession, onMessageReceived, onTypingIndicator } = options;

  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingMessages = useRef<Set<string>>(new Set());
  const messageIdCounter = useRef<number>(0);

  useEffect(() => {
    if (!ws || !isInSession) {
      setIsPartnerTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      return;
    }

    const unsubscribe = ws.onMessage((msg) => {
      if (msg.type === 'message') {
        const messageData: MessageData = {
          id: `${msg.data.from}-${msg.data.timestamp}-${Math.random()}`,
          text: msg.data.text,
          senderId: msg.data.from.toString(),
          senderName: 'Stranger',
          timestamp: msg.data.timestamp,
        };
        
        setMessages((prev) => [...prev, messageData]);
        onMessageReceived?.(messageData);
      } else if (msg.type === 'typing') {
        const isTyping = msg.data.isTyping;
        setIsPartnerTyping(isTyping);
        onTypingIndicator?.(isTyping);

        if (isTyping) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsPartnerTyping(false);
          }, TYPING_INDICATOR_TIMEOUT);
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

  const sendMessage = useCallback((text: string) => {
    if (!ws || !text.trim() || !isInSession) {
      return;
    }

    const trimmedText = text.trim();
    
    if (pendingMessages.current.has(trimmedText)) {
      return;
    }
    
    pendingMessages.current.add(trimmedText);
    
    const messageId = `msg-${Date.now()}-${messageIdCounter.current++}`;
    
    const sent = ws.send({ 
      type: 'message', 
      data: { text: trimmedText } 
    });

    if (sent) {
      const timestamp = Date.now();
      const messageData: MessageData = {
        id: messageId,
        text: trimmedText,
        senderId: 'self',
        senderName: 'You',
        timestamp,
      };
      
      setMessages((prev) => [...prev, messageData]);
      
      setTimeout(() => {
        pendingMessages.current.delete(trimmedText);
      }, MESSAGE_PENDING_CLEAR_DELAY);
    } else {
      pendingMessages.current.delete(trimmedText);
    }
  }, [ws, isInSession]);

  const typingDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingStateRef = useRef<boolean>(false);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!ws || !isInSession) return;

    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
    }

    if (isTyping) {
      if (!lastTypingStateRef.current) {
        ws.send({ 
          type: 'typing', 
          data: { isTyping: true } 
        });
        lastTypingStateRef.current = true;
      }
    } else {
      typingDebounceRef.current = setTimeout(() => {
        ws.send({ 
          type: 'typing', 
          data: { isTyping: false } 
        });
        lastTypingStateRef.current = false;
      }, TYPING_DEBOUNCE_DELAY);
    }
  }, [ws, isInSession]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setIsPartnerTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = null;
    }
    lastTypingStateRef.current = false;
    pendingMessages.current.clear();
    messageIdCounter.current = 0;
  }, []);

  return {
    messages,
    isPartnerTyping,
    sendMessage,
    sendTypingIndicator,
    clearMessages,
  };
}
