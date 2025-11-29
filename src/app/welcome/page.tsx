'use client';

import { useEffect, useState } from 'react';
import { WelcomeForm } from '@/components/welcome/WelcomeForm';

export default function WelcomePage() {
  const [activeCount] = useState(() => Math.floor(Math.random() * 251) + 150);

  useEffect(() => {
    document.title = 'Welcome - Omegle VITAP';
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
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-14 items-start lg:items-center min-h-[70vh]">
          <section className="w-full max-w-md sm:max-w-lg mx-auto lg:mx-0 lg:max-w-md flex-shrink-0 lg:pt-4">
            <WelcomeForm />
          </section>

          <section className="flex-1 text-white flex flex-col gap-6 lg:pl-4">
            <div className="inline-flex w-fit items-center gap-3 rounded-full bg-white/15 backdrop-blur-xl px-4 py-2 border border-white/30 text-xs uppercase tracking-[0.35em]">
              Active now
              <span className="font-semibold tracking-normal text-base">{activeCount} online</span>
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-[3rem] font-extrabold leading-tight drop-shadow-xl max-w-2xl">
                Meet new people across campuses in a curated random chat experience.
              </h1>
            </div>

            <div className="w-full max-w-3xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5 lg:hidden">
                {[
                  { title: '5k+', subtitle: 'Matches made' },
                  { title: '4s', subtitle: 'Avg match time' },
                  { title: '9 PM – 1 AM', subtitle: 'Active nightly' },
                ].map((stat) => (
                  <div
                    key={stat.title}
                    className="rounded-[1.5rem] bg-white/15 backdrop-blur-xl border border-white/20 shadow-[0_8px_18px_rgba(15,23,42,0.12)] px-5 py-6 flex flex-col items-center justify-center text-center min-h-[120px]"
                  >
                    <p className="text-2xl font-bold leading-tight">{stat.title}</p>
                    <p className="text-sm text-white/80 mt-1.5">{stat.subtitle}</p>
                  </div>
                ))}
              </div>

              <ul className="hidden lg:flex flex-col gap-4 text-white/90 text-lg">
                {[
                  { title: '5k+ matches made', detail: 'Students paired every week' },
                  { title: '4 second average match time', detail: 'Lightning fast connects' },
                  { title: 'Active nightly 9 PM – 1 AM', detail: 'Peak community hours' },
                ].map((point) => (
                  <li
                    key={point.title}
                    className="flex items-start gap-4 bg-white/10 rounded-2xl px-5 py-4 backdrop-blur-xl border border-white/20 shadow-[0_6px_18px_rgba(15,23,42,0.12)]"
                  >
                    <span className="w-2 h-2 mt-2 rounded-full bg-emerald-300 flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    <div>
                      <p className="font-semibold text-white">{point.title}</p>
                      <p className="text-sm text-white/75">{point.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
