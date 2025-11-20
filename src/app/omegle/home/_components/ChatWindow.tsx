"use client";

import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/hooks/useChat";
import { EncryptedText } from "@/components/ui/encrypted-text";

interface ChatWindowProps {
  messages: ChatMessage[];
  partnerTyping: boolean;
  partnerOnline: boolean;
  onSendMessage: (message: string) => void;
  onTyping: () => void;
  isConnected: boolean;
  userId: string;
}

export default function ChatWindow({
  messages,
  partnerTyping,
  partnerOnline,
  onSendMessage,
  onTyping,
  isConnected,
  userId,
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
    <div className="flex flex-col h-full shadow-xl transition-colors duration-300 bg-white border-l border-[#0084d1]/20">
      {/* Header with status */}
      <div className="flex-shrink-0 px-4 py-3 transition-colors duration-300 bg-gradient-to-r from-[#0084d1]/10 to-[#0084d1]/15 border-b border-[#0084d1]/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${partnerOnline ? "bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" : "bg-[#0084d1]/40"}`}
            />
            <span className="text-sm font-semibold text-[#0084d1]">
              {isConnected
                ? partnerOnline
                  ? "Stranger is online"
                  : "Waiting for stranger..."
                : "Not connected"}
            </span>
          </div>

          {/* Right side: Typing indicator and Home button */}
          <div className="flex items-center gap-3">
            {partnerTyping && (
              <div className="flex items-center gap-1 text-xs font-medium text-[#0084d1]">
                <span>Stranger is typing</span>
                <div className="flex gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full animate-bounce bg-[#0084d1]"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full animate-bounce bg-[#0084d1]"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full animate-bounce bg-[#0084d1]"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}
            {!isConnected && (
              <a
                href="/omegle"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 hover:bg-white border border-[#0084d1]/30 hover:border-[#0084d1]/50 transition-all shadow-sm hover:shadow-md group"
                title="Back to home"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 text-[#0084d1] group-hover:-translate-x-0.5 transition-transform"
                >
                  <path
                    fillRule="evenodd"
                    d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs font-semibold text-[#0084d1]">Home</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {!isConnected && (
          <div className="flex items-center justify-center h-full">
            <p className="text-base font-medium text-[#0084d1]">Click "Start" to begin chatting</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`${msg.type === "system" ? "text-center" : ""}`}>
            {msg.type === "system" ? (
              <div className="text-xs italic rounded-full px-3 py-1 inline-block text-[#0084d1] bg-[#0084d1]/10">
                {msg.message}
              </div>
            ) : (
              <div className="text-sm">
                <span
                  className={`font-semibold ${
                    msg.senderId === userId ? "text-[#0084d1]" : "text-[#0084d1]/90"
                  }`}
                >
                  {msg.senderId === userId ? "You" : "Stranger"}:
                </span>{" "}
                {msg.senderId === userId ? (
                  <span className="text-gray-800">{msg.message}</span>
                ) : (
                  <EncryptedText
                    text={msg.message}
                    className="inline"
                    revealDelayMs={30}
                    flipDelayMs={30}
                    encryptedClassName="text-[#0084d1]/50"
                    revealedClassName="text-gray-800"
                  />
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-3 flex-shrink-0 transition-colors duration-300 bg-white border-[#0084d1]/20">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            placeholder={isConnected ? "Type a message..." : "Connect to start chatting"}
            disabled={!isConnected}
            className="flex-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm shadow-sm transition-colors duration-300 border-[#0084d1]/30 focus:ring-[#0084d1] focus:border-transparent text-gray-800 disabled:bg-[#0084d1]/5 disabled:cursor-not-allowed placeholder:text-[#0084d1]/50 bg-white"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!isConnected || !inputMessage.trim()}
            className="p-3 rounded-xl transition-all shadow-md hover:shadow-lg bg-[#0084d1] text-white hover:bg-[#0084d1]/90 disabled:bg-[#0084d1]/30 disabled:cursor-not-allowed hover:scale-105"
            title="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
