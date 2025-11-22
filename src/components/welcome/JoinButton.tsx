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
        className="w-full py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold cursor-not-allowed text-sm sm:text-base shadow-xl border-2 border-red-400/50 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative flex flex-col items-center justify-center gap-2">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shadow-lg" />
            Service Offline
          </span>
          <span className="text-xs font-normal opacity-90">Active Hours: 9:00 PM ~ 1:00 AM IST</span>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-4 sm:py-5 rounded-2xl font-bold text-white transition-all text-sm sm:text-base shadow-xl relative overflow-hidden group ${
        disabled
          ? 'bg-gray-400 cursor-not-allowed opacity-70'
          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 hover:scale-[1.02] active:scale-[0.98]'
      }`}
    >
      {!disabled && (
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
      )}
      <span className="relative flex items-center justify-center gap-2">
        Find Match
      </span>
    </button>
  );
};
