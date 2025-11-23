import { useRef, useState, useCallback, useEffect } from 'react';
import type { SocketIOService } from '@/lib/socketio';

export interface MessageData {
  id: string; // Unique message ID
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
}

interface UseWebSocketChatOptions {
  ws: SocketIOService | null;
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
    if (!ws || !isInSession) {
      // Clear typing indicator when not in session
      setIsPartnerTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      return;
    }

    const unsubscribe = ws.onMessage((msg) => {
      if (msg.type === 'message') {
        // Incoming message from partner
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
    console.log('[useWebSocketChat] sendMessage called:', { text, hasWs: !!ws, isInSession, connected: ws?.isConnected() });
    
    if (!ws || !text.trim() || !isInSession) {
      console.log('[useWebSocketChat] sendMessage blocked:', { hasWs: !!ws, hasTrimmedText: !!text.trim(), isInSession });
      return;
    }

    const trimmedText = text.trim();
    
    // Send to backend
    console.log('[useWebSocketChat] Sending message to backend:', { type: 'message', data: { text: trimmedText } });
    const sent = ws.send({ 
      type: 'message', 
      data: { text: trimmedText } 
    });

    console.log('[useWebSocketChat] Message sent result:', sent);

    if (sent) {
      // Add to local messages immediately (optimistic update)
      const timestamp = Date.now();
      const messageData: MessageData = {
        id: `self-${timestamp}-${Math.random()}`,
        text: trimmedText,
        senderId: 'self',
        senderName: 'You',
        timestamp,
      };
      
      setMessages((prev) => [...prev, messageData]);
      console.log('[useWebSocketChat] Message added to local messages');
    }
  }, [ws, isInSession]);

  // Debounce timer for typing indicator
  const typingDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingStateRef = useRef<boolean>(false);

  /**
   * Send typing indicator to partner (debounced)
   */
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!ws || !isInSession) return;

    // Clear existing debounce timer
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
    }

    if (isTyping) {
      // Send "typing" immediately on first keystroke
      if (!lastTypingStateRef.current) {
        ws.send({ 
          type: 'typing', 
          data: { isTyping: true } 
        });
        lastTypingStateRef.current = true;
      }
    } else {
      // Debounce "stopped typing" signal by 300ms
      typingDebounceRef.current = setTimeout(() => {
        ws.send({ 
          type: 'typing', 
          data: { isTyping: false } 
        });
        lastTypingStateRef.current = false;
      }, 300);
    }
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
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = null;
    }
    lastTypingStateRef.current = false;
  }, []);

  return {
    messages,
    isPartnerTyping,
    sendMessage,
    sendTypingIndicator,
    clearMessages,
  };
};
