'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { analytics } from '@/services/firebase';
import { EMOJI_PICKER_HIDE_DELAY, MAX_MESSAGE_LENGTH } from '@/constants';
import { FileUpload, FilePreview } from './FileUpload';
import { showError } from '@/lib';

// Dynamically import emoji picker to avoid SSR issues
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface ChatInputProps {
  isConnected: boolean;
  onSend?: (message: string) => void;
  onFileUpload?: (file: File, caption?: string) => Promise<void>;
  onTyping?: (isTyping: boolean) => void;
}

export const ChatInput = ({ isConnected, onSend, onFileUpload, onTyping }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(undefined);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(async () => {
    const trimmedMessage = message.trim();

    // If there's a file, send it with optional caption
    if (selectedFile) {
      if (isSending || !isConnected) return;

      setIsSending(true);
      setUploadProgress(0);

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev === undefined || prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        await onFileUpload?.(selectedFile, trimmedMessage || undefined);

        clearInterval(progressInterval);
        setUploadProgress(100);

        // Clear file and message
        setSelectedFile(null);
        setMessage('');
        setUploadProgress(undefined);

        // Track analytics
        analytics.trackMessageSent(trimmedMessage.length, false);
      } catch (error) {
        console.error('File upload failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'File upload failed';
        showError(errorMessage);
        setUploadProgress(undefined);
      } finally {
        setIsSending(false);
        inputRef.current?.focus();
      }

      return;
    }

    // Regular text message
    // Prevent sending if already sending, not connected, or empty message
    if (isSending || !isConnected || !trimmedMessage) {
      return;
    }

    setIsSending(true);

    // Clear typing timeout and send stop typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    onTyping?.(false);

    // Send message
    onSend?.(trimmedMessage);

    // Track analytics
    const hasEmoji = /[\p{Emoji}]/u.test(trimmedMessage);
    analytics.trackMessageSent(trimmedMessage.length, hasEmoji);

    // Clear input
    setMessage('');

    // Reset sending state after a short delay to prevent rapid fire
    setTimeout(() => {
      setIsSending(false);
      inputRef.current?.focus();
    }, 100);
  }, [message, selectedFile, isSending, isConnected, onSend, onFileUpload, onTyping]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);

    if (!isConnected) return;

    // Send typing indicator
    if (newValue.length > 0) {
      onTyping?.(true);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing after inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTyping?.(false);
        typingTimeoutRef.current = null;
      }, EMOJI_PICKER_HIDE_DELAY);
    } else {
      // User cleared the input
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      onTyping?.(false);
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleEmojiClick = useCallback(
    (emojiData: { emoji: string }) => {
      setMessage((prev) => prev + emojiData.emoji);
      setShowEmojiPicker(false);
      onTyping?.(true);

      // Track emoji usage
      analytics.trackEmojiUsed();

      // Focus input after emoji selection
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    [onTyping]
  );

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Focus input when connected
  useEffect(() => {
    if (isConnected) {
      inputRef.current?.focus();
    }
  }, [isConnected]);

  const canSend = isConnected && (message.trim().length > 0 || selectedFile !== null) && !isSending;

  return (
    <div className="border-t border-slate-200 p-4 bg-white relative">
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-20 left-4 z-50">
          <EmojiPicker onEmojiClick={handleEmojiClick} width={300} height={400} />
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <FilePreview
          file={selectedFile}
          onRemove={() => setSelectedFile(null)}
          uploadProgress={uploadProgress}
        />
      )}

      <div className="flex gap-2">
        {/* File Upload Button */}
        <FileUpload isConnected={isConnected} onFileSelect={setSelectedFile} disabled={isSending} />

        {/* Emoji Button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={!isConnected}
          className="p-3 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          title="Add emoji"
          type="button"
        >
          <span className="text-xl">😊</span>
        </button>

        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedFile
              ? 'Add a caption (optional)...'
              : isConnected
                ? 'Type your message...'
                : 'Connect to start chatting'
          }
          disabled={!isConnected}
          className="flex-1 px-4 py-3 text-sm rounded-xl border-2 border-slate-200 focus:outline-none focus:border-blue-400 transition-colors disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
          maxLength={MAX_MESSAGE_LENGTH}
          autoComplete="off"
          spellCheck="true"
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            canSend
              ? 'bg-blue-500 hover:bg-blue-600 active:scale-95'
              : 'bg-slate-300 cursor-not-allowed'
          }`}
          title={
            selectedFile ? 'Send file' : canSend ? 'Send message (Enter)' : 'Type a message to send'
          }
          type="button"
        >
          {isSending ? (
            <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Character Counter */}
      {message.length > 0 && (
        <div className="mt-2 text-right">
          <span
            className={`text-xs ${
              message.length >= MAX_MESSAGE_LENGTH
                ? 'text-red-500 font-semibold'
                : message.length >= MAX_MESSAGE_LENGTH * 0.9
                  ? 'text-orange-500'
                  : 'text-slate-400'
            }`}
          >
            {message.length} / {MAX_MESSAGE_LENGTH}
          </span>
        </div>
      )}
    </div>
  );
};
