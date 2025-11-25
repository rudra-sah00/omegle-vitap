/**
 * Firebase Configuration and Initialization
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

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let analytics: Analytics | null = null;

export const initializeFirebase = () => {
  if (typeof window === 'undefined') {
    // Server-side, don't initialize
    return { app: null, analytics: null };
  }

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  // Initialize Analytics only in browser
  if (typeof window !== 'undefined' && !analytics) {
    try {
      analytics = getAnalytics(app);
    } catch (error) {
      console.error('Failed to initialize Firebase Analytics:', error);
    }
  }

  return { app, analytics };
};

export const getFirebaseApp = () => app;
export const getFirebaseAnalytics = () => analytics;
