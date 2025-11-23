'use client';

import { WelcomeForm } from '@/components/welcome/WelcomeForm';
import { useEffect } from 'react';

export default function WelcomePage() {
  useEffect(() => {
    document.title = 'Random Video Chat with Strangers - Free Omegle Alternative | Omegle VITAP';
    
    // Update meta description dynamically
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Start free random video chat with strangers instantly. Talk to random people online, meet new friends anonymously. Best Omegle alternative for random stranger chat.');
    }
  }, []);

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden px-4 sm:px-6 md:px-8 py-8">
      {/* Animated gradient background - sky blue */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-400 via-blue-400 to-cyan-400 animate-gradient-xy"></div>
      
      {/* Animated orbs - muted sky blue */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-sky-300/40 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob"></div>
      <div className="absolute top-40 right-20 w-72 h-72 bg-blue-300/40 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-40 w-72 h-72 bg-cyan-300/40 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-4000"></div>
      
      <div className="relative w-full max-w-md sm:max-w-lg z-10">
        <WelcomeForm />
      </div>
    </div>
  );
}
