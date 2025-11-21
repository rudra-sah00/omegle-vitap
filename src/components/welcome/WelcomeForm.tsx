'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
        console.error('Failed to check status', error);
        // Fallback to local check if API fails
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
      alert('Please enter your name');
      return;
    }
    // Navigate to the main chat page
    router.push('/omegle');
  };

  return (
    <div className="bg-sky-200/50 backdrop-blur-sm rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl space-y-5 sm:space-y-6 min-h-[400px] flex flex-col justify-center">
      {/* Name Input */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-600 ml-1 uppercase tracking-wider">Display Name</label>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 sm:px-5 py-4 sm:py-5 rounded-xl bg-white/80 backdrop-blur-sm border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-base sm:text-lg placeholder:text-slate-400"
        />
      </div>

      {/* Gender Selection */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-600 ml-1 uppercase tracking-wider">Gender</label>
        <div className="flex gap-3">
          {['Male', 'Female', 'Other'].map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`flex-1 py-4 sm:py-5 rounded-xl font-semibold transition-all text-base sm:text-lg ${
                gender === g
                  ? 'bg-blue-600 text-white shadow-lg scale-[1.02]'
                  : 'bg-white/80 text-slate-700 hover:bg-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-3">
        <JoinButton 
          isOnline={isOnline} 
          onClick={handleJoin}
          disabled={!name.trim()}
        />
      </div>

      {/* Links */}
      <p className="text-center text-xs sm:text-sm text-slate-700 pt-2 leading-relaxed">
        By continuing, you agree to our{' '}
        <Link href="/terms" className="underline cursor-pointer hover:text-blue-600 transition-colors">Terms</Link>,{' '}
        <Link href="/privacy" className="underline cursor-pointer hover:text-blue-600 transition-colors">Privacy</Link> &{' '}
        <Link href="/community-guidelines" className="underline cursor-pointer hover:text-blue-600 transition-colors">Community Guidelines</Link>
      </p>
    </div>
  );
};
