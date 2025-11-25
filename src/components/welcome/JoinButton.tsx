import React from 'react';
import { Button } from '@heroui/button';

interface JoinButtonProps {
  isOnline: boolean;
  onClick?: () => void;
  disabled?: boolean;
  isChecking?: boolean;
  isCheckingOnlineStatus?: boolean;
}

export const JoinButton: React.FC<JoinButtonProps> = ({ isOnline, onClick, disabled, isChecking, isCheckingOnlineStatus }) => {
  // Checking online status on page load
  if (isCheckingOnlineStatus) {
    return (
      <Button
        isDisabled
        className="w-full py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-gray-400 to-gray-500 text-white font-bold text-sm sm:text-base shadow-xl border-2 border-gray-300/50 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex flex-col items-center justify-center gap-2">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Checking Status...
          </span>
        </div>
      </Button>
    );
  }

  // Checking backend availability
  if (isChecking) {
    return (
      <Button
        isDisabled
        isLoading
        className="w-full py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-sm sm:text-base shadow-xl border-2 border-blue-400/50"
      >
        Connecting...
      </Button>
    );
  }

  // Offline hours - scheduled maintenance
  if (!isOnline) {
    return (
      <Button
        isDisabled
        className="w-full py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-sm sm:text-base shadow-xl border-2 border-red-400/50 relative overflow-hidden h-auto min-h-[4rem]"
      >
        <div className="flex flex-col items-center justify-center gap-1 w-full">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shadow-lg" />
            Service Offline
          </span>
          <span className="text-xs font-normal opacity-90">Active Hours: 9:00 PM ~ 2:00 AM IST</span>
        </div>
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      isDisabled={disabled}
      className={`w-full py-4 sm:py-5 rounded-2xl font-bold text-white text-sm sm:text-base shadow-xl relative overflow-hidden group ${disabled
        ? 'bg-gray-400 opacity-70'
        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 hover:scale-[1.02] active:scale-[0.98]'
        }`}
    >
      {!disabled && (
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
      )}
      <span className="relative flex items-center justify-center gap-2">
        Find Match
      </span>
    </Button>
  );
};
