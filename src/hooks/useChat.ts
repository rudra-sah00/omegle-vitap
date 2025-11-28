/**
 * useChat Hook
 * Manages chat messages and typing indicators for real-time messaging
 * 
 * @description Provides complete chat functionality including:
 * - Sending and receiving messages via WebSocket
 * - Real-time typing indicators with debouncing
 * - Message deduplication to prevent duplicates
 * - Automatic cleanup on session end
 * 
 * The hook handles all the complexity of:
 * - Typing indicator timeouts (auto-hide after 5s)
 * - Debounced typing state updates (prevent spam)
 * - Pending message tracking (prevent duplicate sends)
 * 
 * @example
 * ```tsx
 * function ChatRoom() {
 *   const { messages, isPartnerTyping, sendMessage, sendTypingIndicator } = useChat({
 *     ws: socketService,
 *     isInSession: true,
 *     onMessageReceived: (msg) => console.log('New message:', msg),
 *   });
 *   
 *   return (
 *     <div>
 *       {messages.map(msg => <Message key={msg.id} {...msg} />)}
 *       {isPartnerTyping && <TypingIndicator />}
 *       <ChatInput 
 *         onSend={sendMessage}
 *         onTyping={() => sendTypingIndicator(true)}
 *         onStopTyping={() => sendTypingIndicator(false)}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { 
  TYPING_INDICATOR_TIMEOUT, 
  TYPING_DEBOUNCE_DELAY, 
  MESSAGE_PENDING_CLEAR_DELAY 
} from '@/constants';
import type { SocketIOService } from '@/services/socket';

/**
 * Structure of a chat message
 * 
 * @property id - Unique identifier for the message
 * @property text - Message content
 * @property senderId - ID of the sender ('self' for own messages)
 * @property senderName - Display name of the sender
 * @property timestamp - Unix timestamp when message was sent
 */
export interface MessageData {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
}

/**
 * Options for configuring the useChat hook
 * 
 * @property ws - Socket.IO service instance for real-time communication
 * @property isInSession - Whether user is currently in an active chat session
 * @property onMessageReceived - Optional callback when a new message arrives
 * @property onTypingIndicator - Optional callback when partner typing state changes
 */
interface UseChatOptions {
  ws: SocketIOService | null;
  isInSession: boolean;
  onMessageReceived?: (message: MessageData) => void;
  onTypingIndicator?: (isTyping: boolean) => void;
}

/**
 * Hook for managing chat messages and typing indicators
 * 
 * @param options - Configuration options for the chat hook
 * @returns Chat state and functions for messaging
 * 
 * @see {@link MessageData} for message structure
 * @see {@link UseChatOptions} for configuration options
 */
export function useChat(options: UseChatOptions) {
  const { ws, isInSession, onMessageReceived, onTypingIndicator } = options;

  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isPartnerTypingInternal, setIsPartnerTypingInternal] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingMessages = useRef<Set<string>>(new Set());
  const messageIdCounter = useRef<number>(0);

  // Derive actual typing state - only true if in session AND partner is typing
  const isPartnerTyping = isInSession && ws && isPartnerTypingInternal;

  useEffect(() => {
    if (!ws || !isInSession) {
      // Clear timeout when session ends
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
        setIsPartnerTypingInternal(isTyping);
        onTypingIndicator?.(isTyping);

        if (isTyping) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsPartnerTypingInternal(false);
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
    setIsPartnerTypingInternal(false);
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
