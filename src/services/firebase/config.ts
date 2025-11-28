/**
 * Firebase Configuration
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAnalytics, type Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAyz7owgqhDgh2arm6OEW12XhTFQZXfum4",
  authDomain: "omgle-vitap-prod.firebaseapp.com",
  projectId: "omgle-vitap-prod",
  storageBucket: "omgle-vitap-prod.firebasestorage.app",
  messagingSenderId: "1079560721492",
  appId: "1:1079560721492:web:3cd8196d0a658036d609c1",
  measurementId: "G-QPQ6NYRC2C"
};

let app: FirebaseApp;
let analytics: Analytics | null = null;

/**
 * Initialize Firebase (singleton pattern)
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { app: null, analytics: null };
  }

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  if (typeof window !== 'undefined' && !analytics) {
    try {
      analytics = getAnalytics(app);
    } catch {
      // Analytics initialization failed
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
