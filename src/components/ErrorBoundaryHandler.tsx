'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export function ErrorBoundaryHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Prevent the default browser behavior
      event.preventDefault();
      
      // Log to Sentry
      Sentry.captureException(event.reason, {
        contexts: {
          rejection: {
            promise: String(event.promise),
            reason: String(event.reason),
          },
        },
      });
      
      // Silently handle in production
    };

    // Handle uncaught errors
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      
      Sentry.captureException(event.error, {
        contexts: {
          error: {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        },
      });
      
      // Silently handle error
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null;
}
