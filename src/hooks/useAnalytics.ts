/**
 * Analytics Hook
 * Automatically tracks user engagement, page time, and behavior
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { analytics } from '@/lib/firebase/analytics';

export function useAnalytics() {
  const pathname = usePathname();
  const pageStartTimeRef = useRef<number>(Date.now());
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const engagementActionsRef = useRef<string[]>([]);

  useEffect(() => {
    // Track page load time
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

    // Track page visibility changes
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      analytics.trackTabVisibility(isVisible);
      
      if (!isVisible) {
        // Track time on page when user leaves
        const timeOnPage = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
        analytics.trackTimeOnPage(pathname || 'unknown', timeOnPage);
      } else {
        // Reset timer when user returns
        pageStartTimeRef.current = Date.now();
      }
    };

    // Track before unload (user closing tab/navigating away)
    const handleBeforeUnload = () => {
      const timeOnPage = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
      analytics.trackTimeOnPage(pathname || 'unknown', timeOnPage);
      
      // Track engagement score
      if (engagementActionsRef.current.length > 0) {
        const score = Math.min(100, engagementActionsRef.current.length * 10);
        analytics.trackEngagement(score, engagementActionsRef.current);
      }
    };

    // Track user activity for idle detection
    const resetIdleTimer = () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      
      // Track idle after 5 minutes of inactivity
      idleTimeoutRef.current = setTimeout(() => {
        analytics.trackCustomEvent('user_idle', {
          page: pathname,
          idle_duration_seconds: 300,
        });
      }, 300000);
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Activity listeners for idle detection
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      document.addEventListener(event, resetIdleTimer);
    });
    
    resetIdleTimer();

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
      });
      
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      
      // Track final time on page
      const timeOnPage = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
      analytics.trackTimeOnPage(pathname || 'unknown', timeOnPage);
    };
  }, [pathname]);

  // Helper to track engagement actions
  const trackAction = (actionName: string) => {
    engagementActionsRef.current.push(actionName);
  };

  return { trackAction };
}
