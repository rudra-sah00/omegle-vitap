'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { JoinButton } from './JoinButton';
import { useUser } from '@/context/UserContext';

export const WelcomeForm = () => {
  const { name, setName, gender, setGender } = useUser();
  const [isOnline, setIsOnline] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkOnlineStatus = async () => {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        setIsOnline(data.isOnline);
      } catch (error) {
        // Silently fallback to local check if API fails
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const istOffset = 5.5 * 60 * 60000;
        const istTime = new Date(utc + istOffset);
        const hours = istTime.getHours();
        setIsOnline(hours >= 21 || hours < 1);
      }
    };

    checkOnlineStatus();
    const interval = setInterval(checkOnlineStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const handleJoin = () => {
    if (!name.trim()) {
      return;
    }
    // Navigate to the main chat page
    router.push('/omegle');
  };

  return (
    <div className="relative">
      {/* Premium Glass morphism card */}
      <div className="bg-white/15 backdrop-blur-2xl rounded-[2rem] pt-4 px-8 pb-8 sm:pt-6 sm:px-10 sm:pb-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/30 relative overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-purple-500/10 pointer-events-none"></div>
        
        {/* Content */}
        <div className="relative z-10 space-y-4">
          {/* Logo */}
          <div className="flex justify-center -mb-4 -mt-4">
            <div className="relative w-52 h-52 sm:w-56 sm:h-56 drop-shadow-2xl">
              <Image
                src="/omegle.png"
                alt="Omegle VITAP"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-2xl tracking-tight">
              Welcome Back
            </h1>
            <p className="text-white/90 text-xs sm:text-sm font-medium">
              Connect with strangers, make new friends
            </p>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-white ml-1 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Display Name
            </label>
            <div className="relative group">
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 sm:px-6 py-4 sm:py-4 rounded-2xl bg-white/95 backdrop-blur-sm border-2 border-white/40 focus:outline-none focus:ring-4 focus:ring-white/50 focus:border-white text-gray-900 text-sm sm:text-base placeholder:text-gray-500 transition-all shadow-xl font-medium hover:bg-white group-hover:shadow-2xl"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </div>
          </div>

          {/* Gender Selection */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-white ml-1 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Gender
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['Male', 'Female', 'Other'].map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`py-4 sm:py-4 rounded-2xl font-bold transition-all text-sm sm:text-base shadow-xl relative overflow-hidden group ${
                    gender === g
                      ? 'bg-white text-blue-600 scale-105 shadow-2xl'
                      : 'bg-white/25 text-white hover:bg-white/35 border-2 border-white/40 hover:scale-[1.02]'
                  }`}
                >
                  {gender !== g && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  )}
                  <span className="relative">{g}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-1">
            <JoinButton 
              isOnline={isOnline} 
              onClick={handleJoin}
              disabled={!name.trim()}
            />
          </div>

          {/* Links */}
          <p className="text-center text-xs text-white/80 pt-1 leading-relaxed">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="text-white underline cursor-pointer hover:text-white transition-colors font-semibold">Terms</Link>,{' '}
            <Link href="/privacy" className="text-white underline cursor-pointer hover:text-white transition-colors font-semibold">Privacy</Link> &{' '}
            <Link href="/community-guidelines" className="text-white underline cursor-pointer hover:text-white transition-colors font-semibold">Guidelines</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
