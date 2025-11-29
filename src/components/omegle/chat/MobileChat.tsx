'use client';

import React from 'react';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import type { ConnectionState } from '@/types/matchmaking';
import type { MessageData } from '@/hooks/useChat';

interface MobileChatProps {
  isConnected: boolean;
  isStrangerTyping?: boolean;
  onSendMessage?: (message: string) => void;
  onTyping?: (isTyping: boolean) => void;
  connectionState?: ConnectionState;
  messages?: MessageData[];
  partnerName?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export const MobileChat = ({
  isConnected,
  isStrangerTyping = false,
  onSendMessage,
  onTyping,
  messages = [],
  partnerName,
  isOpen = false,
  onClose,
}: MobileChatProps) => {
  // Reset chat state when disconnected
  React.useEffect(() => {
    if (!isConnected && onClose) {
      onClose();
    }
  }, [isConnected, onClose]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Chat Panel - Full screen overlay without sidebars */}
      <div
        id="mobile-chat"
        className={`lg:hidden fixed inset-0 bg-white z-50 overflow-hidden ${isOpen ? '' : 'hidden'}`}
      >
        <div className="flex flex-col h-full w-full overflow-hidden">
          {/* Mobile Header with Close Button */}
          <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between border-b border-slate-200 bg-white">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              ></div>
              <span className="text-sm font-medium text-video-blue-text">
                {isConnected ? 'Connected' : 'Not connected'}
              </span>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              title="Close Chat"
            >
              <svg
                className="w-6 h-6 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <ChatMessages
              isConnected={isConnected}
              isStrangerTyping={isStrangerTyping}
              messages={messages}
              partnerName={partnerName}
            />
          </div>
          <div className="flex-shrink-0">
            <ChatInput isConnected={isConnected} onSend={onSendMessage} onTyping={onTyping} />
          </div>
        </div>
      </div>
    </>
  );
};
