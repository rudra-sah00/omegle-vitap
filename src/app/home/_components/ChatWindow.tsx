"use client";

import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/hooks/useChat";

interface ChatWindowProps {
  messages: ChatMessage[];
  partnerTyping: boolean;
  partnerOnline: boolean;
  onSendMessage: (message: string) => void;
  onTyping: () => void;
  isConnected: boolean;
}

export default function ChatWindow({ 
  messages, 
  partnerTyping, 
  partnerOnline,
  onSendMessage, 
  onTyping,
  isConnected 
}: ChatWindowProps) {
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    
    // Trigger typing indicator
    onTyping();
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing indicator after 1 second of no typing
    typingTimeoutRef.current = setTimeout(() => {
      // Typing stopped
    }, 1000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && isConnected) {
      onSendMessage(inputMessage.trim());
      setInputMessage("");
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-300">
      {/* Header with status */}
      <div className="flex-shrink-0 bg-gray-100 border-b border-gray-300 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${partnerOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-sm font-medium text-gray-700">
              {isConnected ? (partnerOnline ? 'Stranger is online' : 'Waiting for stranger...') : 'Not connected'}
            </span>
          </div>
          {partnerTyping && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>Stranger is typing</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!isConnected && (
          <div className="text-center text-gray-500 text-sm py-8">
            <p className="mb-2">💬 Chat with strangers from around the world</p>
            <p className="text-xs">Click "Start" to begin chatting</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`${msg.type === 'system' ? 'text-center' : ''}`}>
            {msg.type === 'system' ? (
              <div className="text-xs text-gray-500 italic">
                {msg.message}
              </div>
            ) : (
              <div className="text-sm">
                <span className={`font-semibold ${msg.senderId === 'You' ? 'text-blue-600' : 'text-red-600'}`}>
                  {msg.senderId === 'system' ? 'System' : msg.senderId}:
                </span>
                <span className="ml-2 text-gray-800">{msg.message}</span>
                <span className="ml-2 text-xs text-gray-400">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} className="border-t border-gray-300 p-4 flex-shrink-0 bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            placeholder={isConnected ? "Type a message..." : "Connect to start chatting"}
            disabled={!isConnected}
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!isConnected || !inputMessage.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
