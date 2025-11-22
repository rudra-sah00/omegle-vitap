'use client';

import { TypingIndicator } from './TypingIndicator';
import { EncryptedText } from '@/components/ui/encrypted-text';
import type { MessageData } from '@/hooks/useWebSocketChat';

interface ChatMessagesProps {
  isConnected: boolean;
  isStrangerTyping?: boolean;
  messages?: MessageData[];
  partnerName?: string;
}

export const ChatMessages = ({ isConnected, isStrangerTyping = false, messages = [], partnerName }: ChatMessagesProps) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white to-slate-50/30">
      {!isConnected ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: '#e0f2fe' }}>
              <svg className="w-8 h-8" style={{ color: '#0084d1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-slate-600 text-sm font-medium">
              Click "Start" to begin chatting
            </p>
            <p className="text-slate-400 text-xs">
              Connect with a stranger and start a conversation
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((message) => {
            const isYou = message.senderName === 'You';
            
            return (
              <div 
                key={message.id} 
                className="flex items-start gap-2"
              >
                <span className={`text-sm font-semibold min-w-[70px] ${
                  isYou ? 'text-blue-600' : 'text-slate-600'
                }`}>
                  {isYou ? 'You:' : `${partnerName || 'Stranger'}:`}
                </span>
                <div className="flex-1">
                  <EncryptedText 
                    text={message.text}
                    className="text-sm text-slate-800 break-words"
                    revealDelayMs={30}
                    flipDelayMs={30}
                  />
                </div>
              </div>
            );
          })}
          {isStrangerTyping && (
            <div className="flex items-start gap-2">
              <span className="text-sm font-semibold min-w-[70px] text-slate-600">
                {partnerName || 'Stranger'}:
              </span>
              <TypingIndicator />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
