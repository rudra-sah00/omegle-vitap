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
