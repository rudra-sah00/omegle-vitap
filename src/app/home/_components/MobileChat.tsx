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
    <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 flex items-end">
      <div className="bg-white w-full h-[85vh] rounded-t-2xl shadow-xl transition-transform duration-300 ease-out transform translate-y-0">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Chat</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
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
