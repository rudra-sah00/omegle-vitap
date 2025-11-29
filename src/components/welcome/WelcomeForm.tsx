'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import { JoinButton } from './JoinButton';
import { useUser } from '@/hooks';
import { ONLINE_STATUS_CHECK_INTERVAL } from '@/constants';

export const WelcomeForm = () => {
  const { name, setName, gender, setGender } = useUser();
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [serviceAvailable, setServiceAvailable] = useState(true);
  const [serviceMessage, setServiceMessage] = useState('');
  const [isCheckingService, setIsCheckingService] = useState(false);
  const [isCheckingOnlineStatus, setIsCheckingOnlineStatus] = useState(true);
  const [nameError, setNameError] = useState('');
  const router = useRouter();

  const validateName = (value: string): string => {
    const trimmedName = value.trim();
    if (trimmedName.length === 0) return '';
    if (trimmedName.length < 3) return 'Name must be at least 3 characters';
    if (/\d/.test(trimmedName)) return 'Name cannot contain numbers';
    if (!/^[a-zA-Z\s]+$/.test(trimmedName)) return 'Name can only contain letters and spaces';
    return '';
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    setNameError(validateName(value));
  };

  const isNameValid =
    name.trim().length >= 3 && !/\d/.test(name) && /^[a-zA-Z\s]+$/.test(name.trim());

  useEffect(() => {
    const checkOnlineStatus = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        if (backendUrl) {
          const res = await fetch(`${backendUrl}/status`);
          const data = await res.json();
          setIsOnline(data.status);
        } else {
          setIsOnline(true);
        }
      } catch {
        setIsOnline(false);
      } finally {
        setIsCheckingOnlineStatus(false);
      }
    };

    checkOnlineStatus();
    const interval = setInterval(checkOnlineStatus, ONLINE_STATUS_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const handleJoin = async () => {
    if (!isNameValid || isLoading) return;

    // Check if backend is online (reuse the status from useEffect)
    if (!isOnline) {
      setServiceAvailable(false);
      setServiceMessage(
        'Service is currently offline. Please try again during active hours (9 PM - 2 AM IST).'
      );
      return;
    }

    setIsLoading(true);
    setIsCheckingService(true);
    setServiceAvailable(true);
    setServiceMessage('');

    try {
      setIsCheckingService(false);
      router.push('/omegle');
    } catch {
      setServiceAvailable(false);
      setServiceMessage('Unable to navigate. Please try again.');
      setIsLoading(false);
      setIsCheckingService(false);
    }
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-[2.3rem] bg-gradient-to-br from-white/50 via-cyan-200/40 to-transparent blur-2xl opacity-50 pointer-events-none"></div>
      <div className="relative bg-white/15 backdrop-blur-2xl rounded-[2rem] pt-6 px-8 pb-8 sm:pt-6 sm:px-10 sm:pb-10 shadow-[0_12px_30px_rgba(15,23,42,0.18)] border border-white/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-purple-500/15 pointer-events-none"></div>
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col items-center gap-2 pt-1">
            <Image
              src="/Omegle.png"
              alt="Omegle VITAP logo"
              width={120}
              height={40}
              className="h-8 w-auto object-contain drop-shadow-lg"
              priority
            />
            <p className="text-[0.65rem] uppercase tracking-[0.4em] text-white/90">
              Built for Students, by Students
            </p>
            <div className="text-center space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-2xl tracking-tight">
                Welcome Back
              </h1>
              <p className="text-white/90 text-xs sm:text-sm font-medium">
                Connect with strangers, make new friends
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-white ml-1 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Display Name
            </label>
            <div className="relative group">
              <input
                type="text"
                placeholder="Enter your name (letters only)"
                value={name}
                onChange={handleNameChange}
                className={`w-full px-5 sm:px-6 py-4 sm:py-4 rounded-2xl bg-white/10 backdrop-blur-sm border ${nameError ? 'border-red-300/80 focus:ring-red-200/40' : 'border-white/30 focus:ring-white/40'} focus:outline-none focus:ring-4 text-white text-sm sm:text-base placeholder:text-white/70 transition-all shadow-xl font-medium`}
              />
              <div className="absolute inset-[2px] rounded-2xl bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </div>
            {nameError && <p className="text-red-200 text-xs ml-1 font-medium">{nameError}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-white ml-1 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Gender
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setGender('Male')}
                className={`py-4 sm:py-5 rounded-2xl font-bold text-sm sm:text-base shadow-xl relative overflow-hidden group transition-all hover:scale-[1.02] active:scale-[0.98] ${gender === 'Male' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' : 'bg-white/95 backdrop-blur-sm border-2 border-white/40 text-gray-900 hover:bg-white'}`}
              >
                {gender === 'Male' && (
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                )}
                <span className="relative flex items-center justify-center gap-2">Male</span>
              </Button>
              <Button
                onClick={() => setGender('Female')}
                className={`py-4 sm:py-5 rounded-2xl font-bold text-sm sm:text-base shadow-xl relative overflow-hidden group transition-all hover:scale-[1.02] active:scale-[0.98] ${gender === 'Female' ? 'bg-gradient-to-r from-pink-600 to-pink-700 text-white' : 'bg-white/95 backdrop-blur-sm border-2 border-white/40 text-gray-900 hover:bg-white'}`}
              >
                {gender === 'Female' && (
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                )}
                <span className="relative flex items-center justify-center gap-2">Female</span>
              </Button>
            </div>
          </div>
          {!serviceAvailable && serviceMessage && (
            <div className="bg-red-500/95 backdrop-blur-sm border-2 border-red-300 rounded-2xl p-4 shadow-xl animate-fade-in">
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-white flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-sm mb-1">Service Unavailable</h3>
                  <p className="text-white/95 text-xs leading-relaxed">{serviceMessage}</p>
                </div>
              </div>
            </div>
          )}
          <div className="pt-1">
            <JoinButton
              isOnline={isOnline}
              onClick={handleJoin}
              disabled={!isNameValid || isLoading}
              isChecking={isCheckingService}
              isCheckingOnlineStatus={isCheckingOnlineStatus}
            />
          </div>
          <p className="text-center text-xs text-white/80 pt-1 leading-relaxed">
            By continuing, you agree to our{' '}
            <Link
              href="/terms"
              className="text-white underline cursor-pointer hover:text-white transition-colors font-semibold"
            >
              Terms
            </Link>
            ,{' '}
            <Link
              href="/privacy"
              className="text-white underline cursor-pointer hover:text-white transition-colors font-semibold"
            >
              Privacy
            </Link>{' '}
            &{' '}
            <Link
              href="/community-guidelines"
              className="text-white underline cursor-pointer hover:text-white transition-colors font-semibold"
            >
              Guidelines
            </Link>
          </p>

          {/* University Partners */}
          <div className="mt-6 pt-4 border-t border-white/20">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {['VIT-AP', 'SRM-AP', 'NID-AP'].map((campus) => (
                <div
                  key={campus}
                  className="flex-1 min-w-[90px] px-4 py-2.5 bg-white/15 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg text-center"
                >
                  <span className="font-semibold text-white tracking-[0.15em] text-xs sm:text-sm uppercase">
                    {campus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
