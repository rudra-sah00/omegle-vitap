/**
 * Firebase Configuration
 * All sensitive configuration is loaded from environment variables
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAnalytics, type Analytics } from 'firebase/analytics';

/**
 * Firebase configuration from environment variables
 * @see .env.example for required variables
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/**
 * Validate that all required Firebase config values are present
 */
function validateFirebaseConfig(): boolean {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;
  return requiredKeys.every(key => {
    const value = firebaseConfig[key];
    return value && value.trim().length > 0;
  });
}

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;
let initializationWarningShown = false;

/**
 * Initialize Firebase (singleton pattern)
 * Validates configuration before initialization
 */
export function initializeFirebase(): { app: FirebaseApp | null; analytics: Analytics | null } {
  if (typeof window === 'undefined') {
    return { app: null, analytics: null };
  }

  // Validate configuration
  if (!validateFirebaseConfig()) {
    if (!initializationWarningShown) {
      console.warn(
        '[Firebase] Missing required configuration. Please check your environment variables.',
        '\nRequired: NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_APP_ID'
      );
      initializationWarningShown = true;
    }
    return { app: null, analytics: null };
  }

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  if (typeof window !== 'undefined' && !analytics && app) {
    try {
      analytics = getAnalytics(app);
    } catch {
      // Analytics initialization failed - likely ad blocker or missing measurementId
    }
  }

  return { app, analytics };
}

export function getFirebaseApp() {
  return app;
}

export function getFirebaseAnalytics() {
  return analytics;
}
