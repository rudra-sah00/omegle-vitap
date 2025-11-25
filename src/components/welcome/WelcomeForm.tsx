'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import { JoinButton } from './JoinButton';
import { useUser } from '@/context/UserContext';

export const WelcomeForm = () => {
  const { name, setName, gender, setGender } = useUser();
  const [isOnline, setIsOnline] = useState(true); // Default to true while checking
  const [isLoading, setIsLoading] = useState(false);
  const [serviceAvailable, setServiceAvailable] = useState(true);
  const [serviceMessage, setServiceMessage] = useState('');
  const [isCheckingService, setIsCheckingService] = useState(false);
  const [isCheckingOnlineStatus, setIsCheckingOnlineStatus] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkOnlineStatus = async () => {
      try {
        // Check backend status directly
        const backendUrl = process.env.NEXT_PUBLIC_WS_URL;
        if (backendUrl) {
          const res = await fetch(`${backendUrl}/status`);
          const data = await res.json();
          setIsOnline(data.status);
        } else {
          setIsOnline(true); // Default to online if no backend URL
        }
      } catch (error) {
        // If backend is unreachable, assume offline
        setIsOnline(false);
      } finally {
        setIsCheckingOnlineStatus(false);
      }
    };

    checkOnlineStatus();
    const interval = setInterval(checkOnlineStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const handleJoin = async () => {
    if (!name.trim() || isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      setIsCheckingService(true);
      setServiceAvailable(true);
      setServiceMessage('');

      // Check backend status before navigating
      const backendUrl = process.env.NEXT_PUBLIC_WS_URL;
      if (!backendUrl) {
        setServiceAvailable(false);
        setServiceMessage('Backend service not configured. Please contact support.');
        setIsLoading(false);
        setIsCheckingService(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${backendUrl}/status`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (!data.status) {
        setServiceAvailable(false);
        setServiceMessage('Backend service is currently unavailable. Please try again later.');
        setIsLoading(false);
        setIsCheckingService(false);
        return;
      }

      // Service is available, navigate to chat
      setIsCheckingService(false);
      router.push('/omegle');
    } catch (error) {
      setServiceAvailable(false);
      setServiceMessage('Unable to connect to backend service. Please check your internet connection and try again.');
      setIsLoading(false);
      setIsCheckingService(false);
    }
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
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setGender('Male')}
                className={`py-4 sm:py-5 rounded-2xl font-bold text-sm sm:text-base shadow-xl relative overflow-hidden group transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  gender === 'Male'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                    : 'bg-white/95 backdrop-blur-sm border-2 border-white/40 text-gray-900 hover:bg-white'
                }`}
              >
                {gender === 'Male' && (
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                )}
                <span className="relative flex items-center justify-center gap-2">
                  Male
                </span>
              </Button>
              <Button
                onClick={() => setGender('Female')}
                className={`py-4 sm:py-5 rounded-2xl font-bold text-sm sm:text-base shadow-xl relative overflow-hidden group transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  gender === 'Female'
                    ? 'bg-gradient-to-r from-pink-600 to-pink-700 text-white'
                    : 'bg-white/95 backdrop-blur-sm border-2 border-white/40 text-gray-900 hover:bg-white'
                }`}
              >
                {gender === 'Female' && (
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                )}
                <span className="relative flex items-center justify-center gap-2">
                  Female
                </span>
              </Button>
            </div>
          </div>

          {/* Service Unavailable Error Banner - Only shown after check fails */}
          {!serviceAvailable && serviceMessage && (
            <div className="bg-red-500/95 backdrop-blur-sm border-2 border-red-300 rounded-2xl p-4 shadow-xl animate-fade-in">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-sm mb-1">Service Unavailable</h3>
                  <p className="text-white/95 text-xs leading-relaxed">
                    {serviceMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-1">
            <JoinButton
              isOnline={isOnline}
              onClick={handleJoin}
              disabled={!name.trim() || isLoading}
              isChecking={isCheckingService}
              isCheckingOnlineStatus={isCheckingOnlineStatus}
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
