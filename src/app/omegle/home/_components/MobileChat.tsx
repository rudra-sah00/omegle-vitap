"use client";

import { ChatMessage } from "@/hooks/useChat";
import ChatWindow from "./ChatWindow";

interface MobileChatProps {
  messages: ChatMessage[];
  partnerTyping: boolean;
  isConnected: boolean;
  showMobileChat: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => void;
  onTyping: () => void;
  userId: string;
}

export default function MobileChat({
  messages,
  partnerTyping,
  isConnected,
  showMobileChat,
  onClose,
  onSendMessage,
  onTyping,
  userId,
}: MobileChatProps) {
  if (!showMobileChat) return null;

  return (
    <div className="md:hidden fixed inset-0 bg-black bg-opacity-60 z-40 flex items-end backdrop-blur-sm">
      <div className="w-full h-[85vh] rounded-t-3xl shadow-2xl transition-all duration-300 ease-out transform translate-y-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex items-center justify-between p-4 border-b rounded-t-3xl border-slate-200/60 bg-gradient-to-r from-slate-100 to-blue-100">
          <h3 className="text-lg font-bold text-slate-800">Chat</h3>
          <button
            onClick={onClose}
            className="text-2xl leading-none transition-colors text-slate-500 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
        <div className="h-[calc(100%-64px)]">
          <ChatWindow
            messages={messages}
            partnerTyping={partnerTyping}
            partnerOnline={isConnected}
            onSendMessage={onSendMessage}
            onTyping={onTyping}
            isConnected={isConnected}
            userId={userId}
          />
        </div>
      </div>
    </div>
  );
}
