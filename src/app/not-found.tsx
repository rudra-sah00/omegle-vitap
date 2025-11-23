'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown === 0) {
      router.push('/welcome');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, router]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 flex items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <div className="mb-8">
          <span className="text-8xl">🔍</span>
        </div>
        
        <h1 className="text-6xl sm:text-7xl font-black tracking-tight mb-4 text-slate-900">
          404
        </h1>
        
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-700 mb-6">
          Page Not Found
        </h2>
        
        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
          Oops! The page you're looking for doesn't exist. 
          Don't worry, we'll redirect you to the home page in <span className="font-bold text-blue-600">{countdown}</span> seconds.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/welcome"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:scale-105 shadow-lg"
          >
            Go to Home Page
          </Link>
          
          <Link
            href="/faq"
            className="inline-block bg-white hover:bg-slate-50 text-slate-900 font-semibold px-8 py-4 rounded-xl transition-all border border-slate-200"
          >
            Visit FAQ
          </Link>
        </div>

        <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-sm text-slate-600">
            Looking for something specific?
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
            <Link href="/welcome" className="text-blue-600 hover:text-blue-700 font-medium">
              Start Chat
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/community-guidelines" className="text-blue-600 hover:text-blue-700 font-medium">
              Guidelines
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
              Privacy
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/terms" className="text-blue-600 hover:text-blue-700 font-medium">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
