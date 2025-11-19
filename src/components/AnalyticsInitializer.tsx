"use client";

/**
 * Analytics Initializer Component
 *
 * Initializes Firebase Analytics and tracks page views.
 * This component should be included in the root layout.
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { analyticsService } from "@/services/analyticsService";

/**
 * Component to initialize analytics and track page views
 *
 * @returns null - This component doesn't render anything
 */
export function AnalyticsInitializer(): null {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize device detection on mount
    analyticsService.detectDeviceType();
  }, []);

  useEffect(() => {
    // Track page view on route change
    if (pathname) {
      analyticsService.trackPageView(pathname);
    }
  }, [pathname]);

  return null;
}
