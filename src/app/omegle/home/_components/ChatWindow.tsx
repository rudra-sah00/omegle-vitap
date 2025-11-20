"use client";

import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/hooks/useChat";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { useTheme } from "@/contexts/ThemeContext";

interface ChatWindowProps {
  messages: ChatMessage[];
  partnerTyping: boolean;
  partnerOnline: boolean;
  onSendMessage: (message: string) => void;
  onTyping: () => void;
  isConnected: boolean;
  userId: string;
  onToggleTheme: () => void;
}

export default function ChatWindow({
  messages,
  partnerTyping,
  partnerOnline,
  onSendMessage,
  onTyping,
  isConnected,
  userId,
  onToggleTheme,
}: ChatWindowProps) {
  const { theme } = useTheme();
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
    <div
      className={`flex flex-col h-full shadow-xl transition-colors duration-300 ${
        theme === "dark"
          ? "bg-black border-l border-purple-900/50"
          : "bg-white border-l border-purple-200"
      }`}
    >
      {/* Header with status */}
      <div
        className={`flex-shrink-0 px-4 py-3 transition-colors duration-300 ${
          theme === "dark"
            ? "bg-gradient-to-r from-purple-900 to-slate-900 border-b border-purple-800"
            : "bg-gradient-to-r from-purple-100 to-indigo-100 border-b border-purple-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${partnerOnline ? "bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" : theme === "dark" ? "bg-slate-400" : "bg-purple-300"}`}
            />
            <span
              className={`text-sm font-semibold ${
                theme === "dark" ? "text-gray-200" : "text-purple-900"
              }`}
            >
              {isConnected
                ? partnerOnline
                  ? "Stranger is online"
                  : "Waiting for stranger..."
                : "Not connected"}
            </span>
          </div>

          {/* Right side: Typing indicator and Theme Toggle */}
          <div className="flex items-center gap-3">
            {partnerTyping && (
              <div
                className={`flex items-center gap-1 text-xs font-medium ${
                  theme === "dark" ? "text-gray-400" : "text-purple-600"
                }`}
              >
                <span>Stranger is typing</span>
                <div className="flex gap-1">
                  <div
                    className={`w-1.5 h-1.5 rounded-full animate-bounce ${
                      theme === "dark" ? "bg-purple-500" : "bg-indigo-500"
                    }`}
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className={`w-1.5 h-1.5 rounded-full animate-bounce ${
                      theme === "dark" ? "bg-purple-500" : "bg-indigo-500"
                    }`}
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className={`w-1.5 h-1.5 rounded-full animate-bounce ${
                      theme === "dark" ? "bg-purple-500" : "bg-indigo-500"
                    }`}
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}

            {/* Theme Toggle Switch */}
            <button
              onClick={onToggleTheme}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                theme === "dark"
                  ? "bg-purple-600 focus:ring-purple-500"
                  : "bg-purple-400 focus:ring-purple-300"
              }`}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span
                className={`inline-block w-4 h-4 transform transition-transform duration-300 rounded-full ${
                  theme === "dark" ? "translate-x-6 bg-yellow-300" : "translate-x-1 bg-white"
                }`}
              />
            </button>
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
            <p
              className={`text-base font-medium ${
                theme === "dark" ? "text-gray-400" : "text-purple-600"
              }`}
            >
              Click "Start" to begin chatting
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`${msg.type === "system" ? "text-center" : ""}`}>
            {msg.type === "system" ? (
              <div
                className={`text-xs italic rounded-full px-3 py-1 inline-block ${
                  theme === "dark"
                    ? "text-gray-400 bg-gray-800/50"
                    : "text-purple-600 bg-purple-100"
                }`}
              >
                {msg.message}
              </div>
            ) : (
              <div className="text-sm">
                <span
                  className={`font-semibold ${
                    msg.senderId === userId
                      ? theme === "dark"
                        ? "text-purple-400"
                        : "text-purple-600"
                      : theme === "dark"
                        ? "text-gray-300"
                        : "text-purple-700"
                  }`}
                >
                  {msg.senderId === userId ? "You" : "Stranger"}:
                </span>{" "}
                {msg.senderId === userId ? (
                  <span className={theme === "dark" ? "text-gray-200" : "text-purple-900"}>
                    {msg.message}
                  </span>
                ) : (
                  <EncryptedText
                    text={msg.message}
                    className="inline"
                    revealDelayMs={30}
                    flipDelayMs={30}
                    encryptedClassName={theme === "dark" ? "text-gray-500" : "text-purple-400"}
                    revealedClassName={theme === "dark" ? "text-gray-200" : "text-purple-900"}
                  />
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        className={`border-t p-3 flex-shrink-0 transition-colors duration-300 ${
          theme === "dark" ? "bg-black border-purple-900/50" : "bg-white border-purple-200"
        }`}
      >
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            placeholder={isConnected ? "Type a message..." : "Connect to start chatting"}
            disabled={!isConnected}
            className={`flex-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm shadow-sm transition-colors duration-300 ${
              theme === "dark"
                ? "border-gray-700 focus:ring-purple-600 focus:border-transparent text-gray-200 disabled:bg-gray-800 disabled:cursor-not-allowed placeholder:text-gray-500 bg-gray-800"
                : "border-purple-300 focus:ring-purple-500 focus:border-transparent text-purple-900 disabled:bg-purple-50 disabled:cursor-not-allowed placeholder:text-purple-400 bg-white"
            }`}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!isConnected || !inputMessage.trim()}
            className={`px-5 py-2.5 rounded-xl transition-all font-semibold text-sm whitespace-nowrap shadow-md hover:shadow-lg ${
              theme === "dark"
                ? "bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-800 disabled:cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 disabled:from-purple-200 disabled:to-indigo-200 disabled:cursor-not-allowed"
            }`}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
