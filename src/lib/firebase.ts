import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, push, onValue, remove } from "firebase/database";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate Firebase configuration
if (typeof window !== "undefined") {
  const requiredFields = ["apiKey", "authDomain", "databaseURL", "projectId", "appId"];
  const missingFields = requiredFields.filter(
    (field) => !firebaseConfig[field as keyof typeof firebaseConfig]
  );

  if (missingFields.length > 0) {
    // Missing Firebase configuration fields
  }
}

// Initialize Firebase only if it hasn't been initialized already
let app: ReturnType<typeof initializeApp>;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
} catch (_error) {
  // Re-throw to prevent app from running with broken Firebase
  throw new Error("Failed to initialize Firebase. Please check your configuration.");
}

/**
 * Firebase Realtime Database instance
 * Used for real-time chat messaging and user queue management
 */
export const database = getDatabase(app);

// Initialize Analytics (only in browser and if supported)
let analytics: Analytics | null = null;

if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics not supported, continue without it
    });
}

export { analytics };

// Export database functions for easy use
export { ref, set, push, onValue, remove };

export default app;
