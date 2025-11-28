/**
 * Firebase Provider
 * Initializes Firebase and tracks page views
 */

'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { initializeFirebase, analytics } from '@/services/firebase';
import { useAnalytics } from '@/hooks/useAnalytics';

interface FirebaseProviderProps {
  children: ReactNode;
}

export function FirebaseProvider({ children }: FirebaseProviderProps) {
  const pathname = usePathname();
  
  useAnalytics();

  useEffect(() => {
    initializeFirebase();
    analytics.initialize();
  }, []);

  useEffect(() => {
    if (pathname) {
      const pageName = pathname === '/' ? 'home' : pathname.slice(1).replace(/\//g, '_');
      const pageTitle = document.title;
      analytics.trackPageView(pageName, pageTitle);
    }
  }, [pathname]);

  return <>{children}</>;
}
