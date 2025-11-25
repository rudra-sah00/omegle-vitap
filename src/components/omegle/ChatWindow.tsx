'use client';

import { memo } from 'react';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import type { ConnectionState } from '@/types/matchmaking';
import type { MessageData } from '@/hooks/useSocketIOChat';

interface ChatWindowProps {
  isConnected: boolean;
  isStrangerTyping?: boolean;
  onSendMessage?: (message: string) => void;
  onTyping?: (isTyping: boolean) => void;
  connectionState?: ConnectionState;
  messages?: MessageData[];
  partnerName?: string;
}

const ChatWindowComponent = ({ isConnected, isStrangerTyping = false, onSendMessage, onTyping, connectionState = 'disconnected', messages = [], partnerName }: ChatWindowProps) => {
  return (
    <div className="hidden lg:flex flex-col bg-white border-l border-slate-300 w-full lg:w-[45%] h-screen shadow-xl overflow-hidden">
      <ChatHeader isConnected={isConnected} />
      <ChatMessages isConnected={isConnected} isStrangerTyping={isStrangerTyping} messages={messages} partnerName={partnerName} />
      <ChatInput isConnected={isConnected} onSend={onSendMessage} onTyping={onTyping} />
    </div>
  );
};

export const ChatWindow = memo(ChatWindowComponent);
