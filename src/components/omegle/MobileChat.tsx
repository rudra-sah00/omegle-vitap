'use client';

import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import type { ConnectionState } from '@/types/matchmaking';
import type { MessageData } from '@/lib/agora-rtm';

interface MobileChatProps {
  isConnected: boolean;
  isStrangerTyping?: boolean;
  onSendMessage?: (message: string) => void;
  connectionState?: ConnectionState;
  messages?: MessageData[];
}

export const MobileChat = ({ isConnected, isStrangerTyping = false, onSendMessage, connectionState = 'disconnected', messages = [] }: MobileChatProps) => {
  const handleClose = () => {
    const chatPanel = document.getElementById('mobile-chat');
    if (chatPanel) {
      chatPanel.classList.add('hidden');
    }
  };

  return (
    <>
      {/* Mobile Chat Toggle Button */}
      <button 
        className="lg:hidden fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white z-20 hover:scale-110 active:scale-95 transition-transform"
        style={{ backgroundColor: '#0084d1' }}
        onClick={() => {
          const chatPanel = document.getElementById('mobile-chat');
          if (chatPanel) {
            chatPanel.classList.toggle('hidden');
          }
        }}
        title="Open Chat"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Mobile Chat Panel */}
      <div 
        id="mobile-chat" 
        className="lg:hidden hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-300 z-30 rounded-t-3xl shadow-2xl animate-slide-up" 
        style={{ height: '65vh' }}
      >
        <div className="flex flex-col h-full">
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

          <ChatMessages isConnected={isConnected} isStrangerTyping={isStrangerTyping} messages={messages} />
          <ChatInput isConnected={isConnected} onSend={onSendMessage} />
        </div>
      </div>
    </>
  );
};
