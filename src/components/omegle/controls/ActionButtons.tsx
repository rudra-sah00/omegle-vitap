/**
 * Action Buttons
 * Room action controls: Start, Stop, Next, Leave, Screen Share
 */

'use client';

import { memo } from 'react';
import { Button } from '@heroui/button';
import {
  PlayIcon,
  StopIcon,
  NextIcon,
  LeaveIcon,
  ScreenShareIcon,
  ScreenShareOffIcon,
  CloseIcon,
} from './Icons';

interface ActionButtonProps {
  onClick: () => void;
  className?: string;
  title?: string;
  disabled?: boolean;
}

/**
 * Start matching button
 */
export const StartButton = memo(({ onClick, disabled }: ActionButtonProps) => (
  <Button
    onClick={onClick}
    isIconOnly
    radius="full"
    isDisabled={disabled}
    className="w-12 h-12 min-w-12 bg-green-500 hover:bg-green-600 text-white"
    title="Start matching"
    aria-label="Start matching with a stranger"
  >
    <PlayIcon />
  </Button>
));
StartButton.displayName = 'StartButton';

/**
 * Stop searching button
 */
export const StopButton = memo(({ onClick, disabled }: ActionButtonProps) => (
  <Button
    onClick={onClick}
    isIconOnly
    radius="full"
    isDisabled={disabled}
    className="w-12 h-12 min-w-12 bg-red-500 hover:bg-red-600 text-white"
    title="Stop searching"
    aria-label="Stop searching for a match"
  >
    <StopIcon />
  </Button>
));
StopButton.displayName = 'StopButton';

/**
 * Next stranger button
 */
export const NextButton = memo(({ onClick, disabled }: ActionButtonProps) => (
  <Button
    onClick={onClick}
    isIconOnly
    radius="full"
    isDisabled={disabled}
    className="w-12 h-12 min-w-12 text-white"
    style={{ backgroundColor: '#0084d1' }}
    title="Next stranger"
    aria-label="Skip to next stranger"
  >
    <NextIcon />
  </Button>
));
NextButton.displayName = 'NextButton';

/**
 * Leave room button
 */
export const LeaveButton = memo(({ onClick, disabled }: ActionButtonProps) => (
  <Button
    onClick={onClick}
    isIconOnly
    radius="full"
    isDisabled={disabled}
    className="w-12 h-12 min-w-12 bg-red-500 hover:bg-red-600 text-white"
    title="Leave room"
    aria-label="Leave the chat room"
  >
    <LeaveIcon />
  </Button>
));
LeaveButton.displayName = 'LeaveButton';

interface ScreenShareButtonProps extends ActionButtonProps {
  isSharing: boolean;
}

/**
 * Screen share toggle button
 * Styled to match camera/mic toggle buttons
 * - Green when sharing (active state)
 * - Slate when not sharing (inactive state)
 */
export const ScreenShareButton = memo(
  ({ onClick, isSharing, disabled }: ScreenShareButtonProps) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${
        isSharing ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-600 hover:bg-slate-700'
      }`}
      title={isSharing ? 'Stop sharing screen' : 'Share screen'}
      aria-label={isSharing ? 'Stop sharing your screen' : 'Share your screen'}
      aria-pressed={isSharing}
    >
      {isSharing ? <ScreenShareOffIcon /> : <ScreenShareIcon />}
    </button>
  )
);
ScreenShareButton.displayName = 'ScreenShareButton';

/**
 * Stop screen share inline button (for indicator)
 */
export const StopShareButton = memo(({ onClick }: ActionButtonProps) => (
  <button
    onClick={onClick}
    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1"
    aria-label="Stop sharing screen"
  >
    <CloseIcon />
    Stop
  </button>
));
StopShareButton.displayName = 'StopShareButton';

interface ChatButtonProps extends ActionButtonProps {
  unreadCount?: number;
}

/**
 * Mobile chat toggle button
 * Shows unread message count badge
 */
export const ChatButton = memo(({ onClick, disabled, unreadCount = 0 }: ChatButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-12 h-12 rounded-full bg-slate-600 hover:bg-slate-700 flex items-center justify-center text-white transition-colors relative"
    title="Open chat"
    aria-label="Open chat"
  >
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>

    {/* Unread Message Count Badge */}
    {unreadCount > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    )}
  </button>
));
ChatButton.displayName = 'ChatButton';
