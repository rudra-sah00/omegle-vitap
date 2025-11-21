/**
 * Device Selector Component
 * Shows available cameras and microphones like Google Meet
 */

'use client';

import { useState, useEffect } from 'react';

interface DeviceInfo {
  deviceId: string;
  label: string;
  kind: 'videoinput' | 'audioinput';
}

interface DeviceSelectorProps {
  type: 'camera' | 'microphone';
  currentDeviceId?: string;
  onDeviceChange: (deviceId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLDivElement | null>;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  type,
  currentDeviceId,
  onDeviceChange,
  isOpen,
  onClose,
  buttonRef,
}) => {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen) {
      loadDevices();
      updatePosition();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.device-selector-menu') && !target.closest('.device-selector-button')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const updatePosition = () => {
    if (buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  };

  const loadDevices = async () => {
    try {
      // Request permissions first to get device labels
      await navigator.mediaDevices.getUserMedia({ 
        video: type === 'camera', 
        audio: type === 'microphone' 
      });

      const deviceInfos = await navigator.mediaDevices.enumerateDevices();
      const kind = type === 'camera' ? 'videoinput' : 'audioinput';
      
      const filteredDevices = deviceInfos
        .filter((device) => device.kind === kind && device.deviceId)
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `${type === 'camera' ? 'Camera' : 'Microphone'} ${index + 1}`,
          kind: device.kind as 'videoinput' | 'audioinput',
        }));

      setDevices(filteredDevices);
    } catch (error) {
      // If permission denied, still show devices without labels
      const deviceInfos = await navigator.mediaDevices.enumerateDevices();
      const kind = type === 'camera' ? 'videoinput' : 'audioinput';
      
      const filteredDevices = deviceInfos
        .filter((device) => device.kind === kind && device.deviceId)
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `${type === 'camera' ? 'Camera' : 'Microphone'} ${index + 1}`,
          kind: device.kind as 'videoinput' | 'audioinput',
        }));

      setDevices(filteredDevices);
    }
  };

  const handleDeviceSelect = (deviceId: string) => {
    onDeviceChange(deviceId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="device-selector-menu fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[280px]"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
        {type === 'camera' ? 'Select Camera' : 'Select Microphone'}
      </div>
      
      <div className="max-h-[300px] overflow-y-auto">
        {devices.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-500 text-center">
            No {type}s found
          </div>
        ) : (
          devices.map((device) => (
            <button
              key={device.deviceId}
              onClick={() => handleDeviceSelect(device.deviceId)}
              className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                device.deviceId === currentDeviceId ? 'bg-blue-50' : ''
              }`}
            >
              <span className="flex items-center gap-2">
                {type === 'camera' ? (
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
                <span className="truncate max-w-[200px]">{device.label}</span>
              </span>
              {device.deviceId === currentDeviceId && (
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
