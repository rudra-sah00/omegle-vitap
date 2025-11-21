'use client';

import { TypingIndicator } from './TypingIndicator';
import type { MessageData } from '@/lib/agora-rtm';

interface ChatMessagesProps {
  isConnected: boolean;
  isStrangerTyping?: boolean;
  messages?: MessageData[];
}

export const ChatMessages = ({ isConnected, isStrangerTyping = false, messages = [] }: ChatMessagesProps) => {
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
        <div className="space-y-3">
          {messages.map((message, index) => (
            <div 
              key={`${message.timestamp}-${index}`} 
              className={`flex ${message.senderName === 'You' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                  message.senderName === 'You' 
                    ? 'bg-[#0084d1] text-white' 
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                <p className="text-sm break-words">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.senderName === 'You' ? 'text-blue-100' : 'text-slate-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))}
          {isStrangerTyping && (
            <div className="flex justify-start">
              <TypingIndicator />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
