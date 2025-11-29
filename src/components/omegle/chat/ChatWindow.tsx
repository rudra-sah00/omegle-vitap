'use client';

import { memo } from 'react';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import type { ConnectionState } from '@/types/matchmaking';
import type { MessageData } from '@/hooks/useChat';

interface ChatWindowProps {
  isConnected: boolean;
  isStrangerTyping?: boolean;
  onSendMessage?: (message: string) => void;
  onTyping?: (isTyping: boolean) => void;
  connectionState?: ConnectionState;
  messages?: MessageData[];
  partnerName?: string;
}

const ChatWindowComponent = ({
  isConnected,
  isStrangerTyping = false,
  onSendMessage,
  onTyping,
  messages = [],
  partnerName,
}: ChatWindowProps) => {
  return (
    <div className="hidden lg:flex flex-col bg-white border-l border-slate-300 w-full lg:w-[45%] h-full shadow-xl overflow-hidden">
      <ChatHeader isConnected={isConnected} />
      <div className="flex-1 overflow-hidden">
        <ChatMessages
          isConnected={isConnected}
          isStrangerTyping={isStrangerTyping}
          messages={messages}
          partnerName={partnerName}
        />
      </div>
      <ChatInput isConnected={isConnected} onSend={onSendMessage} onTyping={onTyping} />
    </div>
  );
};

export const ChatWindow = memo(ChatWindowComponent);
