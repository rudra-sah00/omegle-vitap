"use client";

import { useState } from "react";
import { useAuth } from "@/context";
import MediaControls from "./MediaControls";
import AccountModal from "./AccountModal";

interface VideoPlaceholderProps {
  label: string;
  isUser?: boolean;
  fullHeight?: boolean;
}

export default function VideoPlaceholder({ label, isUser = false, fullHeight = false }: VideoPlaceholderProps) {
  const [showControls, setShowControls] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <div 
        className={`relative bg-gray-900 rounded-lg overflow-hidden ${fullHeight ? 'h-full' : isUser ? 'h-48' : 'h-64'} cursor-pointer`}
        onClick={() => isUser && setShowControls(!showControls)}
        onMouseEnter={() => isUser && setShowControls(true)}
        onMouseLeave={() => isUser && setShowControls(false)}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`${isUser ? 'w-16 h-16' : 'w-24 h-24'} mx-auto mb-3 bg-gray-700 rounded-full flex items-center justify-center`}>
              <svg className={`${isUser ? 'w-8 h-8' : 'w-12 h-12'} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm font-medium">{label}</p>
          </div>
        </div>
        
        <div className="absolute top-3 left-3 bg-black bg-opacity-50 px-2 py-1 rounded text-xs text-white">
          {isUser ? "You" : "Stranger"}
        </div>

        {isUser && user && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAccountModal(true);
            }}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-colors shadow-lg"
            title="My Account"
          >
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </button>
        )}

        {isUser && showControls && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-3">
            <MediaControls />
          </div>
        )}
      </div>

      <AccountModal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} />
    </>
  );
}
