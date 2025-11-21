import React from 'react';

interface JoinButtonProps {
  isOnline: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export const JoinButton: React.FC<JoinButtonProps> = ({ isOnline, onClick, disabled }) => {
  if (!isOnline) {
    return (
      <button
        disabled
        className="w-full py-3 sm:py-4 rounded-xl bg-slate-800 text-white/70 font-semibold cursor-not-allowed text-sm sm:text-base border-2 border-slate-700"
      >
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Service Offline
          </span>
          <span className="text-xs font-normal opacity-75">Active Hours: 9:00 PM ~ 1:00 AM IST</span>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 sm:py-4 rounded-xl font-semibold text-white transition-all text-sm sm:text-base ${
        disabled
          ? 'bg-slate-400 cursor-not-allowed opacity-70'
          : 'bg-slate-800 hover:bg-slate-900'
      }`}
    >
      Start Chatting
    </button>
  );
};
