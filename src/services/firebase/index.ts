/**
 * Firebase Service Exports
 */

export { initializeFirebase, getFirebaseApp, getFirebaseAnalytics } from './config';

// Analytics exports from modular structure
export { analytics, AnalyticsEvents } from './analytics';
export type {
  DurationBucket,
  MatchQuality,
  NetworkQuality,
  ErrorType,
  MatchEndReason,
  DeviceType,
  ReconnectionType,
  MediaContext,
} from './analytics';
