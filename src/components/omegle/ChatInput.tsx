'use client';

import { useState } from 'react';

interface ChatInputProps {
  isConnected: boolean;
  onSend?: (message: string) => void;
}

export const ChatInput = ({ isConnected, onSend }: ChatInputProps) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && isConnected) {
      onSend?.(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-slate-200 p-4 bg-white">
      <div className="flex gap-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isConnected ? "Type your message..." : "Connect to start chatting"}
          disabled={!isConnected}
          className="flex-1 px-4 py-3 text-sm rounded-xl border-2 border-slate-200 focus:outline-none focus:border-blue-400 transition-colors disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
        />
        <button 
          onClick={handleSend}
          disabled={!isConnected || !message.trim()}
          className="p-3 rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
          style={{ backgroundColor: '#0084d1' }}
          title="Send message"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
};
