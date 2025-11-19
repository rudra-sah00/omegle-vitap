import "@testing-library/jest-dom";

// Mock Firebase environment variables for tests
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "test-api-key";
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "test-app.firebaseapp.com";
process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL = "https://test-app.firebaseio.com";
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "test-project-id";
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "test-app.appspot.com";
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "123456789";
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = "1:123456789:web:abcdef";
process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID = "G-XXXXXXXXXX";

// Mock Firebase modules before they are imported
jest.mock("firebase/analytics", () => ({
  getAnalytics: jest.fn(),
  isSupported: jest.fn(() => Promise.resolve(false)),
  logEvent: jest.fn(),
  setUserId: jest.fn(),
  setUserProperties: jest.fn(),
}));

jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(() => ({})),
  ref: jest.fn(),
  push: jest.fn(),
  set: jest.fn(),
  get: jest.fn(),
  onValue: jest.fn(),
  onDisconnect: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
  serverTimestamp: jest.fn(),
  off: jest.fn(),
}));
