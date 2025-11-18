"use client";

import { useState } from "react";

export default function ChatWindow() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([
    { text: "You're now chatting with a random stranger. Say hi!", isUser: false }
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      setMessages([...messages, { text: message, isUser: true }]);
      setMessage("");
      
      // Demo: Simulate stranger response
      setTimeout(() => {
        setMessages(prev => [...prev, { text: "Hi there!", isUser: false }]);
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-300">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, idx) => (
          <div key={idx} className="text-sm">
            <span className="font-semibold">
              {msg.isUser ? 'You' : 'Stranger'}:
            </span>
            <span className="ml-2 text-black">{msg.text}</span>
          </div>
        ))}
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} className="border-t border-gray-300 p-4 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:border-gray-400 text-black"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
