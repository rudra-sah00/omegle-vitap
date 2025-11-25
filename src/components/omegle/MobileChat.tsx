'use client';

import React from 'react';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import type { ConnectionState } from '@/types/matchmaking';
import type { MessageData } from '@/hooks/useSocketIOChat';

interface MobileChatProps {
  isConnected: boolean;
  isStrangerTyping?: boolean;
  onSendMessage?: (message: string) => void;
  onTyping?: (isTyping: boolean) => void;
  connectionState?: ConnectionState;
  messages?: MessageData[];
  partnerName?: string;
}

export const MobileChat = ({ isConnected, isStrangerTyping = false, onSendMessage, onTyping, connectionState = 'disconnected', messages = [], partnerName }: MobileChatProps) => {
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const lastMessageCountRef = React.useRef(0);

  // Reset chat state when disconnected
  React.useEffect(() => {
    if (!isConnected) {
      setUnreadCount(0);
      setIsChatOpen(false);
      lastMessageCountRef.current = 0;
      // Close the chat panel
      const chatPanel = document.getElementById('mobile-chat');
      if (chatPanel) {
        chatPanel.classList.add('hidden');
      }
    }
  }, [isConnected]);

  // Track new messages and update unread count
  React.useEffect(() => {
    // Count only messages from stranger (not from 'You')
    const strangerMessages = messages.filter(msg => msg.senderId !== 'local');
    const newMessageCount = strangerMessages.length;
    
    if (newMessageCount > lastMessageCountRef.current && !isChatOpen) {
      // New message received while chat is closed
      setUnreadCount(prev => prev + (newMessageCount - lastMessageCountRef.current));
    }
    
    lastMessageCountRef.current = newMessageCount;
  }, [messages, isChatOpen]);

  // Reset unread count when chat is opened
  React.useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
    }
  }, [isChatOpen]);

  const handleClose = () => {
    const chatPanel = document.getElementById('mobile-chat');
    if (chatPanel) {
      chatPanel.classList.add('hidden');
      setIsChatOpen(false);
    }
  };

  const handleOpen = () => {
    const chatPanel = document.getElementById('mobile-chat');
    if (chatPanel) {
      const isCurrentlyHidden = chatPanel.classList.contains('hidden');
      chatPanel.classList.toggle('hidden');
      setIsChatOpen(isCurrentlyHidden);
      if (isCurrentlyHidden) {
        setUnreadCount(0);
      }
    }
  };

  return (
    <>
      {/* Mobile Chat Toggle Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-20">
        <button 
          className="relative w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform"
          style={{ backgroundColor: '#0084d1' }}
          onClick={handleOpen}
          title="Open Chat"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          
          {/* Unread Message Count Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Chat Panel */}
      <div 
        id="mobile-chat" 
        className="lg:hidden hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-300 z-30 rounded-t-3xl shadow-2xl animate-slide-up overflow-hidden" 
        style={{ height: '65vh' }}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Mobile Header with Close Button */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium" style={{ color: '#0084d1' }}>
                {isConnected ? 'Connected' : 'Not connected'}
              </span>
            </div>
            <button 
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              title="Close Chat"
            >
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <ChatMessages isConnected={isConnected} isStrangerTyping={isStrangerTyping} messages={messages} partnerName={partnerName} />
          <ChatInput isConnected={isConnected} onSend={onSendMessage} onTyping={onTyping} />
        </div>
      </div>
    </>
  );
};
