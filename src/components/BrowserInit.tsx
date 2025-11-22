/**
 * Browser Initialization Component
 * Initializes browser polyfills and compatibility checks on client-side
 * Must be used in root layout for early initialization
 */

'use client';

import { useEffect } from 'react';
import { initBrowserPolyfills } from '@/lib/browser-polyfill';

export function BrowserInit() {
  useEffect(() => {
    // Initialize browser polyfills as early as possible
    initBrowserPolyfills();
  }, []);

  // This component doesn't render anything
  return null;
}
