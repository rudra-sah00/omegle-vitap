/**
 * Browser Polyfill Initialization
 * Initializes browser polyfills on client-side mount
 */

'use client';

import { useEffect } from 'react';
import { initBrowserPolyfills } from '@/lib';

export function BrowserPolyfillInit() {
  useEffect(() => {
    initBrowserPolyfills();
  }, []);

  return null;
}
