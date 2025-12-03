'use client';

import { useEffect, useRef, useState } from 'react';
import { TypingIndicator } from './TypingIndicator';
import { FileMessage } from './FileMessage';
import { formatMessage } from '@/utils/messageFormatter';
import { TextAnimate } from '@/components/ui/text-animate';
import type { MessageData } from '@/hooks/useChat';

interface ChatMessagesProps {
  isConnected: boolean;
  isStrangerTyping?: boolean;
  messages?: MessageData[];
  partnerName?: string;
}

export const ChatMessages = ({
  isConnected,
  isStrangerTyping = false,
  messages = [],
  partnerName,
}: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Track which message IDs have been animated (to not re-animate on re-render)
  const [animatedIds, setAnimatedIds] = useState<Set<string>>(new Set());

  // Auto-scroll to bottom when new messages arrive - using scrollTop to prevent page scroll
  useEffect(() => {
    if (containerRef.current) {
      // Use scrollTop instead of scrollIntoView to keep scroll within container
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isStrangerTyping]);

  // Mark messages as animated after they appear
  useEffect(() => {
    const newIds = messages.filter((m) => !animatedIds.has(m.id)).map((m) => m.id);

    if (newIds.length > 0) {
      // Mark as animated after a short delay to let animation play
      const timer = setTimeout(() => {
        setAnimatedIds((prev) => {
          const next = new Set(prev);
          newIds.forEach((id) => next.add(id));
          return next;
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [messages, animatedIds]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto overflow-x-hidden p-4 bg-gradient-to-b from-white to-slate-50/30 scroll-smooth hide-scrollbar"
    >
      {!isConnected ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-3">
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#e0f2fe' }}
            >
              <svg
                className="w-8 h-8"
                style={{ color: '#0084d1' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-slate-600 text-sm font-medium">
              Click &quot;Start&quot; to begin chatting
            </p>
            <p className="text-slate-400 text-xs">
              Connect with a stranger and start a conversation
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((message) => {
            const isYou = message.senderName === 'You';
            const isNewMessage = !animatedIds.has(message.id);
            const isFileMessage = Boolean(message.fileUrl);
            // Check if message has URLs (links) - if so, skip animation
            const hasLinks = /https?:\/\/|www\./i.test(message.text);
            const shouldAnimate = !isYou && isNewMessage && !hasLinks && !isFileMessage;

            return (
              <div key={message.id} className="w-full">
                {/* For file messages, pass sender name to show overlaid on image */}
                {isFileMessage && message.fileUrl && message.fileName && message.mimeType ? (
                  <FileMessage
                    fileUrl={message.fileUrl}
                    fileName={message.fileName}
                    mimeType={message.mimeType}
                    fileSize={message.fileSize}
                    caption={message.text || undefined}
                    senderName={isYou ? 'You' : partnerName || 'Stranger'}
                    isYou={isYou}
                  />
                ) : (
                  <div className="flex items-start gap-2">
                    <span
                      className={`text-sm font-semibold min-w-[70px] flex-shrink-0 ${
                        isYou ? 'text-blue-600' : 'text-slate-600'
                      }`}
                    >
                      {isYou ? 'You:' : `${partnerName || 'Stranger'}:`}
                    </span>
                    <div className="flex-1 text-sm text-slate-800 break-words break-all overflow-hidden whitespace-pre-wrap min-w-0">
                      {shouldAnimate ? (
                        <TextAnimate
                          animation="slideLeft"
                          by="character"
                          duration={0.5}
                          startOnView={false}
                          once={true}
                          className="inline"
                          as="span"
                        >
                          {message.text}
                        </TextAnimate>
                      ) : (
                        formatMessage(message.text)
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {isStrangerTyping && (
            <div className="flex items-start gap-2 w-full">
              <span className="text-sm font-semibold min-w-[70px] flex-shrink-0 text-slate-600">
                {partnerName || 'Stranger'}:
              </span>
              <TypingIndicator />
            </div>
          )}
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};
