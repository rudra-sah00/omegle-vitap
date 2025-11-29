'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const MAINTENANCE_MODE = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

/**
 * Maintenance Page Component
 *
 * @description Displays a maintenance notice when NEXT_PUBLIC_MAINTENANCE_MODE is 'true'.
 * Automatically redirects to welcome page when maintenance mode is disabled.
 * Page title is set in layout.tsx using Next.js metadata API.
 */
export default function MaintenancePage() {
  const router = useRouter();

  useEffect(() => {
    // If maintenance mode is off, redirect immediately
    if (!MAINTENANCE_MODE) {
      router.replace('/welcome');
    }
  }, [router]);

  // Don't render content if maintenance mode is off
  if (!MAINTENANCE_MODE) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Icon and Title */}
        <div className="space-y-6">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-slate-100 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>

          <div className="space-y-3">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight">
              Under Maintenance
            </h1>
            <p className="text-xl text-slate-600 max-w-lg mx-auto">
              We&apos;re currently performing scheduled maintenance to improve your experience
            </p>
          </div>
        </div>

        {/* Status Box */}
        <div className="inline-block bg-slate-50 border border-slate-200 rounded-2xl px-8 py-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <p className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Status</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">Service will resume shortly</p>
        </div>

        {/* Footer Links */}
        <div className="pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500 mb-3">While you wait, you can review our:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/terms"
              className="text-slate-700 hover:text-slate-900 font-medium underline underline-offset-4 hover:underline-offset-2 transition-all"
            >
              Terms of Service
            </Link>
            <span className="text-slate-300">•</span>
            <Link
              href="/privacy"
              className="text-slate-700 hover:text-slate-900 font-medium underline underline-offset-4 hover:underline-offset-2 transition-all"
            >
              Privacy Policy
            </Link>
            <span className="text-slate-300">•</span>
            <Link
              href="/community-guidelines"
              className="text-slate-700 hover:text-slate-900 font-medium underline underline-offset-4 hover:underline-offset-2 transition-all"
            >
              Community Guidelines
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
