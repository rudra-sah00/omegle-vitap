/**
 * Global Error Handler
 * Catches unhandled errors and promise rejections at window level
 * Logs errors for debugging while preventing UI crashes
 */

'use client';

import { useEffect, useCallback } from 'react';

/** Error tracking service interface for future integration */
interface ErrorReport {
  message: string;
  stack?: string;
  type: 'error' | 'unhandledrejection';
  timestamp: string;
  url: string;
  userAgent: string;
}

/**
 * Send error to tracking service
 * Can be integrated with Sentry, LogRocket, etc.
 */
function reportError(report: ErrorReport): void {
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔴 [GlobalErrorHandler] ${report.type}`);
    console.error('Message:', report.message);
    if (report.stack) {
      console.error('Stack:', report.stack);
    }
    console.log('URL:', report.url);
    console.log('Time:', report.timestamp);
    console.groupEnd();
  }
  
  // In production, send to error tracking service
  // TODO: Integrate with Sentry or similar service
  // Example:
  // if (typeof Sentry !== 'undefined') {
  //   Sentry.captureException(new Error(report.message));
  // }
}

export function GlobalErrorHandler() {
  const handleUnhandledRejection = useCallback((event: PromiseRejectionEvent) => {
    // Don't prevent default in development for easier debugging
    if (process.env.NODE_ENV === 'production') {
      event.preventDefault();
    }
    
    const reason = event.reason;
    const message = reason instanceof Error 
      ? reason.message 
      : typeof reason === 'string' 
        ? reason 
        : 'Unknown promise rejection';
    
    reportError({
      message,
      stack: reason instanceof Error ? reason.stack : undefined,
      type: 'unhandledrejection',
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    });
  }, []);

  const handleError = useCallback((event: ErrorEvent) => {
    // Don't prevent default in development for easier debugging
    if (process.env.NODE_ENV === 'production') {
      event.preventDefault();
    }
    
    reportError({
      message: event.message || 'Unknown error',
      stack: event.error?.stack,
      type: 'error',
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    });
  }, []);

  useEffect(() => {
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [handleUnhandledRejection, handleError]);

  return null;
}
