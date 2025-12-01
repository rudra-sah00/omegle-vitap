'use client';

import { useEffect } from 'react';
import { WelcomeForm } from '@/components/welcome/WelcomeForm';

export default function WelcomePage() {
  useEffect(() => {
    document.title = 'Welcome - Omegle';
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-sky-500/40">
      {/* Core animated gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-400 via-blue-400 to-cyan-400 animate-gradient-xy" />

      {/* Premium overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_50%)] opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.45),_transparent_55%)] opacity-70" />
        <div className="absolute inset-0 opacity-30 bg-[linear-gradient(120deg,rgba(255,255,255,0.18)_1px,transparent_1px)] bg-[size:160px_160px]" />
        <div className="absolute inset-0 opacity-40 blur-3xl bg-gradient-to-br from-white/10 via-transparent to-purple-500/20" />
      </div>

      {/* Animated orbs - keep original hues */}
      <div className="absolute top-20 left-10 sm:left-20 w-60 sm:w-72 h-60 sm:h-72 bg-sky-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
      <div className="absolute top-44 right-4 sm:right-20 w-56 sm:w-72 h-56 sm:h-72 bg-blue-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-10 left-20 sm:left-40 w-64 sm:w-72 h-64 sm:h-72 bg-cyan-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000" />

      <main className="relative z-10 px-4 sm:px-8 lg:px-12 py-10 sm:py-14 lg:py-16">
        <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[70vh]">
          <section className="w-full max-w-md sm:max-w-lg mx-auto">
            <WelcomeForm />
          </section>
        </div>
      </main>
    </div>
  );
}
