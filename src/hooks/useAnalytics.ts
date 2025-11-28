/**
 * useAnalytics Hook
 * Tracks user engagement, page time, and behavior
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { analytics } from '@/services/firebase';
import { IDLE_TIMEOUT } from '@/constants';

export function useAnalytics() {
  const pathname = usePathname();
  // Initialize with 0, will be set to actual time in useEffect
  const pageStartTimeRef = useRef<number>(0);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const engagementActionsRef = useRef<string[]>([]);

  // Initialize page start time on mount
  useEffect(() => {
    pageStartTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationTiming) {
        const loadTime = navigationTiming.loadEventEnd - navigationTiming.fetchStart;
        analytics.trackPageLoadTime(loadTime);
      }
    }
  }, []);

  useEffect(() => {
    pageStartTimeRef.current = Date.now();

    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      analytics.trackTabVisibility(isVisible);
      
      if (!isVisible) {
        const timeOnPage = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
        analytics.trackTimeOnPage(pathname || 'unknown', timeOnPage);
      } else {
        pageStartTimeRef.current = Date.now();
      }
    };

    const handleBeforeUnload = () => {
      const timeOnPage = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
      analytics.trackTimeOnPage(pathname || 'unknown', timeOnPage);
      
      if (engagementActionsRef.current.length > 0) {
        const score = Math.min(100, engagementActionsRef.current.length * 10);
        analytics.trackEngagement(score, engagementActionsRef.current);
      }
    };

    const resetIdleTimer = () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      
      idleTimeoutRef.current = setTimeout(() => {
        analytics.trackCustomEvent('user_idle', {
          page: pathname,
          idle_duration_seconds: IDLE_TIMEOUT / 1000,
        });
      }, IDLE_TIMEOUT);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      document.addEventListener(event, resetIdleTimer);
    });
    
    resetIdleTimer();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
      });
      
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      
      const timeOnPage = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
      analytics.trackTimeOnPage(pathname || 'unknown', timeOnPage);
    };
  }, [pathname]);

  const trackAction = (actionName: string) => {
    engagementActionsRef.current.push(actionName);
  };

  return { trackAction };
}
