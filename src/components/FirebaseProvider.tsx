'use client';

import { useEffect } from 'react';
import { initializeFirebase } from '@/lib/firebase/config';
import { analytics } from '@/lib/firebase/analytics';
import { usePathname } from 'next/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Analytics tracking
  useAnalytics();

  useEffect(() => {
    // Initialize Firebase on mount
    initializeFirebase();
    analytics.initialize();
  }, []);

  useEffect(() => {
    // Track page views on route change
    if (pathname) {
      const pageName = pathname === '/' ? 'home' : pathname.slice(1).replace(/\//g, '_');
      const pageTitle = document.title;
      analytics.trackPageView(pageName, pageTitle);
    }
  }, [pathname]);

  return <>{children}</>;
}
