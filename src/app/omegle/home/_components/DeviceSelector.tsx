"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";

interface DeviceSelectorProps {
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
  type: "camera" | "microphone";
  disabled?: boolean;
}

/**
 * Device selector dropdown component similar to Google Meet
 * Shows available cameras or microphones with selection
 */
export default function DeviceSelector({
  devices,
  selectedDeviceId,
  onSelectDevice,
  type,
  disabled = false,
}: DeviceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (devices.length === 0) {
    return null;
  }

  const selectedDevice = devices.find((d) => d.deviceId === selectedDeviceId);
  const displayName = selectedDevice?.label || `Default ${type}`;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 bg-black/60 hover:bg-black/70 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed max-w-[200px]"
        title={`Select ${type}`}
      >
        <span className="truncate flex-1 text-left">{displayName}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-[250px] bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
          <div className="max-h-[200px] overflow-y-auto">
            {devices.map((device) => {
              const isSelected = device.deviceId === selectedDeviceId;
              return (
                <button
                  key={device.deviceId}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDevice(device.deviceId);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-gray-800 transition-colors ${
                    isSelected ? "bg-gray-800 text-blue-400" : "text-white"
                  }`}
                >
                  <span className="truncate flex-1">
                    {device.label || `${type} ${device.deviceId.slice(0, 8)}`}
                  </span>
                  {isSelected && <Check className="w-4 h-4 ml-2 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
