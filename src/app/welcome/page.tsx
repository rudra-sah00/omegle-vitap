'use client';

import { WelcomeForm } from '@/components/welcome/WelcomeForm';
import { useEffect } from 'react';

export default function WelcomePage() {
  useEffect(() => {
    document.title = 'Welcome - Omegle VITAP';
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen overflow-hidden px-4 sm:px-6 md:px-8 py-8" style={{ backgroundColor: '#4fc3f7' }}>
      <div className="w-full max-w-md sm:max-w-lg">
        <WelcomeForm />
      </div>
    </div>
  );
}
