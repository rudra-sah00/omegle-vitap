/**
 * Device Selector Component
 * Shows available cameras and microphones like Google Meet
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { analytics } from '@/services/firebase';

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

  const updatePosition = useCallback(() => {
    if (buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Position popup above the button with 8px gap
      // Calculate bottom position: distance from bottom of viewport to top of button + gap
      const bottomPosition = window.innerHeight - rect.top + 8;
      // Center the popup horizontally relative to the button
      const popupWidth = 280; // min-w-[280px]
      const leftPosition = rect.left + (rect.width / 2) - (popupWidth / 2);
      
      // Position values are calculated but not used since we use CSS positioning
      void bottomPosition;
      void leftPosition;
    }
  }, [buttonRef]);

  useEffect(() => {
    // Skip if not open
    if (!isOpen) return;
    
    // Use flag to prevent state updates after unmount
    let isMounted = true;
    
    const fetchDevices = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          return;
        }

        const deviceInfos = await navigator.mediaDevices.enumerateDevices();
        const kind = type === 'camera' ? 'videoinput' : 'audioinput';
        const hasLabels = deviceInfos.some(d => d.label !== '');
        
        if (!hasLabels) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
              video: type === 'camera', 
              audio: type === 'microphone' 
            });
            stream.getTracks().forEach(track => track.stop());
            
            const newDeviceInfos = await navigator.mediaDevices.enumerateDevices();
            const filteredDevices = newDeviceInfos
              .filter((device) => device.kind === kind && device.deviceId)
              .map((device, index) => ({
                deviceId: device.deviceId,
                label: device.label || `${type === 'camera' ? 'Camera' : 'Microphone'} ${index + 1}`,
                kind: device.kind as 'videoinput' | 'audioinput',
              }));
            if (isMounted) setDevices(filteredDevices);
            return;
          } catch {
            // Permission denied - continue with no labels
          }
        }
        
        const filteredDevices = deviceInfos
          .filter((device) => device.kind === kind && device.deviceId)
          .map((device, index) => ({
            deviceId: device.deviceId,
            label: device.label || `${type === 'camera' ? 'Camera' : 'Microphone'} ${index + 1}`,
            kind: device.kind as 'videoinput' | 'audioinput',
          }));

        if (isMounted) setDevices(filteredDevices);
      } catch {
        if (isMounted) setDevices([]);
      }
    };

    fetchDevices();
    updatePosition();
    
    // Update position on scroll or resize
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      isMounted = false;
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, type, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    // Track device list opened
    analytics.trackDeviceListOpened(type);

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking the trigger button or the menu itself
      if (!target.closest('.device-selector-menu') && 
          !target.closest('.device-selector-button') &&
          !target.closest('.device-menu-trigger')) {
        onClose();
      }
    };

    // Use setTimeout to prevent immediate closing when trigger is clicked
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, type]);

  const handleDeviceSelect = (deviceId: string) => {
    onDeviceChange(deviceId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="device-selector-menu absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[280px] bottom-full mb-2 left-1/2 -translate-x-1/2"
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
          devices.map((device) => {
            const isSelected = device.deviceId === currentDeviceId;
            return (
              <button
                key={device.deviceId}
                onClick={() => handleDeviceSelect(device.deviceId)}
                className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                  isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <span className="flex items-center gap-2">
                  {type === 'camera' ? (
                    <svg className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                  <span className={`truncate max-w-[200px] ${isSelected ? 'font-semibold text-blue-700' : ''}`}>{device.label}</span>
                </span>
                {isSelected && (
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
