'use client';

import { memo } from 'react';

export type NetworkQuality = 'excellent' | 'good' | 'poor' | 'unknown';

interface NetworkQualityIndicatorProps {
  quality: NetworkQuality;
  label?: string;
  showLabel?: boolean;
  className?: string;
}

const getQualityConfig = (quality: NetworkQuality) => {
  switch (quality) {
    case 'excellent':
      return {
        bars: 4,
        color: '#22c55e', // green-500
        label: 'Excellent',
      };
    case 'good':
      return {
        bars: 3,
        color: '#22c55e', // green-500
        label: 'Good',
      };
    case 'poor':
      return {
        bars: 1,
        color: '#ef4444', // red-500
        label: 'Poor',
      };
    case 'unknown':
    default:
      return {
        bars: 2, // Show 2 bars while measuring
        color: '#9ca3af', // gray - indicates still measuring
        label: 'Measuring...',
      };
  }
};

const NetworkQualityIndicatorComponent = ({
  quality,
  label,
  showLabel = false,
  className = '',
}: NetworkQualityIndicatorProps) => {
  const config = getQualityConfig(quality);
  const displayLabel = label || config.label;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Signal bars */}
      <div className="flex items-end gap-0.5 h-4">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className="w-1 rounded-sm transition-all duration-300"
            style={{
              height: `${bar * 25}%`,
              backgroundColor: bar <= config.bars ? config.color : 'rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>

      {/* Label */}
      {showLabel && (
        <span className="text-xs font-medium" style={{ color: config.color }}>
          {displayLabel}
        </span>
      )}
    </div>
  );
};

export const NetworkQualityIndicator = memo(NetworkQualityIndicatorComponent);
