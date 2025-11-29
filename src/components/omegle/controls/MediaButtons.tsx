/**
 * Media Buttons
 * Camera and microphone toggle controls with device selection
 */

'use client';

import { memo, RefObject } from 'react';
import { CameraOnIcon, CameraOffIcon, MicOnIcon, MicOffIcon, DropdownArrowIcon } from './Icons';
import { DeviceSelector } from '../video';

interface MediaToggleButtonProps {
  isOn: boolean;
  onToggle: () => void;
  type: 'camera' | 'microphone';
}

/**
 * Base media toggle button (camera/mic)
 */
export const MediaToggleButton = memo(({ isOn, onToggle, type }: MediaToggleButtonProps) => {
  const isCam = type === 'camera';
  const title = isOn
    ? `Turn off ${type} (stays off until you turn it back on)`
    : `Turn on ${type} (stays on for next matches)`;

  return (
    <button
      onClick={onToggle}
      className={`w-11 h-11 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-white transition-colors ${
        isOn ? 'bg-slate-600 hover:bg-slate-700' : 'bg-red-500 hover:bg-red-600'
      }`}
      title={title}
      aria-label={isOn ? `Turn off ${type}` : `Turn on ${type}`}
      aria-pressed={isOn}
    >
      {isCam ? isOn ? <CameraOnIcon /> : <CameraOffIcon /> : isOn ? <MicOnIcon /> : <MicOffIcon />}
    </button>
  );
});
MediaToggleButton.displayName = 'MediaToggleButton';

interface DeviceMenuTriggerProps {
  isOn: boolean;
  showMenu: boolean;
  onToggleMenu: (e: React.MouseEvent) => void;
  type: 'camera' | 'microphone';
}

/**
 * Small dropdown trigger button for device selection
 */
export const DeviceMenuTrigger = memo(({ isOn, onToggleMenu, type }: DeviceMenuTriggerProps) => {
  if (!isOn) return null;

  return (
    <button
      onClick={onToggleMenu}
      className="device-menu-trigger absolute -top-1 -right-1 w-5 h-5 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors"
      title={`Change ${type}`}
      aria-label={`Select ${type} device`}
      aria-haspopup="listbox"
    >
      <DropdownArrowIcon />
    </button>
  );
});
DeviceMenuTrigger.displayName = 'DeviceMenuTrigger';

interface MediaControlWithSelectorProps {
  type: 'camera' | 'microphone';
  isOn: boolean;
  currentDeviceId?: string;
  showMenu: boolean;
  buttonRef: RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onToggleMenu: (e: React.MouseEvent) => void;
  onCloseMenu: () => void;
  onSwitchDevice?: (deviceId: string) => void;
}

/**
 * Complete media control with toggle button + device selector
 */
export const MediaControlWithSelector = memo(
  ({
    type,
    isOn,
    currentDeviceId,
    showMenu,
    buttonRef,
    onToggle,
    onToggleMenu,
    onCloseMenu,
    onSwitchDevice,
  }: MediaControlWithSelectorProps) => {
    return (
      <div ref={buttonRef} className="relative device-selector-button">
        <MediaToggleButton isOn={isOn} onToggle={onToggle} type={type} />

        {onSwitchDevice && (
          <DeviceMenuTrigger
            isOn={isOn}
            showMenu={showMenu}
            onToggleMenu={onToggleMenu}
            type={type}
          />
        )}

        {onSwitchDevice && (
          <DeviceSelector
            type={type}
            currentDeviceId={currentDeviceId}
            onDeviceChange={onSwitchDevice}
            isOpen={showMenu}
            onClose={onCloseMenu}
            buttonRef={buttonRef}
          />
        )}
      </div>
    );
  }
);
MediaControlWithSelector.displayName = 'MediaControlWithSelector';
