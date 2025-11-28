'use client';

import Link from 'next/link';

interface ChatHeaderProps {
  isConnected: boolean;
}

export const ChatHeader = ({ isConnected }: ChatHeaderProps) => {
  return (
    <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-sm font-medium text-video-blue-text">
          {isConnected ? 'Connected' : 'Not connected'}
        </span>
      </div>
      <Link 
        href="/welcome" 
        className="flex items-center gap-1.5 text-sm font-medium transition-all hover:gap-2 text-video-blue-text"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Home
      </Link>
    </div>
  );
};
