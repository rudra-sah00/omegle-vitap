import { ReactNode } from 'react';

interface VideoDisplayProps {
  id: string;
  label: string;
  isConnected: boolean;
  isSearching: boolean;
  showConnectionIndicator?: boolean;
  children?: ReactNode;
}

export function VideoDisplay({ 
  id, 
  label, 
  isConnected, 
  isSearching,
  showConnectionIndicator = false,
  children 
}: VideoDisplayProps) {
  return (
    <div className="flex-1 relative overflow-hidden rounded-lg" style={{ backgroundColor: '#c8e6f5', minHeight: '300px' }}>
      {/* Video Element */}
      <div
        id={id}
        className="absolute inset-0 w-full h-full"
        style={{ backgroundColor: '#c8e6f5' }}
      />

      {/* Placeholder when not connected */}
      {!isConnected && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mb-3" 
            style={{ backgroundColor: '#a8d8f0' }}
          >
            <svg className="w-10 h-10" style={{ color: '#0084d1' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: '#0084d1' }}>
            {label}
          </p>
          {isSearching && (
            <p className="text-xs text-slate-500 mt-1 animate-pulse">Searching for match...</p>
          )}
        </div>
      )}

      {/* Connection Indicator */}
      {isConnected && showConnectionIndicator && (
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-white text-sm font-medium">{label}</p>
        </div>
      )}

      {/* Children (e.g., controls) */}
      {children}
    </div>
  );
}
